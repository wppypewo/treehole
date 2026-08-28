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
  // 每次發出請求就 +1。回應回來時對不上號就整份丟掉——
  // 四個 select 連續換三次，三個請求同時在飛，誰先回來由網路決定，
  // 沒有這道閘門的話畫面上會是「最慢的那個條件」的結果。
  const requestId = useRef(0);

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
    const id = ++requestId.current;
    seen.current = new Set();
    setResults([]);
    setPage(0);
    setDone(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(buildDiscoverUrl(1, g, y, s, r));
      if (requestId.current !== id) return;
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (requestId.current !== id) return;
      const fresh = ((data.results ?? []) as MovieSummary[]).filter((m) => {
        if (seen.current.has(m.id)) return false;
        seen.current.add(m.id);
        return true;
      });
      setResults(fresh);
      setPage(1);
      if (!data.hasMore) setDone(true);
    } catch {
      if (requestId.current !== id) return;
      setError(labels.loadError);
    } finally {
      // 過期的請求不准把 loading 關掉，那盞燈屬於還在飛的那一個
      if (requestId.current === id) setLoading(false);
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
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        buildDiscoverUrl(page + 1, genre, year, sort, minRating),
      );
      if (requestId.current !== id) return;
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (requestId.current !== id) return;
      const fresh = ((data.results ?? []) as MovieSummary[]).filter((m) => {
        if (seen.current.has(m.id)) return false;
        seen.current.add(m.id);
        return true;
      });
      setResults((prev) => [...prev, ...fresh]);
      setPage(page + 1);
      if (!data.hasMore || page + 1 >= 20) setDone(true);
    } catch {
      if (requestId.current !== id) return;
      setError(labels.loadError);
    } finally {
      if (requestId.current === id) setLoading(false);
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

  return (
    <div>
      {/* 篩選列黏在導覽列下方。這一頁的內容可以很長，捲到第 300 部片時
          還要捲回頂端才能換條件是折磨。sticky 的高度剛好接在 h-16 的 nav 之下。 */}
      <div className="sticky top-16 z-20 -mx-5 border-b border-hairline bg-ink py-4 sm:-mx-8">
        {/* 手機上四個 select 換行會讓黏住的這條佔掉四分之一個螢幕，
            所以改成單排橫捲；桌機空間夠，維持換行排列。 */}
        <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto px-5 sm:flex-wrap sm:overflow-visible sm:px-8">
          <select
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              applyFilters(e.target.value, year, sort, minRating);
            }}
            aria-label={labels.genre}
            className="select-dark shrink-0"
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
            className="select-dark shrink-0"
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
            className="select-dark shrink-0"
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
            className="select-dark shrink-0"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {!isDefaultFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="tap-safe ml-1 shrink-0 text-[0.75rem] tracking-[0.06em] text-paper-faint transition-colors hover:text-curtain-ink"
            >
              {labels.clearFilters}
            </button>
          )}
        </div>

        {/* 條件摘要寫成一句話，不是一排 chip。使用者需要知道自己在看什麼，
            而不是再讀一次剛剛選過的選項。 */}
        <p
          aria-live="polite"
          className="t-meta mt-3 px-5 text-paper-faint sm:px-8"
        >
          {summaryText}
        </p>
      </div>

      {results.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {/* 載入／結束／空結果都是非同步才出現的字，不放進 live region 的話
          只有看得見畫面的人知道發生了什麼。錯誤要打斷（alert），
          其餘等使用者手邊的事做完再報（status）。 */}
      <div className="mt-14 border-t border-hairline pt-8 text-center text-sm text-paper-faint">
        {error ? (
          <div role="alert" className="space-y-4">
            <p className="text-paper-dim">{error}</p>
            <button type="button" onClick={loadMore} className="btn-line">
              {labels.retry}
            </button>
          </div>
        ) : (
          <p role="status">
            {loading ? (
              <span className="animate-pulse">{labels.loading}</span>
            ) : results.length === 0 ? (
              labels.empty
            ) : done ? (
              labels.noMore
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}
