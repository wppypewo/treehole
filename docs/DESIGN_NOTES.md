# 設計筆記

Treehole 的設計決策、取捨與維護規則。原本分散在給 AI 代理人的交接檔裡，2026-10-25 整理到這裡。
產品介紹、功能與本機設定見 [README](../README.md)。

## 片庫資料

收藏／想看／已看過／評分存在 Neon Postgres 的四張表（`favorites`、`watchlist`、
`watched`、`ratings`），主鍵都是 `tmdb_id`。沒有 user 欄位，因為只有一個人用。

Schema 由 `src/lib/db.ts` 的 `createSchema()` 在**第一次查詢時**自動建立，四道
`CREATE TABLE IF NOT EXISTS` 包在一次 `sql.transaction()` 裡送出。沒有 migration
指令要跑。建表的 promise 存在 module scope，失敗時會重設成 `null`，不會把一次
連線失敗快取成永久失敗。

**本機開發連的是 production 資料庫**（除非你另外開一個 Neon branch 換掉
`DATABASE_URL`）。在瀏覽器上點的每一下都是真資料，沒有 seed 資料集可以躲。
`DATABASE_URL`、`OWNER_PASSCODE`、`OWNER_SECRET` 沒設時，本機跑起來是擁有者鎖
fail closed（全站鎖死）、資料庫也連不上。

**這個 repo 沒有備份指令。** 雲端轉本機的備份已評估過並決定不做。備援範圍以
Neon 方案提供的為準，去 Neon console 看，不要假設。

舊的 `data/movies.sqlite` 那 12 筆沒有遷移，這是決定不是疏漏。

## 本機開發：Turbopack 冷啟動抓字型會失敗

**`npm run dev`（Turbopack）第一次啟動可能整站 500**（2026-10-12 實測）。錯誤是
`Can't resolve '@vercel/turbopack-next/internal/font/google/font'`，log 前面一長串
`Connection timed out when requesting https://fonts.gstatic.com/...`。Noto Serif TC 在
Google Fonts 切成 108 個 unicode-range 檔，冷啟動同時抓，當時那台機器並行時平均一個 6 秒，
超過 dev 的逾時；失敗會留在這個行程裡，重新整理沒用。**停掉再啟動一次**就好：抓到的已存在
`.next/dev`，重啟只補缺的。`next dev --webpack` 不受影響（抓不到時退回 fallback 字型）。
`next build` 偶爾也會因單一字檔逾時失敗，重跑即可。上游回報見 vercel/next.js discussions #81721

## 擁有者鎖

`src/proxy.ts`（Next 16 把 `middleware.ts` 改名為 `proxy.ts`，舊名已 deprecated）
是**唯一**的授權檢查點。資料層與 route handler 一律假設請求已經過關。

- 未解鎖的頁面請求 → rewrite 到 `/unlock`，網址列保持原樣
- 未解鎖的 `/api/*` → `401 {"error":"locked"}` JSON，不是 HTML
- `OWNER_PASSCODE` / `OWNER_SECRET` 任一沒設 → **整站鎖死，連擁有者也進不去**。
  這是刻意的，設定漏掉時關門比預設開門安全
- 通行碼短於 16 個字元（`MIN_PASSCODE_LENGTH`，以字元計）也當成沒設，整站鎖住。
  cookie 的 HMAC 金鑰是 `OWNER_SECRET` 加通行碼，換掉任一個，舊 cookie 都會失效
- 根 layout 查導覽列片數前會自己驗一次 cookie（`tokenUnlocks()`，和 proxy 共用），
  不只看 proxy 帶的 header：matcher 排除的路徑不經過 proxy，照樣會由根 layout 畫 404
- matcher 必須排除 `_next/static` 等靜態資產，否則解鎖頁自己的 CSS/JS 也會被鎖

改 matcher 前想清楚：Server Function 是打到自己路由的 POST，把某個路徑排除掉
就等於把那條路徑的授權拿掉，而且不會有任何錯誤訊息。

