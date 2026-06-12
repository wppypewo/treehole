// TMDB 圖片網址助手（圖片網址非機密，前後端皆可用）
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbImage(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "w780" | "w1280" | "original" = "w500",
): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
