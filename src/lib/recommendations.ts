import type { Locale } from "@/i18n/config";
import {
  getRecommendations,
  type MovieSummary,
  type MovieListResponse,
} from "@/lib/tmdb";
import { listFavorites, listWatched } from "@/lib/db";

const SEED_LIMIT = 10; // 最多取幾部已收藏／已看過電影當推薦來源
const REC_PAGES_PER_SEED = 4; // 每個種子向 TMDB 抓幾頁推薦，攤平後彙整
const PAGE_SIZE = 20; // 對外分頁每頁筆數
const AGG_TTL = 10 * 60 * 1000; // 彙整結果快取時間

// 目前所有種子的 tmdb_id（收藏 + 已看過，去重）
async function seedIds(): Promise<number[]> {
  const [favorites, watched] = await Promise.all([
    listFavorites(),
    listWatched(),
  ]);
  return [...new Set([...favorites, ...watched].map((m) => m.tmdb_id))];
}

// 種子集合 + 語系作為快取鍵：收藏一變動，鍵就變、快取自然失效
function seedKey(locale: Locale, ids: number[]): string {
  return `${locale}:${[...ids].sort((a, b) => a - b).join(",")}`;
}

interface Aggregate {
  key: string;
  at: number;
  hasSeeds: boolean;
  movies: MovieSummary[];
}

const globalForRec = globalThis as unknown as { __recAgg?: Aggregate };

// 以使用者片庫為種子，抓多部種子的多頁推薦，彙整去重後依「被推薦次數」排序
async function buildAggregate(
  locale: Locale,
  ids: number[],
): Promise<{ hasSeeds: boolean; movies: MovieSummary[] }> {
  if (ids.length === 0) return { hasSeeds: false, movies: [] };

  const seeds = ids.slice(0, SEED_LIMIT);
  const owned = new Set(ids); // 已在片庫的片不再推薦

  const calls: Promise<MovieListResponse>[] = [];
  for (const id of seeds) {
    for (let p = 1; p <= REC_PAGES_PER_SEED; p++) {
      calls.push(getRecommendations(locale, id, p));
    }
  }
  const settled = await Promise.allSettled(calls);

  // 以「被幾部種子（或第幾頁）推薦到」累計分數，越高排越前；同分用 TMDB 評分
  const scored = new Map<number, { movie: MovieSummary; score: number }>();
  for (const outcome of settled) {
    if (outcome.status !== "fulfilled") continue;
    for (const movie of outcome.value.results) {
      if (owned.has(movie.id)) continue;
      const hit = scored.get(movie.id);
      if (hit) hit.score += 1;
      else scored.set(movie.id, { movie, score: 1 });
    }
  }

  const movies = [...scored.values()]
    .sort(
      (a, b) => b.score - a.score || b.movie.vote_average - a.movie.vote_average,
    )
    .map((s) => s.movie);

  return { hasSeeds: true, movies };
}

async function getAggregate(
  locale: Locale,
): Promise<{ hasSeeds: boolean; movies: MovieSummary[] }> {
  const ids = await seedIds();
  const key = seedKey(locale, ids);
  const cached = globalForRec.__recAgg;
  if (cached && cached.key === key && Date.now() - cached.at < AGG_TTL) {
    return { hasSeeds: cached.hasSeeds, movies: cached.movies };
  }
  const built = await buildAggregate(locale, ids);
  globalForRec.__recAgg = { key, at: Date.now(), ...built };
  return built;
}

// 對外分頁：回傳第 page 頁（每頁 PAGE_SIZE 筆）與是否還有更多。
// hasSeeds=false 代表片庫為空，前端顯示引導文案。
export async function getForYouPage(
  locale: Locale,
  page: number,
): Promise<{ hasSeeds: boolean; results: MovieSummary[]; hasMore: boolean }> {
  const { hasSeeds, movies } = await getAggregate(locale);
  const start = (page - 1) * PAGE_SIZE;
  const results = movies.slice(start, start + PAGE_SIZE);
  return { hasSeeds, results, hasMore: start + PAGE_SIZE < movies.length };
}
