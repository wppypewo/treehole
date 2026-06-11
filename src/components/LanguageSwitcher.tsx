"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";

// 語言切換：透過 Server Action 寫入 cookie 後 refresh，讓伺服器元件以新語系重新渲染
export default function LanguageSwitcher({
  current,
  labels,
}: {
  current: Locale;
  labels: Record<Locale, string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1" aria-busy={isPending}>
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => switchTo(locale)}
            aria-pressed={active}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {labels[locale]}
          </button>
        );
      })}
    </div>
  );
}
