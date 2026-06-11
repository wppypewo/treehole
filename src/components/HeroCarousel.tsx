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

// 頂部大型主視覺輪播：用熱門電影的 backdrop 淡入淡出輪播，可左右切換、點擊進詳情。
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
    <section className="group/hero relative overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/9] w-full bg-zinc-900 sm:aspect-[2.4/1]">
        {items.map((item, i) => {
          const img = tmdbImage(item.backdrop_path, "w780");
          return (
            <Link
              key={item.id}
              href={`/movie/${item.id}`}
              aria-hidden={i !== idx}
              // 全部疊放，靠 opacity 做淡入淡出；非當前張不接受點擊
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === idx ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              )}
              {/* 由下而上的深色漸層，讓文字清楚 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 space-y-2 p-5 sm:p-8">
                <h2 className="text-2xl font-bold text-white sm:text-4xl">
                  {item.title}
                </h2>
                <p className="line-clamp-2 max-w-2xl text-sm text-zinc-200 sm:text-base">
                  {item.overview}
                </p>
                <span className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
                  {viewLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {items.length > 1 && (
        <>
          {/* 左右切換箭頭：游標移入時淡入 */}
          <button
            type="button"
            aria-label="prev"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-black/70 group-hover/hero:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={() => go(1)}
            className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white opacity-0 backdrop-blur transition-opacity duration-300 hover:bg-black/70 group-hover/hero:opacity-100"
          >
            ›
          </button>

          {/* 進度圓點 */}
          <div className="absolute top-4 right-4 z-10 flex gap-1.5">
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
    </section>
  );
}
