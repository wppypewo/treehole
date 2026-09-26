import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { listWatchedEntries } from "@/lib/db";
import { diaryDateFormatter, todayInTaipei } from "@/lib/dates";
import PageHeader from "@/components/PageHeader";
import WatchedDiary, { type DiaryRow } from "@/components/library/WatchedDiary";

// getLocale() 讀 cookie，這頁不會被預先產生；片庫資料每次請求直接查資料庫。

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.library.watchedTitle };
}

export default async function WatchedPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const entries = await listWatchedEntries();

  // 日期拆解在伺服器做，照台北時間；瀏覽器端只負責篩選與分組
  const diaryDate = diaryDateFormatter(locale);
  const thisYear = todayInTaipei().slice(0, 4);

  const rows: DiaryRow[] = entries.map((m) => {
    const d = diaryDate(m.watched_at);
    return {
      movie: {
        tmdb_id: m.tmdb_id,
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
      },
      month: d ? { key: d.monthKey, label: d.monthLabel } : null,
      day: d?.day ?? null,
      weekday: d?.weekday ?? null,
      full: d?.full ?? null,
      score: m.score,
      note: m.note,
    };
  });

  // 刊頭：總數，加上今年看了幾部（今年還沒看過就不寫「今年 0 部」）
  const countThisYear = rows.filter((r) =>
    r.month?.key.startsWith(thisYear),
  ).length;
  const meta =
    entries.length > 0
      ? [
          dict.common.filmCount.replace("{n}", String(entries.length)),
          countThisYear > 0
            ? dict.library.watched.thisYear.replace("{n}", String(countThisYear))
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  const lw = dict.library.watched;

  return (
    <section className="page-shell">
      <PageHeader title={dict.library.watchedTitle} meta={meta} />
      <div className="mt-8">
        <WatchedDiary
          rows={rows}
          labels={{
            remove: dict.library.remove,
            confirmRemove: dict.library.confirmRemove,
            cancel: dict.library.cancel,
            removeNamed: dict.library.removeNamed,
            filterGroup: dict.library.filterGroup,
            filterAll: lw.filterAll,
            filterHigh: lw.filterHigh,
            filterUnrated: lw.filterUnrated,
            unrated: lw.unrated,
            score: dict.home.diary.score,
            count: dict.common.filmCount,
            undated: lw.undated,
            filteredEmpty: dict.library.filteredEmpty,
            removeError: dict.common.removeError,
            empty: dict.library.emptyWatched,
            browse: dict.common.browse,
          }}
        />
      </div>
    </section>
  );
}
