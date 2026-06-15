# PROJECT_STATE

> 產出日期：2026-06-15
> 僅針對 `movie-app`（Treehole）repo 據實盤點；git 狀態皆在本 repo 內判斷。
> 本次只做狀態盤點：未改產品程式碼 / README / package.json / env / Vercel / CI 設定，未跑 formatter / migration / test / build。

## Repo Identity

* Repo path: `D:\ClaudeCode\projects\movie-app`
* Repo type: Next.js 16 全端 Web App（git repo，有 GitHub remote）
* Primary purpose: Treehole——TMDB 電影探索 + 私人片庫（本機 SQLite + 可選 Prowlarr/qBittorrent；Vercel 為 demo），同時作為作品集
* Current status: Maintenance（主線已穩定；以收尾 / 文件與作品集表述為主，不開新功能）

## Git Status

* Branch: `main`
* Latest commit: `3249b1a 加入 Treehole production screenshots`
* Working tree: clean（`git status --short` 無輸出）
* Remote: `origin` → `https://github.com/zhuang060329-bit/treehole-movie-app.git`（依備忘為 private）
* Sync status: 與 `origin/main` 同步（`## main...origin/main`，無 ahead / behind）

## Product Status

* Production / deployment: Vercel demo（README 載明 `https://treehole-movie-app.vercel.app`，以 `DEMO_MODE=1` 運作、不連真實 DB）；本 repo **無 `vercel.json`**（部署設定在 Vercel 端，未進 repo），另有 `.vercelignore`。AGENTS.md：不動 Vercel 部署設定，除非明確指示
* README / portfolio status: 已是作品集狀態（Treehole 標題、live demo、features、demo/local 對照表、設計決策、tech stack、architecture、testing、screenshots、future）
* CI status: 有 GitHub Actions `.github/workflows/ci.yml`，push / PR 到 main 觸發 `typecheck → test → build`（build 帶 `DEMO_MODE=1`）；另有 `.github/dependabot.yml`
* Test status: Vitest；README 載明 58 tests / 6 files（utility 層）；本次未執行測試，未驗證即時數字
* Demo mode status: 由 `DEMO_MODE=1` 切換。`next.config.ts` 的 turbopack `resolveAlias` 在 demo 時把 `@/lib/db` 指向 `src/lib/db.demo.ts`（stub：讀回空、寫入 no-op）；UI 寫入動作仍顯示但呈 disabled 並誠實說明，不假裝儲存
* Known limitations: 缺 demo/local DB 邊界的整合測試（README future）；測試僅涵蓋 utility 層，UI 與 API 整合未覆蓋

## Tech Stack

* Framework: Next.js 16.2.6（App Router、Turbopack，port 3100）+ React 19 + TypeScript
* Data source: TMDB API（v3 key / v4 token，全部 server-side）
* Local database: better-sqlite3（**僅 local 模式**；demo 模式以 `db.demo.ts` stub 取代）
* Demo / production mode: 單一 `DEMO_MODE` env 切換（Vercel=demo、本機=local）；keys（TMDB / Prowlarr / qBittorrent）皆 server-side
* Styling: Tailwind CSS v4（`@tailwindcss/postcss`）
* Testing: Vitest（`vitest.config.ts`）
* Deployment: Vercel（demo）；本機為 Node 20+ LAN server（bind `0.0.0.0`）

> 動畫套件現況：`package.json` 含 `motion` ^12.40.0，**Motion 已安裝並使用中**（`motion/react` 的 `popLayout`、`.animate-rise`）；GSAP / Lenis 尚未安裝（計畫方向）。README、設計決策與 AGENTS.md 描述已一致（AGENTS.md 於 2026-06-15 修正對齊）。

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
* README screenshots：README 已嵌入桌機 / 手機截圖。
* Production screenshots：`docs/screenshots/` 已有 6 張（home/detail/browse/search desktop + home/detail mobile；commit `3249b1a`）。
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
3. 作品集 closeout 檢查：確認 README、live demo、screenshots、demo/local 邊界說明、CI 狀態彼此一致。

## Deferred / Explicit Approval Required

> 以下為已討論但**不屬於**目前 Maintenance / 收尾階段的項目，預設不執行。

* **Cinematic UI 優化 pass（GSAP + Lenis）**
  * 這是**新功能 / 大改動**（AGENTS.md「UI 優化方向：已確認方向，尚未授權執行」；需安裝 GSAP/Lenis，屬新 package）。
  * 不屬於目前 Maintenance 階段。
  * 只有使用者明確開啟 design / feature phase 時才可做。
* **本機 Prowlarr indexer 設定文件化、case study writeup**（README future）：屬擴充，非收尾必要，待明確指示。

## Forbidden Scope

* Do not expose or print secrets.
* Do not modify env files（`.env` / `.env.example`）。
* Do not change demo/local DB boundary（`DEMO_MODE` 判斷、`db.demo.ts` stub、`next.config.ts` alias）unless explicitly requested.
* Do not broaden into a full streaming platform（不把 Prowlarr / qBittorrent 帶到 Vercel）。
* Do not replace the current README structure unless explicitly requested.
* Do not perform broad UI redesign unless a new design phase is explicitly opened.
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
