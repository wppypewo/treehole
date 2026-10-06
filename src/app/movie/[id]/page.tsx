import Link from "next/link";
import type { Metadata } from "next";
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
import { getMovieRecord } from "@/lib/db";
import type { MovieRecord } from "@/lib/db.types";
import { characterText } from "@/lib/filmography";
import StatusNotice from "@/components/StatusNotice";
import RefreshButton from "@/components/RefreshButton";
import MovieActions from "@/components/MovieActions";
import MovieGrid from "@/components/MovieGrid";
import TrailerPlayer from "@/components/TrailerPlayer";
import PersonCard from "@/components/PersonCard";
import RatingEditor from "@/components/RatingEditor";
import ParallaxImage from "@/components/ParallaxImage";
import SectionHead from "@/components/SectionHead";
import FallbackImg from "@/components/FallbackImg";

// 這頁本來就是動態的：getLocale() 讀 cookie，片庫狀態每次請求直接查資料庫。
// 不用 force-dynamic，是因為那個旗標等同 fetchCache = "force-no-store"，
// 會把詳情／演職員／預告／相似片這幾路 TMDB 在 tmdbFetch 設好的 revalidate 一併作廢。
// 資料庫查詢不吃 fetch 快取，不需要拿整頁的旗標去換它的即時性。

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId <= 0) return {};
  try {
    const locale = await getLocale();
    const movie = await getMovieDetails(locale, movieId);
    const year = movie.release_date?.slice(0, 4);
    return {
      title: year ? `${movie.title}（${year}）` : movie.title,
      description: movie.overview || undefined,
    };
  } catch {
    // 抓不到就讓 layout 的預設標題接手；分頁標題不值得讓整頁掛掉
    return {};
  }
}

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
    return (
      <StatusNotice
        title={dict.errors.loadFailed}
        body={tmdbErrorMessage(error, dict)}
      >
        <RefreshButton label={dict.errors.reload} />
        <Link href="/" className="btn-line">
          {dict.errors.home}
        </Link>
      </StatusNotice>
    );
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

  // 四張表的狀態與日期一句查詢取回（原本是四次來回）。
  // 資料庫讀不到時片子照樣顯示，只有「我的紀錄」改成一行說明：
  // 不拿空白狀態頂替，否則按一下就會蓋掉資料庫裡其實存在的紀錄
  let record: MovieRecord | null = null;
  try {
    record = await getMovieRecord(movie.id);
  } catch (error) {
    console.error("[movie-record]", error);
  }

  const savedMovie = {
    tmdb_id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
  };

  const still = tmdbImage(movie.backdrop_path, "w1280");
  // 劇照優先；沒有劇照才放海報。原本兩張都放，同一部片的臉在首屏出現兩次
  const poster = still ? null : tmdbImage(movie.poster_path, "w500");
  const showOriginal =
    movie.original_title && movie.original_title !== movie.title;

  // 片名下的一行事實：拿得到的才列，缺的不寫「—」
  const facts: string[] = [];
  if (movie.release_date) facts.push(movie.release_date.slice(0, 4));
  if (movie.runtime) facts.push(`${movie.runtime} ${dict.movie.minutes}`);
  if (movie.vote_average > 0)
    facts.push(
      dict.movie.tmdbScore
        .replace("{score}", movie.vote_average.toFixed(1))
        .replace("{n}", movie.vote_count.toLocaleString(locale)),
    );
  if (movie.genres.length > 0)
    facts.push(movie.genres.map((g) => g.name).join("、"));

  const leads = credits?.cast.slice(0, 5) ?? [];

  return (
    <article className="pb-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="detail-grid pt-9 sm:pt-12 min-[1000px]:pt-16">
          <header className="detail-head animate-rise">
            <h1 className="t-film text-[clamp(2.5rem,5.4vw,4.25rem)] text-paper">
              {movie.title}
            </h1>
            {showOriginal && (
              <p
                lang="und"
                className="t-original mt-2.5 text-[clamp(1.125rem,2vw,1.375rem)] text-paper-dim"
              >
                {movie.original_title}
              </p>
            )}
            {facts.length > 0 && (
              <p className="t-meta mt-5">
                {/* 每項事實自己不斷行，只在分隔點之後換行：
                    手機上「劇情、」與「愛情」不會被拆到兩行 */}
                {facts.map((f, i) => (
                  <span key={f}>
                    {i > 0 && (
                      <>
                        <span aria-hidden className="px-2 text-paper-faint">
                          ·
                        </span>
                        <wbr />
                      </>
                    )}
                    <span className="whitespace-nowrap">{f}</span>
                  </span>
                ))}
              </p>
            )}
          </header>

          {/* 劇照不再出血鋪滿首屏、也不壓字：它是這部片的一格畫面，
              放在片名底下當證據。捲動下沉沿用全站唯一的那種動畫 */}
          {still ? (
            <div className="detail-still relative mt-8 aspect-[21/9] overflow-hidden bg-ink-raised">
              <ParallaxImage
                src={still}
                srcSet={tmdbSrcSet(movie.backdrop_path, "backdrop")}
                sizes={IMAGE_SIZES.detailStill}
                priority
              />
            </div>
          ) : (
            poster && (
              <div className="detail-still mt-8 aspect-[2/3] w-40 overflow-hidden bg-ink-raised sm:w-52">
                <FallbackImg
                  src={poster}
                  srcSet={tmdbSrcSet(movie.poster_path, "poster")}
                  sizes={IMAGE_SIZES.detailPoster}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )
          )}

          <p className="detail-prose t-prose mt-8">
            {movie.overview || dict.movie.noOverview}
          </p>

          <aside
            aria-labelledby="ledger-title"
            className="detail-ledger mt-12 border border-hairline-strong bg-ink p-6 min-[1000px]:mt-0"
          >
            <h2 id="ledger-title" className="font-display text-xl text-paper">
              {dict.movie.ledger}
            </h2>
            {record ? (
              <>
                <div className="mt-[1.375rem]">
                  <MovieActions
                    movie={savedMovie}
                    initial={{
                      watchlist: record.watchlistAddedAt,
                      watched: record.watchedAt,
                      favorites: record.favoritedAt,
                    }}
                    locale={locale}
                    labels={{ ...dict.actions, saveError: dict.common.saveError }}
                  />
                </div>
                <RatingEditor
                  movie={savedMovie}
                  initialScore={record.rating?.score ?? null}
                  initialNote={record.rating?.note ?? ""}
                  labels={{
                    ...dict.rating,
                    saveError: dict.common.saveError,
                    removeError: dict.common.removeError,
                  }}
                />
              </>
            ) : (
              <div className="mt-[1.375rem] border-l-2 border-curtain pl-4">
                <p className="text-sm leading-relaxed text-paper-dim">
                  {dict.movie.ledgerUnavailable}
                </p>
                <div className="mt-4">
                  <RefreshButton label={dict.errors.reload} />
                </div>
              </div>
            )}
          </aside>

          {(credits?.director || leads.length > 0) && (
            <dl className="detail-credits mt-10 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-t border-hairline pt-5 text-sm">
              {credits?.director && (
                <div className="contents">
                  <dt className="text-paper-faint">{dict.movie.director}</dt>
                  <dd>
                    <Link
                      href={`/person/${credits.director.id}`}
                      className="link-hair tap-inline text-paper-dim"
                    >
                      {credits.director.name}
                    </Link>
                  </dd>
                </div>
              )}
              {leads.length > 0 && (
                <div className="contents">
                  <dt className="text-paper-faint">{dict.movie.cast}</dt>
                  <dd className="leading-relaxed">
                    {leads.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && <span className="text-paper-faint">、</span>}
                        <Link
                          href={`/person/${c.id}`}
                          className="link-hair tap-inline text-paper-dim"
                        >
                          {c.name}
                        </Link>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {/* 預告放在左欄、演職員底下：寬度跟劇照一致，右邊的「我的紀錄」
              繼續黏著。原本放在格線外、限寬 4xl，桌機上右側空出一大塊 */}
          {trailerKey && (
            <section
              aria-labelledby="trailer-title"
              className="detail-trailer mt-16"
            >
              <SectionHead id="trailer-title" title={dict.movie.trailer} />
              <div className="mt-[1.125rem]">
                <TrailerPlayer youTubeKey={trailerKey} label={movie.title} />
              </div>
            </section>
          )}
        </div>
      </div>

      {credits && credits.cast.length > 0 && (
        <section aria-labelledby="cast-title" className="mt-20">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <SectionHead id="cast-title" title={dict.movie.castRail} />
          </div>
          <div className="rail scrollbar-hide mt-[0.875rem] flex overflow-x-auto [--rail-gap:1.25rem]">
            <div aria-hidden className="rail-gutter" />
            {credits.cast.slice(0, 15).map((c) => (
              <PersonCard
                key={c.id}
                id={c.id}
                name={c.name}
                sub={characterText(c.character, dict.person)}
                profilePath={c.profile_path}
              />
            ))}
            <div aria-hidden className="rail-gutter" />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section
          aria-labelledby="related-title"
          className="mx-auto mt-20 max-w-[1400px] px-5 sm:px-8"
        >
          <SectionHead id="related-title" title={dict.recommendations.related} />
          <div className="mt-[1.125rem]">
            {/* 12 部在 2／3／4 欄都排得滿；5 欄時最後一列只剩 2 部，藏掉 */}
            <MovieGrid
              movies={related}
              emptyText={dict.recommendations.relatedEmpty}
              className="xl:[&>*:nth-child(n+11)]:hidden"
            />
          </div>
        </section>
      )}
    </article>
  );
}
