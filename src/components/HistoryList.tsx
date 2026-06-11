"use client";

import { useState } from "react";
import Link from "next/link";
import type { HistoryEntry } from "@/lib/db";

// 搜尋紀錄：點關鍵字重新搜尋；可一鍵清除全部。
export default function HistoryList({
  items,
  clearLabel,
  emptyText,
}: {
  items: HistoryEntry[];
  clearLabel: string;
  emptyText: string;
}) {
  const [list, setList] = useState(items);
  const [busy, setBusy] = useState(false);

  async function clearAll() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/history", { method: "DELETE" });
      setList([]);
    } finally {
      setBusy(false);
    }
  }

  if (list.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={clearAll}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-red-950"
        >
          {clearLabel}
        </button>
      </div>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {list.map((entry) => (
          <li key={entry.query}>
            <Link
              href={`/search?q=${encodeURIComponent(entry.query)}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {entry.query}
              </span>
              <span className="shrink-0 text-xs text-zinc-400">
                {new Date(entry.searched_at).toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
