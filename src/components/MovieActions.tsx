"use client";

import { useState } from "react";
import type { SavedMovie } from "@/lib/db";

interface Labels {
  favorite: string;
  favorited: string;
  watchlist: string;
  watchlistAdded: string;
  watched: string;
  watchedDone: string;
}

// 詳情頁動作列：收藏 / 想看 / 已看過 可切換（呼叫 API 寫入 SQLite）。下載另由 DownloadButton 負責。
export default function MovieActions({
  movie,
  initialFavorite,
  initialWatchlist,
  initialWatched,
  labels,
}: {
  movie: SavedMovie;
  initialFavorite: boolean;
  initialWatchlist: boolean;
  initialWatched: boolean;
  labels: Labels;
}) {
  const [fav, setFav] = useState(initialFavorite);
  const [want, setWant] = useState(initialWatchlist);
  const [seen, setSeen] = useState(initialWatched);
  const [busy, setBusy] = useState(false);

  async function toggle(
    kind: "favorites" | "watchlist" | "watched",
    active: boolean,
    setActive: (v: boolean) => void,
  ) {
    if (busy) return;
    setBusy(true);
    try {
      if (active) {
        await fetch(`/api/${kind}?tmdb_id=${movie.tmdb_id}`, {
          method: "DELETE",
        });
        setActive(false);
      } else {
        await fetch(`/api/${kind}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(movie),
        });
        setActive(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const base =
    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50";
  const activeCls =
    "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900";
  const idleCls =
    "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <button
        type="button"
        disabled={busy}
        aria-pressed={fav}
        onClick={() => toggle("favorites", fav, setFav)}
        className={`${base} ${fav ? activeCls : idleCls}`}
      >
        {fav ? labels.favorited : labels.favorite}
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={want}
        onClick={() => toggle("watchlist", want, setWant)}
        className={`${base} ${want ? activeCls : idleCls}`}
      >
        {want ? labels.watchlistAdded : labels.watchlist}
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={seen}
        onClick={() => toggle("watched", seen, setSeen)}
        className={`${base} ${seen ? activeCls : idleCls}`}
      >
        {seen ? labels.watchedDone : labels.watched}
      </button>
    </div>
  );
}
