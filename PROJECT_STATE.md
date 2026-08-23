# PROJECT_STATE

> 產出日期：2026-06-15
> 僅針對 `movie-app`（Treehole）repo 據實盤點；git 狀態皆在本 repo 內判斷。
> 本次只做狀態盤點：未改產品程式碼 / README / package.json / env / Vercel / CI 設定，未跑 formatter / migration / test / build。

## Repo Identity

* Repo path: `D:\ClaudeCode\projects\movie-app`
* Repo type: Next.js 16 全端 Web App（git repo，有 GitHub remote）
* Primary purpose: Treehole——TMDB 電影導覽 + 私人片庫（本機 SQLite；Vercel 為 demo），同時作為作品集
* Current status: **Design phase（2026-08-23 由使用者明確開啟）**——BT 下載功能已整批移除，正進行全站風格重做

## Git Status

* Branch: `main`
* Latest commit: `3249b1a 加入 Treehole production screenshots`
* Working tree: clean（`git status --short` 無輸出）
* Remote: `origin` → `https://github.com/zhuang060329-bit/treehole-movie-app.git`（依備忘為 private）
* Sync status: 與 `origin/main` 同步（`## main...origin/main`，無 ahead / behind）

## Product Status

* Production / deployment: Vercel demo（README 載明 `https://treehole-movie-app.vercel.app`，以 `DEMO_MODE=1` 運作、不連真實 DB）；本 repo **無 `vercel.json`**（部署設定在 Vercel 端，未進 repo），另有 `.vercelignore`。AGENTS.md：不動 Vercel 部署設定，除非明確指示
* README status: Treehole 標題、live demo、features、demo/local 對照表、設計決策、tech stack、architecture、testing、future。**2026-08-23 移除截圖區**（見階段 5）
* CI status: 有 GitHub Actions `.github/workflows/ci.yml`，push / PR 到 main 觸發 `typecheck → test → build`（build 帶 `DEMO_MODE=1`）；另有 `.github/dependabot.yml`
* Test status: Vitest；50 tests / 5 files（utility 層），2026-08-23 實測通過。lint 已清到 0 error 0 warning
* Demo mode status: 由 `DEMO_MODE=1` 切換。`next.config.ts` 的 turbopack `resolveAlias` 在 demo 時把 `@/lib/db` 指向 `src/lib/db.demo.ts`（stub：讀回空、寫入 no-op）；UI 寫入動作仍顯示但呈 disabled 並誠實說明，不假裝儲存
* Known limitations: 缺 demo/local DB 邊界的整合測試（README future）；測試僅涵蓋 utility 層，UI 與 API 整合未覆蓋

## Tech Stack

* Framework: Next.js 16.2.6（App Router、Turbopack，port 3100）+ React 19 + TypeScript
* Data source: TMDB API（v3 key / v4 token，全部 server-side）
* Local database: better-sqlite3（**僅 local 模式**；demo 模式以 `db.demo.ts` stub 取代）
* Demo / production mode: 單一 `DEMO_MODE` env 切換（Vercel=demo、本機=local）；TMDB key 為 server-side
* Styling: Tailwind CSS v4（`@tailwindcss/postcss`）
* Testing: Vitest（`vitest.config.ts`）
* Deployment: Vercel（demo）；本機為 Node 20+ LAN server（bind `0.0.0.0`）

> 動畫套件現況（2026-08-23 更新）：`gsap` ^3.15、`lenis` ^1.3、`motion` ^12.40 皆已安裝並使用中。分工見 AGENTS.md。

## Available Commands

（來源：`package.json` scripts，確實存在）
* Lint: `npm run lint`（`eslint`）
* Typecheck: `npm run typecheck`（`tsc --noEmit`）
* Test: `npm run test`（`vitest run`）；watch：`npm run test:watch`
* Build: `npm run build`（`next build`）
* Dev: `npm run dev`（`next dev -H 0.0.0.0 -p 3100`）；Windows：`啟動Treehole.bat`
* Other: `npm run start`（`next start -H 0.0.0.0 -p 3100`）

## Completed Work

> 僅依 README、commits、實際檔案整理，未腦補。

