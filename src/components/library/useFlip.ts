"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

/**
 * 片庫三頁共用的重排動畫：拿掉一部、換排序、換篩選時，
 * 留下來的項目從舊位置滑到新位置，新出現的淡入。
 *
 * 用法：容器掛 ref，每個項目掛 data-flip-id（值要穩定，用 tmdb_id），
 * 在會改變排列的 setState「之前」呼叫 capture()。
 *
 * 跟舊版 LibraryGrid 的差別：
 * - 目標改成 [data-flip-id]，不是容器的 children。日誌頁是月份分組，
 *   直接子元素是組而不是片，量 children 會量錯東西。
 * - 拿掉 onLeave。React 已經把離場的節點從 DOM 移走了，
 *   對它們做淡出不會有任何畫面，只是白做。離場由其餘項目補位來表達。
 */
export function useFlip<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const pending = useRef<Flip.FlipState | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    gsap.registerPlugin(Flip);
  }, []);

  function targets(): HTMLElement[] {
    return containerRef.current
      ? Array.from(
          containerRef.current.querySelectorAll<HTMLElement>("[data-flip-id]"),
        )
      : [];
  }

  function capture() {
    if (reduceMotion.current || !containerRef.current) return;
    pending.current = Flip.getState(targets());
  }

  // useLayoutEffect：要在瀏覽器畫出新位置之前把項目擺回舊位置，
  // 否則會先閃一次新排列，動畫才追上來
  useLayoutEffect(() => {
    const state = pending.current;
    if (!state) return;
    pending.current = null;
    // 篩到一部不剩時容器會被換成空狀態，沒有東西可以動
    if (!containerRef.current) return;

    Flip.from(state, {
      targets: targets(),
      duration: 0.25,
      ease: "expo.out",
      // 不用 absolute：這裡的項目高度不一（日誌有長有短的短評），
      // 抽離排版流會讓容器高度瞬間塌掉，頁尾先跳上來
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, ease: "expo.out" },
        ),
    });
  });

  return { containerRef, capture };
}
