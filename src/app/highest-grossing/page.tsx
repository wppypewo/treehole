import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getHighestGrossing } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import PageHeader from "@/components/PageHeader";

// 史上最賣座（票房）完整頁：縱向無限捲動到第 20 頁
export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pages.highestGrossing };
}

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

  return (
    <section className="page-shell">
      <PageHeader title={dict.pages.highestGrossing} rule={false} />
      <div className="mt-10">
        {errorMessage ? (
          <ErrorNotice message={errorMessage} placement="" />
        ) : (
          <InfiniteMovieGrid
            endpoint="/api/highest-grossing"
            initialMovies={data?.results ?? []}
            initialHasMore={data ? data.page < data.total_pages : false}
            maxPages={20}
            variant="ranked"
            rankedLabels={dict.lists}
            labels={{
              loading: dict.common.loading,
              noMore: dict.common.noMore,
              loadError: dict.common.loadError,
              retry: dict.common.retry,
              empty: dict.common.empty,
            }}
          />
        )}
      </div>
    </section>
  );
}
