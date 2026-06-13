import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getForYouPage } from "@/lib/recommendations";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import ErrorNotice from "@/components/ErrorNotice";

// 需讀取本機 SQLite 取得收藏／已看過作為推薦來源，故每次請求即時渲染
export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const isDemo = process.env.DEMO_MODE === "1";

  // demo 模式下個人化推薦無種子（片庫為本機版功能），改為誠實說明 + 繼續探索出口
  if (isDemo) {
    return (
      <section className="space-y-4">
        <h1 className="text-xl font-bold">{dict.pages.recommendations}</h1>
        <div className="space-y-4 py-16 text-center">
          <p className="mx-auto max-w-md text-sm text-zinc-500">
            {dict.demo.recommendationsEmpty}
          </p>
          <Link
            href="/browse"
            className="inline-block rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10"
          >
            {dict.demo.keepBrowsing}
          </Link>
        </div>
      </section>
    );
  }

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
    <section className="space-y-4">
      <h1 className="text-xl font-bold">{dict.pages.recommendations}</h1>
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
