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
      gsap.to(layerRef.current, {
        yPercent: 14,
        ease: "none",
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
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
