import Link from "next/link";
import { tmdbImage } from "@/lib/images";
import type { MovieSummary } from "@/lib/tmdb";
import type { Locale } from "@/i18n/config";

// 上映日格式化：短月份 + 日。抽出來讓首頁的橫列與 /upcoming 整頁共用同一種寫法。
export function upcomingDateFormatter(locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-TW", {
    month: "short",
    day: "numeric",
  });
}

/**
 * 即將上映用的卡片：16:9 劇照 + 上映日。
 *
 * 不用海報，因為未上映的片常常還沒有成品海報，而這一區真正的資訊是「哪一天」。
 * 日期用 didone 大字擺在片名之前，片名退到次層。
 */
export default function UpcomingCard({
  movie,
  fmt,
}: {
  movie: MovieSummary;
  fmt: Intl.DateTimeFormat;
}) {
  const still = tmdbImage(movie.backdrop_path, "w780");
  const date = movie.release_date ? new Date(movie.release_date) : null;

  return (
    <Link href={`/movie/${movie.id}`} className="group/up block">
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
          className="pointer-events-none absolute inset-2 border border-paper/0 transition-colors duration-300 group-hover/up:border-paper/60 group-focus-visible/up:border-paper/60"
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
}
