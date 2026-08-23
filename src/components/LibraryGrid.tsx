"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { tmdbImage } from "@/lib/images";
import type { SavedMovie } from "@/lib/db";

interface Labels {
  remove: string;
  empty: string;
  sort: string;
  sortAdded: string;
  sortTitle: string;
  sortRating: string;
  minRating: string;
  ratingPlaceholder: string;
  demoEmpty: string;
  browse: string;
  count: string;
}

/**
 * 收藏 / 想看 / 已看過。
 *
 * 卡片語彙與 MovieCard 一致：不放大、不壓評分徽章，只浮現內縮片夾框。
 * 之前這裡是獨立實作的一套 hover scale + badge，和探索頁的卡片對不起來。
 *
 * 與探索頁真正的差別在資訊：這裡的片是「你放進來的」，所以片名下面除了
 * 年份與 TMDB 評分之外，還有一個只有這裡會出現的動作——拿掉。
 *
 * 移除用 motion 的 popLayout，讓格線重排時不會整片跳動。
 */
export default function LibraryGrid({
  items,
  kind,
  labels,
  isDemo = false,
}: {
  items: SavedMovie[];
  kind: "favorites" | "watched" | "watchlist";
  labels: Labels;
  isDemo?: boolean;
}) {
  const [list, setList] = useState(items);
  const [removing, setRemoving] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"added" | "title" | "rating">("added");
  const [minRating, setMinRating] = useState("");

  async function remove(tmdbId: number) {
    setRemoving(tmdbId);
    try {
      await fetch(`/api/${kind}?tmdb_id=${tmdbId}`, { method: "DELETE" });
      setList((prev) => prev.filter((m) => m.tmdb_id !== tmdbId));
    } finally {
      setRemoving(null);
    }
  }

  let shown = minRating
    ? list.filter((m) => m.vote_average >= Number(minRating))
    : list;
  if (sortBy === "title") {
    shown = [...shown].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "rating") {
    shown = [...shown].sort((a, b) => b.vote_average - a.vote_average);
  }

  // 空狀態：demo 與真的空片庫講的是不同的事，不能共用同一句話
  if (list.length === 0) {
    return (
      <div className="border-t border-hairline py-24">
        <div className="mx-auto max-w-md text-center">
          <p className="text-[0.9375rem] leading-relaxed text-paper-dim">
            {isDemo ? labels.demoEmpty : labels.empty}
          </p>
          <Link href="/browse" className="btn-line mt-8">
            {labels.browse}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 控制條：與內容之間一條 hairline，兩個 select 靠左，計數靠右 */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "added" | "title" | "rating")
            }
            aria-label={labels.sort}
            className="select-dark"
          >
            <option value="added">{labels.sortAdded}</option>
            <option value="title">{labels.sortTitle}</option>
            <option value="rating">{labels.sortRating}</option>
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            aria-label={labels.minRating}
            className="select-dark"
          >
            <option value="">{labels.ratingPlaceholder}</option>
            {["8", "7", "6"].map((r) => (
              <option key={r} value={r}>
                {r}+
              </option>
            ))}
          </select>
        </div>
        <p className="t-meta text-paper-faint">
          {labels.count.replace("{n}", String(shown.length))}
        </p>
      </div>

      {shown.length === 0 ? (
        // 有片但篩選後歸零：控制條仍在上面，這裡純文字提示就夠
        <p className="py-20 text-center text-sm text-paper-faint">
          {labels.empty}
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <AnimatePresence initial={false} mode="popLayout">
            {shown.map((movie) => {
              const poster = tmdbImage(movie.poster_path, "w342");
              const rating =
                movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
              return (
                <motion.div
                  key={movie.tmdb_id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="group/lib"
                >
                  <Link href={`/movie/${movie.tmdb_id}`} className="block">
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-raised">
                      {poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={poster}
                          alt={movie.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-3 text-center text-[0.6875rem] text-paper-faint">
                          {movie.title}
                        </div>
                      )}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-2 border border-paper/0 transition-colors duration-300 group-hover/lib:border-paper/60 group-focus-within/lib:border-paper/60"
                      />
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-[0.8125rem] text-paper-dim transition-colors duration-300 group-hover/lib:text-paper">
                      {movie.title}
                    </h3>
                  </Link>

                  {/* 拿掉：常駐但極低對比，hover 才轉成簾幕紅。
                      不做「hover 才出現」——那會讓觸控裝置找不到它。 */}
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    {rating && (
                      <span className="t-meta text-paper-faint">{rating}</span>
                    )}
                    <button
                      type="button"
                      disabled={removing === movie.tmdb_id}
                      onClick={() => remove(movie.tmdb_id)}
                      className="tap-safe ml-auto text-[0.6875rem] tracking-[0.06em] text-paper-faint transition-colors hover:text-curtain-ink disabled:opacity-40"
                    >
                      {removing === movie.tmdb_id ? "…" : labels.remove}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
