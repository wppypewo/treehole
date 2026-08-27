"use client";

import { useState } from "react";
import type { SavedMovie } from "@/lib/db";

interface Labels {
  title: string;
  scorePrompt: string;
  note: string;
  notePlaceholder: string;
  save: string;
  saved: string;
  clear: string;
}

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

  async function save() {
    if (!score || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...movie, score, note }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function clearRating() {
    if (saving) return;
    setSaving(true);
    try {
      await fetch(`/api/ratings?tmdb_id=${movie.tmdb_id}`, {
        method: "DELETE",
      });
      setScore(null);
      setNote("");
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-2xl border-t border-hairline pt-8">
      <h2 className="t-section text-paper">{labels.title}</h2>

      <div className="mt-6">
        <p className="text-xs text-paper-faint">{labels.scorePrompt}</p>
        {/* 十格刻度：選到的分數以下全部填實，像溫度計而不是十顆獨立按鈕。
            填色用簾幕紅，與片庫動作同一個「這是你留下的」語意。 */}
        <div className="mt-3 flex flex-wrap gap-px">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const on = score !== null && n <= score;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={score === n}
                onClick={() => {
                  setScore(n);
                  setSaved(false);
                }}
                className={`h-11 w-11 border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
        <label
          htmlFor="rating-note"
          className="block text-xs text-paper-faint"
        >
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
          className="mt-2 w-full border border-hairline bg-ink-raised px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-paper-dim disabled:cursor-not-allowed disabled:opacity-50"
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
    </section>
  );
}
