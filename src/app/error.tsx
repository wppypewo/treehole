"use client";

import { useSyncExternalStore } from "react";

const text = {
  zh: { title: "載入時發生問題", sub: "請稍後再試一次。", retry: "重試" },
  en: { title: "Something went wrong", sub: "Please try again.", retry: "Retry" },
};

function detectLocale(): "zh" | "en" {
  try {
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
    return m?.[1] === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

// 這個值不會變動，不需要訂閱來源
const subscribeNever = () => () => {};

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // cookie 只有 client 讀得到。用 useSyncExternalStore 取 client 快照、
  // server 快照固定回 "zh"，既避免 hydration mismatch，也不會在 effect 裡
  // setState 造成連鎖 render。
  const locale = useSyncExternalStore(subscribeNever, detectLocale, () => "zh" as const);

  const t = text[locale];

  return (
    <div className="page-shell">
      <div className="max-w-lg border-b border-hairline py-24">
        <p className="t-film text-[2rem] text-paper sm:text-[2.5rem]">
          {t.title}
        </p>
        <p className="mt-4 text-[0.9375rem] text-paper-dim">{t.sub}</p>
        <button type="button" onClick={reset} className="btn-line mt-8">
          {t.retry}
        </button>
      </div>
    </div>
  );
}
