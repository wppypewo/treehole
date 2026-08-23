import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getHighestGrossing } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import PageHeader from "@/components/PageHeader";

// 史上最賣座（票房）完整頁：縱向無限捲動到第 20 頁
export default async function HighestGrossingPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  let data;
  let errorMessage;
  try {
    data = await getHighestGrossing(locale, 1);
  } catch (error) {
    errorMessage = tmdbErrorMessage(error, dict);
  }

  if (errorMessage) {
    return <ErrorNotice message={errorMessage} />;
  }

  return (
    <section className="page-shell space-y-8">
      <PageHeader
        title={dict.pages.highestGrossing}
        subtitle={dict.pages.highestGrossingSubtitle}
      />
      <InfiniteMovieGrid
        endpoint="/api/highest-grossing"
        initialMovies={data?.results ?? []}
        initialHasMore={data ? data.page < data.total_pages : false}
        maxPages={20}
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
