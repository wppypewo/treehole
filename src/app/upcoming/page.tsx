import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { getUpcoming } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import { groupReleaseSchedule, todayInTaipei } from "@/lib/dates";
import { tmdbImage } from "@/lib/images";
import ErrorNotice from "@/components/ErrorNotice";
import PageHeader from "@/components/PageHeader";
import FallbackImg from "@/components/FallbackImg";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pages.upcoming };
}

/**
 * 即將上映：一張按日期排的院線片表。
 *
 * 這一頁的資訊是「哪一天」，所以日期佔左欄、同一天的片疊在右邊，
 * 由近到遠往下讀。原本是 16:9 劇照格線，但未上映的片常常還沒有像樣的劇照，
 * 大圖換不到任何多的資訊，還把日期擠成圖說。
 *
 * 日期不用簾幕紅：檔期是院線的事，不是使用者留下的痕跡。
 */
export default async function UpcomingPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  let movies: MovieSummary[] = [];
  let errorMessage;
  try {
    movies = (await getUpcoming(locale)).results;
  } catch (error) {
    errorMessage = tmdbErrorMessage(error, dict);
  }

  // TMDB 的 upcoming 會混進已經上映幾天的片，只留今天以後的
  const days = groupReleaseSchedule(movies, todayInTaipei(), locale);
  const count = days.reduce((n, d) => n + d.movies.length, 0);

  return (
    <section className="page-shell">
      <PageHeader
        title={dict.pages.upcoming}
        rule={false}
        meta={
          errorMessage || count === 0
            ? undefined
            : `${dict.common.filmCount.replace("{n}", String(count))} · ${dict.home.schedule.source}`
        }
      />
      <div className="mt-10">
        {errorMessage ? (
          <ErrorNotice message={errorMessage} placement="" />
        ) : days.length === 0 ? (
          <p className="border-t border-hairline py-20 text-center text-sm text-paper-faint">
            {dict.lists.upcomingEmpty}
          </p>
        ) : (
          <ol className="border-t border-hairline-strong">
            {days.map((d) => (
              <li
                key={d.date}
                className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-4 border-b border-hairline py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-8"
              >
                {/* 日期欄貼著捲動：同一天片多時，往下捲還看得到是哪一天 */}
                <p className="self-start leading-none sm:sticky sm:top-24">
                  <span aria-hidden className="t-num block text-[1.75rem] text-paper sm:text-[2.25rem]">
                    {d.md}
                  </span>
                  <span aria-hidden className="mt-1.5 block text-[0.6875rem] tracking-[0.06em] text-paper-faint">
                    {d.weekday}
                  </span>
                  <span className="sr-only">{d.full}</span>
                </p>

                <ul className="-mt-2.5 sm:-mt-2">
                  {d.movies.map((m) => (
                    <ScheduleFilm key={m.id} movie={m} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function ScheduleFilm({ movie }: { movie: MovieSummary }) {
  const poster = tmdbImage(movie.poster_path, "w185");
  const original =
    movie.original_title && movie.original_title !== movie.title
      ? movie.original_title
      : null;

  return (
    <li className="hov-row grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 py-2.5 max-sm:pl-3 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
      <div className="aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {poster && (
          // 海報是裝飾，片名就在旁邊
          <FallbackImg
            src={poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <Link
          href={`/movie/${movie.id}`}
          className="font-display text-[1.0625rem] leading-snug text-paper after:absolute after:inset-0 after:content-[''] sm:text-[1.1875rem]"
        >
          {movie.title}
        </Link>
        {original && (
          <p className="mt-0.5 truncate text-[0.8125rem] text-paper-faint">
            {original}
          </p>
        )}
      </div>
    </li>
  );
}
