import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getMovieDetails,
  getRecommendations,
  getTrailerKey,
  getMovieCredits,
} from "@/lib/tmdb";
import type { MovieSummary, MovieCredits } from "@/lib/tmdb";
import { TmdbError } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import { isFavorite, isInWatchlist, isWatched, getRating } from "@/lib/db";
import ErrorNotice from "@/components/ErrorNotice";
import MovieActions from "@/components/MovieActions";
import MovieGrid from "@/components/MovieGrid";
import TrailerPlayer from "@/components/TrailerPlayer";
import PersonCard from "@/components/PersonCard";
import RatingEditor from "@/components/RatingEditor";
import ParallaxImage from "@/components/ParallaxImage";

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

  // 網址裡的 id 不是正整數，就不存在這個資源——回真正的 404，
  // 不是 200 配一句錯誤訊息。已經有設計好的 404 頁，用它。
  if (!Number.isInteger(movieId) || movieId <= 0) {
    notFound();
  }

  let movie;
  try {
    movie = await getMovieDetails(locale, movieId);
  } catch (error) {
    // TMDB 說找不到，語意上就是 404；其他錯誤（金鑰、網路、5xx）才是
    // 「這頁存在但現在載不出來」，那種才顯示錯誤訊息並保留 200。
    if (error instanceof TmdbError && error.kind === "not-found") {
      notFound();
    }
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
    ? tmdbImage(movie.backdrop_path, "w1280")
    : null;
  const backdropSrcSet = tmdbSrcSet(movie.backdrop_path, "backdrop");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "—";
  const showOriginal =
    movie.original_title && movie.original_title !== movie.title;
  // demo 模式下收藏／評分等寫入功能不可用，僅作 UI 文案與停用狀態用途
  const isDemo = process.env.DEMO_MODE === "1";

  return (
    <article className="pb-28">
      {/* ===== 首屏 =====
          手機：劇照一段、片名一段，上下排；桌機：片名壓在劇照底部。
          理由同首頁開場——壓字的可讀性不該取決於這張劇照剛好夠不夠暗。 */}
      <header className="relative w-full">
        {backdrop && (
          <div className="relative h-[40dvh] max-h-[400px] min-h-[220px] w-full overflow-hidden bg-ink-raised sm:h-[62dvh] sm:max-h-[680px] sm:min-h-[380px]">
            <ParallaxImage
              src={backdrop}
              srcSet={backdropSrcSet}
              sizes={IMAGE_SIZES.fullBleed}
              priority
            />
            <div
              aria-hidden
              className="scrim-bottom pointer-events-none absolute inset-0"
            />
          </div>
        )}

        <div className={backdrop ? "sm:absolute sm:inset-x-0 sm:bottom-0" : ""}>
          <div className="animate-rise mx-auto max-w-[1400px] px-5 pt-8 sm:px-8 sm:pt-10 sm:pb-14">
            <Link
              href="/"
              className="tap-safe mb-6 gap-2 text-[0.75rem] tracking-[0.08em] text-paper-dim transition-colors hover:text-paper"
            >
              <span aria-hidden>←</span>
              {dict.movie.back}
            </Link>

            <h1 className="t-film max-w-[18ch] text-[2.25rem] text-paper sm:text-5xl lg:text-6xl">
              {movie.title}
            </h1>
            {showOriginal && (
              <p className="t-meta mt-3 text-paper-faint">
                {movie.original_title}
              </p>
            )}

            {/* metadata：一條 hairline 之上的單行資訊，分隔用間距不用符號堆疊 */}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-7 gap-y-2 border-t border-hairline pt-4">
              <span className="t-meta">{movie.release_date || year}</span>
              {movie.runtime ? (
                <span className="t-meta">
                  {movie.runtime} {dict.movie.minutes}
                </span>
              ) : null}
              {movie.vote_average > 0 && (
                <span className="flex items-baseline gap-2">
                  <span className="t-film text-2xl text-paper">{rating}</span>
                  <span className="t-meta text-paper-faint">
                    {movie.vote_count.toLocaleString()}
                  </span>
                </span>
              )}
              {credits?.director && (
                <span className="t-meta">
                  {dict.movie.director}
                  <Link
                    href={`/person/${credits.director.id}`}
                    className="text-paper transition-colors hover:text-curtain-ink"
                  >
                    {credits.director.name}
                  </Link>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== 劇情簡介：海報與文字並置的圖文欄，不把海報疊在劇照上 ===== */}
      <section className="mx-auto mt-14 max-w-[1400px] px-5 sm:mt-24 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-16">
          <div className="w-32 md:w-full">
            <div className="aspect-[2/3] overflow-hidden bg-ink-raised">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster}
                  srcSet={tmdbSrcSet(movie.poster_path, "poster")}
                  sizes={IMAGE_SIZES.detailPoster}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-paper-faint">
                  {movie.title}
                </div>
              )}
            </div>
            {movie.genres.length > 0 && (
              <ul className="mt-5 hidden md:block">
                {movie.genres.map((genre) => (
                  <li
                    key={genre.id}
                    className="border-b border-hairline py-2 text-[0.75rem] tracking-[0.06em] text-paper-faint"
                  >
                    {genre.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="t-prose">
              {movie.overview || dict.movie.noOverview}
            </p>

            {/* 類型在窄螢幕改為橫排，避免海報下方多出一整段列表 */}
            {movie.genres.length > 0 && (
              <p className="t-meta mt-6 text-paper-faint md:hidden">
                {movie.genres.map((g) => g.name).join("、")}
              </p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-3">
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
            </div>

            {/* demo 模式：誠實說明這些是本機版功能，取代假成功 */}
            {isDemo && (
              <p className="mt-3 text-xs text-paper-faint">
                {dict.demo.actionNote}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ===== 我的評分 ===== */}
      <section className="mx-auto mt-20 max-w-[1400px] px-5 sm:px-8">
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
      </section>

      {trailerKey && (
        <section className="mx-auto mt-20 max-w-[1400px] px-5 sm:px-8">
          <h2 className="t-section mb-6 text-paper">{dict.movie.trailer}</h2>
          <div className="max-w-4xl">
            <TrailerPlayer youTubeKey={trailerKey} label={movie.title} />
          </div>
        </section>
      )}

      {credits && credits.cast.length > 0 && (
        <section className="mt-20">
          <h2 className="t-section mx-auto max-w-[1400px] px-5 text-paper sm:px-8">
            {dict.movie.cast}
          </h2>
          <div className="scrollbar-hide mt-6 flex gap-5 overflow-x-auto">
            <div aria-hidden className="rail-gutter" />
            {credits.cast.slice(0, 15).map((c) => (
              <PersonCard
                key={c.id}
                id={c.id}
                name={c.name}
                sub={c.character}
                profilePath={c.profile_path}
              />
            ))}
            <div aria-hidden className="rail-gutter" />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-[1400px] px-5 sm:px-8">
          <h2 className="t-section mb-6 text-paper">
            {dict.recommendations.related}
          </h2>
          <MovieGrid
            movies={related}
            emptyText={dict.recommendations.relatedEmpty}
          />
        </section>
      )}
    </article>
  );
}
