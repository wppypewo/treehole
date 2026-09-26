"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { SavedMovie } from "@/lib/db.types";
import { sortWatchlist, type WatchlistSort } from "@/lib/library";
import Segmented from "@/components/Segmented";
import ConfirmRemove, { type RemoveLabels } from "./ConfirmRemove";
import LibraryEmpty from "./LibraryEmpty";
import { useFlip } from "./useFlip";

export interface WatchlistRow {
  movie: SavedMovie;
  /** 依加入先後的序號，從 1 起算 */
  queue: number;
  title: string;
  originalTitle: string | null;
  director: string | null;
  /** 「2019 · 132 分鐘」，呼叫端依語系組好；查不到是 null */
  sub: string | null;
  /** 排序用的片長，查不到是 null */
  runtime: number | null;
  /** 「9/12 加入」 */
  added: string | null;
}

interface Labels extends RemoveLabels {
  sortGroup: string;
  sortQueue: string;
  sortRuntime: string;
  sortTitle: string;
  markWatched: string;
  markWatchedNamed: string;
  markedWatched: string;
  undo: string;
  saveError: string;
  removeError: string;
  empty: string;
  browse: string;
}

/** 標記看過之後、復原之前要記住的東西 */
interface Pending {
  row: WatchlistRow;
  /** markWatched 回傳的原加入時間，復原時原樣送回，片才會回到原來的序位 */
  addedAt: string | null;
  /** 這次是不是真的新增了一列看過；本來就看過的話復原不能去刪它 */
  watchedAdded: boolean;
}

/**
 * 想看清單。排成放映表（跟首頁那一段同一種列），因為這一頁要回答的是
 * 「還有哪些、先看哪部」：序號、片名、導演、年份與片長、加入日。
 *
 * 每一列有兩個動作：「看過了」直接記一筆看過並移出清單，附復原；
 * 「拿掉」是兩段式。片名本身是連到詳情頁的連結，點擊範圍撐滿整列，
 * 兩個動作鍵浮在連結上面（relative z-10），不會被整列連結吃掉。
 */
