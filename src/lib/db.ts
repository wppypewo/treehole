import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { SavedMovie, Rating } from "./db.types";

// Postgres（Neon）資料層：存放收藏 / 想看 / 已看過 / 評分。
// 僅在伺服器端使用（route handler 與 server component），切勿匯入 client component。
//
// 為什麼是 Neon 的 HTTP driver 而不是 pg：這個站跑在 Vercel 的 serverless 上，
// 每個請求可能落在不同的執行個體，維持不了連線池。HTTP driver 一次查詢一次請求，
// 沒有連線要管。代價是無法跨查詢開 transaction——本站沒有這種需求。
//
// 授權不在這一層。唯一的檢查點是 src/proxy.ts，它用 src/lib/owner-session.ts
// 的 HMAC cookie 擋在所有頁面與 route handler 之前，沒解鎖的請求到不了這裡。
// 這是單人站的設計前提：那個檢查一旦被繞過，這裡的每個寫入都會對外全開。

// 保持對外相容：讓現有 import type { SavedMovie } from "@/lib/db" 繼續有效
export type { SavedMovie, Rating } from "./db.types";

// 明寫泛型參數：ReturnType<typeof neon> 會把 ArrayMode / FullResults 放寬成
// boolean，查詢結果型別就變成三個分支的聯集，沒辦法當成物件陣列用。
type Sql = NeonQueryFunction<false, false>;

let cachedSql: Sql | null = null;

/**
 * 連線字串在「執行期」才讀，不在模組載入時。
 * 這樣 next build 不需要 DATABASE_URL——建置期不會連任何資料庫。
 */
function client(): Sql {
  if (cachedSql) return cachedSql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL 未設定。本機請寫進 .env，Vercel 由 Neon 整合自動注入。",
    );
  }
  cachedSql = neon(url);
  return cachedSql;
}

/**
 * 建表。四條 DDL 併成一次 transaction，也就是一次 HTTP round trip。
 *
 * tmdb_id 直接當主鍵——原本 SQLite 版有一個 AUTOINCREMENT 流水號 id，
 * 但 tmdb_id 本來就是 UNIQUE NOT NULL，那個欄位從來沒有被用到。
 *
 * 型別用 INTEGER 而非 BIGINT：node-postgres 系的 driver 會把 int8 回傳成
 * 字串（避免超出 JS 安全整數），那會讓 tmdb_id 的型別對不上。TMDB 的 id
 * 是七位數，int4 綽綽有餘。
 */
async function createSchema(sql: Sql): Promise<void> {
  await sql.transaction([
    sql`
      CREATE TABLE IF NOT EXISTS favorites (
        tmdb_id      INTEGER PRIMARY KEY,
        title        TEXT NOT NULL,
        poster_path  TEXT,
        vote_average REAL NOT NULL DEFAULT 0,
        added_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS watchlist (
        tmdb_id      INTEGER PRIMARY KEY,
        title        TEXT NOT NULL,
        poster_path  TEXT,
        vote_average REAL NOT NULL DEFAULT 0,
        added_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS watched (
        tmdb_id      INTEGER PRIMARY KEY,
        title        TEXT NOT NULL,
        poster_path  TEXT,
        vote_average REAL NOT NULL DEFAULT 0,
        watched_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS ratings (
        tmdb_id      INTEGER PRIMARY KEY,
        title        TEXT NOT NULL,
        poster_path  TEXT,
        vote_average REAL NOT NULL DEFAULT 0,
        score        INTEGER NOT NULL,
        note         TEXT NOT NULL DEFAULT '',
        rated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `,
  ]);
}

let schemaReady: Promise<void> | null = null;

/**
 * 取得可用的查詢函式，並保證建表只跑過一次。
 *
 * 快取的是 promise 不是布林值，所以同一個執行個體上並發的第一批請求
 * 會共用同一次建表，不會各跑一遍。
 *
 * 失敗時把快取清掉。若把被 reject 的 promise 留著，這個執行個體
 * 之後每個請求都會拿到同一個舊錯誤，連重試的機會都沒有。
 */
