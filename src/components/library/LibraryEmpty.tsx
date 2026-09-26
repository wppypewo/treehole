import Link from "next/link";

/**
 * 片庫空了。只講怎麼放東西進來，給一個去探索的出口。
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
    <div className="py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-[0.9375rem] leading-relaxed text-paper-dim">{text}</p>
        <Link href="/browse" className="btn-line mt-8">
          {browse}
        </Link>
      </div>
    </div>
  );
}
