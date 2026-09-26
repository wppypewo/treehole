import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { searchMovies } from "@/lib/tmdb";
import { listFavorites, listWatched } from "@/lib/db";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import SearchField from "@/components/SearchField";
import LibraryPicks from "@/components/LibraryPicks";
import MovieGridSkeleton from "@/components/MovieGridSkeleton";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  const query = ((await searchParams).q ?? "").trim();
  return { title: query ? `${query} · ${dict.search.title}` : dict.search.title };
}

type SearchOutcome =
  | { ok: true; found: Awaited<ReturnType<typeof searchMovies>> }
  | { ok: false; message: string };

/**
 * 殼層只等 cookie 與網址參數，兩者都不碰網路，所以刊頭（大搜尋框，或關鍵字標題）
 * 會在第一段串流就送出。要等 TMDB 或資料庫的部分各自包在 Suspense 裡。
 *
 * 原本整頁一起等 TMDB，載入時只能靠 loading.tsx 撐場；而 loading.tsx 拿不到
 * searchParams，分不出有沒有關鍵字，搜尋一個字時會先閃出「沒有關鍵字」的大輸入框。
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { q } = await searchParams;
  const query = (q ?? "").trim();

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

        {/* 片庫入口是次要內容，晚到不影響輸入；沒有骨架，到了才出現 */}
        <Suspense fallback={null}>
          <SearchPicks dict={dict} />
        </Suspense>
      </section>
    );
  }

  // ── 有關鍵字：關鍵字本身就是這一頁的標題 ────────────────────
  // 同一個 promise 給計數與結果兩處用，TMDB 只打一次。
  // 失敗在這裡轉成值，兩處各自決定怎麼顯示，不讓例外穿過 Suspense 打到 error.tsx。
  const outcome: Promise<SearchOutcome> = searchMovies(locale, query).then(
    (found) => ({ ok: true as const, found }),
    (error: unknown) => ({ ok: false as const, message: tmdbErrorMessage(error, dict) }),
  );

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
          <Suspense key={query} fallback={null}>
            <ResultCount outcome={outcome} dict={dict} />
          </Suspense>
        </div>
      </header>

      <Suspense
        key={query}
        fallback={
          <div className="mt-10">
            <MovieGridSkeleton />
          </div>
        }
      >
        <SearchResults outcome={outcome} query={query} dict={dict} />
      </Suspense>
    </section>
  );
}

/** 空手進來時給一個回到自己片庫的入口 */
async function SearchPicks({ dict }: { dict: Dictionary }) {
  // 優先收藏，沒有收藏就退到已看過；兩者都空代表這個人真的還沒開始用，
  // 那就什麼都不放，不假裝有內容。
  // 讀不到資料庫時只少這一區，搜尋框照樣能用，所以接住、記下、不畫。
  let picks;
  let picksTitle = dict.nav.favorites;
  let picksHref = "/favorites";
  try {
    picks = await listFavorites();
    if (picks.length === 0) {
      picks = await listWatched();
      picksTitle = dict.nav.watched;
      picksHref = "/watched";
    }
  } catch (error) {
    console.error("[search-picks] 讀取片庫失敗，搜尋頁改為不顯示片庫入口", error);
    return null;
  }

  return (
    <div className="mt-16 max-w-2xl">
      <LibraryPicks
        items={picks}
        title={picksTitle}
        moreHref={picksHref}
        moreLabel={dict.common.seeAll}
      />
    </div>
  );
}

async function ResultCount({
  outcome,
  dict,
}: {
  outcome: Promise<SearchOutcome>;
  dict: Dictionary;
}) {
  const result = await outcome;
  if (!result.ok || result.found.results.length === 0) return null;
  // 計數報 TMDB 的總筆數而不是這一頁的 20 筆——使用者要知道的是「有多少」，
  // 不是「現在畫面上有多少」。
  return (
    <p className="t-meta shrink-0 text-paper-faint">
      {dict.common.filmCount.replace("{n}", String(result.found.total_results))}
    </p>
  );
}

async function SearchResults({
  outcome,
  query,
  dict,
}: {
  outcome: Promise<SearchOutcome>;
  query: string;
  dict: Dictionary;
}) {
  const result = await outcome;
  if (!result.ok) {
    return <ErrorNotice message={result.message} placement="mt-10" />;
  }

  const { found } = result;
  if (found.results.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-[0.9375rem] text-paper-dim">{dict.search.noResults}</p>
        <Link href="/browse" className="btn-line mt-8">
          {dict.common.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <InfiniteMovieGrid
        // key 綁著關鍵字：換一個字就是換一份清單，元件必須整個重掛。
        // 少了它，同一個路由的 soft navigation 會沿用舊 state，
        // 畫面上就會是新標題配舊搜尋結果。
        key={query}
        endpoint={`/api/search?q=${encodeURIComponent(query)}`}
        initialMovies={found.results}
        initialHasMore={found.page < found.total_pages}
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
  );
}
