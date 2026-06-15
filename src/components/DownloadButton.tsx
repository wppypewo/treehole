"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Dictionary } from "@/i18n/dictionaries";

interface TorrentResult {
  guid: string;
  title: string;
  indexer: string;
  size: number;
  seeders: number;
  leechers: number;
  resolution: string;
}

type Texts = Dictionary["download"];

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

function resRank(res: string): number {
  return { "2160p": 4, "1080p": 3, "720p": 2, "480p": 1 }[res] ?? 0;
}

// 下載按鈕 + 種子選擇對話框：查 Prowlarr → 選一筆 → 加入 qBittorrent。
export default function DownloadButton({
  query,
  buttonLabel,
  t,
}: {
  query: string;
  buttonLabel: string;
  t: Texts;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TorrentResult[]>([]);
  const [sortBy, setSortBy] = useState<"seeders" | "resolution" | "size">(
    "seeders",
  );
  const [addingGuid, setAddingGuid] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [addError, setAddError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<string | null>(null);

  function errText(kind: string): string {
    switch (kind) {
      case "missing-config":
        return t.errMissingConfig;
      case "unreachable":
        return t.errUnreachable;
      case "auth":
        return t.errMissingConfig;
      case "demo-mode":
        return t.errDemoMode;
      case "cache-miss":
        return t.errCacheMiss;
      case "qb-unreachable":
        return t.errQbUnreachable;
      case "qb-auth":
        return t.errQbAuth;
      default:
        return t.errGeneric;
    }
  }

  async function openDialog() {
    setOpen(true);
    setLoading(true);
    setError(null);
    setErrorKind(null);
    setAddError(null);
    // 逾時保護：種子站台一時很慢時，30 秒未回應就中止，避免畫面無限期卡住
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(
        `/api/torrents/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const kind = data.error ?? "http";
        setError(errText(kind));
        setErrorKind(kind);
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch (e) {
      // 逾時（abort）與一般錯誤分開提示
      setError(
        e instanceof DOMException && e.name === "AbortError"
          ? t.errTimeout
          : t.errGeneric,
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  async function addOne(guid: string) {
    setAddingGuid(guid);
    setAddError(null);
    try {
      const res = await fetch("/api/torrents/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(errText(data.error ?? "generic"));
      } else {
        setAdded((prev) => new Set(prev).add(guid));
      }
    } catch {
      setAddError(t.errGeneric);
    } finally {
      setAddingGuid(null);
    }
  }

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "size") return b.size - a.size;
    if (sortBy === "resolution")
      return (
        resRank(b.resolution) - resRank(a.resolution) || b.seeders - a.seeders
      );
    return b.seeders - a.seeders;
  });

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
      >
        ⬇ {buttonLabel}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl bg-zinc-900 sm:rounded-xl sm:border sm:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 標題列 */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <h2 className="eyebrow">{t.title}</h2>
                <div className="flex items-center gap-3">
                  {results.length > 0 && (
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as "seeders" | "resolution" | "size",
                        )
                      }
                      aria-label={t.sort}
                      className="select-dark !py-1 !text-xs"
                    >
                      <option value="seeders">{t.sortSeeders}</option>
                      <option value="resolution">{t.sortResolution}</option>
                      <option value="size">{t.sortSize}</option>
                    </select>
                  )}
                  {/* X 關閉鈕 */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t.close}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100"
                  >
                    <svg
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <line x1="1" y1="1" x2="13" y2="13" />
                      <line x1="13" y1="1" x2="1" y2="13" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 內容區 */}
              <div className="overflow-y-auto">
                {/* 加入佇列失敗的行內提示 */}
                {addError && (
                  <div className="mx-4 mt-3 rounded-md border border-red-900/50 bg-red-950/60 px-3 py-2">
                    <p className="text-sm text-red-300">{addError}</p>
                  </div>
                )}

                {/* 搜尋中 */}
                {loading && (
                  <p className="animate-pulse py-16 text-center text-sm text-zinc-500">
                    {t.searching}
                  </p>
                )}

                {/* 搜尋失敗 */}
                {!loading && error && (
                  <div className="space-y-4 px-4 py-16 text-center">
                    <p className="text-sm text-zinc-300">{error}</p>
                    {errorKind !== "demo-mode" && (
                      <button
                        type="button"
                        onClick={openDialog}
                        className="rounded-md border border-white/15 px-4 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                      >
                        {t.retry}
                      </button>
                    )}
                  </div>
                )}

                {/* 無結果 */}
                {!loading && !error && sorted.length === 0 && (
                  <p className="py-16 text-center text-sm text-zinc-500">
                    {t.noResults}
                  </p>
                )}

                {/* 結果清單 */}
                {!loading && !error && sorted.length > 0 && (
                  <ul className="divide-y divide-white/[0.06]">
                    {sorted.map((r) => {
                      const isAdded = added.has(r.guid);
                      const isAdding = addingGuid === r.guid;
                      return (
                        <li
                          key={r.guid}
                          className="flex items-center gap-4 px-5 py-3.5"
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <p className="truncate text-sm text-zinc-100">
                              {r.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                              {/* 畫質 pill */}
                              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-medium text-zinc-300">
                                {r.resolution || "—"}
                              </span>
                              <span>{formatSize(r.size)}</span>
                              {/* 種子數：充足時以語義綠色標示 */}
                              <span
                                className={
                                  r.seeders >= 5 ? "text-emerald-400/80" : ""
                                }
                              >
                                {r.seeders} {t.colSeeders}
                              </span>
                              <span>{r.indexer}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isAdding || isAdded}
                            onClick={() => addOne(r.guid)}
                            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                              isAdded
                                ? "cursor-default border border-white/10 text-zinc-500"
                                : "border border-white/40 text-zinc-100 hover:border-white/70 hover:text-white"
                            }`}
                          >
                            {isAdded ? t.added : isAdding ? t.adding : t.add}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
