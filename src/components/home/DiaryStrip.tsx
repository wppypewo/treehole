import Link from "next/link";

export interface DiaryEntry {
  id: number;
  title: string;
  /** 大字日期，例如「9/21」。拿不到時整格不排，不用別的數字頂替 */
  date: string | null;
  /** 「我給 8 分」，呼叫端依語系組好；沒評分就是 null */
  score: string | null;
  note: string | null;
}

/**
 * 最近看過的幾部，排成日誌：日期、片名、自己給的分數、自己寫的一句話。
 *
 * 這一段全是使用者留下的痕跡，所以分數用 curtain-ink。
 * hover 用日誌那一種：大字日期轉色，其餘不動（見 globals.css 的 .hov-date）。
 *
 * 1／2／4 欄。四欄時剛好一列，這一段的份量就是「最近」，不往下長。
 */
export default function DiaryStrip({ entries }: { entries: DiaryEntry[] }) {
  return (
    <ol className="mt-[1.125rem] grid grid-cols-1 border-t border-hairline-strong min-[700px]:grid-cols-2 min-[1100px]:grid-cols-4">
      {entries.map((e) => (
        <li key={e.id} className="border-b border-hairline">
          <Link
            href={`/movie/${e.id}`}
            className="hov-date block pt-[1.125rem] pr-[1.125rem] pb-5"
          >
            {e.date && (
              <span className="date-num t-num block text-[1.875rem]">
                {e.date}
              </span>
            )}
            <span
              className={`block font-display text-[1.0625rem] leading-snug text-paper ${
                e.date ? "mt-3" : ""
              }`}
            >
              {e.title}
            </span>
            {e.score && (
              <span className="mt-1 block text-[0.8125rem] text-curtain-ink">
                {e.score}
              </span>
            )}
            {e.note && (
              <span className="mt-2 line-clamp-3 block text-[0.8125rem] leading-relaxed text-paper-faint">
                {e.note}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
