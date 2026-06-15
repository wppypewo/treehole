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

// 個人評分（1–10）與短評，寫入本機 SQLite。
export default function RatingEditor({
  movie,
  initialScore,
  initialNote,
  labels,
  isDemo = false,
  demoNote,
}: {
  movie: SavedMovie;
  initialScore: number | null;
  initialNote: string;
  labels: Labels;
  isDemo?: boolean;
  demoNote?: string;
}) {
  const [score, setScore] = useState<number | null>(initialScore);
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    // demo 模式不寫入，避免顯示無法保存的「已儲存」假回饋
    if (isDemo || !score || saving) return;
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
    if (isDemo || saving) return;
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
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{labels.title}</h2>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500">{labels.scorePrompt}</p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              disabled={isDemo}
              aria-pressed={score === n}
              onClick={() => {
                setScore(n);
                setSaved(false);
              }}
              className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60 ${
                score !== null && n <= score
                  ? "border-amber-400 bg-amber-400/20 text-amber-300"
                  : "border-white/15 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500">{labels.note}</label>
        <textarea
          value={note}
          disabled={isDemo}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder={labels.notePlaceholder}
          rows={3}
          className="w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/40 disabled:opacity-60"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isDemo || !score || saving}
          className="rounded-lg border border-white/50 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:border-white/70 hover:bg-white/10 disabled:opacity-50"
        >
          {saved ? labels.saved : labels.save}
        </button>
        {!isDemo && score !== null && (
          <button
            type="button"
            onClick={clearRating}
            disabled={saving}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {labels.clear}
          </button>
        )}
      </div>

      {isDemo && demoNote && (
        <p className="text-xs text-zinc-500">{demoNote}</p>
      )}
    </section>
  );
}
