"use client";

// 全域錯誤邊界：捕捉渲染期例外，提供重試。文案以繁中為主。
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="text-lg font-semibold text-zinc-100">載入時發生問題</p>
      <p className="text-sm text-zinc-400">請稍後再試一次。</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10"
      >
        重試
      </button>
    </div>
  );
}
