// 統一的錯誤提示框；避免任何情況下出現白畫面
//
// placement：整頁只剩這一塊時（詳情頁、人物頁）置中留白；
// 清單頁已經有自己的頁首，錯誤框跟著內容靠左，傳空字串即可
export default function ErrorNotice({
  message,
  placement = "mx-auto my-20",
}: {
  message: string;
  placement?: string;
}) {
  return (
    <div
      className={`${placement} max-w-xl border-l-2 border-curtain bg-ink-raised px-6 py-5 text-paper-dim`}
    >
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}
