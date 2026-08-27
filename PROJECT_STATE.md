# PROJECT_STATE

> 產出日期：2026-06-15
> 僅針對 `movie-app`（Treehole）repo 據實盤點；git 狀態皆在本 repo 內判斷。
> 本次只做狀態盤點：未改產品程式碼 / README / package.json / env / Vercel / CI 設定，未跑 formatter / migration / test / build。

## Repo Identity

* Repo path: `~/ClaudeCode/projects/movie-app`（2026-07-30 由 Windows 遷至 Mac）
* Repo type: Next.js 16 全端 Web App（git repo，有 GitHub remote）
* Primary purpose: Treehole——TMDB 電影導覽 + 私人片庫。**2026-08-27 起線上版即正式版**（Vercel + Neon Postgres，全站鎖給擁有者一人）
* Current status: 階段 1–15 完成。階段 15（雲端化 + 擁有者鎖）已本機驗證完畢，**尚未 commit / push**

## Git Status

* Branch: `main`
* Latest commit: 見 `git log`（本檔的階段紀錄已滾到階段 11）
* Working tree: clean（`git status --short` 無輸出）
* Remote: `origin` → `https://github.com/zhuang060329-bit/treehole-movie-app.git`（依備忘為 private）
* Sync status: 與 `origin/main` 同步（`## main...origin/main`，無 ahead / behind）

## Product Status

* Production / deployment: Vercel + Neon Postgres（`https://treehole-movie-app.vercel.app`，真實讀寫，通行碼保護）；本 repo **無 `vercel.json`**（部署設定在 Vercel 端，未進 repo），另有 `.vercelignore`。AGENTS.md：不動 Vercel 部署設定，除非明確指示
* README status: Treehole 標題、部署連結（載明需通行碼）、features、Access 一節、設計決策、tech stack、architecture、testing、資料位置、future。**2026-08-23 移除截圖區**（階段 5）；**2026-08-27 移除 demo/local 對照表與備份說明**（階段 15）
* CI status: 有 GitHub Actions `.github/workflows/ci.yml`，push / PR 到 main 觸發 `typecheck → lint → test → build`。**build 不再帶 `DEMO_MODE=1`**，也不需要 `DATABASE_URL`——DB client 是 lazy 的，建置期不連線。actions 為 `@v7`、Node 24。`.github/dependabot.yml` 同時監看 npm 與 github-actions
* Test status: Vitest；**63 tests / 6 files**（utility 層 + 擁有者鎖 session token），2026-08-27 實測通過。lint 已清到 0 error 0 warning
* Access control: `src/proxy.ts` 是唯一授權檢查點，擋在所有頁面與 route handler 之前。通行碼換 HMAC 簽章 cookie（`src/lib/owner-session.ts`）。`OWNER_PASSCODE` / `OWNER_SECRET` 缺任一則全站鎖死（fail closed）。**demo 模式已於階段 15 整套移除**
* Known limitations: route handler 與 proxy 無整合測試（目前靠手動驗證）；DB 層無自動化測試（以真實 Neon 手動驗過）；通行碼無 rate limit，僅固定延遲——serverless 無可靠共享狀態

## Tech Stack

* Framework: Next.js 16.3.2（App Router、Turbopack，port 3100）+ React 19.2.8 + TypeScript 6
* Data source: TMDB API（v3 key / v4 token，全部 server-side）
* Database: Neon Postgres，`@neondatabase/serverless` ^1.1.0（HTTP driver，非 TCP pool）
* Access control: 自建擁有者鎖（`src/proxy.ts` + `src/lib/owner-session.ts`，Web Crypto HMAC-SHA256）；TMDB key 為 server-side
* Styling: Tailwind CSS v4（`@tailwindcss/postcss`）
* Testing: Vitest（`vitest.config.ts`）
* Deployment: Vercel。本機開發連同一個 Neon DB（bind `0.0.0.0`）。CI 建置在 Node 24

> 動畫套件現況（2026-08-23 更新）：`gsap` ^3.15、`lenis` ^1.3、`motion` ^13.1 皆已安裝並使用中。分工見 AGENTS.md。

## Available Commands

（來源：`package.json` scripts，確實存在）
* Lint: `npm run lint`（`eslint`）
* Typecheck: `npm run typecheck`（`tsc --noEmit`）
* Test: `npm run test`（`vitest run`）；watch：`npm run test:watch`
* Build: `npm run build`（`next build`）
* Dev: `npm run dev`（`next dev -H 0.0.0.0 -p 3100`）
* Other: `npm run start`（`next start -H 0.0.0.0 -p 3100`）

## Completed Work

> 僅依 README、commits、實際檔案整理，未腦補。

