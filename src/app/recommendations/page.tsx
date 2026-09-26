import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { getForYouPage } from "@/lib/recommendations";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import PageHeader from "@/components/PageHeader";

// 同 movie/[id]：getLocale() 已保證動態渲染，推薦種子直接查資料庫。
// 加 force-dynamic 只會順手作廢底下 TMDB 查詢的 revalidate。

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pages.recommendations };
}

export default async function RecommendationsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  let first;
  let errorMessage;
  try {
    first = await getForYouPage(locale, 1);
  } catch (error) {
    errorMessage = tmdbErrorMessage(error, dict);
  }

  return (
    <section className="page-shell">
      <PageHeader title={dict.pages.recommendations} />
      <div className="mt-10">
        {errorMessage ? (
          <ErrorNotice message={errorMessage} placement="" />
        ) : (
          <InfiniteMovieGrid
            endpoint="/api/recommendations"
            initialMovies={first?.results ?? []}
            initialHasMore={first?.hasMore ?? false}
            maxPages={20}
            labels={{
              loading: dict.common.loading,
              noMore: dict.common.noMore,
              loadError: dict.common.loadError,
              retry: dict.common.retry,
              // 片庫為空時顯示引導文案，否則顯示一般空狀態
              empty: first?.hasSeeds
                ? dict.recommendations.relatedEmpty
                : dict.recommendations.forYouEmpty,
            }}
          />
        )}
      </div>
    </section>
  );
}
