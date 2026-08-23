"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import UpcomingCard, { upcomingDateFormatter } from "./UpcomingCard";
import { POSTER_GRID } from "./MovieGrid";
import type { MovieSummary } from "@/lib/tmdb";
import type { Locale } from "@/i18n/config";
import { IMAGE_SIZES } from "@/lib/images";

interface Labels {
  loading: string;
  noMore: string;
  loadError: string;
  retry: string;
  empty: string;
}

/**
 * 無限捲動電影牆：首屏由伺服器帶入第 1 頁，捲到接近底部時向分頁 API 取下一頁。
 * 金鑰留在伺服器，瀏覽器只呼叫自家的 /api 端點。
 *
 * variant 決定這一頁長什麼樣。四個清單頁如果都用同一種海報牆，
 * 使用者根本分不出自己在哪一頁：
 * - "grid"   熱門。沒有排序意義，就是一面牆
 * - "ranked" 評分最高／最賣座。名次才是這兩頁的內容，所以標出來
 * - "dated"  即將上映。日期才是重點，改用 16:9 劇照
 */
export default function InfiniteMovieGrid({
  endpoint,
  initialMovies,
  initialHasMore,
  maxPages = 20,
  labels,
  variant = "grid",
  locale = "zh-TW",
}: {
  endpoint: string;
  initialMovies: MovieSummary[];
  initialHasMore: boolean;
  maxPages?: number;
  labels: Labels;
  variant?: "grid" | "ranked" | "dated";
  locale?: Locale;
}) {
  const [movies, setMovies] = useState<MovieSummary[]>(initialMovies);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(
    !initialHasMore || initialMovies.length === 0,
  );
  const [error, setError] = useState<string | null>(null);
  // 已出現過的電影 id，避免不同頁之間重複
  const seen = useRef<Set<number>>(new Set(initialMovies.map((m) => m.id)));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    const next = page + 1;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${endpoint}?page=${next}`);
      if (!res.ok) throw new Error("bad status");
      const data: { results: MovieSummary[]; hasMore: boolean } =
        await res.json();
      const fresh = (data.results ?? []).filter((m) => !seen.current.has(m.id));
      for (const m of fresh) seen.current.add(m.id);
      setMovies((prev) => [...prev, ...fresh]);
      setPage(next);
      if (!data.hasMore || next >= maxPages) setDone(true);
    } catch {
      setError(labels.loadError);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, loading, done, maxPages, labels.loadError]);

  useEffect(() => {
    const el = sentinelRef.current;
    // 出錯時暫停自動載入，等使用者按「重試」，以免哨兵持續觸發狂打 API
    if (!el || done || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, done, error]);

  if (movies.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-paper-faint">
        {labels.empty}
      </p>
    );
  }

  const fmt = variant === "dated" ? upcomingDateFormatter(locale) : null;

  return (
    <div>
      {variant === "dated" && fmt ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {movies.map((movie) => (
            <UpcomingCard
              key={movie.id}
              movie={movie}
              fmt={fmt}
              sizes={IMAGE_SIZES.upcomingGrid}
            />
          ))}
        </div>
      ) : (
        <div className={POSTER_GRID}>
          {movies.map((movie, i) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rank={variant === "ranked" ? i + 1 : undefined}
            />
          ))}
        </div>
      )}

      {/* 捲動哨兵：進入視窗就載入下一頁 */}
      <div ref={sentinelRef} className="h-1" />

      <div className="mt-14 border-t border-hairline pt-8 text-center text-sm text-paper-faint">
        {error ? (
          <div className="space-y-4">
            <p className="text-paper-dim">{error}</p>
            <button type="button" onClick={loadMore} className="btn-line">
              {labels.retry}
            </button>
          </div>
        ) : loading ? (
          <span className="animate-pulse">{labels.loading}</span>
        ) : done ? (
          labels.noMore
        ) : null}
      </div>
    </div>
  );
}