export default function WatchlistTable({
  rows,
  locale,
  labels,
}: {
  rows: WatchlistRow[];
  locale: Locale;
  labels: Labels;
}) {
  const [list, setList] = useState(rows);
  const [sort, setSort] = useState<WatchlistSort>("queue");
  const [busy, setBusy] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { containerRef, capture } = useFlip<HTMLOListElement>();

  const shown = sortWatchlist(list, sort, locale);
  // 畫面上的序號照「目前還在清單上的」加入先後重排：記為看過或拿掉一部之後，
  // 後面的往前遞補，跟重新整理後伺服器給的編號一致。row.queue 只拿來排先後
  const rank = new Map(
    sortWatchlist(list, "queue", locale).map((r, i) => [r.movie.tmdb_id, i + 1]),
  );

  async function markWatched(row: WatchlistRow) {
    setBusy(row.movie.tmdb_id);
    setError(null);
    try {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row.movie),
      });
      if (!res.ok) throw new Error(`watched responded ${res.status}`);
      const data = (await res.json()) as {
        removedFromWatchlist: { added_at: string } | null;
        watchedAdded: boolean;
      };
      capture();
      setList((prev) => prev.filter((r) => r.movie.tmdb_id !== row.movie.tmdb_id));
      setPending({
        row,
        addedAt: data.removedFromWatchlist?.added_at ?? null,
        watchedAdded: data.watchedAdded,
      });
      router.refresh();
    } catch {
      setError(labels.saveError);
    } finally {
      setBusy(null);
    }
  }

  // 復原：先把片放回想看（這是使用者比較在乎的那一半），再撤掉看過。
  // 放回失敗就整個停下，畫面維持「已記為看過」，不做一半
  async function undo() {
    if (!pending || busy !== null) return;
    const { row, addedAt, watchedAdded } = pending;
    setBusy(row.movie.tmdb_id);
    setError(null);
    try {
      const put = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          addedAt ? { ...row.movie, added_at: addedAt } : row.movie,
        ),
      });
      if (!put.ok) throw new Error(`watchlist responded ${put.status}`);
      capture();
      setList((prev) => [...prev, row]);
      setPending(null);
      if (watchedAdded) {
        const del = await fetch(`/api/watched?tmdb_id=${row.movie.tmdb_id}`, {
          method: "DELETE",
        });
        // 片已經回到清單，只是看過那一筆沒撤掉。照實講，不假裝全部成功
        if (!del.ok) setError(labels.saveError);
      }
      router.refresh();
    } catch {
      setError(labels.saveError);
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: WatchlistRow) {
    setBusy(row.movie.tmdb_id);
    setError(null);
    try {
      const res = await fetch(`/api/watchlist?tmdb_id=${row.movie.tmdb_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`watchlist responded ${res.status}`);
      capture();
      setList((prev) => prev.filter((r) => r.movie.tmdb_id !== row.movie.tmdb_id));
      // 拿掉之後，上一次「看過了」的復原還有效，不清掉
      router.refresh();
    } catch {
      setError(labels.removeError);
    } finally {
      setBusy(null);
    }
  }

  // 有片長可排才給「片長」這個選項
  const hasRuntime = list.some((r) => r.runtime !== null);
  const options = [
    { value: "queue" as const, label: labels.sortQueue },
    ...(hasRuntime ? [{ value: "runtime" as const, label: labels.sortRuntime }] : []),
    { value: "title" as const, label: labels.sortTitle },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        {list.length > 1 ? (
          <Segmented
            options={options}
            value={sort}
            onChange={(v) => {
              capture();
              setSort(v);
            }}
            label={labels.sortGroup}
          />
        ) : (
          <span />
        )}

        {/* 狀態列固定存在，讓報讀器接得到變化；沒事時是空的 */}
        <p role="status" className="flex min-h-11 flex-wrap items-center gap-x-4 text-[0.8125rem] text-paper-dim">
          {pending && (
            <>
              <span>{labels.markedWatched.replace("{title}", pending.row.title)}</span>
              <button
                type="button"
                onClick={undo}
                disabled={busy !== null}
                className="link-hair tap-safe text-paper disabled:opacity-40"
              >
                {labels.undo}
              </button>
            </>
          )}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {error}
        </p>
      )}

      {list.length === 0 ? (
        <LibraryEmpty text={labels.empty} browse={labels.browse} />
      ) : (
      <ol ref={containerRef} className="mt-5 border-t border-hairline-strong">
        {shown.map((row) => {
          const id = row.movie.tmdb_id;
          return (
            <li
              key={id}
              data-flip-id={id}
              className="hov-row grid grid-cols-[2.75rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b border-hairline py-4 max-sm:pl-3 min-[900px]:grid-cols-[3.5rem_minmax(0,1.3fr)_minmax(0,1fr)_9.5rem_6.5rem_10.5rem]"
            >
              {/* 序號照加入先後，換了排序也不變，看得出它原本排第幾 */}
              <span aria-hidden className="t-num text-[1.375rem] text-paper-faint">
                {String(rank.get(id) ?? row.queue).padStart(2, "0")}
              </span>

              <Link
                href={`/movie/${id}`}
                className="min-w-0 font-display text-xl leading-snug text-paper after:absolute after:inset-0 after:content-['']"
              >
                {row.title}
                {row.originalTitle && row.originalTitle !== row.title && (
                  <small
                    lang="und"
                    className="ml-2.5 font-display text-sm italic text-paper-faint"
                  >
                    {row.originalTitle}
                  </small>
                )}
              </Link>

              <span className="hidden text-[0.8125rem] text-paper-dim min-[900px]:block">
                {row.director}
              </span>

              <span className="col-start-2 text-[0.8125rem] text-paper-dim tabular-nums min-[900px]:col-start-auto">
                {row.sub}
                {/* 手機沒有獨立的加入日欄，接在同一行後面 */}
                {row.added && (
                  <span className="text-paper-faint min-[900px]:hidden">
                    {row.sub ? " · " : ""}
                    {row.added}
                  </span>
                )}
              </span>

              <span className="hidden text-right text-xs text-paper-faint tabular-nums min-[900px]:block">
                {row.added}
              </span>

              <span className="relative z-10 col-start-2 flex items-center gap-5 pt-1 min-[900px]:col-start-auto min-[900px]:justify-end min-[900px]:pt-0">
                <button
                  type="button"
                  onClick={() => markWatched(row)}
                  disabled={busy !== null}
                  aria-label={labels.markWatchedNamed.replace("{title}", row.title)}
                  className="tap-safe text-[0.8125rem] tracking-[0.02em] text-paper-dim transition-colors hover:text-paper disabled:opacity-40"
                >
                  {labels.markWatched}
                </button>
                <ConfirmRemove
                  title={row.title}
                  labels={labels}
                  busy={busy !== null}
                  onConfirm={() => remove(row)}
                />
              </span>
            </li>
          );
        })}
      </ol>
      )}
    </div>
  );
}
