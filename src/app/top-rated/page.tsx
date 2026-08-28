import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getTopRated } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import PageHeader from "@/components/PageHeader";

// 影史評分最高完整頁：縱向無限捲動到第 20 頁
export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pages.topRated };
}

export default async function TopRatedPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  let data;
  let errorMessage;
  try {
    data = await getTopRated(locale, 1);
  } catch (error) {
    errorMessage = tmdbErrorMessage(error, dict);
  }

  if (errorMessage) {
    return <ErrorNotice message={errorMessage} />;
  }

  return (
    <section className="page-shell space-y-10">
      <PageHeader
        title={dict.pages.topRated}
      />
      <InfiniteMovieGrid
        endpoint="/api/top-rated"
        initialMovies={data?.results ?? []}
        initialHasMore={data ? data.page < data.total_pages : false}
        maxPages={20}
        variant="ranked"
        labels={{
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
