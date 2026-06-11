import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { genreOptions } from "@/lib/genres";
import { discoverMovies } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/tmdb";
import BrowseClient from "@/components/BrowseClient";

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
    <section className="space-y-4">
      <h1 className="text-xl font-bold">{dict.pages.browse}</h1>
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
          loading: dict.common.loading,
          noMore: dict.common.noMore,
          loadError: dict.common.loadError,
          retry: dict.common.retry,
          empty: dict.common.empty,
        }}
      />
    </section>
  );
}
