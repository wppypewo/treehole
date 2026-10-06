import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/tmdb";

// 全站共用的海報牆格線。欄數刻意比一般影音站少一到兩欄——
// 海報大一點、行距鬆一點，符合「慢慢挑」而不是「一次塞滿」。
export const POSTER_GRID =
  "grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** 放在頁首的 POSTER_GRID，前幾張不延遲載入：最寬五欄，1440×900 首屏排得下兩列 */
export const POSTER_GRID_ABOVE_FOLD = 10;

export default function MovieGrid({
  movies,
  emptyText,
  className = "",
}: {
  movies: MovieSummary[];
  emptyText: string;
  /** 補在格線上的 class，例如依欄數藏掉會落單的最後一列 */
  className?: string;
}) {
  if (movies.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-paper-faint">
        {emptyText}
      </p>
    );
  }

  return (
    <div className={`${POSTER_GRID} ${className}`}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
