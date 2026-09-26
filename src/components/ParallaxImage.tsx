"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * 隨捲動緩慢下沉的影像層。
 *
 * 全站只有一種 scroll 動畫，就是這個，用在首頁開場與詳情頁首屏。
 * 它要說的事情很單一：往下捲＝離開這張影像、進入文字。位移完全由捲動
 * 位置決定（scrub），不會自己動，也不會加速。
 *
 * reduced-motion 下不註冊 ScrollTrigger，影像維持靜止。
 */
export default function ParallaxImage({
  src,
  srcSet,
  sizes,
  priority = false,
}: {
  src: string;
  srcSet?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !wrapRef.current || !layerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 影像層上下各多出 8%（116% 高）。位移對稱地從 -6.5% 走到 +6.5%
      // （以影像層自身高度計，約等於框高的 ±7.5%），整段都不會露出框邊。
      // 原本是 0 → 14% 單向，只在 top top 起算時成立：起點提早之後，
      // 框頂還在視窗裡影像就已經退到框內，上緣會露出一條底色。
      gsap.fromTo(
        layerRef.current,
        { yPercent: -6.5 },
        {
          yPercent: 6.5,
          ease: "none",
          scrollTrigger: {
            trigger: wrapRef.current,
            // 從影像進入視窗就開始算，不是等它頂到視窗上緣。
            // 詳情頁的劇照在片名底下，用 top top 要捲過片名才開始動，
            // 前半段完全靜止。clamp() 讓首頁那種一進頁面就在頂端的影像
            // 起點不會落在負的捲動位置，開場不會先跳一段
            start: "clamp(top bottom)",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      {/* 影像本體比框高一截，位移時才不會露出邊 */}
      <div ref={layerRef} className="absolute inset-x-0 -top-[8%] h-[116%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt=""
          aria-hidden="true"
          fetchPriority={priority ? "high" : "auto"}
          className="h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
}
