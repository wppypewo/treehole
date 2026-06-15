"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { tmdbImage } from "@/lib/images";
import type { MovieSummary } from "@/lib/tmdb";

// 單張電影卡（Apple TV 風）：純海報、聚焦放大浮起，片名與年份置於海報下方
export default function MovieCard({ movie }: { movie: MovieSummary }) {
  const poster = tmdbImage(movie.poster_path, "w342");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "—";

  // 海報載入後才淡入，避免圖片 decode 完成瞬間「跳出」
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // 若圖片在 React 掛載前已從快取載完，onLoad 不會觸發，於此補判斷
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group/card relative block focus:outline-none hover:z-20 focus-visible:z-20"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-900 shadow-md ring-1 ring-white/5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:-translate-y-1 group-hover/card:scale-[1.05] group-hover/card:shadow-2xl group-hover/card:ring-2 group-hover/card:ring-white/40 group-active/card:scale-[0.98] group-active/card:duration-150 group-focus-visible/card:-translate-y-1 group-focus-visible/card:scale-[1.05] group-focus-visible/card:ring-2 group-focus-visible/card:ring-white/60">
        {poster ? (
          // 使用原生 img，避免 next/image 對遠端網域的額外設定
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={poster}
            alt={movie.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-700 ease-out ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            無海報
          </div>
        )}
        {/* 評分未知時不顯示 badge，避免「★ —」破壞海報視覺 */}
        {movie.vote_average > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur">
            ★ {rating}
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-1 text-sm font-medium text-zinc-100">
          {movie.title}
        </h3>
        <span className="text-xs text-zinc-500">{year}</span>
      </div>
    </Link>
  );
}