* ~~Vercel demo：已部署，`DEMO_MODE=1` 運作~~ **階段 15 推翻**：改為真實讀寫的正式版。
* ~~Demo mode：寫入動作 disabled + 誠實空狀態~~（commit `92a8b3d`）**階段 15 移除**。
* ~~better-sqlite3 / `db.demo.ts` alias~~ **階段 15 移除**，改為 Neon Postgres。
* GitHub Actions：`ci.yml`（typecheck→lint→test→build）+ `dependabot.yml` 已建立。
* 雲端化 + 擁有者鎖：階段 15，見下方紀錄。
* UI cinematic pass：一系列互動 / 質感 commit（`5bf0af0 優化電影卡片與詳情頁互動質感`、`14a18b6`、`6f423dd`、`f15db11`、`22623a1` 等）。
* demo mode action / empty-state semantics：見上 `92a8b3d`。
* final README correction：近 4 個 commit 整理作品集 README（`9bd48ad`、`d5adfd1`、`2643879`）與文案語義（`c5053f4`、`1cac0cb`）。

## Current Phase

* Phase: 雲端化收尾（階段 15 段 4：文件更新 + commit）
* Goal: 讓線上版成為唯一的正式版——資料存得住、只有擁有者進得去、文件與實際一致。
* Success criteria: typecheck / lint / test / build 全綠、文件無 demo 殘留、線上部署後片庫讀寫與通行碼實測通過。

## Next 3 Allowed Tasks

1. 部署後線上實測：通行碼可進、片庫四種操作可寫入 Neon、重新整理後仍在。
2. Neon 資料庫密碼 reset（明文曾出現在對話紀錄中）。
3. route handler / proxy 的整合測試可行性盤點——先列缺口與方案，不直接大改。

## Deferred / Explicit Approval Required

> 以下為已討論但**不屬於**目前 Maintenance / 收尾階段的項目，預設不執行。

* ~~**Cinematic UI 優化 pass（GSAP + Lenis）**~~ 已於 2026-08-23 執行，見階段 2 / 階段 3 紀錄。
* ~~**其餘頁面的版面重做**~~ 已於 2026-08-23 執行（階段 3）。全站版面改版完成。

## Forbidden Scope

* Do not expose or print secrets.
* Do not modify env files（`.env` / `.env.example`）。
* Do not move authorization out of `src/proxy.ts`, and do not make the lock fail open.
* Do not commit `DATABASE_URL`, `OWNER_PASSCODE` or `OWNER_SECRET` values into the repo or into documentation.
* Do not replace the current README structure unless explicitly requested.
* Do not install new packages unless explicitly confirmed（AGENTS.md）。
* Do not push without explicit instruction.

## Standard Validation

本 repo `package.json` 實際存在的指令（不存在者標 N/A）：
* Lint: `npm run lint`
* Typecheck: `npm run typecheck`
* Test: `npm run test`
* Build: `npm run build`
* （CI 順序：typecheck → lint → test → build，無需 `DATABASE_URL`）

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

---

## 2026-08-23 階段 6：刊頭收斂與字典清理（已完成）

使用者回報功能頁的標題「很聒噪」。實際結構是三層：
eyebrow + 標題 + 副標，其中兩層是多餘的。

- **eyebrow 只是把剛點過的導覽項再唸一次**：點「收藏」進來，上面再寫一次「收藏」
- **副標是一句不影響任何操作的軟話**：「捨不得放掉的那些片，都在這裡。」
  這類話在空狀態文案裡已經講過一次

**做法**：`PageHeader` 收斂為 `{ title, meta }`，eyebrow 與 subtitle 兩個 prop 直接移除。
標題本身的括號補語也一併拿掉。

| 頁面 | 之前 | 之後 |
|---|---|---|
| 熱門 | 熱門電影 | 熱門 |
| 即將上映 | 即將上映（台灣） | 即將上映 |
| 最賣座 | 史上最賣座（票房） | 最賣座 |
| Top Rated | Top Rated of All Time | Top Rated |
| Popular | Popular Movies | Popular |

**全站現在只剩兩個 eyebrow**，兩個都有作用：
1. 首頁開場「今晚這部」——標示這是編輯選片
2. 搜尋結果「搜尋結果」——標示那個襯線大字是使用者的關鍵字，不是片名

這才真正符合 design-guardrails 的 eyebrow 配額規則（先前每頁都有，是違規的）。

**順帶清掉 19 個死鍵**（改版累積下來沒人用的字典項）：
`nav` 的 6 個未在導覽列出現的項、`pages` 的 5 個被 `library`/`browse` 取代的標題、
`movie` 的 5 個標籤（版面改版後不再顯示標籤文字）、`search.prompt`、
`actions.comingSoon`（BT 移除後遺留）、`history.clear`。

