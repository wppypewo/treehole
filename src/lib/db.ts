import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { SavedMovie, HistoryEntry, Rating } from "./db.types";

// SQLite 資料層：單檔資料庫，存放收藏 / 已看過 / 搜尋紀錄。
// 僅在伺服器端使用（route handler 與 server component），切勿匯入 client component。

// 保持對外相容：讓現有 import type { SavedMovie } from "@/lib/db" 繼續有效
export type { SavedMovie, HistoryEntry, Rating } from "./db.types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "movies.sqlite");

function createDb(): Database.Database {
  mkdirSync(DATA_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL"); // 提升並發讀寫穩定度
  database.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id      INTEGER UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      poster_path  TEXT,
      vote_average REAL NOT NULL DEFAULT 0,
      added_at     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS watched (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id      INTEGER UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      poster_path  TEXT,
      vote_average REAL NOT NULL DEFAULT 0,
      watched_at   TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS watchlist (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id      INTEGER UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      poster_path  TEXT,
      vote_average REAL NOT NULL DEFAULT 0,
      added_at     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ratings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id      INTEGER UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      poster_path  TEXT,
      vote_average REAL NOT NULL DEFAULT 0,
      score        INTEGER NOT NULL,
      note         TEXT NOT NULL DEFAULT '',
      rated_at     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS search_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      query       TEXT NOT NULL,
      searched_at TEXT NOT NULL
    );
  `);
  return database;
}

// 單例：避免開發模式熱重載重複建立連線
const globalForDb = globalThis as unknown as {
  __movieDb?: Database.Database;
};
const db = globalForDb.__movieDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__movieDb = db;

export default db;

const nowIso = () => new Date().toISOString();

// 收藏 --------------------------------------------------------------

export function listFavorites(): SavedMovie[] {
  return db
    .prepare(
      "SELECT tmdb_id, title, poster_path, vote_average FROM favorites ORDER BY added_at DESC",
    )
    .all() as SavedMovie[];
}

export function isFavorite(tmdbId: number): boolean {
  return !!db.prepare("SELECT 1 FROM favorites WHERE tmdb_id = ?").get(tmdbId);
}

export function addFavorite(movie: SavedMovie): void {
  db.prepare(
    `INSERT OR IGNORE INTO favorites (tmdb_id, title, poster_path, vote_average, added_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    movie.tmdb_id,
    movie.title,
    movie.poster_path,
    movie.vote_average,
    nowIso(),
  );
}

export function removeFavorite(tmdbId: number): void {
  db.prepare("DELETE FROM favorites WHERE tmdb_id = ?").run(tmdbId);
}

// 已看過 ------------------------------------------------------------

export function listWatched(): SavedMovie[] {
  return db
    .prepare(
      "SELECT tmdb_id, title, poster_path, vote_average FROM watched ORDER BY watched_at DESC",
    )
    .all() as SavedMovie[];
}

export function isWatched(tmdbId: number): boolean {
  return !!db.prepare("SELECT 1 FROM watched WHERE tmdb_id = ?").get(tmdbId);
}

export function addWatched(movie: SavedMovie): void {
  db.prepare(
    `INSERT OR IGNORE INTO watched (tmdb_id, title, poster_path, vote_average, watched_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    movie.tmdb_id,
    movie.title,
    movie.poster_path,
    movie.vote_average,
    nowIso(),
  );
}

export function removeWatched(tmdbId: number): void {
  db.prepare("DELETE FROM watched WHERE tmdb_id = ?").run(tmdbId);
}

// 想看（待看清單） --------------------------------------------------

export function listWatchlist(): SavedMovie[] {
  return db
    .prepare(
      "SELECT tmdb_id, title, poster_path, vote_average FROM watchlist ORDER BY added_at DESC",
    )
    .all() as SavedMovie[];
}

export function isInWatchlist(tmdbId: number): boolean {
  return !!db.prepare("SELECT 1 FROM watchlist WHERE tmdb_id = ?").get(tmdbId);
}

export function addWatchlist(movie: SavedMovie): void {
  db.prepare(
    `INSERT OR IGNORE INTO watchlist (tmdb_id, title, poster_path, vote_average, added_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    movie.tmdb_id,
    movie.title,
    movie.poster_path,
    movie.vote_average,
    nowIso(),
  );
}

export function removeWatchlist(tmdbId: number): void {
  db.prepare("DELETE FROM watchlist WHERE tmdb_id = ?").run(tmdbId);
}

// 個人評分與短評 ----------------------------------------------------

export function getRating(tmdbId: number): Rating | null {
  return (
    (db
      .prepare("SELECT score, note FROM ratings WHERE tmdb_id = ?")
      .get(tmdbId) as Rating | undefined) ?? null
  );
}

// 新增或更新評分（同一部片一筆，依 tmdb_id 覆寫）
export function upsertRating(
  movie: SavedMovie,
  score: number,
  note: string,
): void {
  db.prepare(
    `INSERT INTO ratings (tmdb_id, title, poster_path, vote_average, score, note, rated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(tmdb_id) DO UPDATE SET
       score = excluded.score,
       note = excluded.note,
       rated_at = excluded.rated_at`,
  ).run(
    movie.tmdb_id,
    movie.title,
    movie.poster_path,
    movie.vote_average,
    score,
    note,
    nowIso(),
  );
}

export function removeRating(tmdbId: number): void {
  db.prepare("DELETE FROM ratings WHERE tmdb_id = ?").run(tmdbId);
}

// 搜尋紀錄 ----------------------------------------------------------

export function listHistory(limit = 50): HistoryEntry[] {
  return db
    .prepare(
      "SELECT query, searched_at FROM search_history ORDER BY searched_at DESC LIMIT ?",
    )
    .all(limit) as HistoryEntry[];
}

// 寫入搜尋紀錄：先刪除相同關鍵字舊紀錄再插入，
// 使清單依最近搜尋排序且不重複（重複搜尋會移到最前面）。
export function addHistory(query: string): void {
  const q = query.trim();
  if (!q) return;
  const tx = db.transaction((value: string) => {
    db.prepare("DELETE FROM search_history WHERE query = ? COLLATE NOCASE").run(
      value,
    );
    db.prepare(
      "INSERT INTO search_history (query, searched_at) VALUES (?, ?)",
    ).run(value, nowIso());
  });
  tx(q);
}

export function clearHistory(): void {
  db.prepare("DELETE FROM search_history").run();
}
