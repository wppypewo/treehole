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
      <div className="space-y-3">
        <h2 className="text-sm text-zinc-500 dark:text-zinc-400">
          {dict.pages.history}
        </h2>
        <HistoryList
          items={listHistory()}
          clearLabel={dict.history.clear}
          emptyText={dict.search.prompt}
        />
      </div>
    );
  } else if (errorMessage) {
    body = <ErrorNotice message={errorMessage} />;
  } else {
    body = (
      <div className="space-y-4">
        <h2 className="text-sm text-zinc-500 dark:text-zinc-400">
          {dict.search.resultsFor} · {query}
        </h2>
        <MovieGrid movies={movies ?? []} emptyText={dict.search.noResults} />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <form action="/search" method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={dict.search.placeholder}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {dict.search.button}
        </button>
      </form>
      {body}
    </section>
  );
}
