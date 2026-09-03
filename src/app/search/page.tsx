import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { searchMovies } from "@/lib/tmdb";
import { listFavorites, listWatched } from "@/lib/db";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import SearchField from "@/components/SearchField";
import LibraryPicks from "@/components/LibraryPicks";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  const query = ((await searchParams).q ?? "").trim();
  return { title: query ? `${query} · ${dict.search.title}` : dict.search.title };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let found;
  let errorMessage;
  if (query) {
    try {
      found = await searchMovies(locale, query);
    } catch (error) {
      errorMessage = tmdbErrorMessage(error, dict);
    }
  }

  // ── 尚未輸入關鍵字：搜尋框是這一頁的主體 ──────────────────
  if (!query) {
    // 空手進來時給一個回到自己片庫的入口。優先收藏，沒有收藏就退到已看過；
    // 兩者都空代表這個人真的還沒開始用，那就什麼都不放，不假裝有內容。
    let picks = await listFavorites();
    let picksTitle = dict.nav.favorites;
    let picksHref = "/favorites";
    if (picks.length === 0) {
      picks = await listWatched();
      picksTitle = dict.nav.watched;
      picksHref = "/watched";
    }

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

        <div className="mt-16 max-w-2xl">
          <LibraryPicks
            items={picks}
            title={picksTitle}
            moreHref={picksHref}
            moreLabel={dict.common.seeAll}
          />
        </div>
      </section>
    );
  }

  // ── 有關鍵字：關鍵字本身就是這一頁的標題 ────────────────────
  const results = found?.results ?? [];
  // 計數報 TMDB 的總筆數而不是這一頁的 20 筆——使用者要知道的是「有多少」，
  // 不是「現在畫面上有多少」。
  const total = found?.total_results ?? 0;

  return (
    <section className="page-shell">
      {/* 搜尋框退到刊頭之上、縮小，讓結果本身佔主要視覺 */}
      <div className="max-w-xl">
        {/* 同樣綁 key：defaultValue 是非受控值，換關鍵字時 DOM 不會自己更新，
            從別處連進來或按上一頁時輸入框會停在舊字 */}
        <SearchField
          key={query}
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
              {dict.common.filmCount.replace("{n}", String(total))}
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
            {dict.common.browse}
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <InfiniteMovieGrid
            // key 綁著關鍵字：換一個字就是換一份清單，元件必須整個重掛。
            // 少了它，同一個路由的 soft navigation 會沿用舊 state，
            // 畫面上就會是新標題配舊搜尋結果。
            key={query}
            endpoint={`/api/search?q=${encodeURIComponent(query)}`}
            initialMovies={results}
            initialHasMore={found ? found.page < found.total_pages : false}
            maxPages={20}
            variant="grid"
            labels={{
              loading: dict.common.loading,
              noMore: dict.common.noMore,
              loadError: dict.common.loadError,
              retry: dict.common.retry,
              empty: dict.search.noResults,
            }}
          />
        </div>
      )}
    </section>
  );
}
