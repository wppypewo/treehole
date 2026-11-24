/**
 * 插進一行字時，下方內容跟著平順地讓出位置，而不是一格跳下去。
 * 高度用 grid-template-rows 0fr ↔ 1fr 展開（樣式在 globals.css 的 .reveal），
 * 不必量高度，也不會被中途打斷卡住：transition 從當下的位置接回去。
 *
 * 只用在單一頁面裡的一兩行（詳情頁的日期列、撤銷列、錯誤提示）；
 * 長清單上面不用，那裡改成預留空間，避免每一幀都重排整頁。
 *
 * 收起期間內層設 inert：還在淡出的「復原」不能再被點到，也不進 Tab 順序。
 * 要在收起時保留文字，呼叫端搭配 useLinger。
 */
export default function Reveal({
  open,
  children,
  className = "",
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`reveal ${className}`} data-open={open}>
      <div inert={!open}>{children}</div>
    </div>
  );
}
