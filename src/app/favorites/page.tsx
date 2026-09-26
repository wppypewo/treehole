import { getLocale } from "@/i18n/server";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { listFavoriteEntries } from "@/lib/db";
import { shelfDateFormatter, todayInTaipei } from "@/lib/dates";
import PageHeader from "@/components/PageHeader";
import FavoritesWall, {
  type FavoriteTile,
} from "@/components/library/FavoritesWall";

// getLocale() 讀 cookie，這頁不會被預先產生；片庫資料每次請求直接查資料庫。

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.library.favoritesTitle };
}

export default async function FavoritesPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const entries = await listFavoriteEntries();

  const shelfDate = shelfDateFormatter(locale, todayInTaipei().slice(0, 4));
  const tiles: FavoriteTile[] = entries.map((m) => {
    const date = shelfDate(m.added_at);
    return {
      movie: {
        tmdb_id: m.tmdb_id,
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
      },
      added_at: m.added_at,
      added: date ? dict.actions.since.favorites.replace("{date}", date) : null,
      score: m.score,
    };
  });

  const lf = dict.library.favorites;

  return (
    <section className="page-shell">
      <PageHeader
        title={dict.library.favoritesTitle}
        meta={
          entries.length > 0
            ? dict.common.filmCount.replace("{n}", String(entries.length))
            : undefined
        }
      />
      <div className="mt-8">
        <FavoritesWall
          tiles={tiles}
          locale={locale}
          labels={{
            remove: dict.library.remove,
            confirmRemove: dict.library.confirmRemove,
            cancel: dict.library.cancel,
            removeNamed: dict.library.removeNamed,
            sortGroup: dict.library.sortGroup,
            sortRecent: lf.sortRecent,
            sortTitle: lf.sortTitle,
            sortMine: lf.sortMine,
            score: dict.home.diary.score,
            removeError: dict.common.removeError,
            empty: dict.library.emptyFavorites,
            browse: dict.common.browse,
          }}
        />
      </div>
    </section>
  );
}
