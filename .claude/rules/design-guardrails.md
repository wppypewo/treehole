# 設計禁令（Design Guardrails）

來源：`KnowledgeBase/ClaudeCode/templates/anti-ai-website-prompts.md` — Prompt A 設計禁令清單

前端實作時，所有視覺決定必須通過以下最高裁決規則，並遵守各節禁令。

## 最高裁決規則（優先於下方所有清單）

任何設計決定，做一個檢驗：**把它原樣搬到一個性質完全不同的網站，是否依然成立？**
- 若成立，代表這個決定不來自本專案的脈絡，而是來自「通用安全牌」，重選。
- 若不成立，代表它確實依附於這個網站的內容、用戶、調性，保留。

## 一、配色

禁止：紫到藍漸層當主色或 hero 背景；任何霓虹/彩虹/mesh gradient 當主視覺；同時超過 2 個漸層；預設 Tailwind 的 indigo/violet/fuchsia 當品牌主色；「科技藍+純白+淺灰」這組預設 SaaS 配色。
改為：選一個有實際依據的主色，其餘用中性色撐住，最多一個強調色。

## 二、字體

禁止：無理由地用 Inter / system-ui / 預設 font stack 當全站唯一字體；標題與內文毫無字重、字級以外的差異化；中文網站直接套英文字體的 fallback 而不指定中文字型。
改為：字體選擇要能對應訪談確認的調性方向，並能說出「為什麼是它」。

## 三、版面與元件

禁止：置中 hero（大標置中+副標置中+兩顆置中按鈕）；三欄等寬 feature grid（icon+標題+一句話 ×3）；glassmorphism（frosted glass 卡片、backdrop-blur 浮在柔和背景）；飄浮 3D 抽象人物、無臉角色拿發光球；「trusted by」+灰階 logo 牆；全站卡片都是 rounded-xl+shadow-lg+白底 同一種樣式；整頁鋪滿預設線性 icon；每個 section 都是「置中標題+置中副標+內容」同一節奏。
同時警惕「下一代安全牌」：大字 serif 編輯風、bento grid、米白底 neo-brutalism，若選用理由只是「看起來不像 AI」，同樣通不過最高裁決規則。
改為：允許不對稱、留白不均、單一強元素主導；每個 section 結構因內容而異。

## 四、間距與質感

禁止：全頁統一 8px 倍數的「數學完美」間距毫無疏密對比；每區塊垂直間距都一樣；同一個 shadow 套全站；同一個 border-radius 套全站。
改為：刻意製造疏密節奏，重要的給更多空間，次要的擠緊。

## 五、互動（hover / 動畫）

見 `animation.md`。

## 六、文案

禁止：lorem ipsum 或任何佔位假文；編造假評語/假用戶/假公司/假頭像；「Welcome to Our Product」「Empower your workflow」這類空泛標語；英文出現 unlock/seamless/elevate/revolutionize/leverage/transform/cutting-edge/robust/harness/delve/pivotal；中文出現 賦能/重塑/顛覆/一站式/全方位/打造/強大/高效/極致/輕鬆搞定；「不只是 X，更是 Y」「從 X 到 Y」句式；無具名來源的「專家指出」「研究顯示」。
改為：寫具體的東西。若沒有真實內容，留 [待補]，絕不編造。

## 七、整體傾向

禁止：把「乾淨、現代、極簡」當預設安全牌而產出無記憶點的東西；在沒有理由時選最常見、最不會出錯的方案。
改為：寧可有一個明確、可能有爭議的設計主張，也不要一個誰看了都不記得的安全結果。
