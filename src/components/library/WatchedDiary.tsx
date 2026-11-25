"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SavedMovie } from "@/lib/db.types";
import { tmdbImage } from "@/lib/images";
import {
  filterWatched,
  groupByMonth,
  type WatchedFilter,
} from "@/lib/library";
import Segmented from "@/components/Segmented";
import RemoveButton, { type RemoveLabels } from "./RemoveButton";
import LibraryEmpty from "./LibraryEmpty";
import UndoStatus from "./UndoStatus";
import { useUndoStack } from "./useUndoStack";
import { useFlip } from "./useFlip";
import { useRefocus } from "./useRefocus";
import FallbackImg from "@/components/FallbackImg";

/**
 * 把一筆放回日誌原來的位置：清單是看過時間新的在前，插在第一筆比它舊的前面。
 * 直接接在最後的話，復原後那部片會跑到同月份的最底下，日期順序就亂了。
 * 時間解析不了的排最後，跟伺服器給的順序一致。
 */
function putBack(list: DiaryRow[], row: DiaryRow): DiaryRow[] {
  if (list.some((r) => r.movie.tmdb_id === row.movie.tmdb_id)) return list;
  const t = Date.parse(row.watched_at);
  const at = Number.isNaN(t)
    ? -1
    : list.findIndex((r) => !(Date.parse(r.watched_at) >= t));
  if (at === -1) return [...list, row];
  return [...list.slice(0, at), row, ...list.slice(at)];
}

export interface DiaryRow {
  movie: SavedMovie;
  /** 原始的看過時間（ISO），復原時原樣送回，片才會回到日誌裡原來那一天 */
  watched_at: string;
  /** 分組用，伺服器依台北時間算好；日期解析不了是 null */
  month: { key: string; label: string } | null;
  /** 大字的日「21」與星期「週六」 */
  day: string | null;
  weekday: string | null;
  /** 給報讀的完整日期 */
  full: string | null;
  score: number | null;
  note: string | null;
}

interface Labels extends RemoveLabels {
  filterGroup: string;
  filterAll: string;
  filterHigh: string;
  filterUnrated: string;
  unrated: string;
  /** 「我給 {n} 分」 */
  score: string;
  /** 「{n} 部」 */
  count: string;
  /** 沒有日期的那一組的標題 */
  undated: string;
  filteredEmpty: string;
  /** 篩選後沒東西時的出口：一鍵回到全部 */
  showAll: string;
  removed: string;
  undoMore: string;
  undo: string;
  saveError: string;
  removeError: string;
  empty: string;
  browse: string;
}

/**
 * 看過的片排成日誌：依月份分組，每一筆是大字的日、小海報、片名、
 * 自己給的分數與寫的一句話。
 *
 * 這一頁的內容全是使用者留下的痕跡，所以分數用 curtain-ink；
 * 沒評分就寫「未評分」，淡色，不用別的數字頂替。
 * hover 用日誌那一種（.hov-date）：大字日期轉色，其餘不動。
 *
 * 篩選只有兩種：8 分以上（想回頭找喜歡的）、未評分（想補分數的）。
 * 不做 TMDB 評分門檻——那是別人的分數，跟這一頁無關。
 */
