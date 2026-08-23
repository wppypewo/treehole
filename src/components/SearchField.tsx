// 搜尋輸入框。抽成元件是因為它在同一頁有兩種尺寸：
// 沒有關鍵字時它是主體（大），有結果時它退到刊頭之上（compact）。
export default function SearchField({
  defaultValue,
  placeholder,
  buttonLabel,
  compact = false,
}: {
  defaultValue: string;
  placeholder: string;
  buttonLabel: string;
  compact?: boolean;
}) {
  return (
    <form action="/search" method="get" className="relative">
      <label htmlFor="q" className="sr-only">
        {placeholder}
      </label>
      <input
        id="q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full border-b border-paper-dim bg-transparent pr-24 text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-paper ${
          compact ? "py-2.5 text-base" : "py-4 text-xl sm:text-2xl"
        }`}
      />
      {/* 純文字送出鍵：輸入框已經是一條底線，再加一個外框會變成兩個框 */}
      <button
        type="submit"
        className="tap-safe absolute top-1/2 right-0 -translate-y-1/2 px-1 text-[0.8125rem] tracking-[0.06em] text-paper-dim transition-colors hover:text-curtain-ink"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
