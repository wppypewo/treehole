"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/tmdb";

interface Option {
  value: string;
  label: string;
}

interface Labels {
  genre: string;
  year: string;
  sort: string;
  minRating: string;
  all: string;
  loading: string;
  noMore: string;
  loadError: string;
  retry: string;
  empty: string;
  genrePlaceholder: string;
  yearPlaceholder: string;
  ratingPlaceholder: string;
  summaryPrefix: string;
  summaryAll: string;
  summaryRatingSuffix: string;
  popularFirst: string;
  highestRatedFirst: string;
  newestFirst: string;
  clearFilters: string;
}

// 最低評分選項（由高到低）
const RATINGS = ["8", "7", "6"];

function buildDiscoverUrl(
  p: number,
  g: string,
  y: string,
  s: string,
  r: string,
): string {
  const sp = new URLSearchParams();
  if (g) sp.set("genre", g);
  if (y) sp.set("year", y);
  if (s) sp.set("sort", s);
  if (r) sp.set("minRating", r);
  sp.set("page", String(p));
  return `/api/discover?${sp.toString()}`;
}

// 條件瀏覽：選類型／年份／排序／最低評分，結果無限捲動。
// 首頁第一頁由伺服器帶入；篩選變更走事件處理（不用 effect 同步 setState）。
export default function BrowseClient({
  genres,
  years,
  sorts,
  labels,
  initialMovies,
  initialHasMore,
}: {
  genres: { id: number; name: string }[];
  years: number[];
  sorts: Option[];
  labels: Labels;
  initialMovies: MovieSummary[];
  initialHasMore: boolean;
}) {
  const defaultSort = sorts[0]?.value ?? "popularity.desc";
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState(defaultSort);
  const [minRating, setMinRating] = useState("");
  const [results, setResults] = useState<MovieSummary[]>(initialMovies);
  const [page, setPage] = useState(initialMovies.length > 0 ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<number>>(new Set(initialMovies.map((m) => m.id)));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 目前是否為全預設條件
  const isDefaultFilters = !genre && !year && !minRating && sort === defaultSort;

  // 目前條件摘要文字
  const sortSummaryMap: Record<string, string> = {
    "popularity.desc": labels.popularFirst,
    "vote_average.desc": labels.highestRatedFirst,
    "primary_release_date.desc": labels.newestFirst,
  };
  const sortSummaryLabel = sortSummaryMap[sort] ?? labels.popularFirst;

  const genreLabel = genre
    ? (genres.find((g) => String(g.id) === genre)?.name ?? genre)
    : labels.summaryAll;

  // 排序只在「全預設」或「排序本身非預設」時顯示
  const showSortInSummary = isDefaultFilters || sort !== defaultSort;

  const summaryParts = [labels.summaryPrefix, genreLabel];
  if (year) summaryParts.push(year);
  if (minRating) summaryParts.push(minRating + labels.summaryRatingSuffix);
  if (showSortInSummary) summaryParts.push(sortSummaryLabel);
  const summaryText = summaryParts.join(" · ");

  // 套用新篩選：清空並載入第一頁（由 select 的 onChange 觸發）
  async function applyFilters(g: string, y: string, s: string, r: string) {
    seen.current = new Set();
    setResults([]);
    setPage(0);
    setDone(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(buildDiscoverUrl(1, g, y, s, r));
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fresh = ((data.results ?? []) as MovieSummary[]).filter((m) => {
        if (seen.current.has(m.id)) return false;
        seen.current.add(m.id);
        return true;
      });
      setResults(fresh);
      setPage(1);
      if (!data.hasMore) setDone(true);
    } catch {
      setError(labels.loadError);
    } finally {
      setLoading(false);
    }
  }

  // 清除所有條件並回到預設結果
  function resetFilters() {
    setGenre("");
    setYear("");
    setSort(defaultSort);
    setMinRating("");
    applyFilters("", "", defaultSort, "");
  }

  const loadMore = useCallback(async () => {
    if (loading || done || page === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        buildDiscoverUrl(page + 1, genre, year, sort, minRating),
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fresh = ((data.results ?? []) as MovieSummary[]).filter((m) => {
        if (seen.current.has(m.id)) return false;
        seen.current.add(m.id);
        return true;
      });
      setResults((prev) => [...prev, ...fresh]);
      setPage(page + 1);
      if (!data.hasMore || page + 1 >= 20) setDone(true);
    } catch {
      setError(labels.loadError);
    } finally {
      setLoading(false);
    }
  }, [loading, done, page, genre, year, sort, minRating, labels.loadError]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || done || error || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, done, error, loading]);

  // 統一深色 select 外觀（定義於 globals.css）
  const selectCls = "select-dark";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
            applyFilters(e.target.value, year, sort, minRating);
          }}
          aria-label={labels.genre}
          className={selectCls}
        >
          <option value="">{labels.genrePlaceholder}</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            applyFilters(genre, e.target.value, sort, minRating);
          }}
          aria-label={labels.year}
          className={selectCls}
        >
          <option value="">{labels.yearPlaceholder}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            applyFilters(genre, year, sort, e.target.value);
          }}
          aria-label={labels.minRating}
          className={selectCls}
        >
          <option value="">{labels.ratingPlaceholder}</option>
          {RATINGS.map((r) => (
            <option key={r} value={r}>
              {r}+
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            applyFilters(genre, year, e.target.value, minRating);
          }}
          aria-label={labels.sort}
          className={selectCls}
        >
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* 目前條件摘要 */}
      <div className="flex items-baseline gap-3">
        <p className="text-sm text-zinc-400">{summaryText}</p>
        {!isDefaultFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          >
            {labels.clearFilters}
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="animate-rise grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      <div className="py-4 text-center text-sm text-zinc-500">
        {error ? (
          <div className="space-y-2">
            <p className="text-red-400">{error}</p>
            <button
              type="button"
              onClick={loadMore}
              className="rounded-lg border border-white/20 px-4 py-2 text-zinc-200 transition-colors hover:bg-white/10"
            >
              {labels.retry}
            </button>
          </div>
        ) : loading ? (
          labels.loading
        ) : results.length === 0 ? (
          labels.empty
        ) : done ? (
          labels.noMore
        ) : null}
      </div>
    </div>
  );
}
