"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import MovieGridSkeleton from "./MovieGridSkeleton";
import ListStatus from "./ListStatus";
import Segmented from "./Segmented";
import { POSTER_GRID, POSTER_GRID_ABOVE_FOLD } from "./MovieGrid";
import type { MovieSummary } from "@/lib/tmdb";
import { BROWSE_RATINGS, type BrowseFilters } from "@/lib/browse-filters";

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
  summaryPrefix: string;
  summaryAll: string;
  summaryRatingSuffix: string;
  popularFirst: string;
  highestRatedFirst: string;
  newestFirst: string;
  clearFilters: string;
  editFilters: string;
}

/** 最多捲到第幾頁。TMDB discover 超過 500 頁會回錯，20 頁已是 400 部片 */
const MAX_PAGES = 20;

/**
 * 連續換條件時等多久才真的發請求。方向鍵在十九個類型之間走一遍，
 * 不該打出十九個請求；滑鼠點一下的人感覺不到這 250ms，因為骨架是立刻出現的。
 */
const DEBOUNCE_MS = 250;

function buildDiscoverUrl(p: number, f: BrowseFilters): string {
  const sp = new URLSearchParams();
  if (f.genre) sp.set("genre", f.genre);
  if (f.year) sp.set("year", f.year);
  if (f.sort) sp.set("sort", f.sort);
  if (f.rating) sp.set("minRating", f.rating);
  sp.set("page", String(p));
  return `/api/discover?${sp.toString()}`;
}

/** 網址列只寫跟預設不同的條件，全預設時就是乾淨的 /browse */
function pageUrl(f: BrowseFilters, defaultSort: string): string {
  const sp = new URLSearchParams();
  if (f.genre) sp.set("genre", f.genre);
  if (f.year) sp.set("year", f.year);
  if (f.rating) sp.set("rating", f.rating);
  if (f.sort !== defaultSort) sp.set("sort", f.sort);
  const q = sp.toString();
  return q ? `/browse?${q}` : "/browse";
}

/**
 * 條件瀏覽。
 *
 * 條件放在頁首的一塊面板裡，一列一個條件、選項全部攤開，不藏在下拉選單裡：
 * 使用者在這頁的工作就是換條件，每換一次都要先點開選單才看得到選項是多一步。
 * 年份例外，四十幾個數字攤開只會是一片噪音，留給 select。
 *
 * 面板本身不黏住。捲下去之後黏在導覽列下方的是一行條件摘要，
 * 加上「改條件」跳回面板——黏住整塊面板會吃掉手機四分之一個螢幕。
 *
 * 條件寫進網址（replaceState，不觸發重新渲染），重新整理或分享連結都還在同一組條件。
 */
