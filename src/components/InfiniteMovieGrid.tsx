"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import MovieCard from "./MovieCard";
import ListStatus from "./ListStatus";
import { POSTER_GRID } from "./MovieGrid";
import type { MovieSummary } from "@/lib/tmdb";
import { tmdbImage } from "@/lib/images";

interface Labels {
  loading: string;
  noMore: string;
  loadError: string;
  retry: string;
  empty: string;
}

/** 榜單的欄名。只有 variant="ranked" 需要 */
export interface RankedLabels {
  rank: string;
  film: string;
  year: string;
  score: string;
}

/**
 * 無限捲動清單：首屏由伺服器帶入第 1 頁，捲到接近底部時向分頁 API 取下一頁。
 * 金鑰留在伺服器，瀏覽器只呼叫自家的 /api 端點。
 *
 * variant 決定這一頁長什麼樣：
 * - "grid"   熱門、推薦、搜尋。沒有排序意義，就是一面海報牆
 * - "ranked" 評分最高、最賣座。名次才是這兩頁的內容，改排成一張榜單：
 *            名次、小海報、片名、年份、分數各佔一欄，一眼能往下掃
 */
export default function InfiniteMovieGrid({
  endpoint,
  initialMovies,
  initialHasMore,
  maxPages = 20,
  labels,
  variant = "grid",
  rankedLabels,
}: {
  endpoint: string;
  initialMovies: MovieSummary[];
  initialHasMore: boolean;
  maxPages?: number;
  labels: Labels;
  variant?: "grid" | "ranked";
  rankedLabels?: RankedLabels;
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
  // 哨兵在同一次 render 之間可能觸發兩次，state 的 loading 還來不及變，
  // 用 ref 擋住第二發，否則同一頁會打兩次 API
  const inflight = useRef(false);

  const loadMore = useCallback(async () => {
    if (inflight.current || done) return;
    inflight.current = true;
    const next = page + 1;
    setLoading(true);
    setError(null);
    try {
      // endpoint 本身可能已經帶查詢字串（搜尋頁的 ?q=），所以要判斷接哪個符號
      const join = endpoint.includes("?") ? "&" : "?";
      const res = await fetch(`${endpoint}${join}page=${next}`);
      if (!res.ok) throw new Error(`${endpoint} responded ${res.status}`);
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
      inflight.current = false;
      setLoading(false);
    }
  }, [endpoint, page, done, maxPages, labels.loadError]);

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

  return (
    <div>
      {movies.length > 0 &&
        (variant === "ranked" && rankedLabels ? (
          <RankedList movies={movies} labels={rankedLabels} />
        ) : (
          <div className={POSTER_GRID}>
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ))}

      {/* 捲動哨兵：進入視窗就載入下一頁 */}
      <div ref={sentinelRef} className="h-1" />

      <ListStatus
        error={error}
        loading={loading}
        done={done}
        isEmpty={!loading && !error && movies.length === 0}
        labels={labels}
        onRetry={loadMore}
      />
    </div>
  );
}

// 名次、海報、片名、年份、分數。手機收成三欄，年份與分數併到片名底下
const RANK_COLS =
  "grid grid-cols-[2.25rem_2.75rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[3.5rem_3rem_minmax(0,1fr)_4rem_3.5rem] sm:gap-x-6";

function RankedList({
  movies,
  labels,
}: {
  movies: MovieSummary[];
  labels: RankedLabels;
}) {
  return (
    <div>
      {/* 欄名只在桌機出現；手機的年份與分數跟著片名，不需要表頭 */}
      <div
        aria-hidden
        className={`${RANK_COLS} t-label hidden border-b border-hairline-strong pb-2.5 sm:grid`}
      >
        <span>{labels.rank}</span>
        <span className="col-span-2">{labels.film}</span>
        <span className="text-right">{labels.year}</span>
        <span className="text-right">{labels.score}</span>
      </div>

      <ol className="border-t border-hairline-strong sm:border-t-0">
        {movies.map((movie, i) => (
          <RankedRow key={movie.id} movie={movie} rank={i + 1} labels={labels} />
        ))}
      </ol>
    </div>
  );
}

function RankedRow({
  movie,
  rank,
  labels,
}: {
  movie: MovieSummary;
  rank: number;
  labels: RankedLabels;
}) {
  const poster = tmdbImage(movie.poster_path, "w185");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const score = movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;
  // 中文片名跟原文一樣（華語片、沒有譯名的片）就不重複一次
  const original =
    movie.original_title && movie.original_title !== movie.title
      ? movie.original_title
      : null;

  return (
    <li
      className={`${RANK_COLS} hov-row items-center border-b border-hairline py-3.5 max-sm:pl-3 sm:py-4`}
    >
      <p className="t-num text-[1.375rem] text-paper-faint sm:text-[1.75rem]">
        <span className="sr-only">{labels.rank} </span>
        {rank}
      </p>

      <div className="aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {poster && (
          // 海報是裝飾，片名就在旁邊，報讀不必再念一次
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0">
        <Link
          href={`/movie/${movie.id}`}
          className="font-display text-[1.0625rem] leading-snug text-paper after:absolute after:inset-0 after:content-[''] sm:text-[1.1875rem]"
        >
          {movie.title}
        </Link>
        {original && (
          <p className="mt-0.5 truncate text-[0.8125rem] text-paper-faint">
            {original}
          </p>
        )}
        {(year || score) && (
          <p className="t-meta mt-1 text-paper-faint sm:hidden">
            {[year, score].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <p className="t-meta hidden text-right text-paper-dim sm:block">
        {year && (
          <>
            <span className="sr-only">{labels.year} </span>
            {year}
          </>
        )}
      </p>
      <p className="t-num hidden text-right text-[1.125rem] text-paper sm:block">
        {score && (
          <>
            <span className="sr-only">{labels.score} </span>
            {score}
          </>
        )}
      </p>
    </li>
  );
}
