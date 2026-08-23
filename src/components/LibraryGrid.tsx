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
}

// 收藏 / 想看 / 已看過 列表：可排序與依評分篩選，每張卡片可移除。
// 卡片外觀與 MovieCard 一致（hover scale、ring、rating badge）。
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

  // 統一深色 select 外觀（定義於 globals.css）
  const selectCls = "select-dark";

  return (
    <div className="space-y-4">
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "added" | "title" | "rating")
            }
            aria-label={labels.sort}
            className={selectCls}
          >
            <option value="added">{labels.sortAdded}</option>
            <option value="title">{labels.sortTitle}</option>
            <option value="rating">{labels.sortRating}</option>
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            aria-label={labels.minRating}
            className={selectCls}
          >
            <option value="">{labels.ratingPlaceholder}</option>
            {["8", "7", "6"].map((r) => (
              <option key={r} value={r}>
                {r}+
              </option>
            ))}
          </select>
        </div>
      )}

      {shown.length === 0 ? (
        isDemo && list.length === 0 ? (
          // demo 模式：誠實說明片庫為本機版功能，並提供繼續探索的出口
          <div className="space-y-5 py-16 text-center">
            <p className="mx-auto max-w-md text-sm text-paper-dim">
              {labels.demoEmpty}
            </p>
            <Link
              href="/browse"
              className="inline-block border border-hairline px-4 py-2.5 text-sm text-paper-dim transition-colors hover:bg-white/10 hover:text-paper"
            >
              {labels.browse}
            </Link>
          </div>
        ) : list.length === 0 ? (
          // 非 demo、片庫確實為空：提供探索出口
          <div className="space-y-5 py-16 text-center">
            <p className="mx-auto max-w-sm text-sm text-paper-dim">{labels.empty}</p>
            <Link
              href="/browse"
              className="inline-block border border-hairline px-4 py-2.5 text-sm text-paper-dim transition-colors hover:bg-white/10 hover:text-paper"
            >
              {labels.browse}
            </Link>
          </div>
        ) : (
          // 有片但篩選後歸零：上方篩選控制項仍可見，純文字提示即可
          <p className="py-16 text-center text-sm text-paper-faint">{labels.empty}</p>
        )
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <AnimatePresence initial={false} mode="popLayout">
          {shown.map((movie) => {
            const poster = tmdbImage(movie.poster_path, "w342");
            const rating =
              movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "—";
            return (
              <motion.div
                key={movie.tmdb_id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="group/libcard relative hover:z-20 focus-within:z-20"
              >
                <Link
                  href={`/movie/${movie.tmdb_id}`}
                  className="block focus:outline-none"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-raised shadow-md ring-1 ring-hairline transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/libcard:-translate-y-1 group-hover/libcard:scale-[1.05] group-hover/libcard:shadow-2xl group-hover/libcard:ring-2 group-hover/libcard:ring-white/40 group-active/libcard:scale-[0.98] group-active/libcard:duration-150 group-focus-within/libcard:-translate-y-1 group-focus-within/libcard:scale-[1.05] group-focus-within/libcard:ring-2 group-focus-within/libcard:ring-white/60">
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        ref={(el) => { if (el?.complete) el.style.opacity = "1"; }}
                        src={poster}
                        alt={movie.title}
                        loading="lazy"
                        onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
                        style={{ opacity: 0, transition: "opacity 0.7s ease-out" }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-paper-faint">
                        無海報
                      </div>
                    )}
                    <span className="absolute right-2 top-2 bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-paper backdrop-blur">
                      ★ {rating}
                    </span>
                  </div>
                  <div className="mt-2 px-0.5">
                    <h3 className="line-clamp-1 text-sm font-medium text-paper">
                      {movie.title}
                    </h3>
                  </div>
                </Link>
                {/* 移除按鈕：桌面（fine pointer + hover）預設隱藏，hover / focus-within / focus-visible 時浮現；觸控裝置維持常駐可見 */}
                <button
                  type="button"
                  disabled={removing === movie.tmdb_id}
                  onClick={() => remove(movie.tmdb_id)}
                  className="mt-0.5 px-0.5 text-xs text-paper-faint transition-[color,opacity] hover:text-red-400 focus-visible:text-red-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:opacity-40 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover/libcard:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within/libcard:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:focus-visible:opacity-100"
                >
                  {removing === movie.tmdb_id ? "…" : labels.remove}
                </button>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
