# 動畫規則

來源：`KnowledgeBase/ClaudeCode/templates/anti-ai-website-prompts.md` — Prompt A 第五節

## 動畫與互動禁令（硬性規定）

禁止：
- 完全無 hover 回饋，或全站只有一種通用 hover
- 可點元素 hover 時淡出/消失
- 用 hover 才顯示關鍵資訊
- 整頁元素都套 fade-in-on-scroll 毫無取捨
- 每顆按鈕都套同一個 scale-105+transition

## 允許的動畫來源（限定）

**本專案目前實際安裝的只有 `gsap` 與 `lenis` 兩支**，新動畫優先用這兩支寫。

`motion`（framer-motion）**已於 2026-09-03 移除**——當時全站只剩片庫格線的
排序過場在用它，那段改寫成 GSAP Flip（`gsap/Flip`，本來就已載入），
於是整包相依可以拿掉。**不要因為看到舊文件寫「已安裝並使用中」就重新裝回來。**

清單上其餘的（React Bits、Motion Primitives、Aceternity UI、Animate UI）是
「若要引入，不必重新討論美學方向」的白名單，**不代表已安裝**。
實際安裝任何一支之前仍須取得使用者確認（AGENTS.md：未經確認不得安裝套件）。

## 發光類元件

spotlight / beam / glow card 不在禁止之列，但適用同一條規則：

**禁止整頁套特效**。每一個動畫或特效都要能說出「為什麼加在這」，且該理由必須依附於這個元素的內容角色（它是不是這頁最值得強調的東西），不能是「比較炫」。
