"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { HistoryEntry } from "@/lib/db";

interface RelTimeLabels {
  justNow: string;
  earlierToday: string;
  yesterday: string;
  daysAgo: string; // "{n} 天前" or "{n} days ago"
}

function toRelativeTime(
  isoString: string,
  now: number,
  labels: RelTimeLabels,
): string {
  const then = new Date(isoString).getTime();
  const d = new Date(now);
  const todayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;

  if (then >= todayStart) {
    if (now - then < 60_000) return labels.justNow;
    return labels.earlierToday;
  }
  if (then >= yesterdayStart) return labels.yesterday;

  const diffDays = Math.floor((now - then) / 86_400_000);
  return labels.daysAgo.replace("{n}", String(diffDays));
}

// 搜尋紀錄：chip flow，點關鍵字重新搜尋；可一鍵清除全部。
export default function HistoryList({
  items,
  clearLabel,
  emptyText,
  relTimeLabels,
}: {
  items: HistoryEntry[];
  clearLabel: string;
  emptyText: string;
  relTimeLabels: RelTimeLabels;
}) {
  const [list, setList] = useState(items);
  const [busy, setBusy] = useState(false);
  // 相對時間在 client mount 後才計算，避免 SSR/client hydration mismatch
  const [relTimes, setRelTimes] = useState<string[]>([]);

  useEffect(() => {
    const now = Date.now();
    setRelTimes(list.map((e) => toRelativeTime(e.searched_at, now, relTimeLabels)));
  }, [list, relTimeLabels]);

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
      <p className="py-16 text-center text-sm text-zinc-500">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={clearAll}
          className="text-xs text-zinc-600 transition-colors hover:text-zinc-400 disabled:opacity-50"
        >
          {clearLabel}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {list.map((entry, i) => (
          <li
            key={entry.query}
            className="animate-rise"
            style={{ animationDelay: `${i * 25}ms` }}
          >
            <Link
              href={`/search?q=${encodeURIComponent(entry.query)}`}
              className="flex min-h-[40px] items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.08] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <span className="max-w-[200px] truncate font-medium text-zinc-100 sm:max-w-xs">
                {entry.query}
              </span>
              {relTimes[i] && (
                <span className="shrink-0 text-xs text-zinc-600">
                  {relTimes[i]}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