**`language.label` 沒刪，改成有用的**：語言切換原本是兩顆沒有群組語意的按鈕，
現在包上 `role="group" aria-label`，螢幕閱讀器才知道那兩顆是一組。

---

## 2026-08-23 階段 7：標題改為直白名稱（已完成）

承階段 6，使用者要求連標題本身的文藝腔也拿掉。

| 頁面 | 之前 | 之後 |
|---|---|---|
| /favorites | 留下來的 / The ones you kept | 收藏 / Favorites |
| /watchlist | 排隊中 / Waiting in line | 想看 / Watchlist |
| /watched | 走過的 / Films you've seen | 已看過 / Watched |
| /browse | 慢慢挑 / Take your time | 瀏覽 / Browse |
| /search | 在找哪一部? / What are you looking for? | 搜尋 / Search |
| /top-rated | 影史評分最高 | 評分最高 |

**首頁策展列一併處理**（同一個腔調，且原本與目的地頁面對不上）：
大家在看的→熱門、還沒上映的→即將上映、最賣座的→最賣座、
評分最高的→評分最高、為你挑的→為你推薦。

現在**每一條策展列的標題與它連到的頁面標題完全一致**——先前
「大家在看的」連到標題是「熱門電影」的頁面，同一個目的地兩個名字。

**順帶修掉一個視覺 bug**：三個空狀態（`MovieGrid`、`InfiniteMovieGrid`、
`LibraryGrid`）都畫了 `border-t`，但它們緊接在 `PageHeader` 的 `border-b`
下方，畫面上是兩條相距 27px 的平行線，看起來像畫錯。已移除，並在
`LibraryGrid` 加註說明避免以後又加回來。

**未動**：空狀態的引導句（「清單還空著。挑幾部，排進來。」）保留——
那不是標題，而且空狀態本來就需要一句話告訴使用者下一步做什麼。
首頁的 eyebrow「今晚這部」也保留，它標示的是「這部片是被挑出來的」，
有實際作用。

---

## 2026-08-23 階段 8：TypeScript 升到 6.0.3（已完成）

起因是 dependabot 的 `typescript 5.9.3 → 7.0.2` PR（#8）CI 掛掉。

**查證出來的根因**：TypeScript 7 是 Go 改寫的原生版，**不再提供 JS 編譯器 API**。

| 版本 | 根進入點 | `lib/typescript.js` |
|---|---|---|
| 5.9.3 | `./lib/typescript.js` | 有 |
| 6.0.3 | `./lib/typescript.js` | 有 |
| 7.0.2 | `./lib/version.cjs`（只有版本號） | **沒有** |

Next 16.2.6 的 `verify-typescript-setup` 是用 `existsSync('typescript/lib/typescript.js')`
做檢查，不是能力探測，所以 TS 7 一律被判定為「沒安裝」。

**為什麼 `Type check` 過但 `Build` 掛**：`npm run typecheck` 跑的是 `bin/tsc`
執行檔（TS 7 還有），`next build` 要的是 JS 模組形式的 API（TS 7 沒有）。
兩條不同路徑，不是矛盾。log 裡的 `Segmentation fault`（exit 139）發生在
build worker 已經 `exited with code: 1` **之後**，是 Next 錯誤處理的問題，
不是 TS 7 造成的當機。

**選 TS 6 的依據**：Next 16.3.2 的原始碼把 typescript 檢查拆成 API 與 CLI 兩個，
API 那個明寫 `install: 'typescript@^6.0.0'`——官方支援的 API 線是 6，不是 7。
（16.3.x 另有 `experimental.useTypeScriptCli` 可走 CLI 路徑吃 TS 7，但那是
experimental，且要同時升 Next，兩個變動疊加。）

**相容性事前查證**：`@typescript-eslint` 8.60.0 宣告 `typescript: >=4.8.4 <6.1.0`，
6.0.3 在範圍內；`eslint-config-next` 要 `>=3.3.1`；`next` 未宣告 typescript peer。

**實測**：typecheck / lint / 50 tests / `DEMO_MODE=1 build` 全過。
建置 log 出現 `Running TypeScript ...` 且成功——正是 TS 7 掛掉的那一步。
`next.config.ts` 沒有 `ignoreBuildErrors`，所以檢查確實有跑。
dev 模式 8 條路由實測 200，無 server error。

**PR #8（TS 7）未合併**，理由如上。等 Next 穩定支援 TS 7 再說。

---

## 2026-08-23 階段 9：清理 dependabot 積壓的相依更新（已完成）

**沒有直接合併那些 PR**——它們的 CI 是跑在舊 main 上（Node 20 + actions v4 + TS 5），
綠燈不保證在新環境成立。改為逐一在本地升級並各自驗證。事後證明這是對的，
其中一個在新環境會直接崩潰。

