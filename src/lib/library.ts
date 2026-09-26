import type { Locale } from "@/i18n/config";

// 三個片庫頁的排序、篩選、分組。純函式，伺服器與瀏覽器都能用，
// 拆出來是為了能單獨測：排序錯了畫面不會報錯，只會安靜地排錯。

function collatorFor(locale: Locale): Intl.Collator {
  // zh-Hant 的預設排序是筆畫，跟書店索引一致；英文照字母
  return new Intl.Collator(locale === "en" ? "en" : "zh-Hant", {
    sensitivity: "base",
    numeric: true,
  });
}

// ── 想看 ─────────────────────────────────────────────────

export type WatchlistSort = "queue" | "runtime" | "title";

export interface QueueItem {
  /** 依加入先後的序號，從 1 起算。換排序也不變，看得出它原本排第幾 */
  queue: number;
  title: string;
  runtime: number | null;
}

/**
 * 想看清單排序。片長不知道的排最後——
 * 挑「今晚看得完的」時，不知道長度的片不該混在短片裡。
 * 同分一律退回加入先後，排序結果才穩定。
 */
export function sortWatchlist<T extends QueueItem>(
  rows: T[],
  by: WatchlistSort,
  locale: Locale,
): T[] {
  const byQueue = (a: T, b: T) => a.queue - b.queue;
  if (by === "queue") return [...rows].sort(byQueue);
  if (by === "runtime") {
    return [...rows].sort((a, b) => {
      if (a.runtime === null && b.runtime === null) return byQueue(a, b);
      if (a.runtime === null) return 1;
      if (b.runtime === null) return -1;
      return a.runtime - b.runtime || byQueue(a, b);
    });
  }
  const c = collatorFor(locale);
  return [...rows].sort((a, b) => c.compare(a.title, b.title) || byQueue(a, b));
}

/** 全部片長加總。任何一部不知道就回 null：只算一部分的總數是錯的數字 */
export function totalRuntime(runtimes: (number | null)[]): number | null {
  if (runtimes.length === 0) return null;
  let sum = 0;
  for (const r of runtimes) {
    if (r === null || r <= 0) return null;
    sum += r;
  }
  return sum;
}

// ── 看過 ─────────────────────────────────────────────────

export type WatchedFilter = "all" | "high" | "unrated";

/** 「8 分以上」的門檻。評分是 1–10 的整數 */
export const HIGH_SCORE = 8;

export function filterWatched<T extends { score: number | null }>(
  entries: T[],
  filter: WatchedFilter,
): T[] {
  if (filter === "high")
    return entries.filter((e) => e.score !== null && e.score >= HIGH_SCORE);
  if (filter === "unrated") return entries.filter((e) => e.score === null);
  return entries;
}

export interface MonthGroup<T> {
  key: string;
  label: string;
  entries: T[];
}

/**
 * 依月份分組，保留傳進來的順序（看過日期新的在前）。
 * 沒有日期的條目收進最後一組，key 為空字串，由呼叫端決定標題。
 */
export function groupByMonth<
  T extends { month: { key: string; label: string } | null },
>(entries: T[]): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = [];
  const index = new Map<string, MonthGroup<T>>();
  const undated: T[] = [];
  for (const e of entries) {
    if (!e.month) {
      undated.push(e);
      continue;
    }
    let g = index.get(e.month.key);
    if (!g) {
      g = { key: e.month.key, label: e.month.label, entries: [] };
      index.set(e.month.key, g);
      groups.push(g);
    }
    g.entries.push(e);
  }
  if (undated.length > 0) groups.push({ key: "", label: "", entries: undated });
  return groups;
}

// ── 收藏 ─────────────────────────────────────────────────

export type FavoritesSort = "recent" | "title" | "mine";

/**
 * 收藏排序。「我的評分」高的在前，沒評分的排最後；
 * 同分退回收藏先後（新的在前）。
 */
export function sortFavorites<
  T extends { title: string; added_at: string; score: number | null },
>(rows: T[], by: FavoritesSort, locale: Locale): T[] {
  const recent = (a: T, b: T) => b.added_at.localeCompare(a.added_at);
  if (by === "recent") return [...rows].sort(recent);
  if (by === "mine") {
    return [...rows].sort((a, b) => {
      if (a.score === null && b.score === null) return recent(a, b);
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score || recent(a, b);
    });
  }
  const c = collatorFor(locale);
  return [...rows].sort((a, b) => c.compare(a.title, b.title) || recent(a, b));
}
