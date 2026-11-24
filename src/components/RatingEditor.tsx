"use client";

import { useEffect, useRef, useState } from "react";
import type { SavedMovie } from "@/lib/db";
import { NOTE_MAX_LENGTH } from "@/lib/library";
import RatingRuler from "./RatingRuler";
import Reveal from "./Reveal";
import { useLinger } from "./useLinger";

interface Labels {
  scorePrompt: string;
  note: string;
  notePlaceholder: string;
  saving: string;
  saved: string;
  /** 有短評、還沒選分數時的提醒：分數是這筆紀錄的主鍵，沒分數存不進去 */
  needScore: string;
  clear: string;
  /** 清除之後的通知，旁邊配一個復原 */
  cleared: string;
  undo: string;
  retry: string;
  saveError: string;
  removeError: string;
}

type Status = "idle" | "saving" | "saved" | "error";

/** 短評停手多久才存。打中文要選字，太短會在選字中途就送出 */
const NOTE_SAVE_DELAY_MS = 1500;

// 個人評分（1–10）與短評，寫入雲端片庫。
//
// 放在詳情頁「我的紀錄」欄裡，排在片庫三顆鍵之下，所以自己不帶標題與外框。
// 欄名用 .t-label，跟上面那組「片庫」同一級。
//
// 自動儲存，沒有儲存鍵：點分數當下就存；短評停手 1.5 秒、離開輸入框、
// 或選字結束後存。以前要另外按「儲存」，打完短評直接換頁就整段不見。
// 換頁或關分頁時還沒送出的那一筆用 keepalive 補送。
//
// 存的狀態一定講出來（儲存中…／已儲存），失敗時給重試；畫面說存了就一定存了。
export default function RatingEditor({
  movie,
  initialScore,
  initialNote,
  labels,
}: {
  movie: SavedMovie;
  initialScore: number | null;
  initialNote: string;
  labels: Labels;
}) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 剛清掉的分數與短評；有值時顯示復原
  const [cleared, setCleared] = useState<{
    score: number;
    note: string;
  } | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // 以下都是 ref：存檔流程在計時器、pagehide、卸載時都會跑，不能依賴某一次 render 的值
  const latest = useRef({ score: initialScore, note: initialNote });
  const persisted = useRef({ score: initialScore, note: initialNote });
  const inFlight = useRef(false);
  const queued = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false);

  async function flush(keepalive = false) {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const { score, note } = latest.current;
    if (!score) return;
    if (score === persisted.current.score && note === persisted.current.note)
      return;
    // 同一時間只送一筆，後到的排在它後面；不然慢的那筆可能後到，蓋掉新的。
    // 例外是頁面要走了（keepalive）：排隊的那筆要等前一筆回來才送，分頁一關就沒機會了，
    // 所以直接帶 keepalive 把最新內容送出去。前一筆已經先上路，伺服器照順序收到的機會大
    if (inFlight.current && !keepalive) {
      queued.current = true;
      return;
    }
    inFlight.current = true;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...movie, score, note }),
        keepalive,
      });
      // 不看狀態碼就顯示「已儲存」，等於在資料庫寫失敗時對使用者說謊。
      if (!res.ok) throw new Error(`ratings responded ${res.status}`);
      persisted.current = { score, note };
      // 送出之後人可能又改了短評，那段新字還在等計時器。這時說「已儲存」是謊話
      const current = latest.current;
      setStatus(
        current.score === score && current.note === note ? "saved" : "idle",
      );
    } catch {
      setStatus("error");
    } finally {
      inFlight.current = false;
      if (queued.current) {
        queued.current = false;
        void flush();
      }
    }
  }

  // pagehide 與卸載只掛一次，透過 ref 拿最新一次 render 的 flush
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  // 換頁（元件卸載）或關分頁（pagehide）時，把還在等計時器的那一筆送出去
  useEffect(() => {
    const send = flushRef;
    const onHide = () => void send.current(true);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      void send.current(true);
    };
  }, []);

  function schedule() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), NOTE_SAVE_DELAY_MS);
  }

  function pick(n: number) {
    setScore(n);
    setCleared(null);
    latest.current = { ...latest.current, score: n };
    void flush();
  }

  function editNote(value: string) {
    setNote(value);
    latest.current = { ...latest.current, note: value };
    setStatus("idle");
    // 選字途中不排存檔，等 compositionend
    if (!composing.current) schedule();
  }

  async function clearRating() {
    if (busy || inFlight.current || !score) return;
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    setError(null);
    const before = { score, note };
    try {
      const res = await fetch(`/api/ratings?tmdb_id=${movie.tmdb_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`ratings responded ${res.status}`);
      setScore(null);
      setNote("");
      latest.current = { score: null, note: "" };
      persisted.current = { score: null, note: "" };
      setStatus("idle");
      setCleared(before);
      // 清除鍵在分數歸零後就不畫了，焦點會掉回 <body>。交給刻度的第一格，
      // 也就是清除後整組唯一可 Tab 到的那一格：要重新評分從這裡開始
      rulerRef.current?.querySelector<HTMLElement>('[data-score="1"]')?.focus();
    } catch {
      setError(labels.removeError);
    } finally {
      setBusy(false);
    }
  }

  // 復原：把清掉的分數與短評原樣放回去
  async function restore() {
    if (busy || !cleared) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...movie, ...cleared }),
      });
      if (!res.ok) throw new Error(`ratings responded ${res.status}`);
      setScore(cleared.score);
      setNote(cleared.note);
      latest.current = { ...cleared };
      persisted.current = { ...cleared };
      setCleared(null);
      setStatus("saved");
      rulerRef.current
        ?.querySelector<HTMLElement>(`[data-score="${cleared.score}"]`)
        ?.focus();
    } catch {
      setError(labels.saveError);
    } finally {
      setBusy(false);
    }
  }

  const waitingForScore = !score && note.trim() !== "";
  const statusText =
    status === "saving"
      ? labels.saving
      : status === "saved"
        ? labels.saved
        : "";

  // 撤銷列與錯誤提示收起時，留著上一則內容淡出
  const shownCleared = useLinger(cleared).shown;
  const errorText =
    status === "error" || error ? (error ?? labels.saveError) : null;
  const shownError = useLinger(errorText).shown;

  return (
    <div>
      <div className="mt-[1.375rem]">
        <p id="rating-scale-label" className="t-label">
          {labels.scorePrompt}
        </p>
        <div ref={rulerRef} className="mt-2.5">
          <RatingRuler
            value={score}
            onChange={pick}
            labelledBy="rating-scale-label"
          />
        </div>
      </div>

      <div className="mt-[1.375rem]">
        <label htmlFor="rating-note" className="t-label block">
          {labels.note}
        </label>
        <textarea
          id="rating-note"
          value={note}
          onChange={(e) => editNote(e.target.value)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
            schedule();
          }}
          onBlur={() => void flush()}
          placeholder={labels.notePlaceholder}
          maxLength={NOTE_MAX_LENGTH}
          rows={3}
          aria-describedby="rating-note-hint"
          className="mt-2.5 min-h-[5.75rem] w-full resize-y border border-hairline bg-ink-raised px-3.5 py-3 text-sm leading-relaxed text-paper outline-none transition-colors placeholder:text-paper-dim focus:border-paper-dim"
        />
        <p
          id="rating-note-hint"
          className="mt-1.5 min-h-[1.25rem] text-[0.75rem] text-paper-faint"
        >
          {waitingForScore ? labels.needScore : ""}
        </p>
      </div>

      {/* 清除放左邊、存檔狀態放右邊。狀態那一格一直掛著，報讀器才唸得到 */}
      <div className="mt-2 flex items-center justify-between gap-3">
        {score !== null ? (
          <button
            type="button"
            onClick={clearRating}
            aria-disabled={busy || status === "saving" || undefined}
            className="fade-in tap-safe text-[0.8125rem] tracking-[0.04em] text-paper-faint transition-colors hover:text-paper aria-disabled:opacity-50"
          >
            {labels.clear}
          </button>
        ) : (
          <span aria-hidden />
        )}
        <p
          role="status"
          aria-live="polite"
          className="text-[0.75rem] text-paper-faint"
        >
          {/* 「儲存中」換成「已儲存」：舊字直接換掉，新字淡入 */}
          {statusText && (
            <span key={statusText} className="fade-in inline-block">
              {statusText}
            </span>
          )}
        </p>
      </div>

      {/* 清除後的復原。跟片庫三顆鍵一樣不設計時器：資料被改了的通知，不該自己消失 */}
      <div role="status" aria-live="polite">
        <Reveal open={cleared !== null}>
        {shownCleared && (
          <p className="mt-3 flex items-baseline justify-between gap-4 text-[0.8125rem] text-paper-dim">
            <span>{labels.cleared}</span>
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

      <Reveal open={errorText !== null}>
      {shownError && (
        <p
          role="alert"
          className="mt-4 flex items-baseline justify-between gap-4 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          <span>{shownError}</span>
          {status === "error" && !error && (
            <button
              type="button"
              onClick={() => void flush()}
              className="tap-safe link-hair shrink-0 text-paper"
            >
              {labels.retry}
            </button>
          )}
        </p>
      )}
      </Reveal>
    </div>
  );
}
