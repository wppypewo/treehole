import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { listFavorites } from "@/lib/db";
import LibraryGrid from "@/components/LibraryGrid";
import PageHeader from "@/components/PageHeader";

// getLocale() 讀 cookie，這頁不會被預先產生；片庫資料每次請求直接查資料庫。

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.library.favoritesTitle };
}

export default async function FavoritesPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const items = await listFavorites();

  return (
    <section className="page-shell space-y-10">
      <PageHeader
        title={dict.library.favoritesTitle}
      />
      <LibraryGrid
        items={items}
        kind="favorites"
        labels={{
          remove: dict.library.remove,
          empty: dict.library.emptyFavorites,
          sort: dict.browse.sort,
          sortAdded: dict.library.sortAdded,
          sortTitle: dict.library.sortTitle,
          sortRating: dict.library.sortRating,
          minRating: dict.browse.minRating,
          ratingPlaceholder: dict.library.ratingPlaceholder,
          browse: dict.common.browse,
          count: dict.common.filmCount,
          removeError: dict.common.removeError,
        }}
      />
    </section>
  );
}
