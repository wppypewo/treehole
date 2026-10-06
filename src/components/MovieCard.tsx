"use client";

import Link from "next/link";
import FallbackImg from "@/components/FallbackImg";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import type { MovieSummary } from "@/lib/tmdb";

/**
 * 單張電影卡。
 *
 * 刻意不做「hover 放大浮起」——那是 Netflix / Apple TV 的語彙，會讓整列海報
 * 在游標經過時此起彼落。這裡用 .hov-poster：海報靜止時壓暗一階，停下的那張
 * 恢復原亮度，片名加底線。位置不動，整列是安靜的。
 *
 * 評分不壓在海報上。海報是完整的印刷品，資訊放在它下面。
 */
export default function MovieCard({
  movie,
  size = "sm",
  sizes = IMAGE_SIZES.posterGrid,
  eager = false,
  first = false,
}: {
  movie: MovieSummary;
  size?: "sm" | "lg";
  /** 這張卡在版面上實際佔多寬。橫列與格線差很多，所以由呼叫端指定。 */
  sizes?: string;
  /** 格線首屏那幾張：不延遲載入、不淡入。淡入要等 hydration 才把 opacity 打開，
   *  首屏海報會空白到 JS 跑完；lazy 則要等版面算完才發請求。這幾張就是 LCP */
  eager?: boolean;
  /** 整頁第一張：再提高抓取優先序 */
  first?: boolean;
}) {
  const poster = tmdbImage(movie.poster_path, size === "lg" ? "w500" : "w342");
  const posterSrcSet = tmdbSrcSet(movie.poster_path, "poster");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

  // 沒有海報、或海報載不出來，都在框裡排片名
  const titleSlate = (
    <div className="flex h-full w-full items-center justify-center px-3 text-center text-[0.6875rem] tracking-wide text-paper-dim">
      {movie.title}
    </div>
  );

  return (
    <Link href={`/movie/${movie.id}`} className="hov-poster group/card block">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {poster ? (
          // 原生 img：避免 next/image 對 TMDB 遠端網域的額外設定
          <FallbackImg
            src={poster}
            srcSet={posterSrcSet}
            sizes={sizes}
            alt={movie.title}
            loading={eager || first ? "eager" : "lazy"}
            fetchPriority={first ? "high" : "auto"}
            fadeIn={!(eager || first)}
            fallback={titleSlate}
            className="poster-img h-full w-full object-cover"
          />
        ) : (
          titleSlate
        )}

      </div>

      <div className="mt-3">
        <h3
          className={`poster-cap line-clamp-2 ${
            size === "lg" ? "text-[0.9375rem]" : "text-[0.8125rem]"
          }`}
        >
          {movie.title}
        </h3>
        {(year || rating) && (
          <p className="t-meta mt-1 text-paper-faint">
            {[year, rating].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
