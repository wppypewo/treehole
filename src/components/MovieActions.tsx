"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedMovie } from "@/lib/db";
import type { Locale } from "@/i18n/config";
import { shelfDateFormatter, todayInTaipei } from "@/lib/dates";
import Reveal from "./Reveal";
import { useLinger } from "./useLinger";

interface Labels {
  group: string;
  favorite: string;
  watchlist: string;
  watched: string;
  removedFromWatchlist: string;
  /** 關掉某顆鍵之後的通知，旁邊配一個復原 */
  undone: { watchlist: string; watched: string; favorites: string };
  undo: string;
  since: { watchlist: string; watched: string; favorites: string };
  saveError: string;
}

/** 三張表各自的日期，ISO 8601；不在那張表裡是 null */
export interface LedgerDates {
  watchlist: string | null;
  watched: string | null;
  favorites: string | null;
}

type Kind = "favorites" | "watchlist" | "watched";

// 詳情頁「我的紀錄」裡的三顆切換：想看／看過／收藏。
//
// 字不隨狀態改（原本是「想看」↔「已在想看」），開關只看填色與 aria-pressed。
// 三顆排成一條等寬的鍵，換字會讓鍵寬跳動，而且「已在想看」「看過了」
// 這種寫法讓人分不清按下去是加還是拿掉。
//
// 標記看過會把同一部片移出想看（資料層的 markWatched 在一句 SQL 裡做完），
// 所以這裡要把「想看」一起關掉，並且講出來、給一個復原。
//
// 三顆鍵關掉時也都給復原：取消看過會丟掉看過的日期，取消收藏會丟掉收藏的日期，
// 手滑按到時，復原會帶原本的日期放回去，不是當成今天重新加入。
//
// 送出中用 aria-disabled 擋重複按，不用 disabled：按下的那顆鍵若被停用，
// 焦點會掉回 <body>，鍵盤使用者每按一次就被送回頁首。toggle 自己會擋 busy。
//
// 狀態存的是日期而不是布林：鍵底下那一行「9/12 加入」「9/21 看過」
// 就是從這裡讀的。開的時候記下現在，關的時候清掉。
export default function MovieActions({
  movie,
  initial,
  locale,
  labels,
}: {
  movie: SavedMovie;
  initial: LedgerDates;
  locale: Locale;
  labels: Labels;
}) {
  const [fav, setFav] = useState(initial.favorites);
  const [want, setWant] = useState(initial.watchlist);
  const [seen, setSeen] = useState(initial.watched);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // 最近一次被拿掉的那一筆：哪張表、原本的日期、要顯示哪句話。有值時顯示復原
  const [undo, setUndo] = useState<{ kind: Kind; at: string; message: string } | null>(null);
  const router = useRouter();
  const keysRef = useRef<HTMLDivElement>(null);
  // 收起時留著上一則內容淡出
  const shownUndo = useLinger(undo).shown;
  const showFailed = useLinger(failed ? true : null).shown;
  const fmt = useMemo(
    () => shelfDateFormatter(locale, todayInTaipei().slice(0, 4)),
    [locale],
  );

  /**
   * 先翻按鈕、再送請求，失敗就翻回來。
   *
   * 重點是「失敗必須看得見」：資料庫寫不進去時按鈕若照樣亮著，
   * 重新整理才會發現片庫是空的。畫面說謊比畫面出錯更難查。
   */
  async function toggle(
    kind: Kind,
    current: string | null,
    setDate: (v: string | null) => void,
  ) {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    setUndo(null);

    const active = current !== null;
    // 標記看過時，想看也會被伺服器拿掉，一起先翻
    const marksWatched = kind === "watched" && !active;
    const wantBefore = want;
    setDate(active ? null : new Date().toISOString());
    if (marksWatched) setWant(null);

    try {
      const res = active
        ? await fetch(`/api/${kind}?tmdb_id=${movie.tmdb_id}`, { method: "DELETE" })
        : await fetch(`/api/${kind}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(movie),
          });
      if (!res.ok) throw new Error(`${kind} responded ${res.status}`);

      if (marksWatched) {
        const data = (await res.json().catch(() => null)) as {
          removedFromWatchlist?: { added_at?: unknown } | null;
        } | null;
        const at = data?.removedFromWatchlist?.added_at;
        if (typeof at === "string") {
          setUndo({ kind: "watchlist", at, message: labels.removedFromWatchlist });
        }
      } else if (active && current) {
        setUndo({ kind, at: current, message: labels.undone[kind] });
      }
      // 導覽列的想看／看過片數在 layout 裡算，client 換頁不會重跑 layout。
      // refresh 只重畫 Server Component，這裡的按鈕狀態不受影響。
      if (kind !== "favorites") router.refresh();
    } catch {
      setDate(current);
      if (marksWatched) setWant(wantBefore);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  // 復原：帶原本的日期放回去，這部片回到清單裡原來的位置，
  // 而不是被當成剛加入排到最後。看過那張表走 watched_at，另外兩張走 added_at
  async function restore() {
    if (busy || !undo) return;
    const { kind, at } = undo;
    setBusy(true);
    setFailed(false);
    try {
      const stamp = kind === "watched" ? { watched_at: at } : { added_at: at };
      const res = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...movie, ...stamp }),
      });
      if (!res.ok) throw new Error(`${kind} responded ${res.status}`);
      ({ watchlist: setWant, watched: setSeen, favorites: setFav })[kind](at);
      setUndo(null);
      // 復原鍵接著就不畫了；焦點交給剛被放回去的那顆鍵，報讀器會唸出它已按下
      keysRef.current
        ?.querySelector<HTMLElement>(`[data-kind="${kind}"]`)
        ?.focus();
      if (kind !== "favorites") router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const buttons: {
    kind: Kind;
    label: string;
    date: string | null;
    set: (v: string | null) => void;
  }[] = [
    { kind: "watchlist", label: labels.watchlist, date: want, set: setWant },
    { kind: "watched", label: labels.watched, date: seen, set: setSeen },
    { kind: "favorites", label: labels.favorite, date: fav, set: setFav },
  ];

  return (
    <div>
      <p id="ledger-state-label" className="t-label">
        {labels.group}
      </p>
      <div
        ref={keysRef}
        role="group"
        aria-labelledby="ledger-state-label"
        className="ledger-keys mt-2.5"
      >
        {buttons.map((b) => (
          <button
            key={b.kind}
            type="button"
            aria-disabled={busy || undefined}
            aria-pressed={b.date !== null}
            data-kind={b.kind}
            data-on={b.date !== null}
            onClick={() => toggle(b.kind, b.date, b.set)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* 日期跟著鍵對齊，一欄一格。這一行一直佔一行高：第一次按下時日期才出現，
          若到那時才插進一行，底下整塊會被往下推一格。新日期淡入 */}
      <p className="mt-2 grid min-h-[1lh] grid-cols-3 text-center text-[0.6875rem] text-paper-faint tabular-nums">
        {buttons.map((b) => {
          const date = b.date ? fmt(b.date) : null;
          return (
            <span key={b.kind}>
              {date && (
                <span key={date} className="fade-in inline-block">
                  {labels.since[b.kind].replace("{date}", date)}
                </span>
              )}
            </span>
          );
        })}
      </p>

      {/* live region 一直掛著，內容才會被報讀；條件式整塊掛上去，螢幕閱讀器常常不唸。
          不設計時器自動收掉：這是資料被改了的通知，不該趁人沒看到就消失 */}
      <div role="status" aria-live="polite">
        <Reveal open={undo !== null}>
          {shownUndo && (
          <p className="mt-3 flex items-baseline justify-between gap-4 text-[0.8125rem] text-paper-dim">
            <span>{shownUndo.message}</span>
            <button
              type="button"
              onClick={restore}
              aria-disabled={busy || undefined}
              className="tap-safe link-hair shrink-0 text-paper aria-disabled:opacity-50"
            >
              {labels.undo}
            </button>
          </p>
          )}
        </Reveal>
      </div>

      {/* 失敗提示：一條簾幕紅左線加一行字，不畫方框 */}
      <Reveal open={failed}>
        {showFailed && (
          <p role="alert" className="mt-3 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim">
            {labels.saveError}
          </p>
        )}
      </Reveal>
    </div>
  );
}
