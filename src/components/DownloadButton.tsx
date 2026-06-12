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
        className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-base font-semibold">{t.title}</h2>
              <div className="flex items-center gap-2">
                {results.length > 0 && (
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as "seeders" | "resolution" | "size",
                      )
                    }
                    aria-label={t.sort}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="seeders">{t.sortSeeders}</option>
                    <option value="resolution">{t.sortResolution}</option>
                    <option value="size">{t.sortSize}</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {t.close}
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 py-3">
              {addError && (
                <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {addError}
                </p>
              )}

              {loading && (
                <p className="py-10 text-center text-sm text-zinc-500">
                  {t.searching}
                </p>
              )}

              {!loading && error && (
                <div className="space-y-3 py-10 text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                  {errorKind !== "demo-mode" && (
                    <button
                      type="button"
                      onClick={openDialog}
                      className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {t.retry}
                    </button>
                  )}
                </div>
              )}

              {!loading && !error && sorted.length === 0 && (
                <p className="py-10 text-center text-sm text-zinc-500">
                  {t.noResults}
                </p>
              )}

              {!loading && !error && sorted.length > 0 && (
                <ul className="space-y-2">
                  {sorted.map((r) => {
                    const isAdded = added.has(r.guid);
                    const isAdding = addingGuid === r.guid;
                    return (
                      <li
                        key={r.guid}
                        className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {r.title}
                          </p>
                          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                            <span>
                              {t.colResolution}: {r.resolution}
                            </span>
                            <span>
                              {t.colSize}: {formatSize(r.size)}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {t.colSeeders}: {r.seeders}
                            </span>
                            <span>
                              {t.colIndexer}: {r.indexer}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isAdding || isAdded}
                          onClick={() => addOne(r.guid)}
                          className="shrink-0 rounded-md border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
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
