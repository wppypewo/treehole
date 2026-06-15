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
  } else {
    body = (
      <div className="space-y-4">
        <div>
          <p className="eyebrow mb-1">{dict.search.resultsFor}</p>
          <p className="text-sm font-medium text-zinc-200">{query}</p>
        </div>
        <MovieGrid movies={movies ?? []} emptyText={dict.search.noResults} />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {!query && (
        <header className="mx-auto w-full max-w-2xl animate-rise">
          <p className="eyebrow mb-2.5">{dict.search.eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            {dict.search.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{dict.search.subtitle}</p>
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
            className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-zinc-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={dict.search.placeholder}
            className="w-full rounded-xl border border-white/10 bg-zinc-900/60 py-3 pr-28 pl-11 text-base text-zinc-100 placeholder:text-zinc-500 outline-none transition-[border-color,background-color,box-shadow] focus:border-white/30 focus:bg-zinc-900 focus:shadow-[0_0_0_4px_rgba(255,255,255,0.06)]"
          />
          <button
            type="submit"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            {dict.search.button}
          </button>
        </form>
      </div>
      {body}
    </section>
  );
}
