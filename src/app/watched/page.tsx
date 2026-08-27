import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { listWatched } from "@/lib/db";
import LibraryGrid from "@/components/LibraryGrid";
import PageHeader from "@/components/PageHeader";

// 讀取雲端片庫，需於每次請求即時取得最新資料
export const dynamic = "force-dynamic";

export default async function WatchedPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const items = await listWatched();

  return (
    <section className="page-shell space-y-10">
      <PageHeader
        title={dict.library.watchedTitle}
      />
      <LibraryGrid
        items={items}
        kind="watched"
        labels={{
          remove: dict.library.remove,
          empty: dict.library.emptyWatched,
          sort: dict.browse.sort,
          sortAdded: dict.library.sortAdded,
          sortTitle: dict.library.sortTitle,
          sortRating: dict.library.sortRating,
          minRating: dict.browse.minRating,
          ratingPlaceholder: dict.library.ratingPlaceholder,
          browse: dict.common.browse,
          count: dict.common.filmCount,
        }}
      />
    </section>
  );
}
