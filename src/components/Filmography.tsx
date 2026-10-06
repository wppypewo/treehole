"use client";

import { useState } from "react";
import Link from "next/link";
import Segmented from "./Segmented";
import FallbackImg from "@/components/FallbackImg";

export interface FilmographyRow {
  id: number;
  title: string;
  /** 原文片名，跟譯名一樣時為 null */
  original: string | null;
  poster: string | null;
  /** 「飾 Bruce Wayne」「導演 · 編劇」 */
  role: string;
  lead: boolean;
  /** 還沒上映的片：「2026 年 12 月 18 日上映」 */
  opens: string | null;
  /** 這部片在自己片庫裡的狀態；不在片庫為 null */
  library: LibraryMark | null;
}

/** 一列只標一個狀態，優先序見人物頁的 libraryMark */
export type LibraryMark = "watched" | "watchlist" | "favorite";

export interface FilmographyYear {
  /** 「2024」；沒有上映日的那一組為 null */
  year: string | null;
  rows: FilmographyRow[];
}

type Kind = "acting" | "crew";

/**
 * 人物頁的作品年表：左欄年份、右欄那一年的片，由新到舊往下讀。
 * 版面跟「即將上映」同一套，那一頁的主軸是日期，這一頁是年份。
 *
 * 演出與幕後分成兩個分頁，不混在一張表裡：導演在紀錄片裡以本人入鏡的
 * 那幾筆，混進他導的片之間只會打斷閱讀。預設分頁照 TMDB 的
 * known_for_department 決定，只有一邊有作品時不出現切換。
 */
export default function Filmography({
  acting,
  crew,
  counts,
  defaultKind,
  labels,
}: {
  acting: FilmographyYear[];
  crew: FilmographyYear[];
  counts: Record<Kind, number>;
  defaultKind: Kind;
  labels: {
    title: string;
    acting: string;
    crew: string;
    creditKind: string;
    lead: string;
    undated: string;
    noCredits: string;
    /** 「{n} 部」 */
    filmCount: string;
    library: Record<LibraryMark, string>;
  };
}) {
  const [kind, setKind] = useState<Kind>(defaultKind);
  const both = counts.acting > 0 && counts.crew > 0;
  const years = kind === "acting" ? acting : crew;
  const count = counts[kind];

  return (
    <section aria-labelledby="filmography" className="mt-20 sm:mt-24">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
        <h2 id="filmography" className="t-section text-paper">
          {labels.title}
        </h2>
        {count > 0 && (
          <p className="t-meta text-paper-faint">
            {labels.filmCount.replace("{n}", String(count))}
          </p>
        )}
        {both && (
          <Segmented
            className="ml-auto"
            label={labels.creditKind}
            value={kind}
            onChange={setKind}
            options={[
              { value: "acting", label: labels.acting },
              { value: "crew", label: labels.crew },
            ]}
          />
        )}
      </div>

      {count === 0 ? (
        <p className="mt-6 border-t border-hairline py-20 text-center text-sm text-paper-faint">
          {labels.noCredits}
        </p>
      ) : (
        <ol className="mt-6 border-t border-hairline-strong">
          {years.map((y) => (
            <li
              key={y.year ?? "undated"}
              className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-4 border-b border-hairline py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-8"
            >
              {/* 年份貼著捲動：一年好幾部時，往下捲還看得到是哪一年 */}
              {y.year ? (
                <p className="t-num self-start text-[1.75rem] leading-none text-paper sm:sticky sm:top-24 sm:text-[2.25rem]">
                  {y.year}
                </p>
              ) : (
                <p className="t-meta self-start pt-1 text-paper-faint sm:sticky sm:top-24">
                  {labels.undated}
                </p>
              )}

              <ul className="-mt-2.5 sm:-mt-2">
                {y.rows.map((row) => (
                  <CreditRow
                    key={row.id}
                    row={row}
                    leadLabel={labels.lead}
                    libraryLabels={labels.library}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * 片庫標記放在片名右邊、用 curtain-ink：它是使用者留下的痕跡，
 * 在一長串作品裡一眼看得出哪幾部自己已經有紀錄。只寫字，不做徽章。
 */
function CreditRow({
  row,
  leadLabel,
  libraryLabels,
}: {
  row: FilmographyRow;
  leadLabel: string;
  libraryLabels: Record<LibraryMark, string>;
}) {
  return (
    <li className="hov-row grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 py-2.5 max-sm:pl-3 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
      <div className="aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {row.poster && (
          // 海報是裝飾，片名就在旁邊
          <FallbackImg
            src={row.poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <Link
          href={`/movie/${row.id}`}
          className="font-display text-[1.0625rem] leading-snug text-paper after:absolute after:inset-0 after:content-[''] sm:text-[1.1875rem]"
        >
          {row.title}
        </Link>
        {row.library && (
          <span className="t-label ml-2.5 whitespace-nowrap text-curtain-ink">
            {libraryLabels[row.library]}
          </span>
        )}
        {row.original && (
          <p lang="und" className="mt-0.5 truncate text-[0.8125rem] text-paper-faint">
            {row.original}
          </p>
        )}
        {(row.role || row.lead || row.opens) && (
          <p className="mt-1 text-[0.8125rem] leading-snug text-paper-dim">
            {row.lead && (
              <span className="t-label mr-2 text-paper">{leadLabel}</span>
            )}
            {row.role}
            {row.opens && (
              <span className="text-paper-faint">
                {row.role && <span aria-hidden className="px-1.5">·</span>}
                {row.opens}
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  );
}
