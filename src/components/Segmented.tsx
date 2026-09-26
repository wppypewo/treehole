"use client";

import { useRef } from "react";

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
