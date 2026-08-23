import Link from "next/link";
import UpcomingCard, { upcomingDateFormatter } from "./UpcomingCard";
import type { MovieSummary } from "@/lib/tmdb";
import type { Locale } from "@/i18n/config";
import { IMAGE_SIZES } from "@/lib/images";

// 首頁的即將上映橫列。卡片本身與 /upcoming 整頁共用 UpcomingCard，
// 兩邊只差在排列方式（橫捲 vs 格線）。
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

  const fmt = upcomingDateFormatter(locale);

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
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="w-[72vw] max-w-[420px] shrink-0 sm:w-[340px]"
          >
            <UpcomingCard
              movie={movie}
              fmt={fmt}
              sizes={IMAGE_SIZES.upcomingRail}
            />
          </div>
        ))}
        <div aria-hidden className="rail-gutter" />
      </div>
    </section>
  );
}
