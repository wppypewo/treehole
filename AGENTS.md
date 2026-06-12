<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Treehole Movie App 接手文件

## 目前狀態（接手前必讀）

- **Vercel Demo**：已部署成功，使用 `DEMO_MODE=1`，不連真實資料庫
- **Local 版**：SQLite（better-sqlite3）+ Prowlarr + qBittorrent 整合，`DEMO_MODE` 未設
- **主線已穩定**：除非收到明確 bug 回報，不重開部署主線；不動 Vercel 部署設定

## 技術棧

| 層 | 選擇 |
|---|---|
| 框架 | Next.js 16.2.6（port 3100） |
| React | 19.2.4 |
| 樣式 | Tailwind v4（@tailwindcss/postcss） |
| 本機資料庫 | better-sqlite3 ^12.10.0（local 版專用） |
| 型別 | TypeScript ^5 |
| Lint | ESLint ^9（eslint-config-next 16.2.6） |
| 動畫 | 尚未安裝（GSAP / Lenis / Motion 為計畫方向，尚未引入） |

## 技術邊界（禁止跨越）

- 禁止修改 `.env`
- 禁止修改 `DEMO_MODE` 判斷邏輯或 db stub
- 禁止把 Prowlarr / qBittorrent 整合帶到 Vercel（Vercel 版永遠是 `DEMO_MODE=1`）
- 禁止破壞 local SQLite 功能
- 禁止改動 Vercel 部署設定，除非我明確指示
- 禁止安裝新 package，除非我明確確認

## UI 優化方向（已確認方向，尚未授權執行）

目標調性：高級電影網站感。參考：Apple TV+ / Letterboxd / A24 / MUBI。

動畫分工（計畫中，尚未安裝）：
- GSAP + Lenis：cinematic scroll、timeline、pinned sequence、hero transition
- Motion（framer-motion）：限小型元件動畫，必要時才用
- 禁止以 Motion 為主動畫引擎

可用元件來源：React Bits、Motion Primitives、Aceternity UI、Animate UI

上述方向是已確認的設計意圖，不是開始實作的指令。UI 優化須等使用者明確授權後才能進行。

## Rules 位置

| 檔案 | 用途 |
|---|---|
| `.claude/rules/design-guardrails.md` | 設計禁令（配色、版面、文案等） |
| `.claude/rules/animation.md` | 動畫規則與允許來源 |
| `.claude/rules/backend-first.md` | 後端先行規則與安全禁令 |
| `.claude/rules/frontend-implementation.md` | 前端還原禁令 |
| `.claude/rules/handoff.md` | Handoff 接收與前後端串接規則 |
