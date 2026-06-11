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

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">{dict.pages.favorites}</h1>
      <LibraryGrid
        items={items}
        kind="favorites"
        labels={{
          remove: dict.library.remove,
          empty: dict.library.emptyFavorites,
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
