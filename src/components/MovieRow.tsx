"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/tmdb";
import { IMAGE_SIZES } from "@/lib/images";

/**
 * 橫向策展列。
 *
 * size="lg" 給當頁最重要的一列（為你挑的／熱門），卡片明顯大一階；
 * 其餘用 sm。首頁靠這個尺寸差製造疏密，而不是每列都一樣寬。
 *
 * 捲動箭頭常駐但低對比，不做 hover 才浮現——箭頭是導覽件，
 * 藏起來只是為了畫面乾淨，代價是使用者不知道這列可以捲。
 */
export default function MovieRow({
  title,
  movies,
  moreHref,
  moreLabel,
  size = "sm",
  prevLabel,
  nextLabel,
  aside,
  headingId,
}: {
  title: string;
  movies: MovieSummary[];
  moreHref: string;
  moreLabel: string;
  size?: "sm" | "lg";
  prevLabel: string;
  nextLabel: string;
  /** 標題後的一句事實，例如資料來源（「TMDB 熱門」）；寫法同 SectionHead */
  aside?: string;
  /** 給外層 section 的 aria-labelledby 用 */
  headingId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 已經捲到頭／尾時箭頭要看得出來按了也沒用。
  // 沒有這個狀態的話，兩顆箭頭在任何位置都長一樣，按下去沒反應像壞掉。
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    // 次像素誤差：容器寬與捲動寬相減常會差個 0.5px，留 1px 容差
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });
    const observer = new ResizeObserver(syncEdges);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      observer.disconnect();
    };
  }, [syncEdges, movies.length]);

  if (movies.length === 0) return null;

  // 每次捲動約一個可視寬度的 80%
  function scrollByDir(dir: number) {
    const el = ref.current;
    if (el)
      el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const cardWidth =
    size === "lg"
      ? "w-[46vw] max-w-[260px] sm:w-56 md:w-64"
      : "w-[32vw] max-w-[180px] sm:w-36 md:w-40";

  return (
    <section aria-labelledby={headingId}>
      <div className="mx-auto flex max-w-[1400px] items-baseline justify-between gap-6 px-5 sm:px-8">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h2 id={headingId} className="t-section text-paper">
            {title}
          </h2>
          {aside && <p className="t-meta text-paper-faint">{aside}</p>}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={moreHref}
            className="tap-safe text-[0.75rem] tracking-[0.08em] text-paper-faint transition-colors hover:text-paper"
          >
            {moreLabel}
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              aria-label={prevLabel}
              disabled={atStart}
              onClick={() => scrollByDir(-1)}
              className="flex h-11 w-11 items-center justify-center text-paper-faint transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-25"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              aria-label={nextLabel}
              disabled={atEnd}
              onClick={() => scrollByDir(1)}
              className="flex h-11 w-11 items-center justify-center text-paper-faint transition-colors hover:text-paper disabled:pointer-events-none disabled:opacity-25"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* 捲動容器出血到視窗邊緣，但第一張卡仍與標題切齊。
          右側刻意不留白，讓最後一張被裁切，暗示這列還有內容。 */}
      <div
        ref={ref}
        className={`scrollbar-hide mt-6 flex overflow-x-auto scroll-smooth ${
          size === "lg" ? "gap-5" : "gap-4"
        }`}
      >
        {/* 左側墊片：對齊 Container 的內距 */}
        <div aria-hidden className="rail-gutter" />
        {movies.map((m) => (
          <div key={m.id} className={`${cardWidth} shrink-0`}>
            <MovieCard
              movie={m}
              size={size}
              sizes={
                size === "lg" ? IMAGE_SIZES.railLarge : IMAGE_SIZES.railSmall
              }
            />
          </div>
        ))}
        <div aria-hidden className="rail-gutter" />
      </div>
    </section>
  );
}
