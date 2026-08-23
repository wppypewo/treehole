import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { searchMovies } from "@/lib/tmdb";
import { addHistory, listHistory } from "@/lib/db";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import MovieGrid from "@/components/MovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import HistoryList from "@/components/HistoryList";

// 搜尋紀錄讀取本機 SQLite，需於每次請求即時取得最新資料
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let movies;
  let errorMessage;
  if (query) {
    addHistory(query); // 記錄這次搜尋（相同關鍵字會移到最前面、不重複）
    try {
      movies = (await searchMovies(locale, query)).results;
    } catch (error) {
      errorMessage = tmdbErrorMessage(error, dict);
    }
  }

  let body;
  if (!query) {
    // 尚未輸入關鍵字時，顯示搜尋紀錄（點關鍵字可重新搜尋、可清除）
    body = (
      <HistoryList
        items={listHistory()}
        clearLabel={dict.history.clearShort}
        emptyText={dict.history.empty}
        relTimeLabels={{
          justNow: dict.history.justNow,
          earlierToday: dict.history.earlierToday,
          yesterday: dict.history.yesterday,
          daysAgo: dict.history.daysAgo,
        }}
      />
    );
  } else if (errorMessage) {
    body = <ErrorNotice message={errorMessage} />;
  } else if (!movies || movies.length === 0) {
    // 有查詢字但找不到符合結果
    body = (
      <div className="space-y-4 py-16 text-center">
        <div>
          <p className="eyebrow mb-1">{dict.search.resultsFor}</p>
          <p className="text-sm font-medium text-paper">{query}</p>
        </div>
        <p className="text-sm text-paper-faint">{dict.search.noResults}</p>
        <Link
          href="/browse"
          className="inline-block border border-hairline px-4 py-2.5 text-sm text-paper-dim transition-colors hover:bg-white/10 hover:text-paper"
        >
          {dict.demo.keepBrowsing}
        </Link>
      </div>
    );
  } else {
    // 有結果
    body = (
      <div className="space-y-4">
        <div>
          <p className="eyebrow mb-1">{dict.search.resultsFor}</p>
          <p className="text-sm font-medium text-paper">{query}</p>
        </div>
        <MovieGrid movies={movies} emptyText={dict.search.noResults} />
      </div>
    );
  }

  return (
    <section className="page-shell space-y-8">
      {!query && (
        <header className="mx-auto w-full max-w-2xl animate-rise">
          <p className="eyebrow mb-2.5">{dict.search.eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-paper">
            {dict.search.title}
          </h1>
          <p className="mt-2 text-sm text-paper-dim">{dict.search.subtitle}</p>
        </header>
      )}
      <div className="mx-auto w-full max-w-2xl pt-2">
        <form action="/search" method="get" className="relative">
          {/* 放大鏡圖示：純裝飾，不攔截點擊 */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-paper-faint"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={dict.search.placeholder}
            className="w-full border border-hairline bg-ink-raised py-3 pr-28 pl-11 text-base text-paper placeholder:text-paper-faint outline-none transition-[border-color,background-color,box-shadow] focus:border-paper-dim focus:bg-ink-raised focus:shadow-[0_0_0_4px_rgba(255,255,255,0.06)]"
          />
          <button
            type="submit"
            className="btn-solid absolute top-1/2 right-2 -translate-y-1/2 py-1.5"
          >
            {dict.search.button}
          </button>
        </form>
      </div>
      {body}
    </section>
  );
}
