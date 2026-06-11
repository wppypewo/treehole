# Treehole — 個人電影管理與下載

在自己的機器上跑一個電影管理網頁，區網內任何設備（手機、平板、其他電腦）的瀏覽器都能連進來用。
介面採 Apple TV 風格的深色版面：頂部大圖輪播、橫向捲動分類列、無限捲動。
功能涵蓋：瀏覽 TMDB 熱門 / 即將上映、搜尋、電影詳情、收藏、標記已看過、搜尋紀錄、為你推薦，以及核心的
「一鍵下載」（透過 Prowlarr 找種子 → 丟給 qBittorrent 下載）。

> 目標執行平台為 **Mac**，以下安裝步驟以 macOS 為準。
> 程式碼本身跨平台，Windows / Linux 也能跑，只是 Prowlarr / qBittorrent 的安裝方式不同。

## 系統架構

```
區網設備瀏覽器
   └─ http://<Mac的IP>:3100
        Next.js（跑在 Mac 上，綁定 0.0.0.0）
          ├─ 代理 → TMDB API（公網，電影資料）
          ├─ 代理 → Prowlarr      http://localhost:9696（種子搜尋）
          ├─ 代理 → qBittorrent    http://localhost:8080（加入下載）
          └─ better-sqlite3（本機單檔資料庫：收藏 / 已看過 / 搜尋紀錄）
```

所有金鑰只留在伺服器端，瀏覽器不會直接碰到 TMDB / Prowlarr / qBittorrent。

## 開發進度

本專案分階段交付，目前全部完成：

- [x] **階段 1 — 專案骨架**：Next.js + TypeScript + Tailwind，區網可連
- [x] **階段 2 — TMDB**：熱門 / 即將上映 / 搜尋 / 詳情頁（中英切換）
- [x] **階段 3 — SQLite**：收藏 / 已看過 / 搜尋紀錄
- [x] **階段 4 — Prowlarr + qBittorrent**：詳情頁一鍵下載
- [x] **階段 5 — 推薦**：詳情頁相關推薦 + 依片庫的「為你推薦」
- [x] **階段 6 — 介面與收尾**：Apple TV 風格深色介面、無限捲動、載入骨架、錯誤處理、文件

## 系統需求

- macOS 10.15 以上
- Node.js 20 LTS 以上（本專案以 Node 24 開發）
- 已安裝（或將安裝）Prowlarr 與 qBittorrent（階段 4 才會用到，前面階段不需要）

## 前置安裝

### 1. TMDB 金鑰