* Vercel demo：已部署，`DEMO_MODE=1` 運作（README 載明 live demo）。
* Demo mode：寫入動作 disabled + 誠實空狀態，不假裝持久化（commit `92a8b3d 修正 demo 模式 action 與空狀態語意`）。
* better-sqlite3 / `db.demo.ts` alias：已實作，`next.config.ts` 依 `DEMO_MODE` 切換 `@/lib/db` → `db.demo.ts`。
* GitHub Actions：`ci.yml`（typecheck→test→build，build 帶 DEMO_MODE=1）+ `dependabot.yml` 已建立。
* UI cinematic pass：一系列互動 / 質感 commit（`5bf0af0 優化電影卡片與詳情頁互動質感`、`14a18b6`、`6f423dd`、`f15db11`、`22623a1` 等）。
* demo mode action / empty-state semantics：見上 `92a8b3d`。
* final README correction：近 4 個 commit 整理作品集 README（`9bd48ad`、`d5adfd1`、`2643879`）與文案語義（`c5053f4`、`1cac0cb`）。

## Current Phase

* Phase: 生產後收尾 + 作品集狀態穩定化（主線凍結，文件 / 表述為主）
* Goal: 維持 demo 穩定與 CI 通過，README 對外完整一致；不重開部署主線、不引入新功能。
* Success criteria: working tree clean、CI 綠燈、demo 可瀏覽、README 與實際技術棧一致（含動畫套件描述）。

## Next 3 Allowed Tasks

1. ~~修正 AGENTS.md 動畫套件描述落差~~（已完成 2026-06-15：AGENTS.md 改為「Motion 已安裝並使用中；GSAP/Lenis 未安裝」，與 README 一致）。
2. demo/local DB 邊界整合測試「可行性盤點」：先列缺口與測試方案，不直接大改（對應 README future 第一項）。
3. 作品集 closeout 檢查：確認 README、live demo、demo/local 邊界說明、CI 狀態彼此一致。

## Deferred / Explicit Approval Required

> 以下為已討論但**不屬於**目前 Maintenance / 收尾階段的項目，預設不執行。

* ~~**Cinematic UI 優化 pass（GSAP + Lenis）**~~ 已於 2026-08-23 執行，見階段 2 / 階段 3 紀錄。
* ~~**其餘頁面的版面重做**~~ 已於 2026-08-23 執行（階段 3）。全站版面改版完成。

## Forbidden Scope

* Do not expose or print secrets.
* Do not modify env files（`.env` / `.env.example`）。
* Do not change demo/local DB boundary（`DEMO_MODE` 判斷、`db.demo.ts` stub、`next.config.ts` alias）unless explicitly requested.
* Do not replace the current README structure unless explicitly requested.
* Do not install new packages unless explicitly confirmed（AGENTS.md）。
* Do not push without explicit instruction.

## Standard Validation

本 repo `package.json` 實際存在的指令（不存在者標 N/A）：
* Lint: `npm run lint`
* Typecheck: `npm run typecheck`
* Test: `npm run test`
* Build: `npm run build`
* （CI 順序：typecheck → test → build，build 帶 `DEMO_MODE=1`）

## Handoff Prompt

Next assistant / Claude Code session should first read:

* `D:\ClaudeCode\WORKSPACE_STATE.md`
* `CLAUDE.md` / `AGENTS.md`（本 repo；CLAUDE.md 內容為 `@AGENTS.md`，並讀 `.claude/rules/`）
* `PROJECT_STATE.md`（本檔）
* `README.md`
* `package.json`
* `git status --short`（在本 repo 內執行，勿用 `D:\ClaudeCode` 根目錄狀態）
* `git log --oneline -5`

Then it should only execute Current Phase or Next 3 Allowed Tasks.
Do not reopen completed phases.
Do not broaden scope.

---

## 2026-08-23 階段 1：移除 BT 下載功能（已完成）

使用者明確指示把 Treehole 收斂為純電影導覽站，並開啟新的 design phase。

**刪除**：`src/lib/prowlarr.ts`、`src/lib/qbittorrent.ts`、`src/app/api/torrents/`（2 個 route）、
`src/components/DownloadButton.tsx`、`src/__tests__/prowlarr-utils.test.ts`、
`docs/screenshots/detail-{desktop,mobile}.png`

**修改**：詳情頁移除掛載與 `downloadQuery`；`dictionaries.ts` 移除 `download` 區塊與 `actions.download`
（620 → 535 行）；`layout.tsx` metadata；`.env` / `.env.example` 移除 `PROWLARR_*` `QBITTORRENT_*`
（使用者明確授權解除 env 禁令）；README / AGENTS.md 改寫為純導覽敘事。

**未動**：SQLite 片庫（收藏／想看／已看過／評分／搜尋紀錄）、`DEMO_MODE` 判斷邏輯、
`db.demo.ts` stub、`next.config.ts` alias、Vercel 部署設定。