維護時守住的規則：

- 授權檢查不從 `src/proxy.ts` 搬走，也不分散到各個 route handler
- 鎖不能變成 fail-open（設定缺漏時放行）
- `DATABASE_URL` 與通行碼不寫進程式碼、文件或 commit

## 安全標頭與 CSP 的分工

2026-09-03 加入。安全標頭分兩處，別合併：

- 靜態的四個在 `next.config.ts` 的 `headers()`：`nosniff` / `X-Frame-Options: DENY` /
  `Referrer-Policy` / `Permissions-Policy`。
- **CSP 在 `src/lib/csp.ts`，由 `src/proxy.ts` 掛上**。它每個 request 要換一次
  nonce，是動態值，放不進 `next.config.ts`。`proxy.ts` 有六條回傳路徑
  （解鎖 API 放行、解鎖頁：已解鎖轉回首頁／鎖著時帶 LOCK_HEADER 放行、已解鎖、
  API 401、未解鎖 rewrite），**每一條都要帶 CSP**，
  漏掉哪一條那一條就沒有政策。
- 目前是 **Report-Only**。翻成強制執行的開關是 `csp.ts` 的 `CSP_ENFORCE`，
  翻之前要做的事寫在那支檔案的註解裡。**翻之前一定要先讀那段註解。**
- 這個站的 `style-src` 收到 `'self'`（沒有 `'unsafe-inline'`），比 StackWorth 緊。
  前提是全站 0 個內聯 `<style>` 與 0 個 `style="..."`——GSAP 與 Lenis 走 CSSOM
  寫 `element.style`，那不歸 `style-src` 管。日後若有人寫了 `style={{...}}`，
  Report-Only 會先在 console 叫；那時候要問的是「能不能改成 class」，
  而不是把 `'unsafe-inline'` 加回來。
- nonce 在這個站是免費的：用 nonce 等於全站動態渲染，而 14 條路由本來就全是 `ƒ`。
  StackWorth 為了同一件事賠掉 7 個靜態頁，這裡沒有東西可以賠。

## Tailwind 不掃 markdown

**`globals.css` 的 `@source not "../../**/*.md";` 別刪**。Tailwind v4 的自動內容
偵測會把 repo 裡的 `.md` 也當成模板掃，文件裡舉例的 class 名會被當成真的在用
而產出 CSS（實測 `border-0` 就是這樣進去的）。這行把 markdown 排除掉。

## 視覺方向（2026-09-26 改版：放映表）

**放映表**：字排為主、片庫優先。首頁先看自己的想看清單與看過紀錄，
TMDB 的片單放在後面。清單一律排成「表」（序號、片名、年份、日期欄），
只有收藏頁與「外面在放」保留海報。

已鎖定的決定：
- **形狀鎖**：全站 `border-radius: 0`（`globals.css` 的 `*` reset）
- **配色鎖**：中性三階（`--paper` / `--paper-dim` / `--paper-faint`，皆過 WCAG AA）
  + 唯一強調色簾幕紅，分三個 token（`globals.css` 開頭有對比數據）：
  - `--curtain #c8503f`：線條與標記，不承載文字（列 hover 左緣線、訊息與錯誤的左側粗線、導覽目前位置底線）
  - `--curtain-ink #e4897b`：小字（自評分數、「今晚」的理由、今晚那一部的序號）
  - `--curtain-fill #b04537`：上面壓字的填塊（詳情頁「我的紀錄」開著的想看／看過／收藏鍵、評分尺填滿的格）
  主要用途仍是「使用者留下的痕跡」；新增用途前先問它是不是痕跡、位置或錯誤
- **字體**：Bodoni Moda（西文標題）+ Noto Serif TC（中文標題）+ Geist（介面）。
  字級工具在 `globals.css`：`.t-film`／`.t-num`／`.t-meta`／`.t-label`／`.t-section`／`.t-reason`
