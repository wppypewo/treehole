// 載入骨架：形狀與 MovieCard 一致（海報 + 兩行文字），欄數與 POSTER_GRID 相同，
// 這樣資料到位時不會發生位移。
export default function MovieGridSkeleton({ count = 15 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] w-full animate-pulse bg-ink-raised" />
          <div className="mt-3 h-3 w-3/4 animate-pulse bg-ink-raised" />
          <div className="mt-2 h-3 w-1/4 animate-pulse bg-ink-raised" />
        </div>
      ))}
    </div>
  );
}