| 套件 | 之前 | 之後 | 備註 |
|---|---|---|---|
| `next` | 16.2.6 | **16.3.2** | 安全修補，見下 |
| `eslint-config-next` | 16.2.6 | 16.3.2 | 與 next 綁定 |
| `@types/node` | ^20 | **^24.13.3** | 對齊 CI 的 Node 24，不採 dependabot 提的 26 |
| `react` / `react-dom` | 19.2.4 | **19.2.8** | |
| `@types/react` | 19.2.15 | 19.2.18 | |
| `@types/react-dom` | 19.2.3 | 19.2.4 | |
| `eslint` | 9.39.4 | **9.39.5** | 停在 9.x，見下 |

### npm audit：6 個 high → 0

跑 `npm audit` 才發現這批更新其實是安全修補：

1. **PostCSS 路徑穿越**（GHSA-r28c-9q8g-f849）——next 16.2.6 內含 postcss 8.4.31，
   16.3.2 換成 8.5.23
2. **sharp <0.35.0** 繼承 libvips 的 CVE-2026-33327 / 33328 / 35590 / 35591
   ——升級後實裝 0.35.3
3. **js-yaml**（CVE-2026-59870）——來自 `eslint → @eslint/eslintrc → js-yaml`。
   eslint 修補版 9.39.5 把 eslintrc 帶到 3.3.6、js-yaml 帶到 4.3.1 就解決了，
   不需要跳 major

### eslint 10 不可行（已實測，不是推測）

裝了 10.9.0 之後 `npm run lint` **直接崩潰**：

```
TypeError: Error while loading rule 'react/display-name':
contextOrFilename.getFilename is not a function
  at .../eslint-config-next/node_modules/eslint-plugin-react/lib/util/version.js
```

`eslint-plugin-react` 呼叫 `context.getFilename()`，eslint 10 已移除該 API。
而 `eslint-plugin-react` **7.37.5 已經是最新版**，peer 宣告
`eslint: ^3 || … || ^9.7`——沒支援 eslint 10，也沒有可以 override 的較新版本。
等 eslint-plugin-react 跟上再說。

### 還原精確釘版

`npm install` 會把 `next` / `react` / `react-dom` / `eslint-config-next` 從精確
釘版改成 caret。那是專案原本刻意的慣例（Vercel demo 要可重現），已手動還原。

### 驗證

typecheck / lint / 50 tests / `DEMO_MODE=1` build 全過；`npm audit` 0 vulnerabilities；
dev 模式 15 條路由實測正確、無 server error。lint 另用探針檔實測規則確實會觸發，
不是靜默跳過。

---

## 2026-08-23 階段 10：CI 加 lint、清完剩餘相依（已完成）

**CI 加上 lint 步驟**。加的理由是實例而不是原則：eslint 10 的 dependabot PR
拿到綠燈，但本地跑 lint 會直接崩潰——CI 只跑 typecheck / test / build，
沒跑 lint，那個綠燈是假的。現在順序是 `typecheck → lint → test → build`。

**四個相依更新**：

| 套件 | → | 驗證方式 |
|---|---|---|
| `tailwindcss` | 4.3.3 | patch，標準驗證 |
| `vitest` | 4.1.11 | patch，標準驗證 |
| `better-sqlite3` | **13.0.3** | 見下 |
| `motion` | **13.1.1** | 見下 |
| `@types/better-sqlite3` | 7.6.13 → 9.6.0 | 隨 better-sqlite3 |

### better-sqlite3 13：只跑 build 不算驗證

13.0.0 改用 N-API，prebuilt binary 直接隨套件發布。`engines: node >=22`，
CI 的 24 符合。新增 `db.explain()` 與 `preparedStatement.toString()`，
沒有移除既有 API。

**關鍵**：`npm run build` 帶 `DEMO_MODE=1`，會把 `@/lib/db` 換成 stub，
**根本沒碰到真的 SQLite**。所以另外跑 local 模式實測：
POST 寫入 → 直接從 DB 讀回確認 → DELETE → 確認殘留 0。
動手前已備份 `data/movies.sqlite`。

### motion 13：唯一驗得出來的方式是真的刪一張卡

`LibraryGrid` 用 `AnimatePresence` + `mode="popLayout"` 做移除動畫，
typecheck 過不代表動畫還在。實際在瀏覽器點「拿掉」：卡片消失、
計數 2 部 → 1 部、剩下的卡片平順遞補，DB 同步刪除。

### 測試污染與復原（記錄下來以免重演）

