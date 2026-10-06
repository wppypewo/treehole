import Link from "next/link";

export interface ProgramRow {
  id: number;
  title: string;
  originalTitle: string | null;
  director: string | null;
  /** 「2019 · 132 分鐘」這一格，呼叫端依語系組好；拿不到就是 null */
  sub: string | null;
  /** 「9/12 加入」，同上 */
  added: string | null;
}

/**
 * 想看清單排成放映表：序號、片名、導演、年份與片長、加入日。
 *
 * 用列不用海報牆，因為這一段要回答的是「還有哪些、先看哪部」，
 * 那是一張清單的問題。海報牆適合挑，清單適合排。
 *
 * 序號照加入先後，跟「今晚」挑片的依據是同一條規則；
 * 今晚那一部的序號用 curtain-ink 標出來，看得出它在清單裡的位置。
 *
 * 手機三欄（序號／片名與資料／加入日），900px 以上把導演拉成獨立一欄。
 */
export default function ProgramTable({
  rows,
  currentId,
}: {
  rows: ProgramRow[];
  currentId: number | null;
}) {
  // 加入日整欄都沒有時，不留一條空欄
  const hasAdded = rows.some((r) => r.added);
  const desktopCols = hasAdded
    ? "min-[900px]:grid-cols-[3.5rem_minmax(0,1.3fr)_minmax(0,1fr)_9.5rem_7rem]"
    : "min-[900px]:grid-cols-[3.5rem_minmax(0,1.3fr)_minmax(0,1fr)_9.5rem]";

  return (
    <ol className="mt-[1.125rem] border-t border-hairline-strong">
      {rows.map((row, i) => (
        <li key={row.id}>
          <Link
            href={`/movie/${row.id}`}
            className={`hov-row grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-hairline py-4 max-sm:pl-3 ${desktopCols}`}
          >
            <span
              aria-hidden
              className={`t-num text-[1.375rem] ${
                row.id === currentId ? "text-curtain-ink" : "text-paper-faint"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            {/* 手機上原文片名換到第二行並截斷：接在譯名後面的話，
                常常只剩一兩個字掉到下一行 */}
            <span className="min-w-0 font-display text-xl leading-snug text-paper">
              {row.title}
              {row.originalTitle && row.originalTitle !== row.title && (
                <small
                  lang="und"
                  className="t-original ml-2.5 text-sm text-paper-faint max-sm:mt-0.5 max-sm:ml-0 max-sm:block max-sm:truncate"
                >
                  {row.originalTitle}
                </small>
              )}
            </span>

            <span className="hidden text-[0.8125rem] text-paper-dim min-[900px]:block">
              {row.director}
            </span>

            <span className="col-start-2 text-[0.8125rem] text-paper-dim tabular-nums min-[900px]:col-start-auto">
              {row.sub}
            </span>

            {hasAdded && (
              <span className="col-start-3 row-span-2 row-start-1 text-right text-xs text-paper-faint tabular-nums min-[900px]:col-start-auto min-[900px]:row-span-1 min-[900px]:row-start-auto">
                {row.added}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
