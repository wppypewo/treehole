"use client";

import { useEffect, useState } from "react";

/**
 * 值變成 null 之後，先把上一個值留 exitMs，讓離場動畫有東西可以淡出、收起，
 * 時間到才真的清掉。用在撤銷列、錯誤提示這類「有值才顯示」的區塊。
 *
 * - 比對用 Object.is：傳字串、數字，或 useState 存的物件；
 *   每次 render 都新建的物件會被當成每次都變，不要傳。
 * - 可打斷：離場途中又有新值，計時器取消，直接換成新值。
 * - exitMs 要和 globals.css 的 --dur-exit 一致。
 */
export function useLinger<T>(value: T | null, exitMs = 180) {
  const [kept, setKept] = useState<T | null>(value);
  const [prev, setPrev] = useState<T | null>(value);

  // 依 prop 變化調整 state 的官方寫法：在 render 期間比對上一次的值
  if (!Object.is(prev, value)) {
    setPrev(value);
    if (value !== null) setKept(value);
  }

  useEffect(() => {
    if (value !== null || kept === null) return;
    const timer = setTimeout(() => setKept(null), exitMs);
    return () => clearTimeout(timer);
  }, [value, kept, exitMs]);

  return { shown: value ?? kept, closing: value === null && kept !== null };
}
