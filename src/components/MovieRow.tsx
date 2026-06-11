"use client";

import { useRef } from "react";
import Link from "next/link";
import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/tmdb";

// 橫向捲動分類列（Apple TV 風）：標題 + 查看全部 + 可左右捲的海報列。
export default function MovieRow({
  title,
  movies,
  moreHref,
  moreLabel,
}: {
  title: string;
  movies: MovieSummary[];
  moreHref: string;
  moreLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  if (movies.length === 0) return null;

  // 每次捲動約一個可視寬度的 80%
  function scrollByDir(dir: number) {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <Link
          href={moreHref}
          className="text-sm text-zinc-400 transition-colors hover:text-white"
        >
          {moreLabel} ›
        </Link>
      </div>

      {/* 負外距延伸到頁面邊距，並當作箭頭的定位參考，使箭頭落在內容邊緣外側 */}
      <div className="group/row relative -mx-4 sm:-mx-6">
        <div
          ref={ref}
          // 內距留出緩衝：overflow-x 會連帶裁切四邊，留白讓海報放大／上移時不被切，
          // 且第一張卡仍對齊標題。
          className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth px-4 py-4 sm:px-6"
        >
          {movies.map((m) => (
            <div key={m.id} className="w-32 shrink-0 sm:w-40 md:w-44">
              <MovieCard movie={m} />
            </div>
          ))}
        </div>

        {/* 左右捲動箭頭：桌面 hover 時浮現 */}
        <button
          type="button"
          aria-label="prev"
          onClick={() => scrollByDir(-1)}
          className="absolute top-4 bottom-16 left-0 hidden w-12 items-center justify-center rounded-l-xl bg-gradient-to-r from-black/80 to-transparent text-2xl text-white opacity-0 transition-opacity duration-300 group-hover/row:opacity-100 sm:flex"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="next"
          onClick={() => scrollByDir(1)}
          className="absolute top-4 bottom-16 right-0 hidden w-12 items-center justify-center rounded-r-xl bg-gradient-to-l from-black/80 to-transparent text-2xl text-white opacity-0 transition-opacity duration-300 group-hover/row:opacity-100 sm:flex"
        >
          ›
        </button>
      </div>
    </section>
  );
}
