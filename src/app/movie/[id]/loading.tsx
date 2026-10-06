// 電影詳情頁載入骨架。形狀對齊 page.tsx 的 .detail-grid：
// 左欄片名、事實行、21:9 劇照、簡介；右欄（手機在簡介之後）「我的紀錄」外框。
// 外層 min-h-dvh：骨架只有半個視窗高時，頁尾會先露出來，內容一到又被推走，
// 那一下是這頁唯一的版面位移（實測 CLS 0.094）。其他骨架同一個理由。
export default function Loading() {
  return (
    <div className="mx-auto min-h-dvh max-w-[1400px] px-5 sm:px-8">
      <div className="detail-grid pt-9 sm:pt-12 min-[1000px]:pt-16">
        <div className="detail-head">
          <div className="h-12 w-2/3 max-w-md animate-pulse bg-ink-raised" />
          <div className="mt-5 h-3 w-64 max-w-full animate-pulse bg-ink-raised" />
        </div>

        <div className="detail-still mt-8 aspect-[21/9] animate-pulse bg-ink-raised" />

        <div className="detail-prose mt-8 max-w-[62ch]">
          <div className="h-4 w-full animate-pulse bg-ink-raised" />
          <div className="mt-3 h-4 w-11/12 animate-pulse bg-ink-raised" />
          <div className="mt-3 h-4 w-3/4 animate-pulse bg-ink-raised" />
        </div>

        <div className="detail-ledger mt-12 border border-hairline-strong p-6 min-[1000px]:mt-0">
          <div className="h-5 w-24 animate-pulse bg-ink-raised" />
          <div className="mt-[1.375rem] h-12 w-full animate-pulse bg-ink-raised" />
          <div className="mt-[1.375rem] h-11 w-full animate-pulse bg-ink-raised" />
          <div className="mt-[1.375rem] h-24 w-full animate-pulse bg-ink-raised" />
        </div>
      </div>
    </div>
  );
}