export default function BrowseClient({
  genres,
  years,
  sorts,
  labels,
  initial,
  initialMovies,
  initialHasMore,
  initialError,
}: {
  genres: { id: number; name: string }[];
  years: number[];
  sorts: Option[];
  labels: Labels;
  initial: BrowseFilters;
  initialMovies: MovieSummary[];
  initialHasMore: boolean;
  /**
   * 伺服器取第一頁就失敗時的訊息（說得出是 TMDB 哪裡出錯），沒失敗是 null。
   * 前端直接顯示錯誤與重試，不要假裝「沒有片」
   */
  initialError: string | null;
}) {
  const defaultSort = sorts[0]?.value ?? "popularity.desc";
  const [filters, setFilters] = useState<BrowseFilters>(initial);
  const [results, setResults] = useState<MovieSummary[]>(initialMovies);
  const [page, setPage] = useState(initialError ? 0 : 1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!initialError && !initialHasMore);
  const [error, setError] = useState<string | null>(initialError);
  const [stuck, setStuck] = useState(false);

  const seen = useRef<Set<number>>(new Set(initialMovies.map((m) => m.id)));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const stickMarkerRef = useRef<HTMLDivElement | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 每次發出請求就 +1。回應回來時對不上號就整份丟掉——
  // 連續換三次條件，三個請求同時在飛，誰先回來由網路決定，
  // 沒有這道閘門的話畫面上會是「最慢的那個條件」的結果。
  const requestId = useRef(0);

  const isDefault =
    !filters.genre && !filters.year && !filters.rating && filters.sort === defaultSort;

  // 摘要：類型 · 年份 · 門檻 · 排序。排序只在它不是預設、或什麼都沒選時才說
  const sortPhrase: Record<string, string> = {
    "popularity.desc": labels.popularFirst,
    "vote_average.desc": labels.highestRatedFirst,
    "primary_release_date.desc": labels.newestFirst,
  };
  const summary = [
    filters.genre
      ? (genres.find((g) => String(g.id) === filters.genre)?.name ?? labels.summaryAll)
      : labels.summaryAll,
    filters.year || null,
    filters.rating ? filters.rating + labels.summaryRatingSuffix : null,
    isDefault || filters.sort !== defaultSort
      ? (sortPhrase[filters.sort] ?? labels.popularFirst)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  async function fetchFirstPage(f: BrowseFilters, id: number) {
    try {
      const res = await fetch(buildDiscoverUrl(1, f));
      if (requestId.current !== id) return;
      if (!res.ok) throw new Error(`discover responded ${res.status}`);
      const data = await res.json();
      if (requestId.current !== id) return;
      const fresh = ((data.results ?? []) as MovieSummary[]).filter((m) => {
        if (seen.current.has(m.id)) return false;
        seen.current.add(m.id);
        return true;
      });
      setResults(fresh);
      setPage(1);
      setDone(!data.hasMore);
    } catch {
      if (requestId.current !== id) return;
      setError(labels.loadError);
    } finally {
      // 過期的請求不准把 loading 關掉，那盞燈屬於還在飛的那一個
      if (requestId.current === id) setLoading(false);
    }
  }

  // 換條件：畫面立刻清空換成骨架，請求等使用者停手才發
  function apply(next: BrowseFilters) {
    const id = ++requestId.current;
    setFilters(next);
    window.history.replaceState(null, "", pageUrl(next, defaultSort));
    seen.current = new Set();
    setResults([]);
    setPage(0);
    setDone(false);
    setError(null);
    setLoading(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchFirstPage(next, id), DEBOUNCE_MS);
  }

  function change(patch: Partial<BrowseFilters>) {
    apply({ ...filters, ...patch });
  }

  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (loading || done || page === 0) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildDiscoverUrl(page + 1, filters));
      if (requestId.current !== id) return;
      if (!res.ok) throw new Error(`discover responded ${res.status}`);
      const data = await res.json();
      if (requestId.current !== id) return;
      const fresh = ((data.results ?? []) as MovieSummary[]).filter((m) => {
        if (seen.current.has(m.id)) return false;
        seen.current.add(m.id);
        return true;
      });
      setResults((prev) => [...prev, ...fresh]);
      setPage(page + 1);
      if (!data.hasMore || page + 1 >= MAX_PAGES) setDone(true);
    } catch {
      if (requestId.current !== id) return;
      setError(labels.loadError);
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, [loading, done, page, filters, labels.loadError]);

  // 第一頁就失敗時 page 是 0，loadMore 不會動，重試要重抓第一頁
  const retry = page === 0 ? () => apply(filters) : loadMore;

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

  // 摘要列黏住了沒有：它前面那條 1px 的標記一滑進導覽列底下（h-16）就是黏住了
  useEffect(() => {
    const el = stickMarkerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 64),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function backToPanel() {
    const panel = panelRef.current;
    if (!panel) return;
    panel.scrollIntoView({ block: "start" });
    panel.focus({ preventScroll: true });
  }

  const ratingOptions = [
    { value: "", label: labels.all },
    ...BROWSE_RATINGS.map((r) => ({ value: r, label: `${r}+` })),
  ];
  const genreOptions = [
    { value: "", label: labels.all },
    ...genres.map((g) => ({ value: String(g.id), label: g.name })),
  ];

  const showSkeleton = loading && results.length === 0;

  return (
    <div>
      <div
        ref={panelRef}
        tabIndex={-1}
        aria-label={labels.editFilters}
        role="group"
        className="scroll-mt-20 border-t border-hairline-strong focus:outline-none"
      >
        <FilterRow label={labels.genre}>
          <Segmented
            variant="text"
            options={genreOptions}
            value={filters.genre}
            onChange={(v) => change({ genre: v })}
            label={labels.genre}
            className="pick-scroll"
          />
        </FilterRow>
        <FilterRow label={labels.year} htmlFor="browse-year">
          <select
            id="browse-year"
            value={filters.year}
            onChange={(e) => change({ year: e.target.value })}
            className="select-dark"
          >
            <option value="">{labels.all}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </FilterRow>
        <FilterRow label={labels.minRating}>
          <Segmented
            options={ratingOptions}
            value={filters.rating}
            onChange={(v) => change({ rating: v })}
            label={labels.minRating}
          />
        </FilterRow>
        <FilterRow label={labels.sort}>
          <Segmented
            options={sorts}
            value={filters.sort}
            onChange={(v) => change({ sort: v })}
            label={labels.sort}
          />
        </FilterRow>
      </div>

      <div ref={stickMarkerRef} aria-hidden className="h-px" />

      {/* 捲下去之後唯一黏住的東西：一句話說明現在在看什麼。
          摘要寫成一句話，不是一排 chip：使用者需要知道自己在看什麼，
          不需要把剛選過的選項再讀一次。 */}
      <div className="sticky top-16 z-20 -mx-5 flex min-h-12 items-center justify-between gap-x-6 border-b border-hairline bg-ink px-5 sm:-mx-8 sm:px-8">
        <p aria-live="polite" className="t-meta min-w-0 truncate py-3 text-paper-dim">
          <span className="t-label mr-2.5">{labels.summaryPrefix}</span>
          {summary}
        </p>
        <div className="flex shrink-0 items-center gap-x-5 text-[0.8125rem]">
          {!isDefault && (
            <button
              type="button"
              onClick={() =>
                apply({ genre: "", year: "", rating: "", sort: defaultSort })
              }
              className="tap-safe text-paper-faint transition-colors hover:text-paper"
            >
              {labels.clearFilters}
            </button>
          )}
          {stuck && (
            <button
              type="button"
              onClick={backToPanel}
              className="tap-safe link-hair text-paper-dim"
            >
              {labels.editFilters}
            </button>
          )}
        </div>
      </div>

      {showSkeleton ? (
        <div className="mt-10">
          <MovieGridSkeleton count={10} />
        </div>
      ) : (
        results.length > 0 && (
          <div className={`mt-10 ${POSTER_GRID}`}>
            {results.map((m, i) => (
              <MovieCard
                key={m.id}
                movie={m}
                eager={i < POSTER_GRID_ABOVE_FOLD}
                first={i === 0}
              />
            ))}
          </div>
        )
      )}

      <div ref={sentinelRef} className="h-1" />

      <ListStatus
        error={error}
        loading={loading}
        done={done}
        isEmpty={!loading && !error && results.length === 0}
        hasItems={results.length > 0}
        labels={labels}
        onRetry={retry}
      />
    </div>
  );
}

/** 面板裡的一列：左邊欄名，右邊選項。手機上欄名疊在選項上面 */
function FilterRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  /** 右邊是 select 時給它的 id，欄名才會是真的 <label> */
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const cls = "t-label pt-1 sm:pt-0";
  return (
    <div className="grid gap-y-1.5 border-b border-hairline py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-x-6">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={cls}>
          {label}
        </label>
      ) : (
        <p className={cls}>{label}</p>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
