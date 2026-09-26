"use client";

import { useEffect } from "react";
import StatusNotice from "@/components/StatusNotice";
import { errorText, useCookieLocale } from "./error-copy";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = errorText[useCookieLocale()];

  // client 端丟出的錯誤不會進伺服器紀錄，至少留在 console
  useEffect(() => {
    console.error(error);
  }, [error]);

  // 用 retry 而不是 reset：reset 只清掉錯誤狀態、不重抓資料，
  // 伺服器元件的錯誤（TMDB、資料庫）按了只會原樣再錯一次。
  // Next 16.3 起 retry 是穩定 API。
  return (
    <StatusNotice
      title={t.title}
      body={error.digest ? t.subWithCode : t.sub}
      detail={error.digest ? `${t.code} ${error.digest}` : undefined}
    >
      <button type="button" onClick={() => retry()} className="btn-line">
        {t.retry}
      </button>
    </StatusNotice>
  );
}
