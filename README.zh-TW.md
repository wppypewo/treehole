# Treehole

[![CI](https://github.com/wppypewo/treehole/actions/workflows/ci.yml/badge.svg)](https://github.com/wppypewo/treehole/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-informational.svg)](package.json)

[English](README.md) | 繁體中文

一個人用的私人片庫，外圍接上 TMDB 的找片功能：今晚看哪部、想看清單還剩哪些、看過的片和自己打的分數。

**正式站：** https://treehole-movie-app.vercel.app（需要通行碼，沒有公開模式）

介面有繁體中文與英文。電影資料來自 [TMDB](https://www.themoviedb.org/)；本產品使用 TMDB API，但未經 TMDB 背書或認證。

---

## 概覽

Treehole 圍繞一個情境設計：有一個晚上，想從自己存的清單裡挑一部片，而不是去翻片庫目錄。

2026 年 9 月的改版（內部稱「放映表」）讓片庫排在最前面，並用字排代替海報。首頁由上往下是：

1. **今晚**：想看清單裡放最久的那部，附劇照、年份、片長、導演、類型。`?pick=n` 換下一部。想看清單是空的、或資料庫讀不到時，改放 TMDB 熱門榜第一部，並寫明原因。
2. **想看**：前八部排成編號表（片名、原文片名、導演、年份、片長、加入日期）；每部片長都查得到時，附上整份清單的總片長。
3. **最近看過**：最近四筆日誌，附自己的分數與短評。
4. **外面在放**：TMDB 目前熱門片的海報列。
5. **即將上映**：台灣院線接下來的十部，依日期排。
6. **其他片單**：熱門、評分最高、最賣座、為你推薦、即將上映的入口。

線上版就是產品本身。部署在 Vercel，片庫存在 Neon Postgres，整站用一組通行碼鎖給一個人：不能註冊、沒有第二個帳號，也沒有公開瀏覽模式。

---

## 功能

- **導覽列**：瀏覽、想看（附數量）、看過（附數量）、收藏、搜尋
- **片庫三頁，三種版面**
  - 想看：可排序的表格（加入順序、片長、片名）
  - 看過：依月份分組的日誌，可篩選（全部、8 分以上、未評分）
  - 收藏：海報牆，可依收藏時間、片名排序；有任何一部評過分後，多一個「我的評分」排序
  - 拿掉一部片、換排序或換篩選時，列表用 GSAP Flip 重排
- **電影詳情**：劇照、片名區、「我的紀錄」（想看／看過／收藏切換與評分）、導演與五位主要演員、預告片、可橫向捲動的演員列、相關推薦
- **評分**：1–10 分的評分尺，加上最多 1,000 字的短評
- **推薦**（`/recommendations`）：最多取十部收藏或看過的片當種子，把它們在 TMDB 的推薦合併、去重，依被幾部種子推薦到排序
- **瀏覽**：類型、上映年份（1980 至今）、TMDB 最低評分（6、7、8）、排序，條件都寫在網址上
- **搜尋**：TMDB 片名搜尋；沒有輸入關鍵字時顯示自己片庫裡的片，不是空白頁
- **榜單**：評分最高與最賣座是編號表；熱門與為你推薦是海報格；即將上映有自己以日期為主的版面
- **人物頁**：簡介與依年份分組的作品年表
- **多語系**：繁體中文與英文，存在 cookie，網址不帶語系前綴
- **擁有者鎖**：一組通行碼擋住所有頁面與所有 API

截圖之後從線上版補上。

---

## 存取控制

這個站只有一個使用者。與其為一個人做帳號、角色和重設密碼流程，存取只靠一組通行碼。

| | |
|---|---|
| 檢查點 | `src/proxy.ts`，在每個頁面和每個 route handler 之前執行 |
| 未解鎖的頁面請求 | 改寫到 `/unlock`，網址列保持原樣，解鎖後直接到原本要去的頁面 |
| 未解鎖的 API 請求 | `401 {"error":"locked"}`：回 JSON，不是 `fetch()` 解析不了的 HTML |
| 登入狀態 | HMAC-SHA256 簽章的 cookie，`HttpOnly` + `Secure` + `SameSite=lax`，有效 180 天 |
| 設定缺漏 | 整站鎖住，擁有者也進不去。通行碼短於 16 個字元也算缺漏 |

最後一列是刻意的。`OWNER_PASSCODE` 或 `OWNER_SECRET` 沒設時整站關門而不是開門：忘了設變數的部署救得回來，預設開門的部署救不回來。

通行碼是唯一一道防線。serverless 函式沒有共享狀態可以做次數限制，`/api/unlock` 只有固定 400 ms 延遲，所以通行碼至少要 16 個字元，越長越好。cookie 的簽章金鑰由 `OWNER_SECRET` 和通行碼一起產生，換掉任何一個，所有既有的登入狀態都會立即失效。

proxy 以下不再檢查授權。資料層和 route handler 都假設請求已經過關，規則只存在一個檔案裡。唯一的例外是防禦性的：根 layout 查導覽列片數之前會自己驗一次 cookie，繞過 proxy 的路徑（例如 matcher 排除的路徑畫出的 404）不會讀到片庫。

安全標頭分兩處：四個靜態標頭在 `next.config.ts`；每個請求換一次 nonce 的 CSP 由 `src/lib/csp.ts` 產生，proxy 在六條回傳路徑上都掛上。CSP 目前是 Report-Only，`style-src 'self'`，全站沒有內聯樣式。

---

## 產品與設計決策

**字排為主，海報為輔。** 清單一律排成表：序號、片名、年份、日期。只有收藏頁和「外面在放」保留海報，因為這兩處本來就是靠海報認片。

**全站直角。** `globals.css` 把圓角歸零。海報是印出來的長方形，按鈕、輸入框和列也跟著是長方形。

**唯一的強調色取自實物。** 簾幕紅來自放映廳的絨布簾幕，用來標記使用者留下的痕跡（分數、開著的想看鍵、導覽目前位置）和錯誤。為了讓每種用途都通過 WCAG AA，拆成三個 token：`--curtain #c8503f` 用於不承載文字的線條與標記，`--curtain-ink #e4897b` 用於小字（7.7:1），`--curtain-fill #b04537` 用於上面壓字的填塊（4.66:1）。其餘全是中性三階。

**字體承擔識別。** Bodoni Moda 排片名、區塊標題和數字，和影展海報同屬高對比的 didone 傳統。中文標題用 Noto Serif TC，因為中文電影書寫的排版傳統是明體，不是黑體。介面文字用 Geist。「今晚」的片名依估算寬度分三檔字級（`src/lib/title-size.ts`），四個字的中文片名不會顯得太小，長英文片名也不會斷成四行。

**hover 依角色而定，不放大。** 列會在左緣出現簾幕紅線；海報靜止時略暗，hover 恢復原亮度；日誌的日期轉色；行內連結底線變亮。鍵盤聚焦和 hover 一樣。

**只有一種捲動動畫，用在兩處。** 劇照隨捲動緩慢下沉（GSAP ScrollTrigger，跟著捲動走，不自己播放），用在「今晚」和詳情頁。Lenis 的作用是讓這段捲動連續。全站沒有捲動揭露效果；頁首只在載入時淡入一次。

**不做自動輪播。** 「今晚」一次只推一部，並寫明為什麼是它。要換下一部由使用者自己點。

**圖片依裝置實際需要的尺寸載入。** 每張 TMDB 圖片都帶 `srcset`，只列 TMDB 實際提供的寬度（實測 `w999` 回 400），每個版面位置各有手寫的 `sizes`，集中在 `src/lib/images.ts`。在 375px、2 倍密度的手機上，開場劇照從 `w1280`（212 KB）降到 `w780`（85 KB）。

**小螢幕不把文字壓在影像上。** 手機上劇照一段、文字一段。字壓在劇照上，能不能讀就看那張劇照剛好多亮。

**關上的門勝過假的門。** 早期版本公開部署、關掉所有寫入功能，訪客看到的是一排按了沒反應、只會解釋原因的按鈕。不能加片的片庫只是目錄，所以現在整站直接鎖住。

**頁首只寫頁名。** 原本的小標只是重複剛點過的導覽項目，副標也不影響任何操作，兩者都拿掉了。

更多決策、取捨與維護規則（含實測數據）見 [docs/DESIGN_NOTES.md](docs/DESIGN_NOTES.md)。

---

## 技術棧

| 層 | 選擇 |
|---|---|
| 框架 | Next.js 16.3.8（App Router、Turbopack） |
| UI | React 19.3、TypeScript 6 |
| 字體 | Bodoni Moda + Noto Serif TC（標題）、Geist（介面），走 `next/font` |
| 樣式 | Tailwind CSS 4.3，設計 token 在 `globals.css` |
| 動畫 | GSAP（ScrollTrigger、Flip）與 Lenis |
| 資料庫 | Neon Postgres，走 `@neondatabase/serverless` |
| 電影資料 | TMDB API（v3 key 或 v4 token） |
| 測試 | Vitest 5 |
| 部署 | Vercel |

---

## 架構

```
瀏覽器
  └─ Proxy（src/proxy.ts）— 擁有者鎖 + CSP；沒過關，底下什麼都不執行
       └─ Next.js App Router（port 3100）
            ├─ Server components — 抓 TMDB 資料、讀片庫
            ├─ Client components — 瀏覽篩選、片庫列表、評分
            ├─ Route handlers（/api/*）— 片庫寫入、分頁片單、/api/unlock
            ├─ TMDB 層（src/lib/tmdb.ts）— 所有 API 呼叫只在伺服器端
            ├─ DB 層（src/lib/db.ts）— Neon Postgres
            └─ i18n（src/i18n/）— 每個語系一份字典，網址不帶前綴
```

- TMDB API 金鑰只在伺服器端使用，瀏覽器不直接呼叫 TMDB API。
- DB 層在第一次查詢時建立 schema（`CREATE TABLE IF NOT EXISTS`，一次往返送出），並快取這個 promise，所以沒有 migration 步驟，建置時也不需要資料庫。`DATABASE_URL` 沒設時正式建置一樣會成功。
- 授權只在 `src/proxy.ts`。route handler 會驗證輸入，但不過問呼叫者是誰。
- i18n 用扁平字典（`dictionaries.ts`），zh-TW 與 en 結構相同。語系每次請求都從 cookie 讀。

---

## 本機設定

### 需求

- Node.js 24 LTS（CI 用 24 建置）
- [TMDB API 金鑰](https://www.themoviedb.org/settings/api)（v3 key 或 v4 read access token）
- 一個 Neon Postgres 資料庫

### 安裝

```bash
git clone https://github.com/wppypewo/treehole.git
cd treehole

npm install

cp .env.example .env
# 填入 TMDB_API_KEY、DATABASE_URL、OWNER_PASSCODE、OWNER_SECRET

npm run dev
```

打開 `http://localhost:3100`，第一個畫面是通行碼。本機和線上行為相同，因為沒有本機模式。

本機開發連的是 `DATABASE_URL` 指到的資料庫。沒有 seed 資料集，不想動到真實片庫的話，請另開一個 Neon branch。

第一次 `npm run dev` 若整站 500、log 裡有 Google Fonts 逾時，停掉再啟動一次即可，原因見 [docs/DESIGN_NOTES.md](docs/DESIGN_NOTES.md)。

### 環境變數

| 變數 | 必填 | 說明 |
|---|---|---|
| `TMDB_API_KEY` | 是 | TMDB v3 api_key 或 v4 read access token |
| `DATABASE_URL` | 是 | Neon Postgres 連線字串。Vercel–Neon 整合會用這個名稱自動注入 |
| `OWNER_PASSCODE` | 是 | 通行碼，至少 16 個字元，太短時整站維持鎖住。它是網路和片庫之間唯一的東西 |
| `OWNER_SECRET` | 是 | 簽 cookie 用的隨機字串 |

產生 `OWNER_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

兩個擁有者變數少一個，整站就鎖住，而不是開放。建置不需要 `DATABASE_URL`，執行時需要。

開發和正式伺服器都綁 `0.0.0.0`，同一個網路的其他裝置可以用 `http://<本機 IP>:3100` 連進來。

---

## 測試

19 個檔、273 項測試。route handler 和 proxy 直接測試；這些測試裡資料層和 TMDB 都用 mock，不會碰到真的資料庫。

| 檔案 | 涵蓋範圍 |
|---|---|
| `proxy.test.ts` | 擁有者鎖：matcher 排除的路徑、解鎖頁、鎖著時的改寫與 API 401、token 檢查、設定缺漏時鎖住，以及 proxy 六條回傳路徑都帶 CSP |
| `api-library-routes.test.ts` | `favorites`、`watchlist`、`watched`、`ratings`：輸入不合法回 400 且不碰資料庫、合法輸入正規化後交給資料層、資料庫失敗回 503 且不外洩錯誤、短評長度上限 |
| `api-tmdb-routes.test.ts` | `popular`、`top-rated`、`highest-grossing`、`search`、`discover`、`recommendations`：頁碼與篩選條件清理、`hasMore`、依錯誤種類回 500 或 502 |
| `api-unlock.test.ts` | `/api/unlock`：未設定、通行碼錯誤、cookie 屬性、固定 400 ms 延遲、內部錯誤回 500 |
| `owner-session.test.ts` | `issueToken`、`verifyToken`、`passcodeMatches`、`ownerConfig`：偽造簽章、竄改效期、過期與格式錯誤的 token、設定缺漏時鎖住、通行碼最短長度、換通行碼後舊登入失效 |
| `recommendations.test.ts` | TMDB 全部或部分失敗時的彙整、只快取完整結果、片庫為空 |
| `csp.test.ts` | `buildCsp`：nonce、`style-src`、允許的外部來源 |
| `db-route.test.ts` | `movieFromBody`、`tmdbIdFromQuery`、`addedAtFromBody`：片庫 API 的請求解析 |
| `library.test.ts` | 想看排序、片長總計、看過篩選 |
| `browse-filters.test.ts` | `parseBrowseFilters`：瀏覽頁的網址參數解析 |
| `dates.test.ts` | `todayInTaipei`、片架、日誌與日曆的日期格式、上映檔期分組 |
| `filmography.test.ts` | 人物頁與電影頁的作品合併、依年份分組、角色文字 |
| `title-size.test.ts` | 「今晚」片名依估算寬度分檔 |
| `error-boundaries.test.ts` | `global-error` 與 `error` 自己的外框與文案 |
| `tmdb-utils.test.ts` | `pickTrailer`：預告片挑選 |
| `tmdb-error.test.ts` | `tmdbErrorMessage`、`isV4Token`：API 錯誤分類與金鑰格式驗證 |
| `images.test.ts` | `tmdbImage`、`tmdbSrcSet`、`IMAGE_SIZES`：圖片網址、srcset 候選、sizes 字串的不變條件 |
| `genres.test.ts` | `genreOptions`：依語系產生類型清單 |
| `i18n-config.test.ts` | `normalizeLocale`、`tmdbLanguage`、`htmlLang`：語系對應 |

UI 行為和 `src/lib/db.ts` 裡的 SQL 沒有自動測試；資料層是對真實的 Neon 資料庫手動驗證的。

```bash
npm run test       # 跑一次
npm run test:watch # 監看模式
npm run typecheck  # next typegen && tsc --noEmit
npm run lint       # eslint
npm run build      # 正式建置
```

CI 在每次推送到 `main` 和每個對 `main` 的 PR 跑 typecheck、lint、test、build。

---

## 資料存在哪裡

收藏、想看、看過、評分存在 Neon Postgres 的四張表，主鍵是 `tmdb_id`。沒有 user 欄位，因為沒有第二個使用者。

這個 repo 沒有備份指令。早期版本把片庫存在本機 SQLite 檔，那是唯一一份，所以需要備份；雲端資料庫轉存到本機的備份評估過，決定不做。備援範圍就是 Neon 目前方案提供的保留與還原。

---

## 之後可以做

- 對一次性的 Neon branch 跑 `src/lib/db.ts` 的整合測試；目前 SQL 是手動驗證
- 不存在的電影、人物 ID 回真正的 404 狀態碼（目前 404 頁以 200 狀態碼加 `noindex` 呈現，這是串流的已知結果）

---

## 授權

[MIT](LICENSE)。電影資料與圖片屬於 TMDB 及各自的權利人，不在本授權範圍內。
