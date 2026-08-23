"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import type { MovieSummary } from "@/lib/tmdb";

/**
 * 單張電影卡。
 *
 * 刻意不做「hover 放大浮起」——那是 Netflix / Apple TV 的語彙，會讓整列海報
 * 在游標經過時此起彼落。這裡改成：海報位置不動，內縮一圈 hairline 框浮現，
 * 像幻燈片的片夾；片名同時由灰轉白。回饋清楚，但整列是安靜的。
 *
 * 評分不壓在海報上。海報是完整的印刷品，資訊放在它下面。
 *
 * rank：榜單頁（評分最高、最賣座）用的名次。名次是那些頁面真正的內容，
 * 沒有它就只是一面和其他頁一樣的海報牆。
 */
export default function MovieCard({
  movie,
  size = "sm",
  rank,
  sizes = IMAGE_SIZES.posterGrid,
}: {
  movie: MovieSummary;
  size?: "sm" | "lg";
  rank?: number;
  /** 這張卡在版面上實際佔多寬。橫列與格線差很多，所以由呼叫端指定。 */
  sizes?: string;
}) {
  const poster = tmdbImage(movie.poster_path, size === "lg" ? "w500" : "w342");
  const posterSrcSet = tmdbSrcSet(movie.poster_path, "poster");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const rating = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

  // 海報載入後才淡入，避免 decode 完成瞬間「跳出」
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // 圖片若在 React 掛載前已從快取載完，onLoad 不會觸發，於此補判斷
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <Link href={`/movie/${movie.id}`} className="group/card block">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {poster ? (
          // 原生 img：避免 next/image 對 TMDB 遠端網域的額外設定
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={poster}
            srcSet={posterSrcSet}
            sizes={sizes}
            alt={movie.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-700 ease-out ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-[0.6875rem] tracking-wide text-paper-faint">
            {movie.title}
          </div>
        )}

        {/* 內縮片夾框：hover / 鍵盤聚焦時浮現 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-2 border border-paper/0 transition-colors duration-300 ease-out group-hover/card:border-paper/60 group-focus-visible/card:border-paper/60"
        />
      </div>

      <div className={`mt-3 ${rank !== undefined ? "flex gap-3" : ""}`}>
        {rank !== undefined && (
          <span
            aria-hidden
            className="t-film w-7 shrink-0 text-2xl leading-none text-paper-dim transition-colors duration-300 group-hover/card:text-curtain-ink"
          >
            {rank}
          </span>
        )}
        <div className="min-w-0">
          <h3
            className={`line-clamp-2 text-paper-dim transition-colors duration-300 group-hover/card:text-paper ${
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
      </div>
    </Link>
  );
}