**已確認的設計方向（階段 2）**：MUBI 式編輯策展、換字體（含中文字型）、給一個強調色、
授權安裝 GSAP + Lenis、拿掉首頁自動輪播 hero、先做首頁 + 詳情頁定調、雙語維持。

---

## 2026-08-23 階段 2：首頁與詳情頁改版（已完成）

方向由使用者選定：**MUBI 式編輯策展**。Dials：VARIANCE 6 / MOTION 5 / DENSITY 3。
刻意不把 variance 拉更高——MUBI 的版面其實相當規律，識別來自留白與字體；
這是找片工具，打散版面會直接傷害功能。

**新套件（使用者明確授權）**：`gsap` ^3.15.0、`lenis` ^1.3.26

**新增元件**：`SmoothScroll`（Lenis + GSAP ticker 接線）、`ParallaxImage`、
`FeatureFilm`（取代 HeroCarousel）、`RankedList`、`UpcomingStrip`

**刪除**：`HeroCarousel.tsx`（自動輪播）

**Token 層**（`globals.css`）：形狀鎖 radius 0、中性三階 + 單一強調色 curtain red、
`.t-film` / `.t-section` / `.t-prose` / `.t-meta` 字級、`.btn-line` / `.btn-solid`、
`.scrim-bottom`、`.rail-gutter`、`.page-shell`、`.tap-safe`、`.reveal`

**字體**：Bodoni Moda + Noto Serif TC + Geist，全部走 `next/font`。
Noto Serif TC 設 `preload: false`（CJK 檔大），已實測確認 CJK 分片有實際載入。

**改版過程中修掉的真實 bug**：
1. `whileInView` 揭露在快速捲動時可能整段不觸發，內容永久停在 opacity 0
   → 改用 CSS `animation-timeline: view()`，預設可見
2. 手機版片名壓在劇照上可讀性取決於該張劇照亮度 → 改為影像與文字上下分離
3. `RankedList` 的 `<li>` 是 grid item（預設 `min-width: auto`），內含 `truncate`
   標題把它撐到 min-content 寬度，造成手機整頁橫向溢出 → 加 `min-w-0`
4. 觸控目標：wordmark 20px、語言鍵 25px、漢堡鍵 36px → 全數補到 44px（`.tap-safe`）
5. `prefers-reduced-motion` 原本一刀砍掉所有 transition，連狀態回饋一起殺掉
   → 改為只停 animation 與 transform，保留顏色／邊框過渡
6. 兩個既有 lint error（`error.tsx`、`HistoryList.tsx` 的 effect-setState）
   → 改用 `useSyncExternalStore`；`HistoryList` 順帶讓相對時間每分鐘刷新

**其餘頁面**：只做 token 對齊（配色／圓角／字體），版面未重做。

**環境注意**：Turbopack 的 CSS 快取會漏掉新加的 class（`.tap-safe` 就中過）。
改 `globals.css` 後若樣式沒生效，先 `rm -rf .next` 再重啟，不要先懷疑程式碼。

---

## 2026-08-23 階段 3：其餘頁面全部重做（已完成）

**核心問題**：階段 2 之後，10 個頁面共用同一面六欄海報牆——熱門、評分最高、最賣座、
即將上映、瀏覽、搜尋結果、三個片庫頁、人物作品。使用者分不出自己在哪一頁。

**解法：依每頁的用途分成四種版面。**

| 版面 | 用在哪 | 為什麼 |
|---|---|---|
| 海報牆 | 熱門、瀏覽、搜尋結果、片庫、人物作品 | 沒有排序意義，就是一面牆 |
| 編號海報牆 | 評分最高、最賣座 | 名次才是這兩頁的內容 |
| 日期劇照格 | 即將上映 | 未上映的片重點是「哪一天」，且常常還沒有成品海報 |
| 編輯清單 | 搜尋紀錄 | 每列是一次獨立搜尋且帶時間戳，那是清單不是標籤 |

**海報牆本身也改了**：欄數由 `xl:grid-cols-6` 降到 `xl:grid-cols-5`，
`gap-y` 由 4 加到 10。海報大一階、行距鬆一階，符合「慢慢挑」。

**新元件**：`SearchField`（同頁兩種尺寸）、`UpcomingCard`（首頁橫列與 /upcoming 共用）
**MovieGrid 匯出 `POSTER_GRID`**，成為全站唯一的海報牆格線定義。

