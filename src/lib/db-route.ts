import { NextResponse } from "next/server";
import type { SavedMovie } from "./db.types";

/**
 * 資料層錯誤 → JSON 回應（供 route handler 用）。
 *
 * 這一支之所以後來才補：
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
 * tmdb_id 欄位在四張表都是 Postgres `INTEGER`（int4），上限就是這個數。
 *
 * 這個界限不是裝飾。`Number.isInteger(1e21)` 是 true，所以超過 int4 的值
 * 過得了「是不是整數」那一關，然後在 insert 才被 Postgres 打回來，
 * 經由 dbErrorResponse 變成 503「資料庫不可用」——送錯東西的請求被回報成
 * 伺服器掛了。擋在這裡，它才會是它本來該有的 400。
 */
const PG_INT4_MAX = 2_147_483_647;

/**
 * 把外界傳進來的任意值轉成合法的 tmdb_id，不合法回 null。
 *
 * 只收 number 與 string 兩種型別是刻意的：`Number()` 對 `true` 給 1、
 * 對 `[550]` 給 550，兩者都會變成一個看起來很正常、實際上沒有人送出過的 ID。
 */
function toTmdbId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0 || id > PG_INT4_MAX) return null;
  return id;
}

/**
 * 從請求 body 取出一部片。id 不合法就回 null，由呼叫端轉成 400。
 *
 * 片庫四張表的欄位一模一樣，這段解析原本在四個 route 各抄一次。
 *
 * title 與 poster_path 都做型別檢查而不是 String() 硬轉：硬轉會把物件
 * 變成 `[object Object]` 存進資料庫，而 poster_path 之後要接進 `<img src>`，
 * 存一個不是字串的東西進去，壞掉的地方離這裡很遠、也很難查。
 */
export function movieFromBody(body: unknown): SavedMovie | null {
  const raw = body as Record<string, unknown> | null;
  const tmdbId = toTmdbId(raw?.tmdb_id);
  if (tmdbId === null) return null;

  const voteAverage = Number(raw?.vote_average);

  return {
    tmdb_id: tmdbId,
    title: typeof raw?.title === "string" ? raw.title : "",
    poster_path: typeof raw?.poster_path === "string" ? raw.poster_path : null,
    vote_average: Number.isFinite(voteAverage) ? voteAverage : 0,
  };
}

/** 從查詢字串取出 tmdb_id；不合法回 null */
export function tmdbIdFromQuery(url: string): number | null {
  return toTmdbId(new URL(url).searchParams.get("tmdb_id"));
}
