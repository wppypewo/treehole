// 載入骨架：用脈動方塊佔位海報牆，降低等待時的空白感
export default function MovieGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-zinc-800" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
