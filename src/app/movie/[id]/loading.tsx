// 電影詳情頁載入骨架
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto w-48 shrink-0 sm:mx-0">
          <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-zinc-800" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
          <div className="flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
            <div className="h-8 w-24 animate-pulse rounded bg-zinc-800" />
            <div className="h-8 w-20 animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  );
}
