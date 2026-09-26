"use client";

import { useEffect, useSyncExternalStore } from "react";
import StatusNotice from "@/components/StatusNotice";

// 錯誤邊界拿不到 server 端的字典，文案寫在這裡
const text = {
  zh: {
    title: "這一頁暫時載入不了",
    sub: "處理這一頁時出錯了，先重試一次。",
    subWithCode: "處理這一頁時出錯了，先重試一次。一直失敗的話，用下面的代碼去對伺服器紀錄。",
    code: "錯誤代碼",
    retry: "重試",
  },
  en: {
    title: "This page couldn't load",
    sub: "Something failed while handling this page. Try again.",
    subWithCode:
      "Something failed while handling this page. Try again. If it keeps failing, look up the code below in the server logs.",
    code: "Error code",
    retry: "Try again",
  },
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
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // cookie 只有 client 讀得到。用 useSyncExternalStore 取 client 快照、
  // server 快照固定回 "zh"，既避免 hydration mismatch，也不會在 effect 裡
  // setState 造成連鎖 render。
  const locale = useSyncExternalStore(subscribeNever, detectLocale, () => "zh" as const);
  const t = text[locale];

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
