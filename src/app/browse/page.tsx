import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { genreOptions } from "@/lib/genres";
import { discoverMovies } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/tmdb";
import BrowseClient from "@/components/BrowseClient";
import PageHeader from "@/components/PageHeader";

export default async function BrowsePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const genres = genreOptions(locale);

  const thisYear = new Date().getFullYear();
  // 今年回推到 1980
  const years = Array.from({ length: thisYear - 1979 }, (_, i) => thisYear - i);

  const sorts = [
    { value: "popularity.desc", label: dict.browse.sortPopular },
    { value: "vote_average.desc", label: dict.browse.sortRating },
    { value: "primary_release_date.desc", label: dict.browse.sortNewest },
  ];

  // 預設（不限類型／年份、依人氣）第一頁由伺服器帶入，取得失敗則交給前端重載
  let initialMovies: MovieSummary[] = [];
  let initialHasMore = false;
  try {
    const data = await discoverMovies(locale, {
      sort: "popularity.desc",
      page: 1,
    });
    initialMovies = data.results;
    initialHasMore = data.page < data.total_pages;
  } catch {
    initialMovies = [];
    initialHasMore = true;
  }

  return (
    <section className="page-shell space-y-8">
      <PageHeader
        title={dict.browse.title}
      />
      <BrowseClient
        genres={genres}
        years={years}
        sorts={sorts}
        initialMovies={initialMovies}
        initialHasMore={initialHasMore}
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
          genrePlaceholder: dict.browse.genrePlaceholder,
          yearPlaceholder: dict.browse.yearPlaceholder,
          ratingPlaceholder: dict.browse.ratingPlaceholder,
          summaryPrefix: dict.browse.summaryPrefix,
          summaryAll: dict.browse.summaryAll,
          summaryRatingSuffix: dict.browse.summaryRatingSuffix,
          popularFirst: dict.browse.popularFirst,
          highestRatedFirst: dict.browse.highestRatedFirst,
          newestFirst: dict.browse.newestFirst,
          clearFilters: dict.browse.clearFilters,
        }}
      />
    </section>
  );
}
