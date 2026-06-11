// 共用型別定義。db.ts 與 db.demo.ts 都從這裡取型別，避免交叉引用。

export interface SavedMovie {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
}

export interface HistoryEntry {
  query: string;
  searched_at: string;
}

export interface Rating {
  score: number;
  note: string;
}
