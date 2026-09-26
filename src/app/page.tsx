import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  getPopular,
  getUpcoming,
  getMovieDetails,
  getMovieCredits,
  type MovieDetails,
  type MovieSummary,
} from "@/lib/tmdb";
import { listWatchlistEntries, listRecentWatched } from "@/lib/db";
import type { WatchlistEntry, WatchedEntry } from "@/lib/db";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import { shelfDateFormatter, todayInTaipei } from "@/lib/dates";
import StatusNotice from "@/components/StatusNotice";
import RefreshButton from "@/components/RefreshButton";
import MovieRow from "@/components/MovieRow";
import SectionHead from "@/components/SectionHead";
import Tonight, { type TonightFilm } from "@/components/home/Tonight";
import ProgramTable, { type ProgramRow } from "@/components/home/ProgramTable";
import DiaryStrip, { type DiaryEntry } from "@/components/home/DiaryStrip";
import ScheduleList, { type ScheduleItem } from "@/components/home/ScheduleList";

// 這一頁本來就是動態渲染——getLocale() 讀 cookie，Next 不會把它預渲染。
//
// 不加 force-dynamic 是刻意的：那個旗標等同於 fetchCache = "force-no-store"，
// 會把下面幾路 TMDB 在 tmdbFetch 裡設好的 revalidate 一併作廢，
// 每次進首頁都真的重打 TMDB。片庫讀資料庫，本來就不吃 fetch 快取，
// 不需要用整頁的旗標去換它一路的即時性。

/** 放映表最多列幾部；再多就交給 /watchlist */
const TABLE_ROWS = 8;
/** 最近看過列幾部；四欄排成一列 */
const DIARY_ROWS = 4;
/** 即將上映列幾部 */
const SCHEDULE_ROWS = 10;
/**
 * 「全部看完約幾小時」要知道每一部的片長，得逐部查 TMDB。
 * 清單超過這個數就不算總時數，寧可不寫，也不寫一個只算了一部分的數字。
 */
const RUNTIME_SUM_LIMIT = 24;

interface Shelf {
  /** 依加入先後，最早的在前 */
  watchlist: WatchlistEntry[];
  /** 最近看過的在前，只取日誌要用的幾部 */
  watched: WatchedEntry[];
}

/** 讀片庫。資料庫讀不到時回 null，首頁改用 TMDB 熱門撐住，不整頁報錯 */
async function loadShelf(): Promise<Shelf | null> {
  try {
    const [watchlist, watched] = await Promise.all([
      listWatchlistEntries(),
      listRecentWatched(DIARY_ROWS),
    ]);
    return { watchlist, watched };
  } catch (error) {
    console.error("[home] 片庫讀取失敗，首頁改放 TMDB 熱門", error);
    return null;
  }
}

