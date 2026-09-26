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
import ConfirmRemove, { type RemoveLabels } from "./ConfirmRemove";
import LibraryEmpty from "./LibraryEmpty";
import { useFlip } from "./useFlip";

export interface DiaryRow {
  movie: SavedMovie;
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
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  const { containerRef, capture } = useFlip<HTMLDivElement>();

  const groups = groupByMonth(filterWatched(list, filter));

  async function remove(row: DiaryRow) {
    setBusy(row.movie.tmdb_id);
    setFailed(false);
    try {
      const res = await fetch(`/api/watched?tmdb_id=${row.movie.tmdb_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`watched responded ${res.status}`);
      capture();
      setList((prev) => prev.filter((r) => r.movie.tmdb_id !== row.movie.tmdb_id));
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  if (list.length === 0) {
    return <LibraryEmpty text={labels.empty} browse={labels.browse} />;
  }

  return (
    <div>
      {list.length > 1 && (
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
      )}

      {failed && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {labels.removeError}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="py-20 text-center text-sm text-paper-faint">
          {labels.filteredEmpty}
        </p>
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
                      busy={busy !== null}
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
  busy,
  onRemove,
}: {
  row: DiaryRow;
  labels: Labels;
  busy: boolean;
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
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
        <ConfirmRemove title={row.movie.title} labels={labels} busy={busy} onConfirm={onRemove} />
      </div>
    </li>
  );
}
