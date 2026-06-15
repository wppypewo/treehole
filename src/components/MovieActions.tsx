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

  const base =
    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50";
  // active：微亮底色 + 全白文字，示意「已開啟」但不搶下載按鈕的首要視覺
  const activeCls = "border-white/30 bg-white/10 text-white";
  // idle：極淡邊框 + 柔灰文字，有 hover 回饋但退讓於下載
  const idleCls =
    "border-white/15 text-zinc-400 hover:border-white/30 hover:text-zinc-100";

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <button
        type="button"
        disabled={isDemo || busy}
        aria-pressed={fav}
        onClick={() => toggle("favorites", fav, setFav)}
        className={`${base} ${fav ? activeCls : idleCls}`}
      >
        {fav ? labels.favorited : labels.favorite}
      </button>
      <button
        type="button"
        disabled={isDemo || busy}
        aria-pressed={want}
        onClick={() => toggle("watchlist", want, setWant)}
        className={`${base} ${want ? activeCls : idleCls}`}
      >
        {want ? labels.watchlistAdded : labels.watchlist}
      </button>
      <button
        type="button"
        disabled={isDemo || busy}
        aria-pressed={seen}
        onClick={() => toggle("watched", seen, setSeen)}
        className={`${base} ${seen ? activeCls : idleCls}`}
      >
        {seen ? labels.watchedDone : labels.watched}
      </button>
    </div>
  );
}