/** ?pick= 只收非負整數，其餘一律當成 0 */
function parsePick(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

function yearOf(date: string | undefined): string | null {
  return date && date.length >= 4 ? date.slice(0, 4) : null;
}

function scheduleDateFormatter(locale: Locale) {
  // 「9/26」：兩種語系都用同一種短寫，欄寬才固定
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-TW", {
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const pick = parsePick((await searchParams).pick);

  // 第一段：三路並行。熱門與檔期失敗只是少一段；片庫失敗改用熱門開場
  const [pRes, uRes, shelf] = await Promise.all([
    getPopular(locale, 1).then(
      (v) => ({ ok: true as const, v }),
      (e: unknown) => ({ ok: false as const, e }),
    ),
    getUpcoming(locale, 1).catch(() => null),
    loadShelf(),
  ]);
  const popular = pRes.ok ? pRes.v.results : [];

  // 今晚放哪一部 ------------------------------------------------------
  const queue = shelf?.watchlist ?? [];
  const pickIdx = queue.length > 0 ? pick % queue.length : 0;
  const fromQueue: WatchlistEntry | undefined = queue[pickIdx];
  // 清單空了或讀不到時，放熱門榜第一部有劇照的片
  const fromPopular: MovieSummary | undefined = fromQueue
    ? undefined
    : (popular.find((m) => m.backdrop_path) ?? popular[0]);

  const tonightId = fromQueue?.tmdb_id ?? fromPopular?.id ?? null;
  if (tonightId === null) {
    // 片庫與熱門都拿不到，首頁沒有任何東西可以放
    return (
      <StatusNotice
        title={dict.errors.loadFailed}
        // 熱門榜有回應卻是空的：沒有具體原因可說，用通用訊息。
        // 原本這裡用 fallbackError（「先放熱門榜第一部」），但此時畫面上一部都沒有
        body={pRes.ok ? dict.errors.generic : tmdbErrorMessage(pRes.e, dict)}
      >
        <RefreshButton label={dict.errors.reload} />
      </StatusNotice>
    );
  }

  // 第二段：補 TMDB 細節。放映表的前幾部要導演，其餘只要片長算總時數
  const tableSource = queue.slice(0, TABLE_ROWS);
  const detailIds = new Set<number>([tonightId]);
  const creditIds = new Set<number>([tonightId]);
  for (const m of tableSource) creditIds.add(m.tmdb_id);
  const canSumRuntime =
    queue.length > 0 && queue.length <= RUNTIME_SUM_LIMIT;
  for (const m of canSumRuntime ? queue : tableSource) detailIds.add(m.tmdb_id);

  const diarySource = (shelf?.watched ?? []).slice(0, DIARY_ROWS);

  const [detailList, creditList] = await Promise.all([
    Promise.allSettled([...detailIds].map((id) => getMovieDetails(locale, id))),
    Promise.allSettled([...creditIds].map((id) => getMovieCredits(locale, id))),
  ]);

  // 任一部查不到就少那幾格，不讓整段消失
  const details = new Map<number, MovieDetails>();
  [...detailIds].forEach((id, i) => {
    const r = detailList[i];
    if (r.status === "fulfilled") details.set(id, r.value);
  });
  const directors = new Map<number, string>();
  [...creditIds].forEach((id, i) => {
    const r = creditList[i];
    if (r.status === "fulfilled" && r.value.director)
      directors.set(id, r.value.director.name);
  });

  const d = details.get(tonightId);
  const tonight: TonightFilm = {
    id: tonightId,
    title: d?.title ?? fromQueue?.title ?? fromPopular?.title ?? "",
    originalTitle: d?.original_title ?? fromPopular?.original_title ?? null,
    year: yearOf(d?.release_date ?? fromPopular?.release_date),
    runtime: d?.runtime ?? null,
    director: directors.get(tonightId) ?? null,
    genres: d?.genres.map((g) => g.name) ?? [],
    backdropPath: d?.backdrop_path ?? fromPopular?.backdrop_path ?? null,
  };

  const reason = fromQueue
    ? pickIdx === 0
      ? dict.home.tonight.oldest
      : dict.home.tonight.nth
          .replace("{n}", String(pickIdx + 1))
          .replace("{total}", String(queue.length))
    : shelf
      ? dict.home.tonight.fallbackEmpty
      : dict.home.tonight.fallbackError;

  const next =
    queue.length > 1
      ? {
          href: `/?pick=${(pickIdx + 1) % queue.length}`,
          label: dict.home.tonight.next,
        }
      : null;

  // 劇照說明：括號與間隔依語系不同
  const credit = dict.home.tonight.stillCredit;
  const caption =
    locale === "en"
      ? `${tonight.title}${tonight.year ? ` (${tonight.year})` : ""} · ${credit}`
      : `${tonight.title}${tonight.year ? `（${tonight.year}）` : ""} · ${credit}`;

  // 放映表 ------------------------------------------------------------
  const minutes = dict.home.facts.minutes;
  const today = todayInTaipei();
  const shelfDate = shelfDateFormatter(locale, today.slice(0, 4));
  const rows: ProgramRow[] = tableSource.map((m) => {
    const md = details.get(m.tmdb_id);
    const parts = [
      yearOf(md?.release_date),
      md?.runtime ? minutes.replace("{n}", String(md.runtime)) : null,
    ].filter(Boolean);
    return {
      id: m.tmdb_id,
      title: md?.title ?? m.title,
      originalTitle: md?.original_title ?? null,
      director: directors.get(m.tmdb_id) ?? null,
      sub: parts.length > 0 ? parts.join(" · ") : null,
      added: (() => {
        const date = shelfDate(m.added_at);
        return date ? dict.home.watchlist.added.replace("{date}", date) : null;
      })(),
    };
  });

  // 總片長：每一部都查到片長才算
  let totalLabel: string | undefined;
  if (canSumRuntime) {
    const runtimes = queue.map((m) => details.get(m.tmdb_id)?.runtime ?? 0);
    if (runtimes.every((r) => r > 0)) {
      const sum = runtimes.reduce((a, b) => a + b, 0);
      const h = Math.floor(sum / 60);
      const m = sum % 60;
      totalLabel =
        h > 0
          ? dict.home.watchlist.totalHours
              .replace("{h}", String(h))
              .replace("{m}", String(m))
          : dict.home.watchlist.totalMinutes.replace("{m}", String(m));
    }
  }

  // 最近看過 ----------------------------------------------------------
  const diary: DiaryEntry[] = diarySource.map((m) => ({
    id: m.tmdb_id,
    title: m.title,
    date: shelfDate(m.watched_at),
    score:
      m.score !== null
        ? dict.home.diary.score.replace("{n}", String(m.score))
        : null,
    note: m.note?.trim() || null,
  }));

  // 外面在放：今晚那部已經在開場露過臉，這裡跳過 ----------------------
  const outside = popular.filter((m) => m.id !== tonightId).slice(0, 16);

  // 即將上映：只列還沒上映的，由近到遠 ------------------------------
  const fmt = scheduleDateFormatter(locale);
  const schedule: ScheduleItem[] = (uRes?.results ?? [])
    .filter((m) => m.release_date && m.release_date >= today)
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
    .slice(0, SCHEDULE_ROWS)
    .map((m) => ({
      id: m.id,
      title: m.title,
      date: fmt.format(new Date(`${m.release_date}T00:00:00Z`)),
    }));

  const lists = [
    { href: "/popular", label: dict.pages.popular },
    { href: "/top-rated", label: dict.pages.topRated },
    { href: "/highest-grossing", label: dict.pages.highestGrossing },
    { href: "/recommendations", label: dict.pages.recommendations },
    { href: "/upcoming", label: dict.pages.upcoming },
  ];

  return (
    <div className="pb-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Tonight
          film={tonight}
          reason={reason}
          caption={caption}
          next={next}
          labels={{
            open: dict.home.tonight.open,
            year: dict.home.facts.year,
            runtime: dict.home.facts.runtime,
            director: dict.home.facts.director,
            genres: dict.home.facts.genres,
            minutes,
          }}
        />

        {/* 區塊間距刻意不等：開場之後留得最多，之後依份量收放 */}
        {rows.length > 0 && (
          <section
            aria-labelledby="home-watchlist"
            className="mt-22 min-[900px]:mt-32"
          >
            <SectionHead
              id="home-watchlist"
              title={dict.home.watchlist.title}
              aside={totalLabel}
              more={{ href: "/watchlist", label: dict.home.watchlist.all }}
            />
            <ProgramTable
              rows={rows}
              currentId={fromQueue ? tonightId : null}
            />
          </section>
        )}

        {diary.length > 0 && (
          <section aria-labelledby="home-diary" className="mt-24">
            <SectionHead
              id="home-diary"
              title={dict.home.diary.title}
              more={{ href: "/watched", label: dict.home.diary.all }}
            />
            <DiaryStrip entries={diary} />
          </section>
        )}
      </div>

      {outside.length > 0 && (
        <div className="mt-26">
          <MovieRow
            headingId="home-out"
            title={dict.home.out.title}
            aside={dict.home.out.source}
            movies={outside}
            moreHref="/popular"
            moreLabel={dict.common.seeAll}
            prevLabel={dict.common.prev}
            nextLabel={dict.common.next}
          />
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        {schedule.length > 0 && (
          <section aria-labelledby="home-schedule" className="mt-24">
            <SectionHead
              id="home-schedule"
              title={dict.home.schedule.title}
              aside={dict.home.schedule.source}
              more={{ href: "/upcoming", label: dict.common.seeAll }}
            />
            <ScheduleList items={schedule} />
          </section>
        )}

        {/* 其他片單的入口。導覽列只放片庫，這幾頁靠這裡進得去 */}
        <nav aria-labelledby="home-lists" className="mt-24">
          <SectionHead id="home-lists" title={dict.home.lists} />
          <ul className="mt-[1.125rem] flex flex-wrap gap-x-7 gap-y-3 border-t border-hairline-strong pt-5 text-sm text-paper-dim">
            {lists.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-hair tap-inline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
