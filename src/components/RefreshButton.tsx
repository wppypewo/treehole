"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * 伺服器元件自己回錯誤畫面時（不是丟給 error.tsx）的重試鍵。
 * router.refresh() 會重新向伺服器要這一頁，TMDB 恢復了就直接換成正常內容，
 * 不必整頁重新整理。
 */
export default function RefreshButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="btn-line disabled:opacity-50"
    >
      {label}
    </button>
  );
}