- **首頁不做自動輪播**：「今晚」一次只推一部（想看清單放最久的那部，`?pick=n` 換下一部）
- **手機不把文字壓在影像上**：影像一段、文字一段。詳情頁劇照在欄內，不出血
- **hover 依角色分四種，不放大**（`globals.css` 的 `.hov-*`）：
  列＝左緣簾幕紅線（`.hov-row`，手機要配 `max-sm:pl-3`）、海報＝壓暗一階（`.hov-poster`）、
  日誌＝日期轉色（`.hov-date`）、行內連結＝底線變亮（`.link-hair`）。鍵盤聚焦等同 hover
- **整頁只剩一則狀態時用 `StatusNotice`**（404、錯誤邊界、載不出來），不另做版面
- **沒有內聯樣式**：CSP 的 `style-src 'self'` 不容許 `style={{...}}`，見上方安全標頭一節

## 動畫分工

只用已安裝的兩支（`gsap`、`lenis`），不新增套件：
- GSAP + ScrollTrigger：**只有一種** scroll 動畫（影像隨捲動下沉，`ParallaxImage`），
  用在首頁「今晚」的劇照與詳情頁劇照
- Lenis：捲動節奏基礎設施（`SmoothScroll`），讓 scrub 連續。不是特效
- GSAP Flip：片庫三頁的列表重排（`library/useFlip.ts`：拿掉一部片、換排序、換篩選）
- 進場：`animate-rise`（載入時一次，CSS keyframes），用在頁首與狀態頁
- 捲動揭露目前**沒有**。原本的 `.reveal`（CSS `animation-timeline: view()`）只有榜單在用，
  2026-09-26 榜單改寫後已刪。日後要加，用 `view()`，**不用 IntersectionObserver**——
  快速捲動可能整段不觸發，內容會永久停在 opacity 0

2026-09-03 之前 Flip 那一段是 Motion 的 `AnimatePresence mode="popLayout"`。移除的理由是體積：
實測 motion 佔 client JS 的 39.5 KB gzip（14.2%），只服務片庫三個頁面的這一種動畫；
GSAP core 因為首頁與詳情頁的捲動動畫本來就已載入，補 Flip 只多 9.7 KB。
換完 client JS 由 278.2 KB gzip 降到 247.8 KB。動畫語彙不變。

## 已知取捨與限制

- **無效 ID 的 404 狀態碼仍是 200。** `/movie/abc`、TMDB 查無此 id 等情況走 Next 的
  `notFound()`，畫面是 404 頁，但回應已經以 200 開始串流，狀態碼改不了。這是 Next 文件
  （`not-found.md`）載明的行為，Next 會注入 `<meta name="robots" content="noindex">` 當緩解。
  要真正的 404 得在 proxy 檢查，而 proxy 只能看 id 格式、無法得知 TMDB 有沒有這筆，價值有限，未實作。
- **ESLint 10 暫時升不上去**（2026-08-23 實測）。裝上 10.9.0 後 `npm run lint` 直接崩潰：
  `eslint-plugin-react` 呼叫 eslint 10 已移除的 `context.getFilename()`，當時它的最新版
  7.37.5 的 peer 宣告只到 `^9.7`。CI 加跑 lint 就是因為這個 dependabot PR 拿到假綠燈。
- **`next`／`react`／`react-dom`／`eslint-config-next` 釘精確版本。** `npm install` 會把它們改成
  caret，要手動還原。
- **角色名無法翻譯。** TMDB 的 `character` 欄位不隨 `language` 參數變（zh-TW、en-US、ja-JP 實測都一樣）。
  `characterText()` 只把「(voice)」「(uncredited)」「Self」這類固定標記轉成中文，角色本名維持原文。
- **`global-error.tsx` 沒有在執行期觸發過。** 根 layout 的資料庫讀取有 catch，外部弄不壞它。
  改用 `react-dom/server` 直接渲染測試（`src/__tests__/error-boundaries.test.ts`），
  證明畫面本身沒問題，沒證明 Next 在正式環境一定會走到它。
