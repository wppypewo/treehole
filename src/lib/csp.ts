/**
 * Content-Security-Policy。由 src/proxy.ts 每個 request 呼叫一次。
 *
 * 為什麼這個站以前沒有 CSP：首頁與詳情頁有 YouTube 預告片 iframe 與 TMDB 圖片，
 * 政策寫錯是唯一能把線上站打白的標頭。所以照 StackWorth 那套流程走——
 * 先上 Report-Only，在真實瀏覽器裡繞一圈確認沒有違規，再翻成強制執行。
 *
 * 這個站的條件比 StackWorth 好，兩件事值得記著：
 *
 * 1. style-src 收到了 'self'，沒有 'unsafe-inline'。
 *    2026-09-03 實測建置產物（/、/browse、/search、/person/[id]、/popular、
 *    /unlock 六頁）：內聯 <style> 0 個、style="..." 屬性 0 個。
 *    GSAP 與 Lenis 是透過 CSSOM 寫 element.style，那不歸 style-src 管，
 *    所以動畫不受影響。日後若有人寫了 style={{...}}，Report-Only 會先叫。
 *
 * 2. nonce 在這裡是免費的。用 nonce 等於全站動態渲染，StackWorth 為此賠掉
 *    7 個靜態頁；這個站本來 14 條路由就全是 ƒ（動態），沒有東西可以賠。
 */

/**
 * 翻成 true 就從「只回報」改為「實際攔截」。
 *
 * 2026-09-03 已在本機 production build 上繞過一輪：首頁（含捲到底觸發 GSAP
 * 與 Lenis）、/browse、/search、/popular、/person/[id]、/unlock 六頁，
 * console 零違規。同一輪確認了政策確實在運作——注入一段 inline <script>
 * 會被記違規，掛一個 player.vimeo.com 的 iframe 也會，所以零違規是真陰性。
 *
 * 還沒驗的只剩一件事：/movie/[id] 這一頁本身。它要讀資料庫的觀看狀態，
 * 本機沒有 DATABASE_URL 就只會落到錯誤邊界。頁面上的 YouTube iframe 已經
 * 單獨驗過（見下方 frame-src 與 img-src 的註解），但整頁一起跑的樣子沒看過。
 * 翻成 true 之前，這一頁要在有資料庫的環境開一次並按下播放。
 */
export const CSP_ENFORCE = false;

/** Report-Only 時瀏覽器照常渲染，只在 console 印違規。 */
export const CSP_RESPONSE_HEADER = CSP_ENFORCE
  ? "Content-Security-Policy"
  : "Content-Security-Policy-Report-Only";

/**
 * 不論是否強制執行，送進 request 的一律是 Content-Security-Policy。
 * Next 是從 request 上的這個標頭解析出 nonce，再自動加到框架 script 上；
 * 標頭名不對就抓不到 nonce，翻成強制執行的那一刻整站會白。
 */
export const CSP_REQUEST_HEADER = "Content-Security-Policy";

export const NONCE_HEADER = "x-nonce";

export function createNonce(): string {
  // btoa 與 randomUUID 都是 Edge runtime 有的 Web API，不依賴 Node 的 Buffer。
  return btoa(crypto.randomUUID());
}

export function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",

    /* 刻意不加 'strict-dynamic'。StackWorth 在 Report-Only 階段實測過：
       'strict-dynamic' 一出現，瀏覽器就會忽略 'self' 這類 host 來源
       （Chrome 原文："Note that 'strict-dynamic' is present, so host-based
       allowlisting is disabled."），而初始 HTML 裡有 Next 直接寫進去、
       沒有 nonce 的 <script src> 屬 parser-inserted，會被擋掉。

       拿掉之後 'self' 生效：同源 script 放行，inline script 仍必須帶 nonce。
       擋得住注入 <script>…</script> 與載入外站 script。

       dev 需要 unsafe-eval：React 用 eval 重建伺服器端錯誤堆疊。 */
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,

    // 沒有 'unsafe-inline'，理由見檔頭第 1 點。
    "style-src 'self'",

    /* image.tmdb.org：海報與劇照，全站的圖都從那裡直接載（沒有走 next/image 代理）。
       img.youtube.com：預告片未播放時的縮圖（components/TrailerPlayer.tsx）。
       i.ytimg.com：YouTube 播放器自己的封面圖。2026-09-03 在真實瀏覽器實測發現——
         光是把 <iframe src="https://www.youtube.com/embed/..."> 掛上去，就會冒出
         i.ytimg.com/vi_webp/<id>/mqdefault.webp 的違規，而且記在「這一份」政策上。
         會這樣是因為 iframe 剛建立、還沒 commit 到 youtube.com 之前是初始空文件，
         那個階段繼承父層的 CSP，播放器最早的封面預載正好落在那個視窗裡；
         frame commit 之後的腳本與 fetch 就歸 YouTube 自己的政策管了——實測只有
         img-src 被報，沒有任何 script-src / connect-src 違規，正好對得上這個解釋。
         少了這一條，翻成強制執行後預告片封面會破，而 /movie/[id] 恰好是本機唯一
         渲染不出來的頁（要讀資料庫），等於破在唯一測不到的地方。
       data:：globals.css 有一個 inline SVG 的 background-image（下拉箭頭）。
       CSS 的 background-image 歸 img-src 管，不是 style-src。 */
    "img-src 'self' data: https://image.tmdb.org https://img.youtube.com https://i.ytimg.com",

    // next/font/google 在建置期把字型檔抓下來自架，執行期不連 Google。
    "font-src 'self'",

    // 前端所有 fetch 都打自家 /api/*，TMDB 呼叫全在伺服器端。
    "connect-src 'self'",

    /* 預告片播放器，來源是 components/TrailerPlayer.tsx 的 iframe src。
       /movie/[id] 本機渲染不出來（要讀資料庫的觀看狀態，沒有 DATABASE_URL），
       所以這一條是把那個 iframe 單獨掛到別的頁面上驗的：youtube.com 的嵌入
       沒有被報，對照組 player.vimeo.com 被報，兩邊都符合預期。 */
    "frame-src https://www.youtube.com",

    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // 與 next.config.ts 的 X-Frame-Options: DENY 同義，兩個都留著給舊瀏覽器。
    "frame-ancestors 'none'",
  ];

  // upgrade-insecure-requests 只在強制執行時才送。規範明定 Report-Only 政策裡
  // 這個指令無效，Chrome 會為此在 console 印一則 error；一直留著等於每開一頁
  // 塞一則假警報，真有違規反而被蓋掉。翻 CSP_ENFORCE 時它會自動回來。
  if (CSP_ENFORCE) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}
