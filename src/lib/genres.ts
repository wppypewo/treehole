import type { Locale } from "@/i18n/config";

// 固定的 TMDB 電影類型清單。自備繁中／英文名稱
//（TMDB 的 zh-TW 類型名稱為簡體，故不採用其翻譯）。
export const GENRES: { id: number; zh: string; en: string }[] = [
  { id: 28, zh: "動作", en: "Action" },
  { id: 12, zh: "冒險", en: "Adventure" },
  { id: 16, zh: "動畫", en: "Animation" },
  { id: 35, zh: "喜劇", en: "Comedy" },
  { id: 80, zh: "犯罪", en: "Crime" },
  { id: 99, zh: "紀錄", en: "Documentary" },
  { id: 18, zh: "劇情", en: "Drama" },
  { id: 10751, zh: "家庭", en: "Family" },
  { id: 14, zh: "奇幻", en: "Fantasy" },
  { id: 36, zh: "歷史", en: "History" },
  { id: 27, zh: "恐怖", en: "Horror" },
  { id: 10402, zh: "音樂", en: "Music" },
  { id: 9648, zh: "懸疑", en: "Mystery" },
  { id: 10749, zh: "愛情", en: "Romance" },
  { id: 878, zh: "科幻", en: "Science Fiction" },
  { id: 10770, zh: "電視電影", en: "TV Movie" },
  { id: 53, zh: "驚悚", en: "Thriller" },
  { id: 10752, zh: "戰爭", en: "War" },
  { id: 37, zh: "西部", en: "Western" },
];

export function genreOptions(locale: Locale): { id: number; name: string }[] {
  return GENRES.map((g) => ({ id: g.id, name: locale === "en" ? g.en : g.zh }));
}
