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
