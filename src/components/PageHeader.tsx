/**
 * 頁面刊頭。
 *
 * 這是全站除了首頁與詳情頁之外，唯一的「這裡是哪」的訊號，所以做成報頭的樣子：
 * 標題用襯線大字，底下一條 hairline 把它與內容切開，右側留一格放這一頁的計數
 * （幾部片、幾個結果）。計數是資訊不是裝飾——使用者想知道這個清單有多長。
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  meta,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: string;
}) {
  return (
    <header className="animate-rise border-b border-hairline pb-7">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <h1 className="t-film text-[2.125rem] text-paper sm:text-[3rem]">
          {title}
        </h1>
        {meta && <p className="t-meta shrink-0 text-paper-faint">{meta}</p>}
      </div>
      {subtitle && (
        <p className="mt-3 max-w-[52ch] text-sm text-paper-dim">{subtitle}</p>
      )}
    </header>
  );
}