瀏覽器測試過程中誤觸了詳情頁的「收藏」與「標記已看過」，把
`蜘蛛人：重生日`（969681）寫進真實片庫。已透過 API 移除，資料庫回到
與備份完全一致的 4 / 0 / 4 / 0。

**教訓**：在 local 模式（非 DEMO_MODE）用瀏覽器測試會動到真實資料。
下次要嘛先備份、要嘛改用 `DEMO_MODE=1 npm run dev`。

### dependabot ignore 規則已驗證生效

不是靠 YAML 語法推論——dependabot 重跑後自己把 PR 關掉，而且標題顯示
基準已重算（`#8 from 6.0.3 to 7.0.2`、`#6 from 24.13.3 to 26.2.0`）。

`npm audit`：0 vulnerabilities。

---

## 2026-08-23 階段 11：Tailwind 配對同步、片庫備份（已完成）

### `@tailwindcss/postcss` 漏升

`npm outdated` 抓到的：`tailwindcss` 已經 4.3.3，但 `@tailwindcss/postcss`
還停在 4.3.0。這兩個是配對的套件，dependabot 的 PR 只提了前者，我也只升了
前者。已補到 4.3.3。

驗證方式不只跑 build——另外檢查產出的 CSS chunk 確實含有全部自訂 class
（`.page-shell` / `.rail-gutter` / `.scrim-bottom` / `.tap-safe` / `.reveal` /
`.btn-line` / `.t-film`），確認 Tailwind 沒有靜默失效。

`gsap` 3.15.0 與 `lenis` 1.3.26 查證後皆已是最新，無事可做。

### 片庫備份：先前那份是壞的

`data/movies.sqlite` 跑 **WAL 模式**。實際狀況是主檔只有 28KB 且 mtime 停在
7/30，而 `-wal` 檔有 **436KB**——近期資料幾乎全在 WAL 裡。

也就是說階段 10 我用 `cp` 複製單一 `.sqlite` 檔做的那份備份，內容其實是
七月的狀態，真要拿來還原會丟掉之後所有資料。當時沒用到，運氣好。

已改用 `db.backup()` 重做，它會把 WAL 內容 checkpoint 進目的檔：

```
data/movies.sqlite.2026-08-23.bak
  favorites 4 / watchlist 0 / watched 4 / ratings 0 / search_history 5
  integrity_check: ok
```

`.gitignore` 加上 `/data/*.bak`（含 `-wal` / `-shm` 附屬檔），並在註解裡寫明
**不能用 cp**，要用 `db.backup()`。

> 後續：階段 13 已做成 `npm run backup`，這一項不再是缺口。

---

## 2026-08-23 階段 12：無效 ID 的處理與 404 文案（已完成）

impeccable 更新到 v4.1.1 後的全面檢查中發現的。

### 無效 ID 原本回 200 配一句錯誤訊息

`/movie/abc`、`/movie/0`、`/person/0`、TMDB 查無此 id ——這些以前都是
回 HTTP 200，然後在版面中央塞一個 `ErrorNotice`。已經有設計好的 404 頁
卻沒被用到。

改用 Next 的 `notFound()`：id 格式不對、或 TMDB 回 `not-found` 分類的錯誤，
都導向 404 頁。其他錯誤（金鑰、網路、5xx）維持 `ErrorNotice` ——
那類是「這頁存在但現在載不出來」，語意不同。

### 狀態碼仍是 200，這是串流的既定取捨

`notFound()` 之後狀態碼還是 200。查 `node_modules/next/dist/docs` 的
`not-found.md` 確認這是**文件載明的行為**，不是實作錯誤：

> Because the check runs inside the `<Suspense>` boundary, the response has
> already begun streaming as a `200`, and the status can't change once
> streaming has started. The `noindex` tag keeps a soft 404 out of search
> results. To return a real `404` status, the resource has to be checked
> before the response streams... run that check in `proxy` instead.

已驗證 Next 確實注入了 `<meta name="robots" content="noindex">`（無效 id 有、
正常頁沒有），那是官方指定的緩解手段。要真正的 404 狀態碼得寫 `proxy`，
而 proxy 只能檢查 id 格式、無法得知 TMDB 有沒有這筆，價值有限，未實作。

### 404 頁的文案張冠李戴

`not-found.tsx` 用的是 `dict.errors.notFound` =「找不到這部電影。」，
但這頁也會接到人物頁的 404 ——人物頁講電影。新增
`errors.pageNotFound`（「找不到這個頁面。」/ Page not found.）給 404 頁用；
`errors.notFound` 保留給 `tmdb-error` 的 not-found 分類，那裡確實在講電影。

### 這一輪的教訓

