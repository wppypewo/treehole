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

  return (
    <article className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto w-48 shrink-0 sm:mx-0">
          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
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

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{movie.title}</h1>
            {showOriginal && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {dict.movie.originalTitle}：{movie.original_title}
              </p>
            )}
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-1">
              <dt className="text-zinc-500">{dict.movie.rating}</dt>
              <dd className="font-medium">★ {rating}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-zinc-500">{dict.movie.releaseDate}</dt>
              <dd className="font-medium">{movie.release_date || year}</dd>
            </div>
            {movie.runtime ? (
              <div className="flex gap-1">
                <dt className="text-zinc-500">{dict.movie.runtime}</dt>
                <dd className="font-medium">
                  {movie.runtime} {dict.movie.minutes}
                </dd>
              </div>
            ) : null}
          </dl>

          {movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* 收藏 / 已看過：寫入本機 SQLite。下載：查 Prowlarr → 加入 qBittorrent */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
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
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">{dict.movie.overview}</h2>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {movie.overview || dict.movie.noOverview}
        </p>
      </section>

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
      />

      {trailerKey && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">{dict.movie.trailer}</h2>
          <TrailerPlayer youTubeKey={trailerKey} label={movie.title} />
        </section>
      )}

      {credits && (credits.cast.length > 0 || credits.director) && (
        <section className="space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-base font-semibold">{dict.movie.cast}</h2>
            {credits.director && (
              <p className="text-sm text-zinc-500">
                {dict.movie.director}：
                <Link
                  href={`/person/${credits.director.id}`}
                  className="text-zinc-300 hover:underline"
                >
                  {credits.director.name}
                </Link>
              </p>
            )}
          </div>
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
        <section className="space-y-2">
          <h2 className="text-base font-semibold">
            {dict.recommendations.related}
          </h2>
          <MovieGrid
            movies={related}
            emptyText={dict.recommendations.relatedEmpty}
          />
        </section>
      )}

      <Link
        href="/"
        className="inline-block text-sm text-zinc-500 hover:underline"
      >
        ← {dict.nav.popular}
      </Link>
    </article>
  );
}
