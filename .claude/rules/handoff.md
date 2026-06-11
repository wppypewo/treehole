# Handoff 接收規則

來源：`KnowledgeBase/ClaudeCode/templates/anti-ai-website-prompts.md` — Prompt B 階段 2–3

## 階段 2：前端實作（依 handoff bundle，禁止走樣）

- 開始前先問：bundle 指定的技術棧（框架、CSS 方案、套件）是否就是實作技術棧，或有調整
- 以 bundle 的設計檔與截圖為唯一視覺依據。禁止你「重新詮釋」任何視覺決定——間距、配色、字體、字級、圓角、版面，一律以 bundle 為準
- 若 bundle 某處沒交代清楚，先問我，不要自己用通用方案填
- 動畫與特效只實作 bundle 指定的那些，來源限定 React Bits / Motion Primitives / Aceternity UI / Motion / GSAP / Animate UI；bundle 沒要求的地方不要自己加
- 接上階段 1 凍結的 API 契約

## 階段 3：接合與收尾

- 前後端串接、錯誤處理、載入狀態、空狀態
- RWD 依 bundle 的斷點行為
