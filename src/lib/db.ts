import { neon } from "@neondatabase/serverless";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import type {
  SavedMovie,
  WatchlistEntry,
  WatchedEntry,
  FavoriteEntry,
  MovieRecord,
} from "./db.types";

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
export type {
  SavedMovie,
  Rating,
  WatchlistEntry,
  WatchedEntry,
  FavoriteEntry,
  MovieRecord,
} from "./db.types";

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

/** timestamptz 轉成 UTC 的 ISO 字串，理由見 listRecentWatched 的說明 */
const ISO_UTC = 'YYYY-MM-DD"T"HH24:MI:SS"Z"';

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

/**
 * 收藏牆用：全部收藏，最近收藏的在前，多帶收藏時間與自己給的分數。
 * ORDER BY 寫 f.added_at 的理由見 listWatchlistEntries。
 */
export async function listFavoriteEntries(): Promise<FavoriteEntry[]> {
  const sql = await db();
  return (await sql`
    SELECT f.tmdb_id, f.title, f.poster_path, f.vote_average,
           to_char(f.added_at AT TIME ZONE 'UTC', ${ISO_UTC}) AS added_at,
           r.score
    FROM favorites f
    LEFT JOIN ratings r ON r.tmdb_id = f.tmdb_id
    ORDER BY f.added_at DESC
  `) as unknown as FavoriteEntry[];
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

/** 最近一次查詢最多取幾列；首頁只用 4，上限留給之後的頁面 */
const RECENT_WATCHED_MAX = 50;

/**
 * 最近看過的幾部，連同自己給的評分與短評（沒評分的也列，score／note 為 null）。
 *
 * 時間用 to_char 在 SQL 端轉成 UTC 的 ISO 字串：timestamptz 預設輸出
 * 跟著連線的 TimeZone 走，driver 解析成 Date 或字串也可能因版本而異，
 * 在這裡定死格式，呼叫端只要處理一種型別。
 */
export async function listRecentWatched(limit: number): Promise<WatchedEntry[]> {
  // limit 只收 1..50 的整數，其餘夾到邊界，不把任意值送進 SQL
  const n = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), RECENT_WATCHED_MAX)
    : 1;
  const sql = await db();
  return (await sql`
    SELECT w.tmdb_id, w.title, w.poster_path, w.vote_average,
           to_char(w.watched_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS watched_at,
           r.score, r.note
    FROM watched w
    LEFT JOIN ratings r ON r.tmdb_id = w.tmdb_id
    ORDER BY w.watched_at DESC
    LIMIT ${n}
  `) as unknown as WatchedEntry[];
}

/**
 * 看過日誌用：全部看過的片，最近看的在前，連同評分與短評。不設上限——
 * 一個人一年看幾百部，一次 round trip 拿完比分頁省事；真的多到慢了再分頁。
 */
export async function listWatchedEntries(): Promise<WatchedEntry[]> {
  const sql = await db();
  return (await sql`
    SELECT w.tmdb_id, w.title, w.poster_path, w.vote_average,
           to_char(w.watched_at AT TIME ZONE 'UTC', ${ISO_UTC}) AS watched_at,
           r.score, r.note
    FROM watched w
    LEFT JOIN ratings r ON r.tmdb_id = w.tmdb_id
    ORDER BY w.watched_at DESC
  `) as unknown as WatchedEntry[];
}

/**
 * 標記看過，並把同一部片從想看清單拿掉（2026-09-26 使用者核可的行為）。
 *
 * 兩件事寫在同一條 SQL 裡：Postgres 的 data-modifying CTE 在單一陳述式內執行，
 * 要嘛兩邊都成立，要嘛都不成立，不會留下「看過了但還在想看」的半套狀態。
 * Neon 的 HTTP driver 一次請求一條陳述式，這樣也只花一次 round trip。
 *
 * 回傳被拿掉那一列原本的加入時間，前端「復原」時原樣送回去，
 * 那部片才會回到清單裡原本的位置（清單照加入先後排）。沒在想看裡就是 null。
 *
 * watchedAdded 說這次是不是真的新增了一列看過。本來就看過的片再按一次，
 * ON CONFLICT 什麼都不做，復原時就不該去刪那一列——那是更早以前留下的紀錄。
 *
 * 兩個 CTE 各自回傳，用純量子查詢併成一列：removed 為空時（本來不在想看）
 * 若直接 SELECT FROM removed，會連 watchedAdded 都拿不到。
 */