測試時 `npm run start` 因為 port 3100 被舊行程佔用而啟動失敗（EADDRINUSE），
我卻對著舊建置驗證了兩輪、得到錯誤結論。**先確認 server 真的起來了再測。**
另外 grep HTML 找文案會撞到序列化進 RSC payload 的完整字典，
要看實際畫面請用瀏覽器而不是 grep。

---

## 2026-08-24 階段 13：片庫備份指令（已完成）

`npm run backup` → `scripts/backup-db.mjs`。

**要解的問題**：`data/movies.sqlite` 是使用者唯一一份個人資料，正確地被
gitignore 排除，但也因此沒有任何副本。程式碼有 git 保護，這份累積型資料沒有。

**設計上的兩個堅持**：

1. **走 `db.backup()`，不用 `cp`** ——WAL 模式下主檔可能停在數週前，
   近期資料全在 `-wal`。階段 10 我就用 `cp` 做出過一份「看起來正常但內容
   過期」的備份。
2. **備份完一定驗證** ——開檔、`integrity_check`、逐表比對筆數。
   驗證失敗就刪掉那份備份並回傳非 0。壞掉的備份比沒有備份更危險，
   它會讓人以為自己有保障。

### 寫完之後測出兩個 bug，都修了

寫得出來不等於能用。用「故意產生壞備份」與「同秒連跑」兩個情境測，各抓到一個：

- **備份檔壞掉時腳本直接崩潰，壞檔留在原地**。`new Database()` 對非 SQLite
  檔會拋 `SQLITE_NOTADB`，而它原本在 try 區塊外面——最該被攔下的情況反而
  變成未捕捉的例外。改成連開檔都包進 try。
- **同一分鐘內重跑會覆蓋掉前一份備份**。檔名原本只帶到分鐘，實測時就這樣
  蓋掉了一份好的備份。改成帶到秒，且若檔名已存在就加序號，絕不覆蓋。
  「備份指令毀掉你的備份」是最不能接受的失敗方式。

修正後重測：同秒連跑三次產生三份獨立檔案；壞備份被攔下、自動刪除、
結束碼 1、備份總數不變。另外把備份檔當 `movies.sqlite` 開起來實測還原，
五張表資料完整。

**刻意不做的**：不自動刪舊備份。超過 10 份時只印出數量與總大小提醒，
刪不刪由使用者決定——這個指令不會動已存在的備份檔。

README 補了備份與還原的說明；AGENTS.md 加了「片庫資料」一節，
寫明動資料層前先備份、不要用 `cp`、以及 local 模式測試會寫真資料庫。

---

## 2026-08-24 階段 14：正式版全面檢查（已完成）

### 使用者回報「收藏和想看點不了」——是我留下的建置產物

`.env` 沒有設 `DEMO_MODE`、程式碼也沒問題，但 `.next` 是我最後一次驗證時用
`DEMO_MODE=1 npm run build` 建的。`next.config.ts` 的 turbopack `resolveAlias`
在**建置時**把 `@/lib/db` 換成 `db.demo.ts`，stub 就被烤進產物裡。
之後跑 `npm run start` 拿到的就是 demo 版：按鈕 disabled、附一句
「這個 demo 不會保存」。

已清掉重建。**這是個會再犯的陷阱**——`npm run start` 不會告訴你這份 `.next`
是哪種模式建的，畫面上唯一線索是那句 demo 提示，很容易誤判成壞掉。
驗證完 demo 建置後務必重建。

### 檢查中新發現的兩個觸控目標問題

1. **`.btn-line` 只有 43.5px**。原本靠 padding 加總去湊 44，但那會隨字體
   度量浮動——實測差半個像素。改成直接鎖 `min-height: 44px`，不依賴字型。
2. **詳情頁的導演連結只有 55×17px**。它是夾在 metadata 文字行裡的行內連結，
   先前補觸控目標時漏掉。不能套 `.tap-safe`（`inline-flex` + `min-height`
   會把那一行的基線推歪），新增 `.tap-inline` 用偽元素往外擴 14px，
   版面完全不動。已用 `elementFromPoint` 驗證上下各 10px 都能點中。

### 其餘檢查結果

18 條路由（含 `/movie/abc`、`/person/0`、`/no-such` 等邊界）全部正確；
每頁恰好一個 `h1`；375px 無橫向溢出；行動版無小於 44px 的觸控目標；
兩種建置模式都能過；detector 0 findings；`npm audit` 0 vulnerabilities。

端到端實測寫入：在詳情頁點「想看」→ 確認 SQLite 有這筆 → 再點一次取消
→ 確認已清除。

### 測試污染已清理

