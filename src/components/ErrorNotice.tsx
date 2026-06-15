// 統一的錯誤提示框；避免任何情況下出現白畫面
export default function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="mx-auto my-12 max-w-xl rounded-lg border border-white/10 bg-zinc-900/60 px-5 py-4 text-zinc-300">
      <p className="text-sm leading-relaxed">{message}</p>
    </div>
  );
}
