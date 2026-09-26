import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/tmdb";

// 全站共用的海報牆格線。欄數刻意比一般影音站少一到兩欄——
// 海報大一點、行距鬆一點，符合「慢慢挑」而不是「一次塞滿」。
export const POSTER_GRID =
  "grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export default function MovieGrid({
  movies,
  emptyText,
}: {
  movies: MovieSummary[];
  emptyText: string;
}) {
  if (movies.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-paper-faint">
        {emptyText}
      </p>
    );
  }

  return (
    <div className={POSTER_GRID}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
