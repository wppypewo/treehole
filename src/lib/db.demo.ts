// Demo mode DB stub：與 db.ts 函式簽名完全對齊。
// 不 import better-sqlite3，不讀寫檔案系統，不 import ./db。

import type { SavedMovie, HistoryEntry, Rating } from "./db.types";

export function listFavorites(): SavedMovie[] { return []; }
export function isFavorite(_id: number): boolean { return false; }
export function addFavorite(_movie: SavedMovie): void {}
export function removeFavorite(_id: number): void {}

export function listWatched(): SavedMovie[] { return []; }
export function isWatched(_id: number): boolean { return false; }
export function addWatched(_movie: SavedMovie): void {}
export function removeWatched(_id: number): void {}

export function listWatchlist(): SavedMovie[] { return []; }
export function isInWatchlist(_id: number): boolean { return false; }
export function addWatchlist(_movie: SavedMovie): void {}
export function removeWatchlist(_id: number): void {}

export function getRating(_id: number): Rating | null { return null; }
export function upsertRating(_m: SavedMovie, _s: number, _n: string): void {}
export function removeRating(_id: number): void {}

export function listHistory(_limit?: number): HistoryEntry[] { return []; }
export function addHistory(_query: string): void {}
export function clearHistory(): void {}
