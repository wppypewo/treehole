import type { Locale } from "@/i18n/config";

// 片庫留下的時間（加入日、看過日）一律照台北時間顯示。
// 資料層回傳的是 UTC 的 ISO 字串，換日線在台北的午夜，不在格林威治的午夜。
// 伺服器與瀏覽器都會用到，這支檔案不能碰任何只在伺服器端有的東西。

const TZ = "Asia/Taipei";

function tagOf(locale: Locale): string {
  return locale === "en" ? "en-US" : "zh-TW";
}

/** 台北時區的今天，YYYY-MM-DD */
export function todayInTaipei(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * 轉成台北的「9/12」。不是今年的加上年份「2025/9/12」，
 * 不然去年九月跟今年九月看起來一樣。解析不了回 null，由呼叫端決定整格不排。
 */
export function shelfDateFormatter(locale: Locale, thisYear: string) {
  const tag = tagOf(locale);
  const short = new Intl.DateTimeFormat(tag, {
    month: "numeric",
    day: "numeric",
    timeZone: TZ,
  });
  const long = new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: TZ,
  });
  return (iso: string): string | null => {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return null;
    return todayInTaipei(t).slice(0, 4) === thisYear
      ? short.format(t)
      : long.format(t);
  };
}

export interface DiaryDate {
  /** 分組用，「2026-09」 */
  monthKey: string;
  /** 分組標題，「2026 年 9 月」／「September 2026」 */
  monthLabel: string;
  /** 大字的日，「21」 */
  day: string;
  /** 「週六」／「Sat」 */
  weekday: string;
  /** 給報讀用的完整日期，「2026年9月21日」 */
  full: string;
}

/** 看過日誌的日期拆解：月份分組、大字的日、星期。解析不了回 null */
export function diaryDateFormatter(locale: Locale) {
  const tag = tagOf(locale);
  const month = new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    timeZone: TZ,
  });
  const weekday = new Intl.DateTimeFormat(tag, {
    weekday: "short",
    timeZone: TZ,
  });
  const full = new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  });
  return (iso: string): DiaryDate | null => {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return null;
    const ymd = todayInTaipei(t);
    return {
      monthKey: ymd.slice(0, 7),
      // zh-TW 的 long month 是「2026年9月」，中間補空格跟站內其他數字排法一致
      monthLabel:
        locale === "en"
          ? month.format(t)
          : month.format(t).replace(/(\d+)年(\d+)月/, "$1 年 $2 月"),
      day: String(Number(ymd.slice(8, 10))),
      weekday: weekday.format(t),
      full: full.format(t),
    };
  };
}

export interface ReleaseDay<T> {
  /** 「2026-10-03」，也當 key 用 */
  date: string;
  /** 大字的「10/3」 */
  md: string;
  /** 「週六」／「Sat」 */
  weekday: string;
  /** 給報讀用的完整日期 */
  full: string;
  movies: T[];
}

/**
 * 院線上映日的片表：只留今天（台北）以後的，同一天的併成一組，由近到遠。
 *
 * TMDB 的 release_date 是「那個地區的上映日」，本身就是日曆上的一天，
 * 沒有時區可言。所以這裡釘在 UTC 格式化，不能用台北時區，
 * 否則「10-03T00:00Z」換成台北會變成 10/3 早上八點，看起來沒事，
 * 但換成負時區的伺服器就會退成 10/2。
 *
 * 同一天內保留 TMDB 回傳的順序（熱門度）。日期缺漏或解析不了的片不排。
 */
export function groupReleaseSchedule<
  T extends { release_date: string | null | undefined },
>(movies: T[], today: string, locale: Locale): ReleaseDay<T>[] {
  const tag = tagOf(locale);
  const md = new Intl.DateTimeFormat(tag, {
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
  const weekday = new Intl.DateTimeFormat(tag, {
    weekday: "short",
    timeZone: "UTC",
  });
  const full = new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  });

  const byDate = new Map<string, T[]>();
  for (const m of movies) {
    const d = m.release_date;
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d) || d < today) continue;
    if (Number.isNaN(new Date(`${d}T00:00:00Z`).getTime())) continue;
    const bucket = byDate.get(d);
    if (bucket) bucket.push(m);
    else byDate.set(d, [m]);
  }

  return [...byDate.keys()].sort().map((date) => {
    const t = new Date(`${date}T00:00:00Z`);
    return {
      date,
      md: md.format(t),
      weekday: weekday.format(t),
      full: full.format(t),
      movies: byDate.get(date)!,
    };
  });
}

/**
 * 日曆上的一天（生日、上映日），「1970 年 7 月 30 日」／「July 30, 1970」。
 *
 * 跟 groupReleaseSchedule 同理：TMDB 給的是 YYYY-MM-DD，本身沒有時區，
 * 釘在 UTC 格式化才不會因為伺服器時區退一天。格式不對回 null。
 */
export function calendarDateFormatter(locale: Locale) {
  const long = new Intl.DateTimeFormat(tagOf(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return (ymd: string | null | undefined): string | null => {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    const t = new Date(`${ymd}T00:00:00Z`);
    if (Number.isNaN(t.getTime())) return null;
    const text = long.format(t);
    // zh-TW 是「1970年7月30日」，數字與單位之間補空格，跟站內其他日期一致
    return locale === "en" ? text : text.replace(/(\d+)年(\d+)月(\d+)日/, "$1 年 $2 月 $3 日");
  };
}