export async function markWatched(
  movie: SavedMovie,
): Promise<{ removedFromWatchlistAt: string | null; watchedAdded: boolean }> {
  const sql = await db();
  const rows = await sql`
    WITH removed AS (
      DELETE FROM watchlist WHERE tmdb_id = ${movie.tmdb_id}
      RETURNING added_at
    ), inserted AS (
      INSERT INTO watched (tmdb_id, title, poster_path, vote_average)
      VALUES (${movie.tmdb_id}, ${movie.title}, ${movie.poster_path}, ${movie.vote_average})
      ON CONFLICT (tmdb_id) DO NOTHING
      RETURNING tmdb_id
    )
    SELECT
      (SELECT to_char(added_at AT TIME ZONE 'UTC', ${ISO_UTC}) FROM removed) AS added_at,
      EXISTS (SELECT 1 FROM inserted) AS watched_added
  `;
  const row = rows[0] as
    | { added_at?: unknown; watched_added?: unknown }
    | undefined;
  return {
    removedFromWatchlistAt:
      typeof row?.added_at === "string" ? row.added_at : null,
    watchedAdded: row?.watched_added === true,
  };
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

/**
 * 想看清單，照加入先後（最早的在前），多帶加入時間。
 * 首頁的「今晚」與放映表都照這個順序；時間格式見 listRecentWatched 的說明。
 * ORDER BY 寫成 l.added_at：不加表名的話，Postgres 會先對到 SELECT 裡同名的字串別名。
 */
export async function listWatchlistEntries(): Promise<WatchlistEntry[]> {
  const sql = await db();
  return (await sql`
    SELECT l.tmdb_id, l.title, l.poster_path, l.vote_average,
           to_char(l.added_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS added_at
    FROM watchlist l
    ORDER BY l.added_at ASC
  `) as unknown as WatchlistEntry[];
}

/**
 * 加入想看。addedAt 只在「復原」時帶：把 markWatched 回傳的原加入時間放回去，
 * 沒帶就是現在。格式由 route 端的 addedAtFromBody 先驗過。
 */
export async function addWatchlist(
  movie: SavedMovie,
  addedAt: string | null = null,
): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO watchlist (tmdb_id, title, poster_path, vote_average, added_at)
    VALUES (${movie.tmdb_id}, ${movie.title}, ${movie.poster_path}, ${movie.vote_average},
            COALESCE(${addedAt}::timestamptz, now()))
    ON CONFLICT (tmdb_id) DO NOTHING
  `;
}

export async function removeWatchlist(tmdbId: number): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM watchlist WHERE tmdb_id = ${tmdbId}`;
}

// 個人評分與短評 ----------------------------------------------------

// 單一部片 ----------------------------------------------------------

/**
 * 詳情頁的帳本：一部片在四張表裡的狀態，一次查詢拿完。
 * 原本是 isFavorite／isInWatchlist／isWatched／getRating 四支併發，
 * 四次 HTTP round trip，而且只回布林值，帳本寫不出「哪天加入」。
 *
 * FROM (SELECT 1) 保證一定有一列：這部片四張表都沒有時，
 * 三個純量子查詢回 null、LEFT JOIN 的評分也是 null，呼叫端不必處理「零列」。
 */
export async function getMovieRecord(tmdbId: number): Promise<MovieRecord> {
  const sql = await db();
  const rows = await sql`
    SELECT
      (SELECT to_char(added_at AT TIME ZONE 'UTC', ${ISO_UTC})
         FROM favorites WHERE tmdb_id = ${tmdbId}) AS favorited_at,
      (SELECT to_char(added_at AT TIME ZONE 'UTC', ${ISO_UTC})
         FROM watchlist WHERE tmdb_id = ${tmdbId}) AS watchlist_added_at,
      (SELECT to_char(watched_at AT TIME ZONE 'UTC', ${ISO_UTC})
         FROM watched WHERE tmdb_id = ${tmdbId}) AS watched_at,
      r.score, r.note
    FROM (SELECT 1) AS one
    LEFT JOIN ratings r ON r.tmdb_id = ${tmdbId}
  `;
  const row = (rows[0] ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    favoritedAt: str(row.favorited_at),
    watchlistAddedAt: str(row.watchlist_added_at),
    watchedAt: str(row.watched_at),
    rating:
      typeof row.score === "number"
        ? { score: row.score, note: typeof row.note === "string" ? row.note : "" }
        : null,
  };
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
