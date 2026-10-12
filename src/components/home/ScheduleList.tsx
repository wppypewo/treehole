import Link from "next/link";

export interface ScheduleItem {
  id: number;
  title: string;
  /** 上映日，呼叫端依語系格式化好 */
  date: string;
}

/**
 * 即將上映：日期在前、片名在後的一張檔期表。
 *
 * 原本是 16:9 劇照橫捲，但這一段真正的資訊是「哪一天」，劇照佔掉的空間
 * 換不到任何多的資訊，而且未上映的片常常還沒有像樣的劇照。
 *
 * 日期不用簾幕紅：檔期是院線的事，不是使用者留下的痕跡。
 * 800px 以上分兩欄，用 CSS columns 讓日期由上往下讀，而不是左右跳。
 *
 * 同一天常有好幾部（2026-10-05 實測首頁 10 列裡 10/8 佔 6 列），每列都印
 * 一次日期，日期欄就變成重複的噪音。與上一列同一天時：單欄把日期留白，
 * 讀起來像「這一天底下的幾部」；兩欄時第二欄開頭可能正好是重複的那列，
 * 留白會讓那欄沒有日期可依，所以改成轉淡而不是消失。
 * 螢幕閱讀器每列照樣讀到日期。
 */
export default function ScheduleList({ items }: { items: ScheduleItem[] }) {
  return (
    <ol className="mt-[1.125rem] columns-1 gap-12 border-t border-hairline-strong min-[800px]:columns-2">
      {items.map((m, i) => {
        const repeat = i > 0 && items[i - 1].date === m.date;
        return (
          <li
            key={m.id}
            className="break-inside-avoid border-b border-hairline"
          >
            <Link
              href={`/movie/${m.id}`}
              className="hov-row flex items-baseline gap-[1.125rem] py-3 max-sm:pl-3"
            >
              <span
                className={
                  repeat
                    ? "t-num w-16 shrink-0 text-lg text-transparent min-[800px]:text-paper-faint"
                    : "t-num w-16 shrink-0 text-lg text-paper-dim"
                }
              >
                {m.date}
              </span>
              <span className="min-w-0 text-sm text-paper">{m.title}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
