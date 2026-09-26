import MovieGridSkeleton from "./MovieGridSkeleton";

/**
 * 清單頁的載入骨架，形狀對齊各自的版面：
 * - "ranked"   榜單（評分最高、最賣座）：名次、小海報、片名、年份、分數
 * - "schedule" 即將上映：左欄日期、右欄同一天的片
 * - "browse"   探索：四列條件、摘要列、海報牆
 * - "grid"     熱門、推薦：刊頭帶細線，底下海報牆
 * - "search"   搜尋（無關鍵字）：刊頭、大搜尋框
 *
 * 標題條用 1.02em 配 h1 的字級：t-film 的行高就是 1.02，兩邊吃同一組字級，
 * 改刊頭字級時骨架不必跟著改數字。
 * ranked／schedule／browse 的內容以粗線開頭，刊頭不畫細線（同 PageHeader 的 rule={false}）；
 * grid 的刊頭有細線（PageHeader 預設）。
 */
export default function ListSkeleton({
  variant,
}: {
  variant: "ranked" | "schedule" | "browse" | "grid" | "search";
}) {
  if (variant === "search") return <SearchSkeleton />;
  if (variant === "grid") {
    return (
      <div className="page-shell">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-hairline pb-7">
          <div className="h-[1.02em] w-[5em] max-w-full animate-pulse bg-ink-raised text-[2.125rem] sm:text-[3rem]" />
        </div>
        <div className="mt-10">
          <MovieGridSkeleton />
        </div>
      </div>
    );
  }
  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div className="h-[1.02em] w-[5em] max-w-full animate-pulse bg-ink-raised text-[2.125rem] sm:text-[3rem]" />
        {variant === "schedule" && (
          <div className="mb-1 h-3 w-28 animate-pulse bg-ink-raised" />
        )}
      </div>
      {variant === "ranked" && <RankedSkeleton />}
      {variant === "schedule" && <ScheduleSkeleton />}
      {variant === "browse" && <BrowseSkeleton />}
    </div>
  );
}

const bar = "animate-pulse bg-ink-raised";

function RankedSkeleton() {
  return (
    <div className="mt-10 border-t border-hairline-strong">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[2.25rem_2.75rem_minmax(0,1fr)] items-center gap-x-4 border-b border-hairline py-3.5 max-sm:pl-3 sm:grid-cols-[3.5rem_3rem_minmax(0,1fr)_4rem_3.5rem] sm:gap-x-6 sm:py-4"
        >
          <div className={`h-5 w-6 ${bar}`} />
          <div className={`aspect-[2/3] w-full ${bar}`} />
          <div>
            <div className={`h-4 w-2/3 max-w-72 ${bar}`} />
            <div className={`mt-2 h-3 w-1/3 max-w-40 ${bar}`} />
          </div>
          <div className={`ml-auto hidden h-3 w-10 sm:block ${bar}`} />
          <div className={`ml-auto hidden h-4 w-8 sm:block ${bar}`} />
        </div>
      ))}
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="mt-10 border-t border-hairline-strong">
      {[2, 1, 3, 1].map((n, i) => (
        <div
          key={i}
          className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-4 border-b border-hairline py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-8"
        >
          <div>
            <div className={`h-7 w-12 sm:h-9 sm:w-16 ${bar}`} />
            <div className={`mt-1.5 h-2.5 w-8 ${bar}`} />
          </div>
          <div className="-mt-2.5 sm:-mt-2">
            {Array.from({ length: n }).map((_, j) => (
              <div
                key={j}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 py-2.5 max-sm:pl-3 sm:grid-cols-[2.75rem_minmax(0,1fr)]"
              >
                <div className={`aspect-[2/3] w-full ${bar}`} />
                <div className={`h-4 w-2/3 max-w-72 ${bar}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <div className="mt-8">
      <div className="border-t border-hairline-strong">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid gap-y-1.5 border-b border-hairline py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-x-6"
          >
            <div className={`h-3 w-10 ${bar}`} />
            <div className={`h-11 w-full max-w-lg ${bar}`} />
          </div>
        ))}
      </div>
      <div className="flex min-h-12 items-center border-b border-hairline">
        <div className={`h-3 w-48 ${bar}`} />
      </div>
      <div className="mt-10">
        <MovieGridSkeleton count={10} />
      </div>
    </div>
  );
}

/**
 * 對齊 search/page.tsx 沒有關鍵字時的版面：刊頭、大搜尋框。
 * loading.tsx 拿不到 searchParams，分不出有沒有關鍵字；導覽列點進來的是這一種。
 */
function SearchSkeleton() {
  return (
    <div className="page-shell">
      <div className="max-w-2xl border-b border-hairline pb-8">
        <div className={`h-[1.02em] w-[2.5em] text-[2.125rem] sm:text-[3rem] ${bar}`} />
      </div>
      <div className={`mt-8 h-16 w-full max-w-2xl ${bar}`} />
    </div>
  );
}
