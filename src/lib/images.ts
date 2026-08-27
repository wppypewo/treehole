// TMDB 圖片網址助手（圖片網址非機密，前後端皆可用）
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type TmdbImageSize =
  | "w185"
  | "w300"
  | "w342"
  | "w500"
  | "w780"
  | "w1280"
  | "original";

export function tmdbImage(
  path: string | null | undefined,
  size: TmdbImageSize = "w500",
): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

/**
 * 每一類素材要提供哪幾個寬度給瀏覽器挑。
 *
 * TMDB 只服務固定的幾個寬度，不是任意值——實測 `w999` 回 400。
 * 以下每個寬度都實際請求驗證過會回 200。
 *
 * profile 的 w342 不在 TMDB configuration 的 `profile_sizes`（那份清單只有
 * w45 / w185 / h632 / original），但 CDN 確實會產出，已實測 200。人物照最大
 * 的顯示槽是 220px，w342 在 2x 螢幕剛好夠用，所以停在這裡不往上加。
 *
 * poster 刻意不放 w780：海報最大的顯示槽約 260px，就算 3x 螢幕，w500 也有
 * 1.9 倍密度，肉眼看不出差別，但 w780 的檔案大得多。
 */
const SRCSET_WIDTHS = {
  poster: [185, 342, 500],
  backdrop: [300, 780, 1280],
  profile: [185, 342],
} as const;

export type TmdbImageKind = keyof typeof SRCSET_WIDTHS;

/**
 * 產生 srcset。搭配各處量身寫的 sizes，讓瀏覽器依實際顯示寬度與螢幕密度挑檔案。
 *
 * 這解決的是原本「不管什麼裝置都送同一個尺寸」的問題。最明顯的是首屏劇照：
 * 過去一律 w1280（實測 212KB），手機其實只需要 w780（85KB）。
 */
export function tmdbSrcSet(
  path: string | null | undefined,
  kind: TmdbImageKind,
): string | undefined {
  if (!path) return undefined;
  return SRCSET_WIDTHS[kind]
    .map((w) => `${IMAGE_BASE}/w${w}${path} ${w}w`)
    .join(", ");
}

/**
 * 各處的 sizes 字串。集中放在這裡，是因為 sizes 必須跟著版面走——
 * 格線欄數一改，這裡沒跟著改，瀏覽器就會挑錯尺寸而且沒有任何錯誤訊息。
 * 放在一起至少讓它們是一份可以一起讀、一起改的東西。
 */
export const IMAGE_SIZES = {
  // MovieGrid 的 POSTER_GRID：2 / 3 / 4 / 5 欄
  posterGrid:
    "(min-width: 1280px) 260px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  // MovieRow size="sm"
  railSmall: "(min-width: 768px) 160px, (min-width: 640px) 144px, 32vw",
  // MovieRow size="lg"
  railLarge: "(min-width: 768px) 256px, (min-width: 640px) 224px, 46vw",
  // UpcomingStrip 的橫捲卡
  upcomingRail: "(min-width: 640px) 340px, 72vw",
  // /upcoming 的 1 / 2 / 3 欄格線
  upcomingGrid:
    "(min-width: 1400px) 430px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw",
  // 出血劇照（首頁開場、詳情頁首屏）
  fullBleed: "100vw",
  // 詳情頁的海報欄
  detailPoster: "(min-width: 768px) 200px, 128px",
  // 人物頁的照片欄
  personPhoto: "(min-width: 768px) 220px, 128px",
  // 演職員橫列的小頭像
  personThumb: "112px",
  // 編號榜的小海報
  rankThumb: "48px",
  // 搜尋頁空狀態的片庫入口：max-w-2xl 內 3 / 6 欄
  libraryPicks: "(min-width: 640px) 102px, 30vw",
} as const;
