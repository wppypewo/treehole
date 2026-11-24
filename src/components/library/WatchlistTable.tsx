"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { SavedMovie } from "@/lib/db.types";
import { sortWatchlist, type WatchlistSort } from "@/lib/library";
import Segmented from "@/components/Segmented";
import RemoveButton, { type RemoveLabels } from "./RemoveButton";
import LibraryEmpty from "./LibraryEmpty";
import UndoStatus from "./UndoStatus";
import { useUndoStack } from "./useUndoStack";
import { useFlip } from "./useFlip";
import { useRefocus } from "./useRefocus";

export interface WatchlistRow {
  movie: SavedMovie;
  /** 原始的加入時間（ISO），復原時原樣送回，片才會回到原來的序位 */
  added_at: string;
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
  removed: string;
  undoMore: string;
  undo: string;
  saveError: string;
  removeError: string;
  empty: string;
  browse: string;
}

/** 復原堆疊裡的一筆：移出，或標為看過 */
type Undoable =
  | { type: "removed"; row: WatchlistRow }
  | {
      type: "watched";
      row: WatchlistRow;
      /** 這次是不是真的新增了一列看過；本來就看過的話復原不能去刪它 */
      watchedAdded: boolean;
    };

/**
 * 想看清單。排成放映表（跟首頁那一段同一種列），因為這一頁要回答的是
 * 「還有哪些、先看哪部」：序號、片名、導演、年份與片長、加入日。
 *
 * 每一列有兩個動作：「標為看過」記一筆看過並移出清單，「移出」直接移出。
 * 兩個都是按下去畫面當下就變，狀態列給復原；連做好幾筆也能一路往回復原。
 * 片名本身是連到詳情頁的連結，點擊範圍撐滿整列，
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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { containerRef, capture } = useFlip<HTMLOListElement>();
  const { leave, arrive, emptyRef } = useRefocus(containerRef);
  const undoStack = useUndoStack<Undoable>();

  // 有片長可排才給「片長」這個選項。最後一部有片長的移出之後選項會消失，
  // 排序要跟著退回預設，不然分段組裡沒有一格是選中的，鍵盤也 Tab 不進去
  const hasRuntime = list.some((r) => r.runtime !== null);
  const activeSort: WatchlistSort = sort === "runtime" && !hasRuntime ? "queue" : sort;
  const shown = sortWatchlist(list, activeSort, locale);
  // 畫面上的序號照「目前還在清單上的」加入先後重排：記為看過或移出一部之後，
  // 後面的往前遞補，跟重新整理後伺服器給的編號一致。row.queue 只拿來排先後
  const rank = new Map(
    sortWatchlist(list, "queue", locale).map((r, i) => [r.movie.tmdb_id, i + 1]),
  );

  // 兩個動作共用：先從畫面拿掉，寫入失敗再放回來
  function takeOut(id: number) {
    setError(null);
    capture();
    leave(id);
    setList((prev) => prev.filter((r) => r.movie.tmdb_id !== id));
  }

  function putBack(row: WatchlistRow, message: string) {
    capture();
    setList((prev) =>
      prev.some((r) => r.movie.tmdb_id === row.movie.tmdb_id) ? prev : [...prev, row],
    );
    setError(message);
  }

  async function markWatched(row: WatchlistRow) {
    takeOut(row.movie.tmdb_id);
    try {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row.movie),
      });
      if (!res.ok) throw new Error(`watched responded ${res.status}`);
      const data = (await res.json()) as { watchedAdded: boolean };
      undoStack.push({ type: "watched", row, watchedAdded: data.watchedAdded });
      router.refresh();
    } catch {
      putBack(row, labels.saveError);
    }
  }

  async function remove(row: WatchlistRow) {
    takeOut(row.movie.tmdb_id);
    try {
      const res = await fetch(`/api/watchlist?tmdb_id=${row.movie.tmdb_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`watchlist responded ${res.status}`);
      undoStack.push({ type: "removed", row });
      router.refresh();
    } catch {
      putBack(row, labels.removeError);
    }
  }

  // 復原：先帶原本的加入時間把片放回想看（使用者比較在乎的那一半），
  // 是「標為看過」的話再撤掉那筆看過。任一步失敗，這一筆都留在堆疊上，再按一次復原就重做：
  // 放回想看是 ON CONFLICT DO NOTHING，重送不會多一筆，所以只撤看過失敗時重來也安全
  async function undo() {
    setError(null);
    const ok = await undoStack.undo(async (item, isLast) => {
      const { row } = item;
      const put = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row.movie, added_at: row.added_at }),
      });
      if (!put.ok) throw new Error(`watchlist responded ${put.status}`);
      capture();
      // 堆疊還有東西時焦點留在「復原」上；最後一筆才交給放回來的那一列
      if (isLast) arrive(row.movie.tmdb_id);
      setList((prev) =>
        prev.some((r) => r.movie.tmdb_id === row.movie.tmdb_id) ? prev : [...prev, row],
      );
      if (item.type === "watched" && item.watchedAdded) {
        const del = await fetch(`/api/watched?tmdb_id=${row.movie.tmdb_id}`, {
          method: "DELETE",
        });
        // 片已經回到清單，只是看過那一筆沒撤掉。照實講，也不把這一筆從堆疊拿掉
        if (!del.ok) {
          router.refresh();
          throw new Error(`watched responded ${del.status}`);
        }
      }
      router.refresh();
    });
    if (!ok) setError(labels.saveError);
  }

  const top = undoStack.top;
  const message = top
    ? (top.type === "watched" ? labels.markedWatched : labels.removed).replace(
        "{title}",
        top.row.title,
      )
    : null;

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
            value={activeSort}
            onChange={(v) => {
              capture();
              setSort(v);
            }}
            label={labels.sortGroup}
          />
        ) : (
          <span />
        )}

        {/* 狀態列固定存在，讓報讀器接得到變化；沒事時是空的。
            清單空了又沒有待復原時不佔高度，空狀態那一列才貼得住刊頭 */}
        <UndoStatus
          message={message}
          remaining={undoStack.remaining}
          labels={labels}
          busy={undoStack.busy}
          onUndo={undo}
          className={list.length > 0 || top ? "min-h-11" : ""}
        />
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
        <LibraryEmpty text={labels.empty} browse={labels.browse} linkRef={emptyRef} />
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
                    className="t-original ml-2.5 text-sm text-paper-faint"
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
                  aria-label={labels.markWatchedNamed.replace("{title}", row.title)}
                  className="tap-safe text-[0.8125rem] tracking-[0.02em] text-paper-dim transition-colors hover:text-paper"
                >
                  {labels.markWatched}
                </button>
                <RemoveButton
                  title={row.title}
                  labels={labels}
                  onRemove={() => remove(row)}
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
