// 共用型別定義。db.ts 與 client component 都從這裡取型別，避免把伺服器端模組拉進瀏覽器。

export interface SavedMovie {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
}

export interface Rating {
  score: number;
  note: string;
}

/** 想看清單的一列，多帶加入時間（ISO 8601、UTC，例如 2026-09-12T13:05:00Z） */
export interface WatchlistEntry extends SavedMovie {
  added_at: string;
}

/** 看過的一列，連同評分與短評；沒評分時 score 與 note 都是 null */
export interface WatchedEntry extends SavedMovie {
  watched_at: string;
  score: number | null;
  note: string | null;
}

/** 收藏的一列，多帶收藏時間與自己給的分數（沒評分為 null） */
export interface FavoriteEntry extends SavedMovie {
  added_at: string;
  score: number | null;
}

/**
 * 一部片在片庫裡留下的全部痕跡。三個時間都是 ISO 8601、UTC，
 * 不在那張表裡就是 null；沒評分時 rating 是 null。
 */
export interface MovieRecord {
  favoritedAt: string | null;
  watchlistAddedAt: string | null;
  watchedAt: string | null;
  rating: Rating | null;
}
