<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Treehole Movie App 接手文件

## 目前狀態（接手前必讀）

- **Vercel Demo**：已部署成功，使用 `DEMO_MODE=1`，不連真實資料庫
- **Local 版**：SQLite（better-sqlite3）個人片庫，`DEMO_MODE` 未設
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
| 動畫 | GSAP ^3.15 + ScrollTrigger（scroll 敘事）、Lenis ^1.3（捲動節奏）、Motion ^12.40（元件級，如 popLayout） |
| 字體 | Bodoni Moda + Noto Serif TC（標題）、Geist（介面），皆走 `next/font` |

## 技術邊界（禁止跨越）

- 禁止修改 `.env`
- 禁止修改 `DEMO_MODE` 判斷邏輯或 db stub
- 禁止破壞 local SQLite 功能
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
