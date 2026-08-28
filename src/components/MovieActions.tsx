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
  saveError: string;
}

// 詳情頁動作列：收藏 / 想看 / 已看過 可切換（呼叫 API 寫入雲端片庫）。
// 三顆一律用 .btn-line，開啟時填簾幕紅——這是全站唯一會出現彩色填塊的地方，
// 因為它代表「這部片進了你的片庫」，是使用者在這頁唯一能留下的痕跡。
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
  const [failed, setFailed] = useState(false);

  /**
   * 先翻按鈕、再送請求，失敗就翻回來。
   *
   * 這裡的重點不是樂觀更新，是「失敗必須看得見」。原本的寫法是
   * `await fetch(...)` 之後無條件改 state，既不看 res.ok 也沒有 catch：
   * 資料庫寫不進去時按鈕照樣顯示「已收藏 ✓」，重新整理才會發現片庫是空的。
   * 畫面說謊比畫面出錯更難查。
   */
  async function toggle(
    kind: "favorites" | "watchlist" | "watched",
    active: boolean,
    setActive: (v: boolean) => void,
  ) {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    setActive(!active);
    try {
      const res = active
        ? await fetch(`/api/${kind}?tmdb_id=${movie.tmdb_id}`, {
            method: "DELETE",
          })
        : await fetch(`/api/${kind}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(movie),
          });
      if (!res.ok) throw new Error(`${kind} responded ${res.status}`);
    } catch {
      setActive(active);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          aria-pressed={fav}
          data-on={fav}
          onClick={() => toggle("favorites", fav, setFav)}
          className="btn-line"
        >
          {fav ? labels.favorited : labels.favorite}
        </button>
        <button
          type="button"
          disabled={busy}
          aria-pressed={want}
          data-on={want}
          onClick={() => toggle("watchlist", want, setWant)}
          className="btn-line"
        >
          {want ? labels.watchlistAdded : labels.watchlist}
        </button>
        <button
          type="button"
          disabled={busy}
          aria-pressed={seen}
          data-on={seen}
          onClick={() => toggle("watched", seen, setSeen)}
          className="btn-line"
        >
          {seen ? labels.watchedDone : labels.watched}
        </button>
      </div>

      {/* 失敗提示沿用解鎖頁的語彙：一條簾幕紅左線加一行字，不畫方框 */}
      {failed && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {labels.saveError}
        </p>
      )}
    </div>
  );
}
