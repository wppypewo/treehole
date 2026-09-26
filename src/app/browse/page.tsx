import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { genreOptions } from "@/lib/genres";
import { discoverMovies } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/tmdb";
import {
  BROWSE_FIRST_YEAR,
  BROWSE_SORTS,
  parseBrowseFilters,
} from "@/lib/browse-filters";
import { todayInTaipei } from "@/lib/dates";
import BrowseClient from "@/components/BrowseClient";
import PageHeader from "@/components/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.browse.title };
}

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const genres = genreOptions(locale);

  // 「今年」照台北時間算，跟站內其他日期同一個基準
  const thisYear = Number(todayInTaipei().slice(0, 4));
  const years = Array.from(
    { length: thisYear - BROWSE_FIRST_YEAR + 1 },
    (_, i) => thisYear - i,
  );

  const sortLabel: Record<(typeof BROWSE_SORTS)[number], string> = {
    "popularity.desc": dict.browse.sortPopular,
    "vote_average.desc": dict.browse.sortRating,
    "primary_release_date.desc": dict.browse.sortNewest,
  };
  const sorts = BROWSE_SORTS.map((value) => ({ value, label: sortLabel[value] }));

  // 網址帶著條件進來（重新整理、分享連結）就照那組條件取第一頁
  const initial = parseBrowseFilters(await searchParams, thisYear);

  let initialMovies: MovieSummary[] = [];
  let initialHasMore = false;
  let initialFailed = false;
  try {
    const data = await discoverMovies(locale, {
      genre: initial.genre ? Number(initial.genre) : undefined,
      year: initial.year ? Number(initial.year) : undefined,
      minRating: initial.rating ? Number(initial.rating) : undefined,
      sort: initial.sort,
      page: 1,
    });
    initialMovies = data.results;
    initialHasMore = data.page < data.total_pages;
  } catch {
    initialFailed = true;
  }

  return (
    <section className="page-shell">
      <PageHeader title={dict.browse.title} rule={false} />
      <div className="mt-8">
        <BrowseClient
          // 條件不同就是另一份清單。從 /browse?genre=18 點導覽列回 /browse 時
          // 元件會被重用，沒有 key 的話畫面會停在舊條件
          key={`${initial.genre}|${initial.year}|${initial.rating}|${initial.sort}`}
          genres={genres}
          years={years}
          sorts={sorts}
          initial={initial}
          initialMovies={initialMovies}
          initialHasMore={initialHasMore}
          initialFailed={initialFailed}
          labels={{
            genre: dict.browse.genre,
            year: dict.browse.year,
            sort: dict.browse.sort,
            minRating: dict.browse.minRating,
            all: dict.browse.all,
            loading: dict.browse.loading,
            noMore: dict.browse.noMore,
            loadError: dict.common.loadError,
            retry: dict.common.retry,
            empty: dict.browse.empty,
            summaryPrefix: dict.browse.summaryPrefix,
            summaryAll: dict.browse.summaryAll,
            summaryRatingSuffix: dict.browse.summaryRatingSuffix,
            popularFirst: dict.browse.popularFirst,
            highestRatedFirst: dict.browse.highestRatedFirst,
            newestFirst: dict.browse.newestFirst,
            clearFilters: dict.browse.clearFilters,
            editFilters: dict.browse.editFilters,
          }}
        />
      </div>
    </section>
  );
}
