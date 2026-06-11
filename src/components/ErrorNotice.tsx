// 統一的錯誤提示框；避免任何情況下出現白畫面
export default function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="mx-auto my-12 max-w-xl rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}
