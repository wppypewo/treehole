import MovieCard from "./MovieCard";
import type { MovieSummary } from "@/lib/tmdb";

// 海報牆：響應式格狀排列；無資料時顯示空狀態文字
export default function MovieGrid({
  movies,
  emptyText,
}: {
  movies: MovieSummary[];
  emptyText: string;
}) {
  if (movies.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
