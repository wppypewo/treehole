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

// 詳情頁動作列：收藏 / 想看 / 已看過 可切換（呼叫 API 寫入 SQLite）。
// 三顆一律用 .btn-line，開啟時填簾幕紅——這是全站唯一會出現彩色填塊的地方，
// 因為它代表「這部片進了你的片庫」，是使用者在這頁唯一能留下的痕跡。
export default function MovieActions({
  movie,
  initialFavorite,
  initialWatchlist,
  initialWatched,
  labels,
  isDemo = false,
}: {
  movie: SavedMovie;
  initialFavorite: boolean;
  initialWatchlist: boolean;
  initialWatched: boolean;
  labels: Labels;
  isDemo?: boolean;
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
    // demo 模式不寫入：不觸發樂觀更新，避免顯示無法保存的「假成功」
    if (isDemo || busy) return;
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={isDemo || busy}
        aria-pressed={fav}
        data-on={fav}
        onClick={() => toggle("favorites", fav, setFav)}
        className="btn-line"
      >
        {fav ? labels.favorited : labels.favorite}
      </button>
      <button
        type="button"
        disabled={isDemo || busy}
        aria-pressed={want}
        data-on={want}
        onClick={() => toggle("watchlist", want, setWant)}
        className="btn-line"
      >
        {want ? labels.watchlistAdded : labels.watchlist}
      </button>
      <button
        type="button"
        disabled={isDemo || busy}
        aria-pressed={seen}
        data-on={seen}
        onClick={() => toggle("watched", seen, setSeen)}
        className="btn-line"
      >
        {seen ? labels.watchedDone : labels.watched}
      </button>
    </div>
  );
}
