"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * 片庫三頁拿掉一部（或記為看過、復原）之後，焦點要有地方去。
 *
 * 按下「確定拿掉」時焦點在那顆鍵上，那一列一消失，焦點就掉回 <body>：
 * 鍵盤使用者下一個 Tab 從頁首重來，報讀器也不知道人現在在哪。
 * 這裡把焦點交給同一張表裡的鄰居：下一部，沒有就上一部，
 * 一部都不剩就交給空狀態（emptyRef 掛在空狀態裡可聚焦的元素上）。
 *
 * 用法：在會讓某一列離開的 setState 之前呼叫 leave(id)；
 * 復原把一列放回來時呼叫 arrive(id)，焦點等它畫出來之後落在它的片名上。
 * 項目要掛 data-flip-id（useFlip 本來就要求），片名是項目裡第一個連結。
 */
export function useRefocus(containerRef: RefObject<HTMLElement | null>) {
  const target = useRef<HTMLElement | number | "empty" | null>(null);

  // 每次畫完檢查有沒有排好要聚焦的地方。復原的那一列要畫完才在 DOM 上
  useEffect(() => {
    const t = target.current;
    if (t === null || t === "empty") return;
    target.current = null;
    const el =
      typeof t === "number"
        ? containerRef.current?.querySelector<HTMLElement>(
            `[data-flip-id="${t}"] a[href]`,
          )
        : t;
    if (el?.isConnected) el.focus();
  });

  function leave(id: number) {
    const items = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>("[data-flip-id]") ?? [],
    );
    const i = items.findIndex((el) => el.dataset.flipId === String(id));
    const near = i === -1 ? undefined : (items[i + 1] ?? items[i - 1]);
    target.current = near?.querySelector<HTMLElement>("a[href]") ?? "empty";
  }

  function arrive(id: number) {
    target.current = id;
  }

  // 空狀態是換掉整個容器才出現的，用 callback ref 接住它掛上的那一刻
  const emptyRef = useCallback((el: HTMLElement | null) => {
    if (el && target.current === "empty") {
      target.current = null;
      el.focus();
    }
  }, []);

  return { leave, arrive, emptyRef };
}
