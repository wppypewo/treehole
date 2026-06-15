"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/tmdb";

interface Labels {
  loading: string;
  noMore: string;
  loadError: string;
  retry: string;
  empty: string;
}

// 無限捲動電影牆：首屏由伺服器帶入第 1 頁，捲到接近底部時向分頁 API 取下一頁。
// 金鑰留在伺服器，瀏覽器只呼叫自家的 /api 端點。
export default function InfiniteMovieGrid({
  endpoint,
  initialMovies,
  initialHasMore,
  maxPages = 20,
  labels,
}: {
  endpoint: string;
  initialMovies: MovieSummary[];
  initialHasMore: boolean;
  maxPages?: number;
  labels: Labels;
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
      <p className="py-16 text-center text-sm text-zinc-500">{labels.empty}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {/* 捲動哨兵：進入視窗就載入下一頁 */}
      <div ref={sentinelRef} className="h-1" />

      <div className="py-4 text-center text-sm text-zinc-500">
        {error ? (
          <div className="space-y-3">
            <p className="text-zinc-300">{error}</p>
            <button
              type="button"
              onClick={loadMore}
              className="rounded-md border border-white/15 px-4 py-1.5 text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
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