1. 到 [themoviedb.org](https://www.themoviedb.org/) 註冊帳號。
2. 進 Settings → API 申請金鑰：可拿 **v3 api_key** 或 **v4 read access token**，兩者擇一即可。
3. 把它填進 `.env` 的 `TMDB_API_KEY`。

### 2. Prowlarr（種子搜尋，階段 4 起需要）

跑在同一台 Mac 上，預設 `http://localhost:9696`。

**方法一（Homebrew）**

```bash
brew install --cask prowlarr
```

> 此 cask 未來可能下架，若安裝失敗請改用方法二。

**方法二（手動，長期較可靠）**

1. 到 Prowlarr 的 [GitHub Releases](https://github.com/Prowlarr/Prowlarr/releases) 下載對應架構：
   Apple Silicon 用 `osx-core-arm64`，Intel 用 `osx-core-x64`。
2. 解壓後把 `Prowlarr` 拖進「應用程式」。
3. 終端機執行自我簽章，避免被 Gatekeeper 擋下：

   ```bash
   codesign --force --deep -s - /Applications/Prowlarr.app && xattr -rd com.apple.quarantine /Applications/Prowlarr.app
   ```

4. 啟動並開啟設定頁：

   ```bash
   open /Applications/Prowlarr.app
   ```

   瀏覽器開 `http://localhost:9696`。

5. 在 Prowlarr 內加入電影類 indexer（如 YTS、1337x 等公開站），測試可用後，
   到 **Settings → General** 複製 **API Key**，填進 `.env` 的 `PROWLARR_API_KEY`。

### 3. qBittorrent（加入下載，階段 4 起需要）

跑在同一台 Mac 上，預設 `http://localhost:8080`。

1. 安裝並開啟 qBittorrent。
2. 進 **Preferences → Web UI**，勾選啟用，設定 port（預設 8080）與帳號密碼。
3. 把帳密填進 `.env` 的 `QBITTORRENT_USERNAME`、`QBITTORRENT_PASSWORD`。

## 安裝與啟動

```bash
# 1. 進專案目錄
cd movie-app

# 2. 安裝依賴
npm install

# 3. 複製環境變數範本並填入你的金鑰
cp .env.example .env
#   用編輯器打開 .env 填值

# 4. 啟動開發伺服器（已綁定 0.0.0.0，區網可連）
npm run dev
```

啟動後本機開 `http://localhost:3100` 應看到首頁。

> 本專案固定用 **port 3100**（避免與另一個跑在 3000 的專案衝突），dev 與 start 皆已設定。

正式環境用：

```bash
npm run build
npm run start   # 同樣綁定 0.0.0.0
```

## 跨設備連線（區網）

1. 查 Mac 的區網 IP：**系統設定 → 網路 → 點目前連線 → 詳細資料**，看 IP 位址（類似 `192.168.x.x`）。
2. 確定 Mac 與其他設備在同一個 Wi-Fi / 區網。
3. 其他設備瀏覽器開 `http://<Mac的IP>:3100`（例：`http://192.168.1.20:3100`）。
4. 若連不上，檢查 macOS 防火牆是否擋了 Node：**系統設定 → 網路 → 防火牆**。

## 環境變數

複製 `.env.example` 成 `.env` 後填入。**`.env` 不會進版控**。

| 變數 | 說明 |
| --- | --- |
| `TMDB_API_KEY` | TMDB v3 api_key 或 v4 read access token |
| `PROWLARR_URL` | Prowlarr 位址，預設 `http://localhost:9696` |
| `PROWLARR_API_KEY` | Prowlarr → Settings → General 的 API Key |
| `QBITTORRENT_URL` | qBittorrent 位址，預設 `http://localhost:8080` |
| `QBITTORRENT_USERNAME` | qBittorrent Web UI 帳號 |
| `QBITTORRENT_PASSWORD` | qBittorrent Web UI 密碼 |

## 介面與功能說明

- **首頁**：Apple TV 風格深色介面。頂部大圖自動輪播（可用左右箭頭或圓點切換），下面是「熱門 / 為你推薦 / 即將上映」幾排可橫向捲動的分類列，每排右上「查看全部」進入完整頁。
- **無限捲動**：熱門與推薦的完整頁往下捲會自動載入更多，最多到第 20 頁，到底顯示「已經到底了」。
- **搜尋**：導覽列的「搜尋」未輸入關鍵字時顯示搜尋紀錄，點任一筆可重新搜尋、右上可清除全部。
- **收藏 / 已看過**：在電影詳情頁切換，資料存在本機 SQLite。
- **為你推薦**：依你收藏與已看過的電影，向 TMDB 取相關片彙整排序而成；先收藏幾部才會有推薦。
- **一鍵下載**：詳情頁的「下載」用 Prowlarr 找種子，挑一筆「加入」即送到 qBittorrent。所有金鑰只在伺服器端，瀏覽器只連 Next.js，不會碰到 TMDB / Prowlarr / qBittorrent 的金鑰。

## 常見問題

- **`npm install` 安裝 better-sqlite3 時編譯失敗（階段 3 起會用到）**
  先安裝 Xcode 命令列工具再重裝：

  ```bash
  xcode-select --install
  npm install
  ```

- **其他設備連不到 `http://<Mac的IP>:3100`**
  確認在同一區網、IP 沒填錯、macOS 防火牆未阻擋 Node。

- **下載按鈕找不到種子或加入失敗**
  確認 Prowlarr（9696）與 qBittorrent（8080）都在執行，且 `.env` 的金鑰與帳密正確。
  若下載對話框出現「結果已過期」，關閉後重新開啟即可（重新整理伺服器端的搜尋快取）。

- **「為你推薦」是空的**
  先到電影詳情頁收藏或標記幾部已看過的電影，推薦會依你的片庫產生。

## 技術棧

Next.js 16（App Router、TypeScript、Turbopack）、React 19、Tailwind CSS v4、better-sqlite3、Node.js 24。
