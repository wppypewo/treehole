"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { SavedMovie } from "@/lib/db.types";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import { sortFavorites, type FavoritesSort } from "@/lib/library";
import FallbackImg from "@/components/FallbackImg";
import Segmented from "@/components/Segmented";
import RemoveButton, { type RemoveLabels } from "./RemoveButton";
import LibraryEmpty from "./LibraryEmpty";
import UndoStatus from "./UndoStatus";
import { useUndoStack } from "./useUndoStack";
import { useFlip } from "./useFlip";
import { useRefocus } from "./useRefocus";

export interface FavoriteTile {
  movie: SavedMovie;
  /** 排序用的原始收藏時間（ISO、UTC） */
  added_at: string;
  /** 「9/12 收藏」 */
  added: string | null;
  score: number | null;
}

interface Labels extends RemoveLabels {
  sortGroup: string;
  sortRecent: string;
  sortTitle: string;
  sortMine: string;
  /** 「我給 {n} 分」 */
  score: string;
  removed: string;
  undoMore: string;
  undo: string;
  saveError: string;
  removeError: string;
  empty: string;
  browse: string;
}

/**
 * 收藏是一面海報牆。三頁裡只有這一頁用海報：想看是要排的清單，
 * 看過是按日期的紀錄，收藏則是挑出來擺著看的，海報本身就是內容。
 *
 * 海報底下只放兩件事：片名、自己給的分數（curtain-ink，使用者的痕跡），
 * 再一行淡色的收藏日。TMDB 評分不放，這面牆上的東西已經是你挑過的。
 *
 * 欄數 2／3／4，比探索頁的 2／3／4／5 少一欄：
 * 收藏不多，每張給大一點。
 */
export default function FavoritesWall({
  tiles,
  locale,
  labels,
}: {
  tiles: FavoriteTile[];
  locale: Locale;
  labels: Labels;
}) {
  const [list, setList] = useState(tiles);
  const [sort, setSort] = useState<FavoritesSort>("recent");
  const [error, setError] = useState<string | null>(null);
  const { containerRef, capture } = useFlip<HTMLOListElement>();
  const { leave, arrive, emptyRef } = useRefocus(containerRef);
  const undoStack = useUndoStack<FavoriteTile>();

  const shown = sortFavorites(
    list.map((t) => ({ ...t, title: t.movie.title })),
    sort,
    locale,
  );

  // 先從畫面拿掉再送出，按下去當下就有反應；寫入失敗再放回來並說明。
  // 收藏沒有導覽列計數，移出之後不必 router.refresh
  async function remove(tile: FavoriteTile) {
    const id = tile.movie.tmdb_id;
    setError(null);
    capture();
    leave(id);
    setList((prev) => prev.filter((t) => t.movie.tmdb_id !== id));
    try {
      const res = await fetch(`/api/favorites?tmdb_id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`favorites responded ${res.status}`);
      undoStack.push(tile);
    } catch {
      capture();
      setList((prev) => (prev.some((t) => t.movie.tmdb_id === id) ? prev : [...prev, tile]));
      setError(labels.removeError);
    }
  }

  // 復原：帶原本的收藏時間放回去，「最近收藏」排序裡回到原位
  async function undo() {
    setError(null);
    const ok = await undoStack.undo(async (tile, isLast) => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tile.movie, added_at: tile.added_at }),
      });
      if (!res.ok) throw new Error(`favorites responded ${res.status}`);
      capture();
      // 堆疊還有東西時焦點留在「復原」上，方便一路按下去；最後一筆才交給放回來的那張
      if (isLast) arrive(tile.movie.tmdb_id);
      setList((prev) => [...prev, tile]);
    });
    if (!ok) setError(labels.saveError);
  }

  const status = (
    <UndoStatus
      message={
        undoStack.top
          ? labels.removed.replace("{title}", undoStack.top.movie.title)
          : null
      }
      remaining={undoStack.remaining}
      labels={labels}
      busy={undoStack.busy}
      onUndo={undo}
      className={undoStack.top ? "mt-5" : ""}
    />
  );

  const alert = error && (
    <p
      role="alert"
      className="mt-5 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
    >
      {error}
    </p>
  );

  if (list.length === 0) {
    return (
      <div>
        {status}
        {alert}
        <LibraryEmpty text={labels.empty} browse={labels.browse} linkRef={emptyRef} />
      </div>
    );
  }

  // 全部都沒評分時，「我的評分」排出來跟「最近收藏」一樣，不給這個選項
  const anyScore = list.some((t) => t.score !== null);

  return (
    <div>
      {list.length > 1 && (
        <Segmented
          options={[
            { value: "recent", label: labels.sortRecent },
            { value: "title", label: labels.sortTitle },
            ...(anyScore ? [{ value: "mine" as const, label: labels.sortMine }] : []),
          ]}
          value={sort}
          onChange={(v) => {
            capture();
            setSort(v);
          }}
          label={labels.sortGroup}
        />
      )}

      {status}
      {alert}

      <ol
        ref={containerRef}
        className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-4 lg:gap-x-9 lg:gap-y-14"
      >
        {shown.map((t, i) => {
          const id = t.movie.tmdb_id;
          const poster = tmdbImage(t.movie.poster_path, "w342");
          return (
            <li key={id} data-flip-id={id}>
              <Link href={`/movie/${id}`} className="hov-poster block">
                <div className="aspect-[2/3] w-full overflow-hidden bg-ink-raised">
                  {poster ? (
                    <FallbackImg
                      src={poster}
                      srcSet={tmdbSrcSet(t.movie.poster_path, "poster")}
                      sizes={IMAGE_SIZES.favoritesWall}
                      alt={t.movie.title}
                      // 最寬四欄，1440×900 首屏排得下兩列：這八張不延遲載入
                      loading={i < 8 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      fallback={<TitleSlate title={t.movie.title} />}
                      className="poster-img h-full w-full object-cover"
                    />
                  ) : (
                    <TitleSlate title={t.movie.title} />
                  )}
                </div>
                <p className="poster-cap mt-3 font-display text-[1.0625rem] leading-snug">
                  {t.movie.title}
                </p>
              </Link>
              {/* 手機兩欄時一欄約 165px，分數、日期、移出擠不下一行。
                  手機上「移出」一律自成一行：有的卡擠得下、有的擠不下時，
                  同一排兩張卡的「移出」會一高一低。
                  分數與日期之間的點交給 dot-run，日期換行時行首不留點 */}
              <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[0.8125rem]">
                <p className="dot-run basis-full tabular-nums sm:basis-auto">
                  <span>
                    {t.score !== null && (
                      <span className="text-curtain-ink">
                        {labels.score.replace("{n}", String(t.score))}
                      </span>
                    )}
                    {t.added && <span className="text-paper-faint">{t.added}</span>}
                  </span>
                </p>
                <RemoveButton
                  title={t.movie.title}
                  labels={labels}
                  onRemove={() => remove(t)}
                  className="shrink-0"
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// 沒有海報、或海報載不出來，都在框裡排片名
function TitleSlate({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-3 text-center text-[0.6875rem] tracking-wide text-paper-dim">
      {title}
    </div>
  );
}
