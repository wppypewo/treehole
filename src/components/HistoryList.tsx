"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { HistoryEntry } from "@/lib/db";

/**
 * 「現在」的外部資料源。
 *
 * 相對時間需要 Date.now()，但那是不純的，不能在 render 中呼叫，也不能在
 * SSR 時算（會與 client 對不上）。這裡把時間包成一個外部 store：
 * 訂閱時取一次時間，之後每分鐘更新一次，所以「3 分鐘前」不會停在載入當下。
 * getSnapshot 只回傳快取值，是純函式。
 */
let nowSnapshot = 0;

function subscribeNow(onChange: () => void) {
  nowSnapshot = Date.now();
  const id = setInterval(() => {
    nowSnapshot = Date.now();
    onChange();
  }, 60_000);
  return () => clearInterval(id);
}

const getNow = () => nowSnapshot;
// server 端回 0，代表「還算不出來」，畫面先留白而不是印出錯的時間
const getServerNow = () => 0;

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
  const now = useSyncExternalStore(subscribeNow, getNow, getServerNow);
  const relTimes = now
    ? list.map((e) => toRelativeTime(e.searched_at, now, relTimeLabels))
    : [];

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
      <p className="border-t border-hairline py-16 text-sm text-paper-faint">
        {emptyText}
      </p>
    );
  }

  return (
    <div>
      {/* 紀錄改成 hairline 清單，不是一堆 pill。
          pill 適合「可多選的標籤」，但這裡每一列是一次獨立的搜尋，
          而且有時間戳——那是清單的形狀，不是標籤的形狀。 */}
      <div className="flex justify-end border-b border-hairline pb-3">
        <button
          type="button"
          disabled={busy}
          onClick={clearAll}
          className="tap-safe text-[0.6875rem] tracking-[0.06em] text-paper-faint transition-colors hover:text-curtain-ink disabled:opacity-50"
        >
          {clearLabel}
        </button>
      </div>
      <ul>
        {list.map((entry, i) => (
          <li key={entry.query} className="border-b border-hairline">
            <Link
              href={`/search?q=${encodeURIComponent(entry.query)}`}
              className="group/hist flex items-baseline justify-between gap-4 py-4"
            >
              <span className="truncate text-[0.9375rem] text-paper-dim transition-colors group-hover/hist:text-paper">
                {entry.query}
              </span>
              {relTimes[i] && (
                <span className="t-meta shrink-0 text-paper-faint">
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
