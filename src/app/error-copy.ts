import { useSyncExternalStore } from "react";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "@/i18n/config";

// 錯誤邊界是 client 元件，拿不到 server 端的字典，文案寫在這裡。
// error.tsx 與 global-error.tsx 共用。
export const errorText = {
  "zh-TW": {
    title: "這一頁暫時載入不了",
    siteTitle: "Treehole 暫時載入不了",
    sub: "處理這一頁時出錯了，先重試一次。",
    subWithCode: "處理這一頁時出錯了，先重試一次。一直失敗的話，用下面的代碼去對伺服器紀錄。",
    code: "錯誤代碼",
    retry: "重試",
  },
  en: {
    title: "This page couldn't load",
    siteTitle: "Treehole couldn't load",
    sub: "Something failed while handling this page. Try again.",
    subWithCode:
      "Something failed while handling this page. Try again. If it keeps failing, look up the code below in the server logs.",
    code: "Error code",
    retry: "Try again",
  },
} satisfies Record<Locale, Record<string, string>>;

function readLocaleCookie(): Locale {
  try {
    const pattern = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`);
    return normalizeLocale(document.cookie.match(pattern)?.[1]);
  } catch {
    return "zh-TW";
  }
}

// 這個值不會變動，不需要訂閱來源
const subscribeNever = () => () => {};

/**
 * cookie 只有 client 讀得到。用 useSyncExternalStore 取 client 快照、
 * server 快照固定回預設語系，既避免 hydration mismatch，也不會在 effect 裡
 * setState 造成連鎖 render。
 */
export function useCookieLocale(): Locale {
  return useSyncExternalStore(subscribeNever, readLocaleCookie, () => "zh-TW" as const);
}
