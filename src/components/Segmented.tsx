"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/**
 * 分段選擇：幾個選項裡選一個，選了立刻生效（排序、檢視方式）。
 *
 * 語意是 radiogroup，不是一排 aria-pressed 按鈕——後者會被讀成
 * 好幾個各自獨立的開關。鍵盤約定跟 RatingRuler 一樣：整組只吃一次 Tab，
 * 方向鍵移動並直接選取。
 *
 * 樣式在 globals.css：variant="box" 是 .seg（有外框的一條鍵），
 * variant="text" 是 .pick（一排字，選項多時用）。
 */
/** 量選中鍵的位置與大小，寫進 .seg-thumb 用的 CSS 變數 */
function placeThumb(group: HTMLDivElement | null, animate: boolean) {
  const thumb = group?.querySelector<HTMLElement>(".seg-thumb");
  const on = group?.querySelector<HTMLElement>('[role=radio][aria-checked="true"]');
  if (!group || !thumb || !on) return;
  // 已經擺過才滑；第一次直接出現在選中的鍵上
  const next = animate && group.dataset.thumb ? "move" : "still";
  if (group.dataset.thumb !== next) {
    group.dataset.thumb = next;
    // 從 still 切到 move 時先讓 transition 生效、再改位置；
    // 同一次樣式計算裡一起改，Chrome 實測第一次會直接跳到終點
    if (next === "move") void getComputedStyle(thumb).transform;
  }
  thumb.style.setProperty("--x", `${on.offsetLeft}px`);
  thumb.style.setProperty("--y", `${on.offsetTop}px`);
  thumb.style.setProperty("--sx", String(on.offsetWidth / 100));
  thumb.style.setProperty("--sy", String(on.offsetHeight / 100));
}

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  variant = "box",
  className = "",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 給螢幕報讀者的組名，例如「排序」。畫面上通常不顯示。 */
  label: string;
  variant?: "box" | "text";
  className?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const isBox = variant === "box";

  // 把選中底挪到選中鍵上。第一次只擺位置不動畫（data-thumb="still"），
  // 之後換選項才滑（"move"）。用 layout effect：在畫面畫出新選中狀態之前就量好，
  // 否則會先閃一格實心底再開始滑
  useLayoutEffect(() => {
    if (isBox) placeThumb(groupRef.current, true);
  }, [value, isBox]);

  // 字級、視窗寬度改變會讓鍵變寬或折行：重新量，但不動畫。
  // 只在掛載時建一次 observer；每次換值都重建的話，它的首次回呼會把滑動打斷
  useEffect(() => {
    const group = groupRef.current;
    if (!isBox || !group || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => placeThumb(group, false));
    ro.observe(group);
    return () => ro.disconnect();
  }, [isBox]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const i = options.findIndex((o) => o.value === value);
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (i + 1) % options.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (i - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = options.length - 1;
    }
    if (next === null) return;
    event.preventDefault();
    onChange(options[next].value);
    groupRef.current
      ?.querySelectorAll<HTMLButtonElement>("[role=radio]")
      [next]?.focus();
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`${variant === "text" ? "pick" : "seg"} ${className}`}
    >
      {isBox && <span aria-hidden className="seg-thumb" />}
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
