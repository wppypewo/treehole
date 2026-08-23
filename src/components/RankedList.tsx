import Link from "next/link";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import type { MovieSummary } from "@/lib/tmdb";

/**
 * 編號榜。
 *
 * 首頁不能整頁都是橫向海報列——那是同一個版面重複四次。評價最高這一區
 * 改成垂直編號榜：名次用 didone 大字當視覺主體，海報縮成小張參考圖，
 * 資訊層（片名／年份／分數）回到文字。
 *
 * 逐項揭露用 .reveal（scroll-driven animation），不用 IntersectionObserver。
 * 理由是敘事順序：榜單本來就該由上往下讀。實作細節見 globals.css 的註解。
 */
export default function RankedList({
  title,
  movies,
  moreHref,
  moreLabel,
}: {
  title: string;
  movies: MovieSummary[];
  moreHref: string;
  moreLabel: string;
}) {
  if (movies.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-5 sm:px-8">
      <div className="flex items-baseline justify-between gap-6">
        <h2 className="t-section text-paper">{title}</h2>
        <Link
          href={moreHref}
          className="tap-safe text-[0.75rem] tracking-[0.08em] text-paper-faint transition-colors hover:text-paper"
        >
          {moreLabel}
        </Link>
      </div>

      <ol className="mt-8 grid gap-x-14 sm:grid-cols-2">
        {movies.map((movie, i) => {
          const thumb = tmdbImage(movie.poster_path, "w185");
          const year = movie.release_date
            ? movie.release_date.slice(0, 4)
            : null;
          return (
            // min-w-0：grid item 預設 min-width:auto，裡面的 truncate 標題會把它
            // 撐到 min-content 寬度，手機上直接造成整頁橫向溢出
            <li
              key={movie.id}
              className="reveal min-w-0 border-b border-hairline"
            >
              <Link
                href={`/movie/${movie.id}`}
                className="group/rank flex items-center gap-5 py-5"
              >
                <span
                  aria-hidden
                  className="t-film w-9 shrink-0 text-3xl text-paper-faint transition-colors duration-300 group-hover/rank:text-curtain-ink"
                >
                  {i + 1}
                </span>
                <div className="h-[72px] w-12 shrink-0 overflow-hidden bg-ink-raised">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      srcSet={tmdbSrcSet(movie.poster_path, "poster")}
                      sizes={IMAGE_SIZES.rankThumb}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm text-paper-dim transition-colors duration-300 group-hover/rank:text-paper">
                    {movie.title}
                  </h3>
                  <p className="t-meta mt-1 text-paper-faint">
                    {[year, movie.vote_average.toFixed(1)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
