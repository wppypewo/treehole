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
  rule = true,
}: {
  title: string;
  /** 這一頁有幾部片。是資訊不是裝飾——使用者想知道清單有多長。 */
  meta?: string;
  /**
   * 刊頭底下的細線。內容本身就以一條粗線開頭的頁面（榜單、上映表、探索條件）
   * 要關掉，否則兩條平行線只隔一段空白，看起來像畫錯
   */
  rule?: boolean;
}) {
  return (
    <header
      className={`animate-rise flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 ${rule ? "border-b border-hairline pb-7" : ""}`}
    >
      <h1 className="t-film text-[2.125rem] text-paper sm:text-[3rem]">
        {title}
      </h1>
      {meta && <p className="t-meta shrink-0 text-paper-faint">{meta}</p>}
    </header>
  );
}
