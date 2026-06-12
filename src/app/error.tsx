"use client";

import { useEffect, useState } from "react";

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

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<"zh" | "en">("zh");

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const t = text[locale];

  return (
    <div className="space-y-4 py-20 text-center">
      <p className="text-lg font-semibold text-zinc-100">{t.title}</p>
      <p className="text-sm text-zinc-400">{t.sub}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10"
      >
        {t.retry}
      </button>
    </div>
  );
}
