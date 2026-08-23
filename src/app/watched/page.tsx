import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { listWatched } from "@/lib/db";
import LibraryGrid from "@/components/LibraryGrid";
import PageHeader from "@/components/PageHeader";

// 讀取本機 SQLite，需於每次請求即時取得最新資料
export const dynamic = "force-dynamic";

export default async function WatchedPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const items = listWatched();
  const isDemo = process.env.DEMO_MODE === "1";

  return (
    <section className="page-shell space-y-10">
      <PageHeader
        eyebrow={dict.library.watchedEyebrow}
        title={dict.library.watchedTitle}
        subtitle={dict.library.watchedSubtitle}
      />
      <LibraryGrid
        items={items}
        kind="watched"
        isDemo={isDemo}
        labels={{
          remove: dict.library.remove,
          empty: dict.library.emptyWatched,
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
