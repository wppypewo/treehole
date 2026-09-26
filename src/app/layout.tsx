import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { fontVariables } from "./fonts";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { htmlLang } from "@/i18n/config";
import { LOCK_HEADER } from "@/lib/owner-session";
import { listWatched, listWatchlist } from "@/lib/db";
import type { NavCounts } from "@/components/NavCount";

export const metadata: Metadata = {
  // template 讓每一頁只要回傳自己的名字，站名由這裡補上。
  // 沒有它的時候整站十四頁的分頁標題全都是「Treehole」——
  // 開了五個分頁就分不出哪個是哪個，瀏覽器歷史紀錄也一樣廢。
  title: {
    default: "Treehole",
    // 分隔符跟站內既有慣例一致（MovieCard／BrowseClient 的
    // metadata 都用 " · "），不要在分頁標題另開一套。
    template: "%s · Treehole",
  },
  description: "電影導覽站。瀏覽 TMDB 片單、收藏想看的、記下看過的。",
};

/**
 * 導覽列片數。沿用既有的 list 函式取長度，不新增資料層查詢。
 * 失敗只影響那兩個數字，不能讓整頁（包括錯誤頁）跟著掛——所以接住、記下、回 null。
 */
async function loadNavCounts(): Promise<NavCounts | null> {
  try {
    const [watchlist, watched] = await Promise.all([
      listWatchlist(),
      listWatched(),
    ]);
    return { watchlist: watchlist.length, watched: watched.length };
  } catch (error) {
    console.error("[nav-counts] 讀取片數失敗，導覽列改為不顯示數字", error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  // proxy 把未解鎖的請求改寫到 /unlock 時會帶上這個 header。
  // 鎖著的時候不畫導覽列——那些連結一個都點不進去，擺著只是誤導。
  const locked = (await headers()).get(LOCK_HEADER) === "1";
  // 不 await：導覽列先畫，數字由 NavCount 在 Suspense 裡補上。
  // 鎖著時根本不查——未解鎖的請求不該碰資料庫。
  const navCounts = locked ? null : loadNavCounts();

  return (
    // <html> 不能設 height: 100%。Lenis 的捲動上限靠掛在 <html> 上的
    // ResizeObserver 更新，高度被鎖在視窗高之後，無限捲動追加的內容與
    // client-side 換頁都不會觸發它——捲到舊上限就停住。實測：文件從 5151px
    // 長到 10874px，observer 觸發 0 次。所以視窗高度由 body 的 min-h-dvh 負責。
    <html
      lang={htmlLang(locale)}
      className={`${fontVariables} dark antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-ink text-paper">
        <a href="#main" className="skip-link">
          {dict.nav.skipToContent}
        </a>
        <SmoothScroll />
        {!locked && (
          <Navbar locale={locale} dict={dict} counts={navCounts} />
        )}
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </body>
    </html>
  );
}
