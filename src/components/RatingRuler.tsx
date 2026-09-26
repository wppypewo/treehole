"use client";

import { useRef } from "react";

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

/**
 * 十格評分刻度：選到的分數以下全部填實，像溫度計而不是十顆獨立按鈕。
 * 填色用簾幕紅，與片庫動作同一個「這是你留下的」語意。
 *
 * 三種輸入：
 * - 點一格
 * - 按住左右拖（手機上是主要用法，格子只有 30px 寬，拖比點準）
 * - 鍵盤：radiogroup 約定，整組只吃一次 Tab，方向鍵移動並直接選取
 *
 * 樣式在 globals.css 的 .ruler。
 */
export default function RatingRuler({
  value,
  onChange,
  labelledBy,
}: {
  value: number | null;
  onChange: (score: number) => void;
  labelledBy: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function focusCell(n: number) {
    ref.current
      ?.querySelector<HTMLButtonElement>(`[data-score="${n}"]`)
      ?.focus();
  }

  // 由指標的 x 座標換算是第幾格；超出左右邊界時夾在 1 與 10
  function scoreAt(clientX: number): number | null {
    const box = ref.current?.getBoundingClientRect();
    if (!box || box.width === 0) return null;
    const ratio = (clientX - box.left) / box.width;
    return Math.min(10, Math.max(1, Math.ceil(ratio * 10)));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const n = scoreAt(event.clientX);
    if (n === null) return;
    dragging.current = true;
    // 拖出刻度範圍之外也繼續收 pointermove，否則拖到 10 分時手指一滑出去就斷
    event.currentTarget.setPointerCapture(event.pointerId);
    if (n !== value) onChange(n);
    focusCell(n);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const n = scoreAt(event.clientX);
    if (n !== null && n !== value) {
      onChange(n);
      focusCell(n);
    }
  }

  function endDrag() {
    dragging.current = false;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = value ?? 1;
    let next: number | null = null;
    // 方向對應照 WAI-ARIA radiogroup：右／下是下一個，與 Segmented 一致
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = current === 10 ? 1 : current + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = current === 1 ? 10 : current - 1;
    } else if (event.key === "Home") {
      next = 1;
    } else if (event.key === "End") {
      next = 10;
    }
    if (next === null) return;
    event.preventDefault();
    onChange(next);
    // 焦點要跟著走，否則螢幕報讀者聽不到選取變化
    focusCell(next);
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="ruler"
    >
      {SCORES.map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            data-score={n}
            data-filled={value !== null && n <= value}
            // 整組只留一個可 Tab 到的落點：已選的那格，或還沒選時的第一格
            tabIndex={selected || (value === null && n === 1) ? 0 : -1}
            // 指標已經在 pointerdown 選過；這裡接的是鍵盤的 Enter／Space
            onClick={() => {
              if (n !== value) onChange(n);
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
