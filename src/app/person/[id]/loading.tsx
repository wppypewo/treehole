// 人物頁載入骨架。形狀對齊 page.tsx：
// 左欄 2:3 照片、右欄姓名、基本資料一行、簡介；底下是依年份排的作品年表。
const bar = "animate-pulse bg-ink-raised";

export default function Loading() {
  return (
    <div className="page-shell">
      <div className="grid gap-8 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-16">
        <div className={`aspect-[2/3] w-32 md:w-full ${bar}`} />
        <div>
          <div
            className={`h-[1.02em] w-[6em] max-w-full text-[clamp(2.25rem,4.6vw,3.75rem)] ${bar}`}
          />
          <div className={`mt-4 h-3 w-72 max-w-full ${bar}`} />
          <div className="mt-7 max-w-[62ch] border-t border-hairline pt-6">
            <div className={`h-4 w-full ${bar}`} />
            <div className={`mt-3 h-4 w-11/12 ${bar}`} />
            <div className={`mt-3 h-4 w-full ${bar}`} />
            <div className={`mt-3 h-4 w-2/3 ${bar}`} />
          </div>
        </div>
      </div>

      <div className="mt-20 sm:mt-24">
        <div className={`h-6 w-20 ${bar}`} />
        <div className="mt-6 border-t border-hairline-strong">
          {[2, 1, 3].map((n, i) => (
            <div
              key={i}
              className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-4 border-b border-hairline py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-8"
            >
              <div className={`h-7 w-14 sm:h-9 sm:w-20 ${bar}`} />
              <div className="-mt-2.5 sm:-mt-2">
                {Array.from({ length: n }).map((_, j) => (
                  <div
                    key={j}
                    className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 py-2.5 max-sm:pl-3 sm:grid-cols-[2.75rem_minmax(0,1fr)]"
                  >
                    <div className={`aspect-[2/3] w-full ${bar}`} />
                    <div>
                      <div className={`h-4 w-2/3 max-w-72 ${bar}`} />
                      <div className={`mt-2 h-3 w-1/3 max-w-40 ${bar}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
