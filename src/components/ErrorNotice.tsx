// 統一的錯誤提示框；避免任何情況下出現白畫面
export default function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="mx-auto my-20 max-w-xl border-l-2 border-curtain bg-ink-raised px-6 py-5 text-paper-dim">
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}
