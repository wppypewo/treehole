// i18n 基礎設定：支援的語系、預設語系、cookie 名稱，以及對應 TMDB 的 language 參數

export const locales = ["zh-TW", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-TW";

// 存放使用者選擇語系的 cookie 名稱
export const LOCALE_COOKIE = "locale";

// 介面語系 → TMDB API 的 language 參數
export function tmdbLanguage(locale: Locale): string {
  return locale === "en" ? "en-US" : "zh-TW";
}

// 介面語系 → <html lang> 屬性值
export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "zh-Hant";
}

// 把任意字串收斂成合法語系，非法值退回預設語系
export function normalizeLocale(value: string | undefined | null): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}
