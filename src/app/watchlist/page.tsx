import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { listWatchlistEntries } from "@/lib/db";
import { getMovieCredits, getMovieDetails } from "@/lib/tmdb";
import type { MovieDetails } from "@/lib/tmdb";
import { shelfDateFormatter, todayInTaipei } from "@/lib/dates";
import { totalRuntime } from "@/lib/library";
import PageHeader from "@/components/PageHeader";
import WatchlistTable, {
  type WatchlistRow,
} from "@/components/library/WatchlistTable";

// getLocale() 讀 cookie，這頁不會被預先產生；片庫資料每次請求直接查資料庫。

/**
 * 最多替幾部片查 TMDB 片長與導演。每部兩個請求，40 部就是 80 個；
 * 再多頁面會慢到不像在翻自己的清單。超過的部分只顯示片名與加入日，並照實標出來。
 */
const DETAIL_LIMIT = 40;

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.library.watchlistTitle };
}

function yearOf(date: string | undefined): string | null {
  return date && date.length >= 4 ? date.slice(0, 4) : null;
}

export default async function WatchlistPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const entries = await listWatchlistEntries();

  const looked = entries.slice(0, DETAIL_LIMIT);
  const [detailList, creditList] = await Promise.all([
    Promise.allSettled(looked.map((m) => getMovieDetails(locale, m.tmdb_id))),
    Promise.allSettled(looked.map((m) => getMovieCredits(locale, m.tmdb_id))),
  ]);

  // 任一部查不到就少那幾格，不讓整頁失敗
  const details = new Map<number, MovieDetails>();
  const directors = new Map<number, string>();
  looked.forEach((m, i) => {
    const d = detailList[i];
    if (d.status === "fulfilled") details.set(m.tmdb_id, d.value);
    const c = creditList[i];
    if (c.status === "fulfilled" && c.value.director)
      directors.set(m.tmdb_id, c.value.director.name);
  });

  const minutes = dict.home.facts.minutes;
  const shelfDate = shelfDateFormatter(locale, todayInTaipei().slice(0, 4));

  const rows: WatchlistRow[] = entries.map((m, i) => {
    const md = details.get(m.tmdb_id);
    const runtime = md?.runtime && md.runtime > 0 ? md.runtime : null;
    const parts = [
      yearOf(md?.release_date),
      runtime ? minutes.replace("{n}", String(runtime)) : null,
    ].filter(Boolean);
    const date = shelfDate(m.added_at);
    return {
      movie: {
        tmdb_id: m.tmdb_id,
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
      },
      queue: i + 1,
      title: md?.title ?? m.title,
      originalTitle: md?.original_title ?? null,
      director: directors.get(m.tmdb_id) ?? null,
      sub: parts.length > 0 ? parts.join(" · ") : null,
      runtime,
      added: date ? dict.home.watchlist.added.replace("{date}", date) : null,
    };
  });

  // 刊頭：幾部，加上全部看完要多久。只有每一部都查到片長才算總數
  const capped = entries.length > DETAIL_LIMIT;
  const sum = capped ? null : totalRuntime(rows.map((r) => r.runtime));
  let total: string | null = null;
  if (sum !== null) {
    const h = Math.floor(sum / 60);
    const m = sum % 60;
    total =
      h > 0
        ? dict.home.watchlist.totalHours
            .replace("{h}", String(h))
            .replace("{m}", String(m))
        : dict.home.watchlist.totalMinutes.replace("{m}", String(m));
  }
  const meta =
    entries.length > 0
      ? [dict.common.filmCount.replace("{n}", String(entries.length)), total]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  const lw = dict.library.watchlist;

  return (
    <section className="page-shell">
      <PageHeader title={dict.library.watchlistTitle} meta={meta} />
      <div className="mt-8">
        <WatchlistTable
          rows={rows}
          locale={locale}
          labels={{
            remove: dict.library.remove,
            confirmRemove: dict.library.confirmRemove,
            cancel: dict.library.cancel,
            removeNamed: dict.library.removeNamed,
            sortGroup: dict.library.sortGroup,
            sortQueue: lw.sortQueue,
            sortRuntime: lw.sortRuntime,
            sortTitle: lw.sortTitle,
            markWatched: lw.markWatched,
            markWatchedNamed: lw.markWatchedNamed,
            markedWatched: lw.markedWatched,
            undo: dict.actions.undo,
            saveError: dict.common.saveError,
            removeError: dict.common.removeError,
            empty: dict.library.emptyWatchlist,
            browse: dict.common.browse,
          }}
        />
      </div>
      {capped && (
        <p className="mt-6 text-xs text-paper-faint">
          {lw.partialDetails.replace("{n}", String(DETAIL_LIMIT))}
        </p>
      )}
    </section>
  );
}
