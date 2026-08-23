"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * 全站捲動節奏層。
 *
 * 為什麼要這個：本站的兩個 scroll 動畫（首頁開場影像下沉、詳情頁片名浮出）
 * 都是 scrub 綁定捲動位置。瀏覽器原生捲動是階梯式的，scrub 會跟著一格一格跳。
 * Lenis 把捲動變成連續值，這兩個動畫才會是「慢而刻意」而不是抖動。
 * 它是基礎設施，不是特效——沒有它，GSAP 那兩個動畫就不成立。
 *
 * 這裡同時把 Lenis 的 raf 接到 GSAP ticker，避免兩套 rAF 互相搶 frame。
 */
export default function SmoothScroll() {
  useEffect(() => {
    // 使用者要求減少動態時完全不啟用，交還原生捲動
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      // 收尾偏長的緩動，貼近「膠片滑過」的手感，不是彈簧回彈
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