路由檢查打了 `/search?q=dune` 與 `/search?q=zzzznotexist`，搜尋頁依設計會
記錄。加上先前的「不存在的片名測試」，共三筆是我留下的。因為
`/api/history` 只支援「全部清除」、沒有單筆刪除，改為先 `npm run backup`
再直接從資料庫精準刪那三筆。使用者原有的四筆完整保留。

---

## 2026-08-27 階段 15：線上版轉正式版（雲端片庫 + 擁有者鎖）

使用者定調：**「這才是我真正的目標 我把線上版本當作是正式版」**。
線上站必須真的存得住收藏／想看／已看過／評分，本機版作廢。

### 開工前確認的六項決定

| | 決定 |
|---|---|
| A1 | 全站鎖給擁有者一人 |
| B | 本機版完全作廢 |
| C | 本機那 12 筆**不遷移** |
| D | 只用免費方案 |
| E | 搜尋紀錄不上雲，功能直接刪掉 |
| F | README 敘事可以改寫 |

使用者另外批准了四項越界（覆蓋 AGENTS.md 的既有禁令）：安裝
`@neondatabase/serverless`、整套移除 `DEMO_MODE`、刪除搜尋紀錄功能、
調整部署設定。**明確不要的：雲端轉本機的備份指令。**

### 段 1–2：刪功能、換資料層

**刪除**：`src/lib/db.demo.ts`、`scripts/backup-db.mjs`（整個 `scripts/`）、
`src/app/api/history/route.ts`、`src/components/HistoryList.tsx`。

**新增**：`src/components/LibraryPicks.tsx`——搜尋頁空狀態原本靠搜尋紀錄撐著，
拿掉之後不能留一片空白，改成從自己的片庫抽片。

`src/lib/db.ts` 整份改寫成 Neon。`next.config.ts` 的 turbopack `resolveAlias`
與 CI 的 `DEMO_MODE=1` 一併移除。`grep` 驗過 `src/`、`next.config.ts`、
`.github/` 對 `isDemo|demoEmpty|demoNote|DEMO_MODE|dict.demo` 零殘留。

**詳情頁順手修掉一個效能問題**：四個片庫狀態原本是四次循序查詢，本機 SQLite
時代無所謂，換成 Neon 的 HTTP driver 就是四趟往返。改成一次 `Promise.all`。

### `ReturnType<typeof neon>` 是個陷阱

寫完出現 7 個 typecheck error，都是同一個原因。看
`@neondatabase/serverless/index.d.ts:575` 才發現 `ReturnType<typeof neon>` 會把
`ArrayMode` 與 `FullResults` 兩個泛型參數放寬成 `boolean`，查詢結果型別因此變成
三個分支的聯集，`.length` 都取不到。

解法是明寫 `NeonQueryFunction<false, false>`，不要用 `ReturnType` 推。

### 段 3：擁有者鎖——原訂方案在中途作廢

原本要用 Vercel Authentication。使用者實際去看 UI 後回報
**「All Deployments 要花錢 我不想花錢」**——保護範圍要涵蓋 production 網域就得
選 All Deployments，而那在 Hobby 方案要付費。我在 Vercel 文件裡找不到明確的
方案門檻敘述，也就沒有拿「文件沒寫」去反駁使用者看到的實際畫面。

改為自建：一組通行碼換一張 HMAC 簽章 cookie。沒有帳號、沒有資料表、沒有第三方
服務、沒有新套件。

**新增檔案**：

| 檔案 | 職責 |
|---|---|
| `src/lib/owner-session.ts` | 簽發 / 驗證 token、通行碼比對 |
| `src/proxy.ts` | 唯一攔截點 |
| `src/app/api/unlock/route.ts` | 驗通行碼、發 cookie |
| `src/app/unlock/page.tsx` | 解鎖頁 |
| `src/components/UnlockForm.tsx` | 輸入框 |

**Next 16 把 `middleware.ts` 改名為 `proxy.ts`**，舊名已 deprecated。動手前依
AGENTS.md 讀了 `node_modules/next/dist/docs/` 的 proxy 指南，否則會寫出一個檔名
正確、但整份不會被載入的死檔。`NextResponse.rewrite` 的 `request.headers` 初始化
選項在文件正文只示範了 `.next()`，是去翻 `response.d.ts:20` 才確認 `rewrite`
也吃得下。

**幾個刻意的設計**：

- 頁面用 **rewrite 不用 redirect**——網址列保持原樣，解鎖後就停在原本要去的那頁
- `/api/*` 回 **401 JSON 不回 HTML**——丟解鎖頁的 HTML 給 `fetch()` 只會讓前端
  拿到一坨解析不了的東西
- 用 **Web Crypto 不用 `node:crypto`**——proxy 與 route handler 共用同一份實作
- matcher 排除 `_next/static`——漏掉的話解鎖頁自己的 CSS/JS 先壞
- 兩個環境變數缺任一就**全站鎖死**，不設預設值

