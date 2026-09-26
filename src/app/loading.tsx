/**
 * 根目錄的載入骨架，只給首頁用：其他頁都有自己的 loading.tsx。
 *
 * 形狀對齊 page.tsx：左欄「今晚放映」的理由、片名、資料表、兩顆鍵，
 * 右欄 16:9 劇照；底下是放映表的區塊標題與幾列。
 * 原本這裡是清單頁的刊頭加海報牆，首頁載入時會先閃一個不存在的版面。
 *
 * 手機跟正式頁一樣是文字一段、影像一段，不疊。
 */
const bar = "animate-pulse bg-ink-raised";

export default function Loading() {
  return (
    <div className="pb-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid gap-7 pt-9 min-[900px]:grid-cols-[5fr_7fr] min-[900px]:items-end min-[900px]:gap-14 min-[900px]:pt-16">
          <div>
            <div className={`h-3 w-40 ${bar}`} />
            <div
              className={`mt-3.5 h-[1.02em] w-[5.5em] max-w-full text-[clamp(2.5rem,6vw,4.75rem)] ${bar}`}
            />
            <div className="mt-6 grid grid-cols-[3rem_1fr] gap-x-[1.125rem] gap-y-2.5 border-t border-hairline pt-[1.125rem]">
              {["w-12", "w-20", "w-28", "w-24"].map((w) => (
                <div key={w} className="contents">
                  <div className={`h-3 w-8 ${bar}`} />
                  <div className={`h-3 ${w} ${bar}`} />
                </div>
              ))}
            </div>
            <div className="mt-7 flex gap-2.5">
              <div className={`h-11 w-28 ${bar}`} />
              <div className={`h-11 w-24 ${bar}`} />
            </div>
          </div>
          <div>
            <div className={`aspect-video w-full ${bar}`} />
            <div className={`mt-2.5 h-3 w-48 ${bar}`} />
          </div>
        </div>

        <div className="mt-22 min-[900px]:mt-32">
          <div className={`h-6 w-24 ${bar}`} />
          <div className="mt-[1.125rem] border-t border-hairline-strong">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 border-b border-hairline py-4 max-sm:pl-3"
              >
                <div className={`h-5 w-6 ${bar}`} />
                <div className={`h-5 w-2/3 max-w-80 ${bar}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
