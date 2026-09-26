"use client";

import { Suspense, use } from "react";

export interface NavCounts {
  watchlist: number;
  watched: number;
}

export type NavCountKind = keyof NavCounts;

/**
 * 導覽列上的片數：「想看 12」「看過 48」。
 *
 * 數字由 layout 在伺服器端開一個 promise、不 await 就傳下來，這裡用 use() 讀。
 * 好處是導覽列本身不必等資料庫：先畫出沒有數字的版本，數字到了再補上。
 * 資料庫連不上時 promise 解出 null，數字就不出現，導覽列照常可用。
 *
 * 寫入之後（加入想看、標記看過、拿掉）由呼叫端 router.refresh()，
 * layout 重跑一次，這裡拿到新的 promise。
 */
export default function NavCount({
  counts,
  kind,
}: {
  counts: Promise<NavCounts | null> | null;
  kind: NavCountKind;
}) {
  if (!counts) return null;
  return (
    <Suspense fallback={null}>
      <Value counts={counts} kind={kind} />
    </Suspense>
  );
}

function Value({
  counts,
  kind,
}: {
  counts: Promise<NavCounts | null>;
  kind: NavCountKind;
}) {
  const resolved = use(counts);
  if (!resolved) return null;
  return (
    <span className="t-label ml-1.5 tabular-nums tracking-normal">
      {resolved[kind]}
    </span>
  );
}
