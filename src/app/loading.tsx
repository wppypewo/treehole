import MovieGridSkeleton from "@/components/MovieGridSkeleton";

// 頁面切換時的載入骨架（涵蓋熱門、搜尋、推薦、收藏等海報牆頁）
export default function Loading() {
  return (
    <div className="page-shell space-y-4">
      <div className="h-6 w-32 animate-pulse bg-ink-raised" />
      <MovieGridSkeleton />
    </div>
  );
}
