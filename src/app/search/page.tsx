import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { searchMovies } from "@/lib/tmdb";
import { addHistory, listHistory } from "@/lib/db";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import MovieGrid from "@/components/MovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import HistoryList from "@/components/HistoryList";
import SearchField from "@/components/SearchField";

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

  // ── 尚未輸入關鍵字：搜尋框是這一頁的主體 ──────────────────
  if (!query) {
    return (
      <section className="page-shell">
        <header className="animate-rise max-w-2xl border-b border-hairline pb-8">
          <h1 className="t-film text-[2.125rem] text-paper sm:text-[3rem]">
            {dict.search.title}
          </h1>
        </header>

        <div className="mt-8 max-w-2xl">
          <SearchField
            defaultValue=""
            placeholder={dict.search.placeholder}
            buttonLabel={dict.search.button}
          />
        </div>

        <div className="mt-14 max-w-2xl">
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
        </div>
      </section>
    );
  }

  // ── 有關鍵字：關鍵字本身就是這一頁的標題 ────────────────────
  const results = movies ?? [];

  return (
    <section className="page-shell">
      {/* 搜尋框退到刊頭之上、縮小，讓結果本身佔主要視覺 */}
      <div className="max-w-xl">
        <SearchField
          defaultValue={query}
          placeholder={dict.search.placeholder}
          buttonLabel={dict.search.button}
          compact
        />
      </div>

      <header className="mt-10 border-b border-hairline pb-7">
        <p className="eyebrow mb-3">{dict.search.resultsFor}</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <h1 className="t-film text-[2rem] break-all text-paper sm:text-[2.75rem]">
            {query}
          </h1>
          {!errorMessage && results.length > 0 && (
            <p className="t-meta shrink-0 text-paper-faint">
              {dict.common.filmCount.replace("{n}", String(results.length))}
            </p>
          )}
        </div>
      </header>

      {errorMessage ? (
        <ErrorNotice message={errorMessage} />
      ) : results.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[0.9375rem] text-paper-dim">
            {dict.search.noResults}
          </p>
          <Link href="/browse" className="btn-line mt-8">
            {dict.demo.keepBrowsing}
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <MovieGrid movies={results} emptyText={dict.search.noResults} />
        </div>
      )}
    </section>
  );
}
