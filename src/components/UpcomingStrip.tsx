"use client";

import Link from "next/link";
import { tmdbImage } from "@/lib/images";
import type { MovieSummary } from "@/lib/tmdb";
import type { Locale } from "@/i18n/config";

/**
 * 即將上映。
 *
 * 刻意不用海報列：未上映的片常常還沒有成品海報，而這一區真正的資訊是
 * 「哪一天」。所以改用 16:9 劇照 + 上映日，日期用 didone 大字，片名退到次層。
 * 這也讓首頁不會連著出現三列一模一樣的海報捲軸。
 */
export default function UpcomingStrip({
  title,
  movies,
  moreHref,
  moreLabel,
  locale,
}: {
  title: string;
  movies: MovieSummary[];
  moreHref: string;
  moreLabel: string;
  locale: Locale;
}) {
  if (movies.length === 0) return null;

  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-TW", {
    month: "short",
    day: "numeric",
  });

  return (
    <section>
      <div className="mx-auto flex max-w-[1400px] items-baseline justify-between gap-6 px-5 sm:px-8">
        <h2 className="t-section text-paper">{title}</h2>
        <Link
          href={moreHref}
          className="tap-safe text-[0.75rem] tracking-[0.08em] text-paper-faint transition-colors hover:text-paper"
        >
          {moreLabel}
        </Link>
      </div>

      <div className="scrollbar-hide mt-6 flex gap-4 overflow-x-auto scroll-smooth">
        <div aria-hidden className="rail-gutter" />
        {movies.map((movie) => {
          const still = tmdbImage(movie.backdrop_path, "w780");
          const date = movie.release_date ? new Date(movie.release_date) : null;
          return (
            <Link
              key={movie.id}
              href={`/movie/${movie.id}`}
              className="group/up w-[72vw] max-w-[420px] shrink-0 sm:w-[340px]"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-ink-raised">
                {still ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={still}
                    alt={movie.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-opacity duration-300 group-hover/up:opacity-85"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-paper-faint">
                    {movie.title}
                  </div>
                )}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-2 border border-paper/0 transition-colors duration-300 group-hover/up:border-paper/60"
                />
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                {date && (
                  <span className="t-film shrink-0 text-lg text-curtain-ink">
                    {fmt.format(date)}
                  </span>
                )}
                <h3 className="truncate text-[0.8125rem] text-paper-dim transition-colors duration-300 group-hover/up:text-paper">
                  {movie.title}
                </h3>
              </div>
            </Link>
          );
        })}
        <div aria-hidden className="rail-gutter" />
      </div>
    </section>
  );
}
