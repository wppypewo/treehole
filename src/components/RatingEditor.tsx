"use client";

import { useRef, useState } from "react";
import type { SavedMovie } from "@/lib/db";

interface Labels {
  title: string;
  scorePrompt: string;
  note: string;
  notePlaceholder: string;
  save: string;
  saved: string;
  clear: string;
  saveError: string;
  removeError: string;
}

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

// 個人評分（1–10）與短評，寫入雲端片庫。
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  async function save() {
    if (!score || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...movie, score, note }),
      });
      // 不看狀態碼就顯示「已儲存」，等於在資料庫寫失敗時對使用者說謊。
      // 短評打了三行卻沒存進去，是這一頁最傷的失敗方式。
      if (!res.ok) throw new Error(`ratings responded ${res.status}`);
      setSaved(true);
    } catch {
      setError(labels.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function clearRating() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ratings?tmdb_id=${movie.tmdb_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`ratings responded ${res.status}`);
      setScore(null);
      setNote("");
      setSaved(false);
    } catch {
      setError(labels.removeError);
    } finally {
      setSaving(false);
    }
  }

  function pick(n: number) {
    setScore(n);
    setSaved(false);
    setError(null);
  }

  /**
   * radiogroup 的鍵盤約定：整組只吃一次 Tab，方向鍵在選項之間移動並直接選取。
   *
   * 十格刻度視覺上是溫度計，語意上是「十選一」。原本十顆各自掛 aria-pressed
   * 的按鈕會被讀成十個獨立開關，而且鍵盤要按十次 Tab 才走得完。
   */
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = score ?? 1;
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = current === 10 ? 1 : current + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = current === 1 ? 10 : current - 1;
    } else if (event.key === "Home") {
      next = 1;
    } else if (event.key === "End") {
      next = 10;
    }
    if (next === null) return;
    event.preventDefault();
    pick(next);
    // 焦點要跟著走，否則螢幕報讀者聽不到選取變化
    scaleRef.current
      ?.querySelector<HTMLButtonElement>(`[data-score="${next}"]`)
      ?.focus();
  }

  return (
    <section className="max-w-2xl border-t border-hairline pt-8">
      <h2 className="t-section text-paper">{labels.title}</h2>

      <div className="mt-6">
        <p id="rating-scale-label" className="text-xs text-paper-faint">
          {labels.scorePrompt}
        </p>
        {/* 十格刻度：選到的分數以下全部填實，像溫度計而不是十顆獨立按鈕。
            填色用簾幕紅，與片庫動作同一個「這是你留下的」語意。 */}
        <div
          ref={scaleRef}
          role="radiogroup"
          aria-labelledby="rating-scale-label"
          onKeyDown={onKeyDown}
          className="mt-3 flex flex-wrap gap-px"
        >
          {SCORES.map((n) => {
            const on = score !== null && n <= score;
            const selected = score === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                data-score={n}
                // 整組只留一個可 Tab 到的落點：已選的那格，或還沒選時的第一格
                tabIndex={selected || (score === null && n === 1) ? 0 : -1}
                onClick={() => pick(n)}
                className={`h-11 w-11 border text-sm transition-colors ${
                  on
                    ? "border-curtain bg-curtain text-paper"
                    : "border-hairline-strong text-paper-faint hover:border-paper-dim hover:text-paper"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7">
        <label htmlFor="rating-note" className="block text-xs text-paper-faint">
          {labels.note}
        </label>
        <textarea
          id="rating-note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder={labels.notePlaceholder}
          rows={3}
          className="mt-2 w-full border border-hairline bg-ink-raised px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-paper-dim"
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!score || saving}
          className="btn-line"
        >
          {saved ? labels.saved : labels.save}
        </button>
        {score !== null && (
          <button
            type="button"
            onClick={clearRating}
            disabled={saving}
            className="tap-safe text-[0.8125rem] tracking-[0.04em] text-paper-faint transition-colors hover:text-paper disabled:opacity-50"
          >
            {labels.clear}
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {error}
        </p>
      )}
    </section>
  );
}
