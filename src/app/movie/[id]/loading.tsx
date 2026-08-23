// 電影詳情頁載入骨架。形狀對齊改版後的版面：出血劇照帶、片名、
// metadata 行，然後才是海報與簡介的圖文欄。
export default function Loading() {
  return (
    <div>
      <div className="h-[40dvh] max-h-[400px] min-h-[220px] w-full animate-pulse bg-ink-raised sm:h-[62dvh] sm:max-h-[680px]" />

      <div className="mx-auto max-w-[1400px] px-5 pt-8 sm:px-8">
        <div className="h-10 w-2/3 max-w-md animate-pulse bg-ink-raised" />
        <div className="mt-4 h-3 w-32 animate-pulse bg-ink-raised" />
        <div className="mt-6 flex gap-7 border-t border-hairline pt-4">
          <div className="h-3 w-20 animate-pulse bg-ink-raised" />
          <div className="h-3 w-16 animate-pulse bg-ink-raised" />
          <div className="h-3 w-24 animate-pulse bg-ink-raised" />
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-[1400px] px-5 sm:mt-24 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-16">
          <div className="aspect-[2/3] w-32 animate-pulse bg-ink-raised md:w-full" />
          <div>
            <div className="h-4 w-full animate-pulse bg-ink-raised" />
            <div className="mt-3 h-4 w-11/12 animate-pulse bg-ink-raised" />
            <div className="mt-3 h-4 w-3/4 animate-pulse bg-ink-raised" />
            <div className="mt-10 flex gap-3">
              <div className="h-11 w-24 animate-pulse bg-ink-raised" />
              <div className="h-11 w-24 animate-pulse bg-ink-raised" />
              <div className="h-11 w-28 animate-pulse bg-ink-raised" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