**各頁重點**：
- **browse**：篩選列改成黏在導覽列下的控制條（手機單排橫捲、桌機換行），
  條件摘要寫成一句話並加 `aria-live`
- **search**：有關鍵字時，關鍵字本身就是刊頭（襯線大字）+ 結果數；
  沒有關鍵字時搜尋框是主體，紀錄改為 hairline 清單
- **片庫三頁**：卡片語彙終於與 MovieCard 一致（先前還留著 hover 放大 + 海報上壓評分徽章
  的舊實作）。「拿掉」改為常駐低對比、hover 轉簾幕紅——原本是 hover 才出現，
  觸控裝置根本找不到
- **person**：照片欄寬度與詳情頁的海報欄同尺度，讓「人」與「片」是同一個系統
- **404 / error**：數字與標題用襯線大字，與片名同一個字體系統
- **骨架**：形狀對齊改版後的版面（刊頭 + 五欄牆／出血劇照帶），避免資料到位時重排

**修掉的問題**：
1. 手機篩選列換行後，黏住的控制條 + 導覽列吃掉 26% 螢幕 → 改單排橫捲
2. `SearchField` 送出鍵：`.btn-line` 在 layer 外，border 蓋過 Tailwind 的 `border-0`
   → 改成純文字鍵，不與輸入框的底線打架
3. `HistoryList` 改寫時誤留一個永遠渲染空字串的節點 → 已清掉

**環境注意**：**dev server 執行中不要 `rm -rf .next`**，會讓 Turbopack
找不到 manifest 而整站 500。要清快取先 stop server。

---

## 2026-08-23 階段 4：圖片 srcset（已完成）

原本每個 `<img>` 都寫死一個尺寸，不管裝置是什麼。

**先查證再動手**（實際請求 TMDB，不憑記憶）：
- TMDB **只服務固定的幾個寬度**，`w999` 回 **400**，不是任意值都行
- `configuration` 的 `profile_sizes` 只列 w45 / w185 / h632 / original，
  但 `w342`、`w500` 對人物照實測回 200——CDN 接受的是所有類別寬度的聯集
- backdrop 實測：**w1280 = 212KB、w780 = 85KB、w300 = 17KB**

**做法**：`tmdbSrcSet(path, kind)` 依素材類別產生候選寬度；
`IMAGE_SIZES` 集中放各版面槽位的 sizes 字串。

| kind | 候選寬度 | 為什麼停在這 |
|---|---|---|
| poster | 185 / 342 / 500 | 最大顯示槽約 260px，3x 螢幕下 w500 仍有 1.9 倍密度，w780 只是變大 |
| backdrop | 300 / 780 / 1280 | 出血劇照，桌機需要 1280 |
| profile | 185 / 342 | 最大顯示槽 220px，w342 在 2x 剛好夠 |

**實測效果**（瀏覽器實際挑的檔案）：
- 375px @2x 首屏劇照：w1280 → **w780**（212KB → 85KB，-60%）
- 1280px @2x 格線海報：w342 → **w500**（原本 0.75 倍密度，是糊的；這是畫質修正不是省流量）
- 小縮圖（編號榜 48px、演員卡 112px）：正確落在 w185

**測試**：43 → 50。新增的測試不只比對字串，還鎖住兩個會靜默壞掉的性質——
候選寬度必須都在 TMDB 實際服務的清單內，且每個 sizes 的最後一項不能帶媒體條件
（否則不符合條件時瀏覽器退回 100vw 挑最大的檔案）。

**未處理**：`TrailerPlayer` 的 YouTube 縮圖仍是固定 `hqdefault`（480px）。
YouTube 的 `maxresdefault` / `sddefault` **不保證每支影片都存在**，
srcset 挑到不存在的檔案不會退回、會直接壞圖。寧可稍微糊也不要壞圖。

---

## 2026-08-23 階段 5：移除截圖（已完成）

三輪改版後，`docs/screenshots/` 的 4 張圖沒有一張還準（版面、配色、字體全換了），
而且現在全站有四種版面，補拍等於要拍八張。使用者判斷這是自用專案，不需要維護
對外的截圖，直接移除。

**刪除**：`docs/screenshots/` 全部 4 個 PNG（合計約 8.2 MB）
**README**：移除整個 `## Screenshots` 區塊

舊圖仍在 git 歷史裡（commit `3249b1a` 之後），要回復用 `git show` 取即可。

> 若日後要重新對外，README 的作品集敘事（標題、live demo、設計決策段落）
> 都還在，只缺截圖區——補拍後把區塊加回去就好。
