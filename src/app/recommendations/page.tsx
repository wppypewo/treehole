import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getForYouPage } from "@/lib/recommendations";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";
import PageHeader from "@/components/PageHeader";

// 需讀取雲端片庫的收藏／已看過作為推薦來源，故每次請求即時渲染
export const dynamic = "force-dynamic";

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

  if (errorMessage) {
    return <ErrorNotice message={errorMessage} />;
  }

  return (
    <section className="page-shell space-y-10">
      <PageHeader
        title={dict.pages.recommendations}
      />
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
    </section>
  );
}
