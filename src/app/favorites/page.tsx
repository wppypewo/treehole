import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { listFavorites } from "@/lib/db";
import LibraryGrid from "@/components/LibraryGrid";

// 讀取本機 SQLite，需於每次請求即時取得最新資料
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const items = listFavorites();
  const isDemo = process.env.DEMO_MODE === "1";

  return (
    <section className="space-y-6">
      <header className="animate-rise">
        <p className="eyebrow mb-2.5">{dict.library.favoritesEyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          {dict.library.favoritesTitle}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">{dict.library.favoritesSubtitle}</p>
      </header>
      <LibraryGrid
        items={items}
        kind="favorites"
        isDemo={isDemo}
        labels={{
          remove: dict.library.remove,
          empty: dict.library.emptyFavorites,
          sort: dict.browse.sort,
          sortAdded: dict.library.sortAdded,
          sortTitle: dict.library.sortTitle,
          sortRating: dict.library.sortRating,
          minRating: dict.browse.minRating,
          ratingPlaceholder: dict.library.ratingPlaceholder,
          demoEmpty: dict.demo.libraryEmpty,
          browse: dict.demo.keepBrowsing,
        }}
      />
    </section>
  );
}
