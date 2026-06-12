import { tmdbLanguage, type Locale } from "@/i18n/config";

// TMDB 伺服器端存取層。金鑰只在此讀取，瀏覽器不會碰到。
// 認證採官方兩法擇一：v3 api_key 帶 query，或 v4 read access token 帶 Authorization: Bearer。

const BASE = "https://api.themoviedb.org/3";

export type TmdbErrorKind =
  | "missing-key"
  | "invalid-key"
  | "network"
  | "http"
  | "not-found";

export class TmdbError extends Error {
  kind: TmdbErrorKind;
  constructor(kind: TmdbErrorKind, message: string) {
    super(message);
    this.name = "TmdbError";
    this.kind = kind;
  }
}

export interface MovieSummary {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  overview: string;
  genre_ids?: number[];
}

export interface MovieListResponse {
  page: number;
  results: MovieSummary[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails extends MovieSummary {
  runtime: number | null;
  genres: Genre[];
  vote_count: number;
}

// v4 read access token 是 JWT（含「.」分隔）；v3 api_key 為 32 碼十六進位、不含「.」
export function isV4Token(key: string): boolean {
  return key.includes(".");
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  revalidate: number,
): Promise<T> {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) {
    throw new TmdbError("missing-key", "TMDB_API_KEY is not set");
  }

  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  const headers: Record<string, string> = { accept: "application/json" };
  if (isV4Token(key)) {
    headers.Authorization = `Bearer ${key}`;
  } else {
    url.searchParams.set("api_key", key);
  }

  let res: Response;
  try {
    res = await fetch(url, { headers, next: { revalidate } });
  } catch {
    throw new TmdbError("network", "Failed to reach TMDB");
  }

  if (res.status === 401) {
    throw new TmdbError("invalid-key", "TMDB rejected the API key (401)");
  }
  if (res.status === 404) {
    throw new TmdbError("not-found", "TMDB resource not found (404)");
  }
  if (!res.ok) {
    throw new TmdbError("http", `TMDB responded with ${res.status}`);
  }

  return (await res.json()) as T;
}

export function getPopular(
  locale: Locale,
  page = 1,
): Promise<MovieListResponse> {
  return tmdbFetch<MovieListResponse>(
    "/movie/popular",
    { language: tmdbLanguage(locale), page },
    3600,
  );
}

// 即將上映：region=TW 取台灣院線檔期
export function getUpcoming(
  locale: Locale,
  page = 1,
): Promise<MovieListResponse> {
  return tmdbFetch<MovieListResponse>(
    "/movie/upcoming",
    { language: tmdbLanguage(locale), page, region: "TW" },
    3600,
  );
}

export function searchMovies(
  locale: Locale,
  query: string,
  page = 1,
): Promise<MovieListResponse> {
  return tmdbFetch<MovieListResponse>(
    "/search/movie",
    { language: tmdbLanguage(locale), query, page, include_adult: "false" },
    0,
  );
}

export function getMovieDetails(
  locale: Locale,
  id: number,
): Promise<MovieDetails> {
  return tmdbFetch<MovieDetails>(
    `/movie/${id}`,
    { language: tmdbLanguage(locale) },
    3600,
  );
}

// 某部電影的相關推薦（TMDB 依觀看行為產生），回傳結構同其他清單
export function getRecommendations(
  locale: Locale,
  id: number,
  page = 1,
): Promise<MovieListResponse> {
  return tmdbFetch<MovieListResponse>(
    `/movie/${id}/recommendations`,
    { language: tmdbLanguage(locale), page },
    3600,
  );
}

// 影史評分最高（TMDB top_rated）
export function getTopRated(
  locale: Locale,
  page = 1,
): Promise<MovieListResponse> {
  return tmdbFetch<MovieListResponse>(
    "/movie/top_rated",
    { language: tmdbLanguage(locale), page },
    3600,
  );
}

// 史上最賣座：discover 依票房（revenue）由高到低排序
export function getHighestGrossing(
  locale: Locale,
  page = 1,
): Promise<MovieListResponse> {
  return tmdbFetch<MovieListResponse>(
    "/discover/movie",
    {
      language: tmdbLanguage(locale),
      sort_by: "revenue.desc",
      include_adult: "false",
      page,
    },
    3600,
  );
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

// 從影片清單挑一支最適合的預告：官方正片預告 > 正片預告 > 官方先導 > 先導 > 其餘 YouTube
export function pickTrailer(videos: TmdbVideo[]): string | null {
  const youtube = videos.filter((v) => v.site === "YouTube");
  const rank = (v: TmdbVideo): number => {
    if (v.type === "Trailer") return v.official ? 0 : 1;
    if (v.type === "Teaser") return v.official ? 2 : 3;
    return 4;
  };
  youtube.sort((a, b) => rank(a) - rank(b));
  return youtube[0]?.key ?? null;
}

// 取一支 YouTube 預告片的 key。繁中地區常無影片資料，會 fallback 到 en-US。
export async function getTrailerKey(
  locale: Locale,
  id: number,
): Promise<string | null> {
  const primary = await tmdbFetch<{ results: TmdbVideo[] }>(
    `/movie/${id}/videos`,
    { language: tmdbLanguage(locale) },
    3600,
  );
  let key = pickTrailer(primary.results);
  if (!key && tmdbLanguage(locale) !== "en-US") {
    const fallback = await tmdbFetch<{ results: TmdbVideo[] }>(
      `/movie/${id}/videos`,
      { language: "en-US" },
      3600,
    );
    key = pickTrailer(fallback.results);
  }
  return key;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface MovieCredits {
  cast: CastMember[];
  director: { id: number; name: string } | null;
}

interface RawCredits {
  cast: CastMember[];
  crew: { id: number; name: string; job: string }[];
}

// 影片演職員：主演清單 + 導演
export async function getMovieCredits(
  locale: Locale,
  id: number,
): Promise<MovieCredits> {
  const data = await tmdbFetch<RawCredits>(
    `/movie/${id}/credits`,
    { language: tmdbLanguage(locale) },
    3600,
  );
  const dir = data.crew.find((c) => c.job === "Director");
  return {
    cast: data.cast,
    director: dir ? { id: dir.id, name: dir.name } : null,
  };
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department: string;
  birthday: string | null;
  place_of_birth: string | null;
}

// 人物資訊。繁中簡介常為空，會 fallback 到英文。
export async function getPerson(
  locale: Locale,
  id: number,
): Promise<PersonDetails> {
  const person = await tmdbFetch<PersonDetails>(
    `/person/${id}`,
    { language: tmdbLanguage(locale) },
    3600,
  );
  if (!person.biography && tmdbLanguage(locale) !== "en-US") {
    const en = await tmdbFetch<PersonDetails>(
      `/person/${id}`,
      { language: "en-US" },
      3600,
    );
    person.biography = en.biography;
  }
  return person;
}

interface RawPersonMovieCredits {
  cast: (MovieSummary & { popularity?: number })[];
}

// 人物的電影作品：去重、依上映日期新到舊排序
export async function getPersonMovieCredits(
  locale: Locale,
  id: number,
): Promise<MovieSummary[]> {
  const data = await tmdbFetch<RawPersonMovieCredits>(
    `/person/${id}/movie_credits`,
    { language: tmdbLanguage(locale) },
    3600,
  );
  const seen = new Set<number>();
  const unique = data.cast.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  unique.sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));
  return unique;
}

export interface DiscoverFilters {
  genre?: number;
  year?: number;
  minRating?: number;
  sort?: string;
  page?: number;
}

// 條件瀏覽：依類型、年份、最低評分、排序找片
export function discoverMovies(
  locale: Locale,
  filters: DiscoverFilters,
): Promise<MovieListResponse> {
  const ratingSort = filters.sort?.startsWith("vote_average");
  return tmdbFetch<MovieListResponse>(
    "/discover/movie",
    {
      language: tmdbLanguage(locale),
      include_adult: "false",
      sort_by: filters.sort || "popularity.desc",
      page: filters.page ?? 1,
      with_genres: filters.genre,
      primary_release_year: filters.year,
      "vote_average.gte": filters.minRating,
      // 依評分排序或有評分門檻時，加投票數門檻避免冷門片灌進來
      "vote_count.gte": ratingSort || filters.minRating ? 200 : undefined,
    },
    3600,
  );
}