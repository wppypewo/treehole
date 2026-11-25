"use client";

import { useLinger } from "../useLinger";

/**
 * 片庫三頁共用的狀態列：最近一個動作的說明、「復原」，
 * 連續做了好幾個動作時再補一句還能往回復原幾部。
 *
 * 這一列一直掛在頁面上（沒事時是空的），報讀器才接得到變化。
 * 不設計時器：資料被改了的通知不該在人還在讀的時候自己消失。
 */
export default function UndoStatus({
  message,
  remaining,
  labels,
  busy,
  onUndo,
  className = "",
}: {
  message: string | null;
  /** 除了畫面上這一筆，堆疊裡還有幾筆可以復原 */
  remaining: number;
  labels: { undo: string; undoMore: string };
  busy: boolean;
  onUndo: () => void;
  className?: string;
}) {
  // 復原完最後一筆時，這列先淡出再清空，不是一下子不見
  const { shown, closing } = useLinger(message);

  return (
    <p
      role="status"
      className={`flex items-center text-[0.8125rem] text-paper-dim ${className}`}
    >
      {shown && (
        <span
          data-closing={closing || undefined}
          inert={closing}
          className="linger inline-flex flex-wrap items-center gap-x-4 gap-y-1"
        >
          {/* 換成下一筆時只換這段字；復原鍵不重掛，連按時焦點才留得住 */}
          <span key={shown} className="fade-in">
            {shown}
          </span>
          <button
            type="button"
            onClick={onUndo}
            aria-disabled={busy || undefined}
            className="link-hair tap-safe text-paper aria-disabled:opacity-40"
          >
            {labels.undo}
          </button>
          {remaining > 0 && (
            <span className="text-paper-faint">
              {labels.undoMore.replace("{n}", String(remaining))}
            </span>
          )}
        </span>
      )}
    </p>
  );
}
