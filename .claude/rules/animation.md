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

React Bits、Motion Primitives、Aceternity UI、Motion (framer-motion)、GSAP、Animate UI。
以上以外的動畫套件須先取得確認。

## 發光類元件

spotlight / beam / glow card 不在禁止之列，但適用同一條規則：

**禁止整頁套特效**。每一個動畫或特效都要能說出「為什麼加在這」，且該理由必須依附於這個元素的內容角色（它是不是這頁最值得強調的東西），不能是「比較炫」。
