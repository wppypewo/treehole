<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Treehole Movie App 接手文件

## 目前狀態（接手前必讀）

- **線上版就是正式版**（2026-08-27 起）。Vercel + Neon Postgres，收藏／想看／
  已看過／評分都真的存得住。不再有 demo 模式。
- **本機版已作廢**。SQLite、`DEMO_MODE`、`db.demo.ts`、`npm run backup`、
  搜尋紀錄功能全部移除。本機開發連的是同一個 Neon 資料庫。
- **全站鎖給一個人用**。`src/proxy.ts` 擋在所有頁面與 route handler 之前。
- **主線已穩定**：除非收到明確 bug 回報，不重開部署主線；不動 Vercel 部署設定
- **2026-09-27 全面改版「放映表」已合進 `main`**（`redesign/2026-09-26` 快轉合併），
  下方「視覺方向」就是 `main` 現在的樣子。改版只在 mock 資料上檢查過，真實資料尚未逐頁看

## 技術棧

| 層 | 選擇 |
|---|---|
| 框架 | Next.js 16.3.5（port 3100） |
| React | 19.3.0 |
| 樣式 | Tailwind v4（@tailwindcss/postcss） |
| 資料庫 | Neon Postgres，走 `@neondatabase/serverless` ^1.1.0（HTTP driver） |
| 存取控制 | 自建擁有者鎖：`src/proxy.ts` + `src/lib/owner-session.ts`（Web Crypto HMAC） |
| 型別 | TypeScript ^6 |
| Lint | ESLint ^9（eslint-config-next 16.3.5） |
| 動畫 | GSAP ^3.15 + ScrollTrigger（scroll 敘事）+ Flip（片庫格線重排）、Lenis ^1.3（捲動節奏） |
| 字體 | Bodoni Moda + Noto Serif TC（標題）、Geist（介面），皆走 `next/font` |

## 片庫資料

收藏／想看／已看過／評分存在 Neon Postgres 的四張表（`favorites`、`watchlist`、
`watched`、`ratings`），主鍵都是 `tmdb_id`。沒有 user 欄位，因為只有一個人用。

Schema 由 `src/lib/db.ts` 的 `createSchema()` 在**第一次查詢時**自動建立，四道
`CREATE TABLE IF NOT EXISTS` 包在一次 `sql.transaction()` 裡送出。沒有 migration
指令要跑。建表的 promise 存在 module scope，失敗時會重設成 `null`，不會把一次
連線失敗快取成永久失敗。

**本機開發連的是 production 資料庫**（除非你另外開一個 Neon branch 換掉
`DATABASE_URL`）。在瀏覽器上點的每一下都是真資料，沒有 seed 資料集可以躲。

> **但這台機器上的 `.env` 目前只有 `NEXT_TELEMETRY_DISABLED` 與 `TMDB_API_KEY`**
> （2026-09-03 實測）。`DATABASE_URL` / `OWNER_PASSCODE` / `OWNER_SECRET` 三個都沒設，
> 所以本機跑起來是：擁有者鎖 fail closed（全站鎖死，連不進去）、DB 也連不上。
> 上面那段描述的是「有設 `DATABASE_URL` 時」的行為。要在本機動片庫，
> 得自己把 `.env.example` 那五個 key 補齊——**這件事由使用者做，AGENTS.md 禁止 AI 改 `.env`**。

**這個 repo 沒有備份指令。** 雲端轉本機的備份已評估過並決定不做。備援範圍以
Neon 方案提供的為準，去 Neon console 看，不要假設。

舊的 `data/movies.sqlite` 那 12 筆沒有遷移，這是決定不是疏漏。

## 擁有者鎖

`src/proxy.ts`（Next 16 把 `middleware.ts` 改名為 `proxy.ts`，舊名已 deprecated）
是**唯一**的授權檢查點。資料層與 route handler 一律假設請求已經過關。

- 未解鎖的頁面請求 → rewrite 到 `/unlock`，網址列保持原樣
- 未解鎖的 `/api/*` → `401 {"error":"locked"}` JSON，不是 HTML
- `OWNER_PASSCODE` / `OWNER_SECRET` 任一沒設 → **整站鎖死，連擁有者也進不去**。
  這是刻意的，設定漏掉時關門比預設開門安全
- matcher 必須排除 `_next/static` 等靜態資產，否則解鎖頁自己的 CSS/JS 也會被鎖

改 matcher 前想清楚：Server Function 是打到自己路由的 POST，把某個路徑排除掉
就等於把那條路徑的授權拿掉，而且不會有任何錯誤訊息。

## 技術邊界（禁止跨越）

- 禁止修改 `.env`
- 禁止把授權檢查從 `src/proxy.ts` 搬走或分散到各個 route handler
- 禁止讓鎖變成 fail-open（設定缺漏時放行）
- 禁止把 `DATABASE_URL` 或通行碼寫進程式碼、文件或 commit
- 禁止改動 Vercel 部署設定，除非我明確指示
- 禁止安裝新 package，除非我明確確認
- **`globals.css` 的 `@source not "../../**/*.md";` 別刪**。Tailwind v4 的自動內容
  偵測會把 repo 裡的 `.md` 也當成模板掃，文件裡舉例的 class 名會被當成真的在用
  而產出 CSS（實測 `border-0` 就是這樣進去的）。這行把 markdown 排除掉。
- **安全標頭分兩處，別合併**（2026-09-03 加）：
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

## 視覺方向（2026-09-26 改版：放映表）

**放映表**：字排為主、片庫優先。首頁先看自己的想看清單與看過紀錄，
TMDB 的片單放在後面。清單一律排成「表」（序號、片名、年份、日期欄），
只有收藏頁與「外面在放」保留海報。改版紀錄與逐頁說明見 `TASKS.md`、
`docs/redesign-audit-2026-09-26.md`。

已鎖定、不得單方面推翻的決定：
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

動畫分工（只用已安裝的兩支，不新增套件）：
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

可用元件來源（白名單，**都未安裝**，安裝前要使用者確認）：React Bits、Motion Primitives、Aceternity UI、Animate UI

## Rules 位置

| 檔案 | 用途 |
|---|---|
| `.claude/rules/design-guardrails.md` | 設計禁令（配色、版面、文案等） |
| `.claude/rules/animation.md` | 動畫規則與允許來源 |
| `.claude/rules/backend-first.md` | 後端先行規則與安全禁令 |
| `.claude/rules/frontend-implementation.md` | 前端還原禁令 |
| `.claude/rules/handoff.md` | Handoff 接收與前後端串接規則 |