**授權只在 proxy 這一層**。`src/lib/db.ts` 與 route handler 完全沒有授權檢查，
這是有意的取捨：規則放在一個檔案裡，比散在 16 個函式裡可靠。代價是
`src/proxy.ts` 的 matcher 改錯就等於默默拿掉授權，改之前要想清楚。

### 本機實測（不是跑完 build 就算數）

階段 14 的教訓是「只跑 build 不算驗證」，這次直接起 server 打真實 HTTP。

鎖的部分，10 項全過：未解鎖的頁面回解鎖頁且網址不變；四個寫入 API 全部
401；錯誤通行碼不發 cookie；正確通行碼發出 `HttpOnly; Secure; SameSite=lax`
的 180 天 cookie；竄改簽章、把到期時間往後改、過期 token 三種偽造全部擋下；
兩個環境變數都不設時整站鎖死且 `/api/unlock` 回 503；鎖住狀態下 CSS / JS /
woff2 / favicon 全部 200。

另補 13 個單元測試（`src/__tests__/owner-session.test.ts`），涵蓋偽造簽章、
延長到期、格式錯誤、fail-closed 設定。

Neon 的部分，接上使用者開通的真實資料庫跑：schema 自動建立成功（冷啟動連線 +
建表 1689 ms），四張表欄位確認，四種操作各跑一輪寫入／讀取／刪除共 9 項全過，
含評分 upsert 覆蓋而非重複插入。最後三層串起來——鎖著時 401、解鎖後 `POST`
真的寫進 Neon、`/favorites` 頁讀得回來。**驗證資料已全部清除，四張表回到 0 筆。**

### 一個把順序顧慮解掉的發現

原本告訴使用者「要先設通行碼再開資料庫，否則中間有空窗」。實測第 10 項證明
這個顧慮不成立：鎖是 fail-closed 的，兩個變數沒設時**連 API 都是 401**。
所以只設了 Neon 就先部署也不會外洩，最壞情況是擁有者自己進不去。

### 遺留風險（誠實記錄）

- **通行碼是唯一防線**。serverless 沒有可靠的共享狀態做 rate limit，
  `/api/unlock` 只有固定 400 ms 延遲。真正的防線是通行碼長度。
- **Neon 密碼曾以明文貼進對話**。建議 reset。
- **本機沒有 `.env` 檔**（不是空的，是不存在）。`.env` 在禁止修改範圍內，
  沒有代為建立。
- route handler 與 proxy 仍無整合測試。

---

## 已評估後決定不做（勿再提出）

這些都經過評估與討論，使用者已明確表示不做。**下一個 session 不要把它們
當成待辦重新提出**，除非使用者主動要求。

### YouTube 預告縮圖不加 srcset

`TrailerPlayer` 用固定的 `hqdefault.jpg`（480px），在 `max-w-4xl` 的容器裡
偏糊。不加的理由是壞掉的代價比糊更高：YouTube 的 `maxresdefault` 與
`sddefault` **不保證每支影片都存在**，而 srcset 挑到 404 的候選**不會退回
下一個、會直接顯示破圖**。只有 `hqdefault` 是保證有的。要解得加 `onError`
降級邏輯，對一個點開才播的縮圖不划算。

（TMDB 那邊的 srcset 已在階段 4 做完，這一項只針對 YouTube。）

### README 不拆掉作品集敘事

使用者說過「反正是自己用」，但那是針對截圖。README 的標題、live demo 連結、
Product & Design Decisions 幾段仍保留，決定不動。

### 雲端轉本機的備份指令

階段 15 提過，使用者明確回「第 6 點不要做」。舊的 `npm run backup` 存在的理由是
`data/movies.sqlite` 是世上唯一一份；資料搬到 Neon 之後那個前提不成立了。
備援範圍以 Neon 方案提供的為準。不要再提。

### Vercel Authentication 當作擁有者鎖

階段 15 的原訂方案。使用者實際看過 UI 後回報保護範圍要選 All Deployments 才擋得住
production 網域，而那要付費。已改為自建的 `src/proxy.ts`，不要再回頭提這條。

### `npm run start` 不加模式提示

曾提議在啟動時印出「本機版 / Demo 版」，因為 `.next` 會靜默帶著建置模式
（階段 14 就是這樣讓使用者以為功能壞掉）。提了兩次，未採納，不再提。
應對方式改為紀律：**驗證完 `DEMO_MODE=1` 的建置後，記得重建回本機版**。

> 2026-08-27 補記：階段 15 移除 `DEMO_MODE` 後，這個陷阱的成因已不存在——
> 建置產物不再有模式之分。這一條保留作為紀錄。
