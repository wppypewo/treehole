import { NextResponse } from "next/server";
import type { SavedMovie } from "./db.types";

/**
 * 資料層錯誤 → JSON 回應（供 route handler 用）。
 *
 * 對照 `tmdb-route.ts` 的 `tmdbErrorResponse`。這一支之所以後來才補：
 * 片庫的四個 route handler 原本完全沒有 try/catch，Neon 一斷線就讓
 * handler 直接 throw，Next 回一個帶 digest 的 500 HTML-ish 回應。
 * 前端拿到的東西解析不了，也分不出「我送錯了」和「資料庫掛了」。
 *
 * 用 503 而不是 500：這是「暫時性的上游不可用」，重試有意義。
 * 錯誤本身寫進伺服器日誌——吞掉不留痕跡的話，線上就查不出原因。
 */
export function dbErrorResponse(error: unknown): NextResponse {
  console.error("[db] route handler failed:", error);
  return NextResponse.json(
    { error: "db-unavailable", message: "Database is unavailable" },
    { status: 503 },
  );
}

/**
 * 從請求 body 取出一部片。id 不是正整數就回 null，由呼叫端轉成 400。
 *
 * 片庫四張表的欄位一模一樣，這段解析原本在四個 route 各抄一次。
 */
export function movieFromBody(body: unknown): SavedMovie | null {
  const raw = body as Record<string, unknown> | null;
  const tmdbId = Number(raw?.tmdb_id);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) return null;
  return {
    tmdb_id: tmdbId,
    title: String(raw?.title ?? ""),
    poster_path: (raw?.poster_path as string | null) ?? null,
    vote_average: Number(raw?.vote_average) || 0,
  };
}

/** 從查詢字串取出 tmdb_id；非正整數回 null */
export function tmdbIdFromQuery(url: string): number | null {
  const value = Number(new URL(url).searchParams.get("tmdb_id"));
  return Number.isInteger(value) && value > 0 ? value : null;
}
