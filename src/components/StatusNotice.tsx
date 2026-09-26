/**
 * 整頁只剩一則狀態時用的版面：404、錯誤邊界、詳情頁／人物頁／首頁載不出來。
 *
 * 版型跟放映表同一套：粗線起頭，左欄一格代碼、右欄標題與說明，
 * 跟「即將上映」的日期欄、人物頁的年份欄對齊。沒有代碼時右欄獨佔一行。
 *
 * 不加 hook，server 與 client 元件都能直接用（error.tsx 是 client）。
 */
export default function StatusNotice({
  code,
  title,
  body,
  detail,
  children,
}: {
  /** 左欄的代碼，例如「404」；沒有就不畫左欄 */
  code?: string;
  title: string;
  body?: string;
  /** 說明下方的一行小字，例如錯誤代碼 */
  detail?: string;
  /** 動作：連結或按鈕 */
  children?: React.ReactNode;
}) {
  return (
    <section className="page-shell">
      <div
        className={`animate-rise border-t border-hairline-strong pt-7 sm:pt-9 ${
          code
            ? "grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-8"
            : ""
        }`}
      >
        {code && (
          <p className="t-num pt-1.5 text-[1.75rem] leading-none text-paper-faint sm:text-[2.25rem]">
            {code}
          </p>
        )}
        <div className="min-w-0 max-w-[40rem]">
          <h1 className="t-film text-[2rem] text-paper sm:text-[2.75rem]">{title}</h1>
          {body && (
            <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-paper-dim">
              {body}
            </p>
          )}
          {children && <div className="mt-8 flex flex-wrap gap-2.5">{children}</div>}
          {detail && <p className="t-meta mt-10 text-paper-faint">{detail}</p>}
        </div>
      </div>
    </section>
  );
}
