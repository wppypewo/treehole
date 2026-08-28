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

## 技術棧

| 層 | 選擇 |
|---|---|
| 框架 | Next.js 16.3.2（port 3100） |
| React | 19.2.8 |
| 樣式 | Tailwind v4（@tailwindcss/postcss） |
| 資料庫 | Neon Postgres，走 `@neondatabase/serverless` ^1.1.0（HTTP driver） |
| 存取控制 | 自建擁有者鎖：`src/proxy.ts` + `src/lib/owner-session.ts`（Web Crypto HMAC） |
| 型別 | TypeScript ^6 |
| Lint | ESLint ^9（eslint-config-next 16.3.2） |
| 動畫 | GSAP ^3.15 + ScrollTrigger（scroll 敘事）、Lenis ^1.3（捲動節奏）、Motion ^13.1（元件級，如 popLayout） |
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

## 視覺方向（2026-08-23 已實作，首頁與詳情頁）

**MUBI 式編輯策展**。不是 Netflix / Apple TV 的海報牆語彙。

已鎖定、不得單方面推翻的決定：
- **形狀鎖**：全站 `border-radius: 0`（`globals.css` 的 `*` reset）
- **配色鎖**：中性三階（`--paper` / `--paper-dim` / `--paper-faint`，皆過 WCAG AA）
  + 唯一強調色 `--curtain: #c8503f`（戲院簾幕紅）。只用在「使用者留下的痕跡」
- **字體**：Bodoni Moda（西文標題）+ Noto Serif TC（中文標題）+ Geist（介面）
- **卡片 hover 不放大**：只浮現內縮 hairline 框（片夾），整列保持安靜
- **首頁不做自動輪播**：一次只推一部
- **手機不把文字壓在影像上**：影像一段、文字一段

動畫分工：
- GSAP + ScrollTrigger：**只有一種** scroll 動畫（影像隨捲動下沉），用在首頁開場與詳情頁首屏
- Lenis：捲動節奏基礎設施，讓 scrub 連續。不是特效
- CSS `animation-timeline: view()`：捲動揭露。**不用 IntersectionObserver**——
  快速捲動可能整段不觸發，內容會永久停在 opacity 0
- Motion：僅元件級（LibraryGrid 的 popLayout）

可用元件來源：React Bits、Motion Primitives、Aceternity UI、Animate UI

## Rules 位置

| 檔案 | 用途 |
|---|---|
| `.claude/rules/design-guardrails.md` | 設計禁令（配色、版面、文案等） |
| `.claude/rules/animation.md` | 動畫規則與允許來源 |
| `.claude/rules/backend-first.md` | 後端先行規則與安全禁令 |
| `.claude/rules/frontend-implementation.md` | 前端還原禁令 |
| `.claude/rules/handoff.md` | Handoff 接收與前後端串接規則 |
