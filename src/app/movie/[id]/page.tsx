import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getMovieDetails,
  getRecommendations,
  getTrailerKey,
  getMovieCredits,
} from "@/lib/tmdb";
import type { MovieSummary, MovieCredits } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import { tmdbImage } from "@/lib/images";
import { isFavorite, isInWatchlist, isWatched, getRating } from "@/lib/db";
import ErrorNotice from "@/components/ErrorNotice";
import MovieActions from "@/components/MovieActions";
import MovieGrid from "@/components/MovieGrid";
import DownloadButton from "@/components/DownloadButton";
import TrailerPlayer from "@/components/TrailerPlayer";
import PersonCard from "@/components/PersonCard";
import RatingEditor from "@/components/RatingEditor";

// 需讀取本機 SQLite 判斷收藏 / 已看過狀態，故每次請求即時渲染
export const dynamic = "force-dynamic";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return <ErrorNotice message={dict.errors.notFound} />;
  }

  let movie;
  try {
    movie = await getMovieDetails(locale, movieId);
  } catch (error) {
    return <ErrorNotice message={tmdbErrorMessage(error, dict)} />;
  }

  // 相關推薦失敗不應拖垮整頁，故獨立取得並吞掉錯誤
  let related: MovieSummary[] = [];
  try {
    related = (await getRecommendations(locale, movieId)).results.slice(0, 12);
  } catch {
    related = [];
  }

  // 預告片同樣獨立取得，失敗則不顯示
  let trailerKey: string | null = null;
  try {
    trailerKey = await getTrailerKey(locale, movieId);
  } catch {
    trailerKey = null;
  }

  // 演職員同樣獨立取得，失敗則不顯示
  let credits: MovieCredits | null = null;
  try {
    credits = await getMovieCredits(locale, movieId);
  } catch {
    credits = null;
  }

  const myRating = getRating(movie.id);

  const poster = tmdbImage(movie.poster_path, "w500");
  const backdrop = movie.backdrop_path
    ? tmdbImage(movie.backdrop_path, "w780")
    : null;
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "—";
  const showOriginal =
    movie.original_title && movie.original_title !== movie.title;
  // 種子搜尋以原文片名為主（檔名多用原文），帶上年份提升命中率
  const searchYear = movie.release_date ? movie.release_date.slice(0, 4) : "";
  const downloadQuery = [
    movie.original_title || movie.title,
    searchYear,
  ]
    .filter(Boolean)
    .join(" ");

  // demo 模式下收藏／評分等寫入功能不可用，僅作 UI 文案與停用狀態用途
  const isDemo = process.env.DEMO_MODE === "1";

  return (
    // isolate 建立 stacking context，讓 -z-10 的 backdrop 停在 article 範圍內
    <article className="relative isolate">
      {/* ===== 首屏：出血 backdrop header band + 主資訊組 ===== */}
      <header className="relative -mx-4 sm:-mx-6">
        {backdrop && (
          // 清晰 backdrop（非 blur 洗色）；由下而上黑色 scrim 將影像收進頁面背景，
          // 保證疊放的標題可讀。高度用 vw + max 上限預留，避免 CLS。
          <div className="absolute inset-x-0 top-0 -z-10 h-[58vw] max-h-[280px] overflow-hidden sm:h-[44vw] sm:max-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backdrop}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className="animate-rise h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent" />
          </div>
        )}

        <div className="relative px-4 sm:px-6">
          {/* 返回鍵：有 backdrop 時浮在 band 左上；無 backdrop 時退回上方常規連結 */}
          <Link
            href="/"
            className={
              backdrop
                ? "absolute top-4 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-sm text-zinc-200 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
                : "mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
            }
          >
            ← {dict.movie.back}
          </Link>

          {/* poster 壓在 band 下緣、與標題欄並排，形成電影詳情構圖（非置中） */}
          <div
            className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7 ${
              backdrop ? "pt-[44vw] sm:pt-[min(26vw,200px)]" : ""
            }`}
          >
            <div className="animate-rise w-36 shrink-0 sm:w-52">
              <div className="aspect-[2/3] overflow-hidden rounded-xl bg-zinc-800 shadow-2xl shadow-black/50 ring-1 ring-white/10">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={poster}
                    alt={movie.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                    無海報
                  </div>
                )}
              </div>
            </div>

            <div className="animate-rise min-w-0 flex-1 space-y-2.5 [animation-delay:90ms] sm:pb-2">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  {movie.title}
                </h1>
                {showOriginal && (
                  <p className="text-sm text-zinc-400">
                    {dict.movie.originalTitle}：{movie.original_title}
                  </p>
                )}
              </div>

              {/* metadata 第一行：★ 評分（票數） · 年份 · 片長 */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-300">
                <span className="font-medium text-amber-300">
                  ★ {rating}
                  {movie.vote_count > 0 && (
                    <span className="text-zinc-400">
                      {" "}
                      ({movie.vote_count.toLocaleString()})
                    </span>
                  )}
                </span>
                <span className="text-zinc-600">·</span>
                <span>{movie.release_date || year}</span>
                {movie.runtime ? (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span>
                      {movie.runtime} {dict.movie.minutes}
                    </span>
                  </>
                ) : null}
              </div>

              {/* 導演：弱化為第二行，不硬塞進 metadata 行 */}
              {credits?.director && (
                <p className="text-sm text-zinc-400">
                  {dict.movie.director}：
                  <Link
                    href={`/person/${credits.director.id}`}
                    className="text-zinc-200 transition-colors hover:text-white hover:underline"
                  >
                    {credits.director.name}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 類型（降噪：極淡底文字 chip，非 generic bordered pill）＋ 動作，緊貼首屏資訊組 */}
      <div className="mt-5 space-y-3 px-1">
        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-zinc-300"
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}

        {/* 收藏 / 已看過：寫入本機 SQLite。下載：查 Prowlarr → 加入 qBittorrent */}
        <div className="flex flex-wrap items-center gap-2">
          <MovieActions
            movie={{
              tmdb_id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              vote_average: movie.vote_average,
            }}
            initialFavorite={isFavorite(movie.id)}
            initialWatchlist={isInWatchlist(movie.id)}
            initialWatched={isWatched(movie.id)}
            isDemo={isDemo}
            labels={{
              favorite: dict.actions.favorite,
              favorited: dict.actions.favorited,
              watchlist: dict.actions.watchlist,
              watchlistAdded: dict.actions.watchlistAdded,
              watched: dict.actions.watched,
              watchedDone: dict.actions.watchedDone,
            }}
          />
          <DownloadButton
            query={downloadQuery}
            buttonLabel={dict.actions.download}
            t={dict.download}
          />
        </div>

        {/* demo 模式：誠實說明這些是本機版功能，取代假成功 */}
        {isDemo && (
          <p className="text-xs text-zinc-500">{dict.demo.actionNote}</p>
        )}
      </div>

      {/* ===== 內文：編輯式節奏，刻意疏密（overview 主體 → 後續 section） ===== */}
      <section className="mt-10 px-1">
        <h2 className="eyebrow mb-3">{dict.movie.overview}</h2>
        <p className="max-w-2xl text-[15px] leading-7 text-zinc-200 sm:text-base sm:leading-8">
          {movie.overview || dict.movie.noOverview}
        </p>
      </section>

      <div className="mt-8 px-1">
        <RatingEditor
          movie={{
            tmdb_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
          }}
          initialScore={myRating?.score ?? null}
          initialNote={myRating?.note ?? ""}
          labels={dict.rating}
          isDemo={isDemo}
          demoNote={dict.demo.ratingNote}
        />
      </div>

      {trailerKey && (
        <section className="mt-12 px-1">
          <h2 className="eyebrow mb-3">{dict.movie.trailer}</h2>
          <TrailerPlayer youTubeKey={trailerKey} label={movie.title} />
        </section>
      )}

      {credits && (credits.cast.length > 0 || credits.director) && (
        <section className="mt-10 px-1">
          <h2 className="eyebrow mb-3">{dict.movie.cast}</h2>
          <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {credits.cast.slice(0, 15).map((c) => (
              <PersonCard
                key={c.id}
                id={c.id}
                name={c.name}
                sub={c.character}
                profilePath={c.profile_path}
              />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-10 px-1">
          <h2 className="eyebrow mb-3">{dict.recommendations.related}</h2>
          <MovieGrid
            movies={related}
            emptyText={dict.recommendations.relatedEmpty}
          />
        </section>
      )}
    </article>
  );
}
