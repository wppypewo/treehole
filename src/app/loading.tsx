import MovieGridSkeleton from "@/components/MovieGridSkeleton";

// 頁面切換時的載入骨架。形狀對齊 PageHeader + 海報牆，避免內容到位時整頁重排。
export default function Loading() {
  return (
    <div className="page-shell">
      <div className="border-b border-hairline pb-7">
        <div className="h-3 w-16 animate-pulse bg-ink-raised" />
        <div className="mt-4 h-10 w-64 animate-pulse bg-ink-raised" />
        <div className="mt-4 h-3 w-80 max-w-full animate-pulse bg-ink-raised" />
      </div>
      <div className="mt-10">
        <MovieGridSkeleton />
      </div>
    </div>
  );
}