async function db(): Promise<Sql> {
  const sql = client();
  if (!schemaReady) {
    schemaReady = createSchema(sql).catch((err: unknown) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
  return sql;
}

/** neon 回傳的是 Record<string, unknown>[]，這裡集中做一次轉型 */
function asMovies(rows: Record<string, unknown>[]): SavedMovie[] {
  return rows as unknown as SavedMovie[];
}

// 收藏 --------------------------------------------------------------

export async function listFavorites(): Promise<SavedMovie[]> {
  const sql = await db();
  return asMovies(
    await sql`
      SELECT tmdb_id, title, poster_path, vote_average
      FROM favorites ORDER BY added_at DESC
    `,
  );
}

export async function isFavorite(tmdbId: number): Promise<boolean> {
  const sql = await db();
  const rows = await sql`SELECT 1 FROM favorites WHERE tmdb_id = ${tmdbId}`;
  return rows.length > 0;
}

export async function addFavorite(movie: SavedMovie): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO favorites (tmdb_id, title, poster_path, vote_average)
    VALUES (${movie.tmdb_id}, ${movie.title}, ${movie.poster_path}, ${movie.vote_average})
    ON CONFLICT (tmdb_id) DO NOTHING
  `;
}

export async function removeFavorite(tmdbId: number): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM favorites WHERE tmdb_id = ${tmdbId}`;
}

// 已看過 ------------------------------------------------------------

export async function listWatched(): Promise<SavedMovie[]> {
  const sql = await db();
  return asMovies(
    await sql`
      SELECT tmdb_id, title, poster_path, vote_average
      FROM watched ORDER BY watched_at DESC
    `,
  );
}

export async function isWatched(tmdbId: number): Promise<boolean> {
  const sql = await db();
  const rows = await sql`SELECT 1 FROM watched WHERE tmdb_id = ${tmdbId}`;
  return rows.length > 0;
}

export async function addWatched(movie: SavedMovie): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO watched (tmdb_id, title, poster_path, vote_average)
    VALUES (${movie.tmdb_id}, ${movie.title}, ${movie.poster_path}, ${movie.vote_average})
    ON CONFLICT (tmdb_id) DO NOTHING
  `;
}

export async function removeWatched(tmdbId: number): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM watched WHERE tmdb_id = ${tmdbId}`;
}

// 想看（待看清單） --------------------------------------------------

export async function listWatchlist(): Promise<SavedMovie[]> {
  const sql = await db();
  return asMovies(
    await sql`
      SELECT tmdb_id, title, poster_path, vote_average
      FROM watchlist ORDER BY added_at DESC
    `,
  );
}

export async function isInWatchlist(tmdbId: number): Promise<boolean> {
  const sql = await db();
  const rows = await sql`SELECT 1 FROM watchlist WHERE tmdb_id = ${tmdbId}`;
  return rows.length > 0;
}

export async function addWatchlist(movie: SavedMovie): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO watchlist (tmdb_id, title, poster_path, vote_average)
    VALUES (${movie.tmdb_id}, ${movie.title}, ${movie.poster_path}, ${movie.vote_average})
    ON CONFLICT (tmdb_id) DO NOTHING
  `;
}

export async function removeWatchlist(tmdbId: number): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM watchlist WHERE tmdb_id = ${tmdbId}`;
}

// 個人評分與短評 ----------------------------------------------------

export async function getRating(tmdbId: number): Promise<Rating | null> {
  const sql = await db();
  const rows = await sql`
    SELECT score, note FROM ratings WHERE tmdb_id = ${tmdbId}
  `;
  return (rows[0] as unknown as Rating | undefined) ?? null;
}

/** 新增或更新評分（同一部片一筆，依 tmdb_id 覆寫） */
export async function upsertRating(
  movie: SavedMovie,
  score: number,
  note: string,
): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO ratings (tmdb_id, title, poster_path, vote_average, score, note)
    VALUES (${movie.tmdb_id}, ${movie.title}, ${movie.poster_path}, ${movie.vote_average}, ${score}, ${note})
    ON CONFLICT (tmdb_id) DO UPDATE SET
      score    = EXCLUDED.score,
      note     = EXCLUDED.note,
      rated_at = now()
  `;
}

export async function removeRating(tmdbId: number): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM ratings WHERE tmdb_id = ${tmdbId}`;
}
