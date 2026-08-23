/**
 * 頁面刊頭。
 *
 * 只有標題，加上右側可選的計數。
 *
 * 原本還有 eyebrow 與副標，兩個都拿掉了：eyebrow 多半只是把使用者剛點過的
 * 導覽項再唸一次（點「收藏」進來，上面再寫一次「收藏」），副標則是一句
 * 不影響任何操作的軟話。標題本身已經說完該說的，多的兩行只是噪音。
 */
export default function PageHeader({
  title,
  meta,
}: {
  title: string;
  /** 這一頁有幾部片。是資訊不是裝飾——使用者想知道清單有多長。 */
  meta?: string;
}) {
  return (
    <header className="animate-rise flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-hairline pb-7">
      <h1 className="t-film text-[2.125rem] text-paper sm:text-[3rem]">
        {title}
      </h1>
      {meta && <p className="t-meta shrink-0 text-paper-faint">{meta}</p>}
    </header>
  );
}
