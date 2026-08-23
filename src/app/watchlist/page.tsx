import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { listWatchlist } from "@/lib/db";
import LibraryGrid from "@/components/LibraryGrid";
import PageHeader from "@/components/PageHeader";

// 讀取本機 SQLite，需於每次請求即時取得最新資料
export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const items = listWatchlist();
  const isDemo = process.env.DEMO_MODE === "1";

  return (
    <section className="page-shell space-y-10">
      <PageHeader
        eyebrow={dict.library.watchlistEyebrow}
        title={dict.library.watchlistTitle}
        subtitle={dict.library.watchlistSubtitle}
      />
      <LibraryGrid
        items={items}
        kind="watchlist"
        isDemo={isDemo}
        labels={{
          remove: dict.library.remove,
          empty: dict.library.emptyWatchlist,
          sort: dict.browse.sort,
          sortAdded: dict.library.sortAdded,
          sortTitle: dict.library.sortTitle,
          sortRating: dict.library.sortRating,
          minRating: dict.browse.minRating,
          ratingPlaceholder: dict.library.ratingPlaceholder,
          demoEmpty: dict.demo.libraryEmpty,
          browse: dict.demo.keepBrowsing,
          count: dict.common.filmCount,
        }}
      />
    </section>
  );
}
