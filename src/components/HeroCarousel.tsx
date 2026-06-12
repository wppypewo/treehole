"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { tmdbImage } from "@/lib/images";

export interface HeroItem {
  id: number;
  title: string;
  backdrop_path: string | null;
  overview: string;
}

// 頂部大型主視覺輪播：backdrop 淡入淡出，文字層獨立疊放並在換片時 slide-up 進場。
export default function HeroCarousel({
  items,
  viewLabel,
}: {
  items: HeroItem[];
  viewLabel: string;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      6000,
    );
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const go = (dir: number) =>
    setIdx((i) => (i + dir + items.length) % items.length);

  return (
    // 負外距抵消 <main> 的水平 padding，讓 Hero 出血至內容欄邊緣
    <section className="group/hero relative -mx-4 overflow-hidden sm:-mx-6">
      {/* aspect-ratio div 是所有絕對定位元素的參考容器 */}
      <div className="relative aspect-[16/9] w-full bg-zinc-900 sm:aspect-[2.4/1]">

        {/* 圖片層：全部疊放，靠 opacity 切換；圖片本身不可點擊 */}
        {items.map((item, i) => {
          const img = tmdbImage(item.backdrop_path, "w1280");
          return (
            <div
              key={item.id}
              aria-hidden
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === idx ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt=""
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "low"}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          );
        })}

        {/* 由下而上深色漸層，讓文字清楚 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* 文字 + 點擊層：單一 Link 指向當前項目。
            key={idx} 觸發 React 重新掛載，使 CSS 動畫每次換片重播。
            pb-10/pb-12 為底部圓點留空間，避免重疊。 */}
        <Link
          href={`/movie/${items[idx].id}`}
          className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label={items[idx].title}
        >
          <div className="absolute right-0 bottom-0 left-0 px-5 pt-5 pb-10 sm:px-8 sm:pt-8 sm:pb-12">
            <div key={idx} className="animate-hero-text-in space-y-2">
              <h2 className="text-2xl font-bold text-white sm:text-4xl">
                {items[idx].title}
              </h2>
              <p className="line-clamp-2 max-w-2xl text-sm text-zinc-200 sm:text-base">
                {items[idx].overview}
              </p>
              <span className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
                {viewLabel}
              </span>
            </div>
          </div>
        </Link>

        {items.length > 1 && (
          <>
            {/* 左右切換箭頭：游標移入時淡入；z-10 確保在 Link 之上可點擊 */}
            <button
              type="button"
              aria-label="prev"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-black/70 group-hover/hero:opacity-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              type="button"
              aria-label="next"
              onClick={() => go(1)}
              className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-black/70 group-hover/hero:opacity-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
            </button>

            {/* 進度圓點：底部居中，z-10 在 Link 之上 */}
            <div className="absolute bottom-3.5 left-0 right-0 z-10 flex justify-center gap-2">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  aria-label={`${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === idx
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
