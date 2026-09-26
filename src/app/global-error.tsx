"use client";

import { useEffect } from "react";
import "./globals.css";
import { fontVariables } from "./fonts";
import { htmlLang } from "@/i18n/config";
import StatusNotice from "@/components/StatusNotice";
import { errorText, useCookieLocale } from "./error-copy";

/**
 * 根 layout 自己出錯時的畫面（例如讀語系、組導覽列的過程丟出例外）。
 * 它會取代整個 layout，所以 <html>、<body>、全站樣式與字體都得自己帶，
 * class 跟 layout.tsx 對齊，看起來仍是同一個站。
 *
 * 導覽列不畫：它依賴的正是剛剛壞掉的那一層。
 * 錯誤邊界不能匯出 metadata，分頁標題用 React 的 <title>。
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const locale = useCookieLocale();
  const t = errorText[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={htmlLang(locale)} className={`${fontVariables} dark antialiased`}>
      <body className="flex min-h-dvh flex-col bg-ink text-paper">
        <title>{t.siteTitle}</title>
        <main id="main" className="flex-1 pt-16 sm:pt-24">
          <StatusNotice
            title={t.siteTitle}
            body={error.digest ? t.subWithCode : t.sub}
            detail={error.digest ? `${t.code} ${error.digest}` : undefined}
          >
            <button type="button" onClick={() => retry()} className="btn-line">
              {t.retry}
            </button>
          </StatusNotice>
        </main>
      </body>
    </html>
  );
}
