"use client";

import { useState } from "react";
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
  all: string;
}

// 收藏 / 想看 / 已看過 列表：可排序與依評分篩選，每張卡片可移除。
// 卡片外觀與 MovieCard 一致（hover scale、ring、rating badge）。
export default function LibraryGrid({
  items,
  kind,
  labels,
}: {
  items: SavedMovie[];
  kind: "favorites" | "watched" | "watchlist";
  labels: Labels;
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

  const selectCls =
    "rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/40";

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
            <option value="added">
              {labels.sort}：{labels.sortAdded}
            </option>
            <option value="title">
              {labels.sort}：{labels.sortTitle}
            </option>
            <option value="rating">
              {labels.sort}：{labels.sortRating}
            </option>
          </select>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            aria-label={labels.minRating}
            className={selectCls}
          >
            <option value="">
              {labels.minRating}：{labels.all}
            </option>
            {["8", "7", "6"].map((r) => (
              <option key={r} value={r}>
                {r}+
              </option>
            ))}
          </select>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          {labels.empty}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {shown.map((movie) => {
            const poster = tmdbImage(movie.poster_path, "w342");
            const rating =
              movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "—";
            return (
              // group/libcard 讓 hover scale 作用域包含移除按鈕區域
              <div
                key={movie.tmdb_id}
                className="group/libcard relative hover:z-20 focus-visible:z-20"
              >
                <Link
                  href={`/movie/${movie.tmdb_id}`}
                  className="block focus:outline-none"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-md ring-1 ring-white/5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/libcard:-translate-y-1 group-hover/libcard:scale-[1.05] group-hover/libcard:shadow-2xl group-hover/libcard:ring-2 group-hover/libcard:ring-white/40">
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={poster}
                        alt={movie.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        無海報
                      </div>
                    )}
                    <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur">
                      ★ {rating}
                    </span>
                  </div>
                  <div className="mt-2 px-0.5">
                    <h3 className="line-clamp-1 text-sm font-medium text-zinc-100">
                      {movie.title}
                    </h3>
                  </div>
                </Link>
                {/* 移除按鈕：小文字連結，不干擾卡片視覺 */}
                <button
                  type="button"
                  disabled={removing === movie.tmdb_id}
                  onClick={() => remove(movie.tmdb_id)}
                  className="mt-0.5 px-0.5 text-xs text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-40"
                >
                  {removing === movie.tmdb_id ? "…" : labels.remove}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
