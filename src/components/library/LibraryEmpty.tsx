import Link from "next/link";

/**
 * 片庫空了。只講怎麼放東西進來，給一個去探索的出口。
 *
 * 排成表的一列：序號欄寫 00（這張表有 0 部），右欄放說明與出口，
 * 欄寬跟想看清單的序號欄一樣，片放進來之後第一列就長在同一個位置。
 * 不置中：全站的表、刊頭、狀態頁都靠左，空的時候也一樣。
 * 不畫上框線：刊頭底下已經有一條，再畫一條會變成兩條並排。
 */
export default function LibraryEmpty({
  text,
  browse,
}: {
  text: string;
  browse: string;
}) {
  return (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-hairline pt-8 pb-10 min-[900px]:grid-cols-[3.5rem_minmax(0,1fr)]">
      <span aria-hidden className="t-num text-[1.375rem] text-paper-faint">
        00
      </span>
      <div className="min-w-0">
        <p className="max-w-[44ch] text-pretty text-[0.9375rem] leading-relaxed text-paper-dim">
          {text}
        </p>
        <Link href="/browse" className="btn-line mt-6">
          {browse}
        </Link>
      </div>
    </div>
  );
}
