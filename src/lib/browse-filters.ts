import { GENRES } from "./genres";

/** 瀏覽頁的三種排序，第一個是預設 */
export const BROWSE_SORTS = [
  "popularity.desc",
  "vote_average.desc",
  "primary_release_date.desc",
] as const;

/** 最低評分的門檻 */
export const BROWSE_RATINGS = ["6", "7", "8"] as const;

/** 年份選單最早到哪一年 */
export const BROWSE_FIRST_YEAR = 1980;

export interface BrowseFilters {
  genre: string;
  year: string;
  sort: string;
  rating: string;
}

type Param = string | string[] | undefined;

/** 同一個 key 出現兩次（?genre=1&genre=2）時 Next 給陣列，一律只認字串 */
function one(v: Param): string {
  return typeof v === "string" ? v : "";
}

/**
 * 把網址列的查詢字串收斂成一組合法條件。
 *
 * 這組值會原樣送到 TMDB，也會成為選項的選中狀態，所以不認得的一律當成「不限」，
 * 不照單全收：?genre=abc 或 ?year=1900 這種手改網址，
 * 結果應該是退回預設，而不是一頁選項都沒選中、結果又是空的畫面。
 */
export function parseBrowseFilters(
  sp: Record<string, Param>,
  thisYear: number,
): BrowseFilters {
  const genre = one(sp.genre);
  const year = one(sp.year);
  const sort = one(sp.sort);
  const rating = one(sp.rating);
  const y = Number(year);

  return {
    genre: GENRES.some((g) => String(g.id) === genre) ? genre : "",
    year:
      /^\d{4}$/.test(year) && y >= BROWSE_FIRST_YEAR && y <= thisYear ? year : "",
    sort: (BROWSE_SORTS as readonly string[]).includes(sort) ? sort : BROWSE_SORTS[0],
    rating: (BROWSE_RATINGS as readonly string[]).includes(rating) ? rating : "",
  };
}
