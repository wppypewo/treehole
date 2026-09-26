"use client";

import { useState } from "react";
import type { SavedMovie } from "@/lib/db";
import RatingRuler from "./RatingRuler";

interface Labels {
  scorePrompt: string;
  note: string;
  notePlaceholder: string;
  save: string;
  saved: string;
  clear: string;
  saveError: string;
  removeError: string;
}

// 個人評分（1–10）與短評，寫入雲端片庫。
//
// 放在詳情頁「我的紀錄」欄裡，排在片庫三顆鍵之下，所以自己不帶標題與外框。
// 欄名用 .t-label，跟上面那組「片庫」同一級。
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

  return (
    <div>
      <div className="mt-[1.375rem]">
        <p id="rating-scale-label" className="t-label">
          {labels.scorePrompt}
        </p>
        <div className="mt-2.5">
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
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder={labels.notePlaceholder}
          rows={3}
          className="mt-2.5 min-h-[5.75rem] w-full resize-y border border-hairline bg-ink-raised px-3.5 py-3 text-sm leading-relaxed text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-paper-dim"
        />
      </div>

      {/* 儲存放右邊、清除放左邊：兩個動作方向相反，拉開距離免得誤按 */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {score !== null ? (
          <button
            type="button"
            onClick={clearRating}
            disabled={saving}
            className="tap-safe text-[0.8125rem] tracking-[0.04em] text-paper-faint transition-colors hover:text-paper disabled:opacity-50"
          >
            {labels.clear}
          </button>
        ) : (
          <span aria-hidden />
        )}
        <button
          type="button"
          onClick={save}
          disabled={!score || saving}
          className="btn-line"
        >
          {saved ? labels.saved : labels.save}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {error}
        </p>
      )}
    </div>
  );
}
