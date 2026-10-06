"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { SavedMovie } from "@/lib/db.types";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import { sortFavorites, type FavoritesSort } from "@/lib/library";
import FallbackImg from "@/components/FallbackImg";
import Segmented from "@/components/Segmented";
import ConfirmRemove, { type RemoveLabels } from "./ConfirmRemove";
import LibraryEmpty from "./LibraryEmpty";
import { useFlip } from "./useFlip";

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
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const { containerRef, capture } = useFlip<HTMLOListElement>();

  const shown = sortFavorites(
    list.map((t) => ({ ...t, title: t.movie.title })),
    sort,
    locale,
  );

  // 收藏沒有導覽列計數，拿掉之後不必 router.refresh
  async function remove(tile: FavoriteTile) {
    setBusy(tile.movie.tmdb_id);
    setFailed(false);
    try {
      const res = await fetch(`/api/favorites?tmdb_id=${tile.movie.tmdb_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`favorites responded ${res.status}`);
      capture();
      setList((prev) => prev.filter((t) => t.movie.tmdb_id !== tile.movie.tmdb_id));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  if (list.length === 0) {
    return <LibraryEmpty text={labels.empty} browse={labels.browse} />;
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

      {failed && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {labels.removeError}
        </p>
      )}

      <ol
        ref={containerRef}
        className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-4 lg:gap-x-9 lg:gap-y-14"
      >
        {shown.map((t) => {
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
                      loading="lazy"
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
              {/* 手機兩欄時一欄約 165px，分數、日期、拿掉擠不下一行。
                  手機上「拿掉」一律自成一行：有的卡擠得下、有的擠不下時，
                  同一排兩張卡的「拿掉」會一高一低。
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
                <ConfirmRemove
                  title={t.movie.title}
                  labels={labels}
                  busy={busy !== null}
                  onConfirm={() => remove(t)}
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