export default function WatchedDiary({
  rows,
  labels,
}: {
  rows: DiaryRow[];
  labels: Labels;
}) {
  const [list, setList] = useState(rows);
  const [filter, setFilter] = useState<WatchedFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { containerRef, capture } = useFlip<HTMLDivElement>();
  const { leave, arrive, emptyRef } = useRefocus(containerRef);
  const undoStack = useUndoStack<DiaryRow>();

  const groups = groupByMonth(filterWatched(list, filter));

  // 先從畫面拿掉再送出；寫入失敗再放回來並說明
  async function remove(row: DiaryRow) {
    const id = row.movie.tmdb_id;
    setError(null);
    capture();
    leave(id);
    setList((prev) => prev.filter((r) => r.movie.tmdb_id !== id));
    try {
      const res = await fetch(`/api/watched?tmdb_id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`watched responded ${res.status}`);
      undoStack.push(row);
      router.refresh();
    } catch {
      capture();
      setList((prev) => putBack(prev, row));
      setError(labels.removeError);
    }
  }

  // 復原：帶原本的看過時間放回去，回到原來那個月、那一天
  async function undo() {
    setError(null);
    const ok = await undoStack.undo(async (row, isLast) => {
      const res = await fetch("/api/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row.movie, watched_at: row.watched_at }),
      });
      if (!res.ok) throw new Error(`watched responded ${res.status}`);
      capture();
      if (isLast) arrive(row.movie.tmdb_id);
      setList((prev) => putBack(prev, row));
      router.refresh();
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
      className={list.length > 0 || undoStack.top ? "min-h-11 max-sm:basis-full" : ""}
    />
  );

  const alert = error && (
    <p
      role="alert"
      className="fade-in mt-5 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
    >
      {error}
    </p>
  );

  if (list.length === 0) {
    return (
      <div className="enter-soft">
        {status}
        {alert}
        <LibraryEmpty text={labels.empty} browse={labels.browse} linkRef={emptyRef} />
      </div>
    );
  }

  return (
    <div className="enter-soft">
      {/* 篩選與撤銷列同一行：撤銷列預留高度，出現時不把整本日誌往下推 */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      {/* 只剩一部時篩選沒意義就不畫；但正在篩選中時要留著，不然回不到「全部」 */}
      {list.length > 1 || filter !== "all" ? (
        <Segmented
          options={[
            { value: "all", label: labels.filterAll },
            { value: "high", label: labels.filterHigh },
            { value: "unrated", label: labels.filterUnrated },
          ]}
          value={filter}
          onChange={(v) => {
            capture();
            setFilter(v);
          }}
          label={labels.filterGroup}
        />
      ) : (
        <span />
      )}

      {status}
      </div>
      {alert}

      {groups.length === 0 ? (
        // 篩選中移出最後一部時焦點落在這句話上（tabIndex -1：可被聚焦，不進 Tab 順序）
        <div className="py-20 text-center">
          <p
            ref={emptyRef}
            tabIndex={-1}
            className="text-sm text-paper-faint"
          >
            {labels.filteredEmpty}
          </p>
          <button
            type="button"
            onClick={() => {
              capture();
              setFilter("all");
            }}
            className="tap-safe link-hair mt-3 text-[0.8125rem] text-paper"
          >
            {labels.showAll}
          </button>
        </div>
      ) : (
        <div ref={containerRef}>
          {groups.map((g) => {
            const headId = `month-${g.key || "undated"}`;
            return (
              <section key={g.key || "undated"} aria-labelledby={headId} className="mt-12 first:mt-8">
                <div className="flex items-baseline gap-3.5 border-b border-hairline-strong pb-3">
                  <h2 id={headId} className="font-display text-[1.375rem] text-paper">
                    {g.label || labels.undated}
                  </h2>
                  <p className="t-meta text-paper-faint">
                    {labels.count.replace("{n}", String(g.entries.length))}
                  </p>
                </div>
                <ol>
                  {g.entries.map((row) => (
                    <DiaryItem
                      key={row.movie.tmdb_id}
                      row={row}
                      labels={labels}
                      onRemove={() => remove(row)}
                    />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DiaryItem({
  row,
  labels,
  onRemove,
}: {
  row: DiaryRow;
  labels: Labels;
  onRemove: () => void;
}) {
  const id = row.movie.tmdb_id;
  const poster = tmdbImage(row.movie.poster_path, "w185");

  return (
    <li
      data-flip-id={id}
      className="hov-date relative grid grid-cols-[3rem_2.75rem_minmax(0,1fr)] gap-x-4 border-b border-hairline py-5 min-[700px]:grid-cols-[4.5rem_3.5rem_minmax(0,1fr)_auto] min-[700px]:gap-x-6"
    >
      {/* 日期：大字的日，下面一行星期。報讀用完整日期，畫面上的拆字藏起來 */}
      <p className="leading-none">
        {row.day ? (
          <>
            <span aria-hidden className="date-num t-num block text-[1.875rem] min-[700px]:text-[2.5rem]">
              {row.day}
            </span>
            <span aria-hidden className="mt-1.5 block text-[0.6875rem] tracking-[0.06em] text-paper-faint">
              {row.weekday}
            </span>
            <span className="sr-only">{row.full}</span>
          </>
        ) : null}
      </p>

      <div className="aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {poster && (
          <FallbackImg
            src={poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0">
        <Link
          href={`/movie/${id}`}
          className="font-display text-[1.1875rem] leading-snug text-paper after:absolute after:inset-0 after:content-['']"
        >
          {row.movie.title}
        </Link>
        <p className="mt-1 text-[0.8125rem]">
          {row.score !== null ? (
            <span className="text-curtain-ink tabular-nums">
              {labels.score.replace("{n}", String(row.score))}
            </span>
          ) : (
            <span className="text-paper-faint">{labels.unrated}</span>
          )}
        </p>
        {row.note && (
          <p className="mt-2 max-w-[60ch] text-[0.875rem] leading-relaxed text-paper-dim">
            {row.note}
          </p>
        )}
      </div>

      {/* 手機接在內文下面（第三欄第二列），桌機另開一欄靠右 */}
      <div className="relative z-10 col-start-3 mt-2 min-[700px]:col-start-4 min-[700px]:row-start-1 min-[700px]:mt-0 min-[700px]:self-start">
        <RemoveButton title={row.movie.title} labels={labels} onRemove={onRemove} />
      </div>
    </li>
  );
}
