import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { listWatchlist } from "@/lib/db";
import LibraryGrid from "@/components/LibraryGrid";

// 讀取本機 SQLite，需於每次請求即時取得最新資料
export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const items = listWatchlist();

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">{dict.pages.watchlist}</h1>
      <LibraryGrid
        items={items}
        kind="watchlist"
        labels={{
          remove: dict.library.remove,
          empty: dict.library.emptyWatchlist,
          sort: dict.browse.sort,
          sortAdded: dict.library.sortAdded,
          sortTitle: dict.library.sortTitle,
          sortRating: dict.browse.sortRating,
          minRating: dict.browse.minRating,
          all: dict.browse.all,
        }}
      />
    </section>
  );
}
