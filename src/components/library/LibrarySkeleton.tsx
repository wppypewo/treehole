/**
 * 片庫頁的載入骨架。想看是表格列、看過是日誌列、收藏是海報牆，
 * 三頁長得不一樣，共用根目錄那一份海報骨架的話，資料一到整頁會換一次形狀。
 *
 * 刊頭那兩條跟 app/loading.tsx 同一組尺寸。
 *
 * 外層至少一個視窗高（min-h-dvh）：骨架比真內容短的話，頁尾會先露在視窗裡，
 * 內容一到又被推出去，算成一次版面位移（詳情頁實測 CLS 0.094）。
 */
export default function LibrarySkeleton({
  variant,
}: {
  variant: "table" | "diary" | "wall";
}) {
  return (
    <div className="page-shell min-h-dvh">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-hairline pb-7">
        <div className="h-[1.02em] w-[6em] max-w-full animate-pulse bg-ink-raised text-[2.125rem] sm:text-[3rem]" />
        <div className="mb-1 h-3 w-24 animate-pulse bg-ink-raised" />
      </div>

      {/* 分段鍵那一列 */}
      <div className="mt-8 h-11 w-64 max-w-full animate-pulse bg-ink-raised" />

      {variant === "table" && (
        <div className="mt-5 border-t border-hairline-strong">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 border-b border-hairline py-5 min-[900px]:grid-cols-[3.5rem_minmax(0,1.3fr)_minmax(0,1fr)_9.5rem_6.5rem_10.5rem]"
            >
              <div className="h-5 w-7 animate-pulse bg-ink-raised" />
              <div className="h-5 w-3/5 animate-pulse bg-ink-raised" />
              <div className="hidden h-3 w-2/3 animate-pulse bg-ink-raised min-[900px]:block" />
              <div className="hidden h-3 w-3/4 animate-pulse bg-ink-raised min-[900px]:block" />
              <div className="hidden h-3 w-full animate-pulse bg-ink-raised min-[900px]:block" />
              <div className="hidden h-3 w-2/3 justify-self-end animate-pulse bg-ink-raised min-[900px]:block" />
            </div>
          ))}
        </div>
      )}

      {variant === "diary" && (
        <div className="mt-8">
          <div className="h-6 w-36 animate-pulse bg-ink-raised" />
          <div className="mt-3 border-t border-hairline-strong">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[3rem_2.75rem_minmax(0,1fr)] gap-x-4 border-b border-hairline py-5 min-[700px]:grid-cols-[4.5rem_3.5rem_minmax(0,1fr)] min-[700px]:gap-x-6"
              >
                <div className="h-8 w-8 animate-pulse bg-ink-raised min-[700px]:h-10 min-[700px]:w-10" />
                <div className="aspect-[2/3] w-full animate-pulse bg-ink-raised" />
                <div>
                  <div className="h-5 w-1/2 animate-pulse bg-ink-raised" />
                  <div className="mt-2 h-3 w-20 animate-pulse bg-ink-raised" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "wall" && (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-4 lg:gap-x-9 lg:gap-y-14">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] w-full animate-pulse bg-ink-raised" />
              <div className="mt-3 h-4 w-3/4 animate-pulse bg-ink-raised" />
              <div className="mt-2 h-3 w-1/3 animate-pulse bg-ink-raised" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
