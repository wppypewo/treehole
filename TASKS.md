# 全面改版（2026-09-26 起）

分支：`redesign/2026-09-26`，從 `main`（`9d34b7a`）分出。
Codex 版（`chore/deps-minor-2026-09-12` 的 `77631a6`）不動，也不當基底。

## 前提（已確認或採用預設）

- 基底是 `main` 的 MUBI 式編輯策展版。
- 保留設計鎖：圓角 0、唯一強調色簾幕紅 `#c8503f`、Bodoni Moda + Noto Serif TC 標題、
  首頁一次只推一部、手機不壓字在影像上。
- 資料模型不變：`favorites`／`watchlist`／`watched`／`ratings` 四張表。（2026-09-26 使用者確認）
- 文案語氣：平實、資訊優先。（2026-09-26 使用者確認）
- 視覺方向：**A 放映表**（字排為主、片庫上首頁）。（2026-09-26 使用者選定）
- 動畫只用已安裝的 GSAP（ScrollTrigger、Flip）、Lenis、CSS `animation-timeline: view()`，不新增套件。
- 不動 production、不動 Vercel 設定、不改 `.env`。

## 阻擋項

- [ ] 使用者在 `.env` 補齊 `DATABASE_URL`／`OWNER_PASSCODE`／`OWNER_SECRET`，
      並在內建瀏覽器自己輸入通行碼解鎖。沒有這一步無法實際截圖比對。
      注意：本機連的是 production 資料庫，預覽時不點會寫入的按鈕。

## 進度

- [x] 建立分支 `redesign/2026-09-26`
- [x] 讀 Codex 版差異（`77631a6`）
- [x] 讀 `main` 全部頁面與元件的程式碼
- [x] 寫問題清單（見 `docs/redesign-audit-2026-09-26.md`）
- [x] 兩個方向稿（靜態 HTML，不是 production code），2026-09-26 已交付，放在 session scratchpad 的
      `mockup-directions.html`，不進 repo。桌機 1440 與手機 375 寬都檢查過，沒有橫向捲動。
- [x] 使用者選方向：A 放映表（2026-09-26）
- [x] 標記「看過了」時自動移出「想看」：2026-09-26 使用者同意，階段 2 實作，畫面上明示並可復原。
- [x] `main` 與 Codex 版逐頁對照，補進問題清單（2026-09-27，mock 資料；寫在 audit 文件第五節）
  - 2026-09-26 部分替代：session scratchpad 內的 mock Neon（攔截 `fetch`，資料在記憶體）
    加上 `.claude/launch.json` 的 `treehole-mock`（port 3101、`--webpack`，檔案在 gitignore 內），
    首頁、詳情頁、三個片庫頁已在桌機 1440／手機 375 截圖檢查。不碰 production。
  - 2026-09-27：`main`（`9d34b7a`）與 Codex（`77631a6`）各開臨時 worktree 接同一個 mock，
    首頁、詳情、想看、人物四頁在 1440／375 三方截圖對照。對照完 worktree 與 launch 設定已移除。
    **解鎖後用真資料的對照仍未做**，等阻擋項解除

## 分階段實作（每階段跑 typecheck／lint／test／build + `/impeccable` 審查，等使用者確認再進下一階段）

- [x] 階段 0：設計 token 與共用元件（2026-09-26 完成，等使用者確認）
  - 字級工具 `.t-num`／`.t-label`／`.t-reason`；hover 依角色分四種
    （列＝左緣簾幕紅線、海報＝壓暗一階、日誌＝日期轉色、行內連結＝底線變亮），
    MovieCard／UpcomingCard／LibraryPicks／PersonCard／LibraryGrid／RankedList 已換上
  - 新元件 `Segmented`（尚未接進頁面，階段 3、4 用）、`RatingRuler`（已接進 RatingEditor，
    十格一排、可拖曳）、`NavCount`（導覽列想看／看過片數，不改資料契約）
  - 導覽列順序：瀏覽、想看、看過、收藏、搜尋
  - `loading.tsx` 骨架對齊刊頭；`movie/[id]/loading.tsx` 留到階段 2 跟詳情頁一起改
  - 字典：拿掉 ✓ 與「暫無」、空狀態寫明怎麼填、「已看過」→「看過」，
    新增 `library.filteredEmpty`（片庫篩到 0 部時用，原本誤用「片庫是空的」那句）
  - gate：typecheck／lint／test（107）／build 全綠；impeccable 偵測器 0 項
  - 簾幕紅填塊對比：2026-09-26 使用者同意，壓字的填塊改用 `--curtain-fill #b04537`（4.66:1），
    線條與標記維持 `#c8503f`
- [x] 階段 1：首頁（2026-09-26 完成，等使用者確認）
  - 順序：今晚（想看清單放最久的一部，`?pick=n` 換一部）→ 想看放映表（最多 8 列）→
    最近看過（4 格日誌）→ 外面在放（TMDB 熱門海報列）→ 即將上映（檔期表）→ 其他片單入口
  - 新元件 `SectionHead`、`home/Tonight`、`home/ProgramTable`、`home/DiaryStrip`、`home/ScheduleList`；
    `MovieRow` 加可選的 `aside`／`headingId`
  - 資料契約沒改：加入日與看過日期兩格先留空（元件已支援，拿到資料就顯示）
  - gate：typecheck／lint／test（107）／build 全綠；impeccable 偵測器 0 項
  - 資料契約 `listWatchlistEntries()`、`listRecentWatched(limit)`：2026-09-26 使用者核可並已實作
  - `FeatureFilm`、`UpcomingStrip`、`RankedList`：2026-09-26 使用者同意刪除，已刪（未 stage）
- [x] 階段 2：電影詳情頁（2026-09-26 完成，等使用者確認）
  - 版面：左欄 片名 → 事實行 → 21:9 劇照 → 簡介 → 演職員表；右欄「我的紀錄」1000px 以上黏在導覽列下
    （`.detail-grid`，手機順序 片名／劇照／簡介／紀錄／演職員）。劇照不再出血壓字；沒有劇照才放海報
  - 拿掉永遠連回 `/` 的「返回」（導覽列黏在上方、瀏覽器上一頁都在）
  - `MovieActions`：想看／看過／收藏一條等寬鍵，字不隨狀態改；標記看過時同步關掉想看，
    顯示「已從想看清單移除。」＋復原（不自動消失），復原帶原加入時間放回原位
  - `RatingEditor`：不再自帶 section 與標題，併入紀錄欄；清除在左、儲存在右
  - 資料層：`markWatched()`（一句 SQL 同時寫看過、刪想看，回傳原加入時間）取代 `addWatched()`；
    `addWatchlist(movie, addedAt)`；`db-route.ts` 新增 `addedAtFromBody()` 與 5 組測試
  - API：`POST /api/watched` 回應多 `removedFromWatchlist: { added_at } | null`；
    `POST /api/watchlist` 可帶 `added_at`（格式錯、日期不存在、未來時間 → 400 `invalid-added-at`）
  - 字典：刪 `favorited`／`watchlistAdded`／`watchedDone`／`rating.title`／`movie.rating`，
    新增 `actions.group`／`removedFromWatchlist`／`undo`、`movie.tmdbScore`／`castRail`／`ledger`
  - 刪掉沒人用的 `.scrim-bottom`、`IMAGE_SIZES.fullBleed`／`rankThumb`；新增 `detailStill`
  - gate：typecheck／lint／test（112）／build 全綠；impeccable 偵測器 0 項
  - `getMovieRecord(tmdbId)`：2026-09-26 使用者回「可以」，階段 3 一併實作，
    一次取回四張表的狀態與日期，紀錄欄寫出加入想看／看過／收藏的日期，取代原本的四次查詢
- [x] 階段 3：片庫（收藏／想看／已看過）（2026-09-26 完成，等使用者確認）
  - 三頁各自成形，不再共用 `LibraryGrid`：
    想看＝放映表（序號、片名＋原文片名、導演、年份·片長、加入日；排序：排隊／片長／片名），
    看過＝依月份分組的日誌（篩選：全部／8 分以上／未評分），收藏＝海報牆（2／3／4 欄，排序：最近／片名／我的評分）
  - 想看列可直接「記為看過」，畫面上留一行復原；拿掉一律兩步確認；排序、移除都走 GSAP Flip
  - 刊頭：想看寫「N 部 · 全部看完約 X 小時 Y 分」（每部都查到片長才寫），看過寫「N 部 · 今年 N 部」
  - 想看頁最多替 40 部查 TMDB 片長與導演（`DETAIL_LIMIT`），超過照實標出
  - 三頁各有對應形狀的 `loading.tsx`（`library/LibrarySkeleton`）
  - 資料層：新增 `listWatchedEntries()`、`listFavoriteEntries()`（帶日期與自評分，2026-09-26 使用者核可）、
    `getMovieRecord()`；schema 不變
  - API：`POST /api/watched` 回應多 `watchedAdded`（加法，舊欄位不動），復原時用來決定要不要一併刪看過
  - 新增 `lib/library.ts`（排序、總片長）、`lib/dates.ts`（台北時區日期）與兩支測試檔
  - 修掉階段 2 的弱點：視差改為從影像進入視窗就起算（`clamp(top bottom)`），位移改為對稱 ±6.5%，不再露出框邊；以 mock 補截圖
  - 本輪截圖後修正：收藏牆手機兩欄時「收藏」二字被拆行；想看記為看過／拿掉後序號沒有遞補
  - 取消看過不會把片放回想看：刻意維持（理由寫在階段 3 回報）
  - gate：typecheck／lint／test（135）／build 全綠；impeccable 偵測器 0 項
  - `LibraryGrid.tsx` 與字典 `library.sortAdded`／`sortRating`／`ratingPlaceholder`：2026-09-26 使用者回「確認」，
    階段 4 開工時已刪（未 stage）；同時發現頂層 `library.sortTitle` 也是 0 處引用，一併刪
- [x] 階段 4：探索、榜單、即將上映（2026-09-26 完成，等使用者確認）
  - 探索：條件寫進網址（重新整理、分享連結都留得住，`lib/browse-filters.ts` 把不認得的值退回預設）；
    伺服器第一頁失敗時顯示錯誤加重試，不再說「沒有片」；第一頁失敗後重試可用；控制項 250ms 防抖；
    捲過條件區後出現黏在導覽列下的摘要列（「正在看 …」＋清除＋改條件）
  - 評分最高、最賣座：由海報牆改為榜單（名次、小海報、片名＋原文片名、年份、TMDB 分數），
    手機收成三欄、年份與分數併到片名下；`InfiniteMovieGrid` 加 `variant="ranked"` 與重複載入防護
  - 即將上映：依台灣上映日分組的檔期表，過濾掉今天以前的日期，桌機日期欄黏住
  - 搜尋頁只改了錯誤訊息的位置，版面仍是原本的海報牆，沒有另外重排
  - 各頁出錯時刊頭照樣在（`ErrorNotice` 加 `placement`）；四頁新增對應形狀的 `loading.tsx`（`ListSkeleton`）
  - `PageHeader` 加 `rule`：內容本身以粗線開頭的四頁不畫刊頭細線（截圖發現手機上兩條平行線）
  - 刪：`MovieCard` 的 `rank`、`MovieGrid` 的 `ranked`／`startIndex`、`InfiniteMovieGrid` 的 `dated`／`locale`、
    `IMAGE_SIZES.upcomingGrid`、字典 `browse.genrePlaceholder`／`yearPlaceholder`／`ratingPlaceholder`
  - 字典新增 `browse.editFilters`、頂層 `lists`（名次／片名／年份／TMDB／上映表空狀態）
  - gate：typecheck／lint／test（147）／build 全綠；impeccable 偵測器 0 項；mock 截圖桌機 1440／手機 375
  - `UpcomingCard.tsx` 已無人引用，2026-09-26 經使用者同意刪除
- [x] 階段 5：人物頁（2026-09-26 完成，等使用者確認）
  - 修掉一個舊 bug：原本只讀 TMDB 的 `cast`，導演、編劇的頁面看不到自己拍的片
    （實測 Nolan：cast 34 筆多為紀錄片「本人」，crew 78 筆）。新增 `lib/filmography.ts` 合併 cast／crew，
    同片多角色、多職務收成一列，「Thanks」（片尾致謝）不算作品
  - 作品改為依年份的年表（版面沿用即將上映的檔期表），分「演出／幕後」兩個分頁；
    預設看 `known_for_department`，只有一邊有作品時不出現切換
  - 演出列：「飾 X」「本人」「（配音）」「（未掛名）」，卡司前三順位且不是演自己的標「主演」；
    幕後列：職務譯成中文，Screenplay 與 Writer 都是「編劇」時只留一個；未上映的片附上映日
  - 首屏：照片＋姓名＋一行基本資料（領域 · 生 · 卒 · 出生地，缺哪項略過哪項）＋簡介；拿掉固定連回首頁的「返回」
  - 作品取得失敗不拖垮整頁；人物取得失敗時錯誤訊息包在 `page-shell` 裡
  - `lib/tmdb.ts`：`PersonDetails` 加 `deathday`，`getPersonMovieCredits` 改回傳合併後的 `Filmography`
  - `lib/dates.ts` 加 `calendarDateFormatter`（中文「1970 年 7 月 30 日」）
  - 新增 `person/[id]/loading.tsx` 骨架；刪字典 `movie.back`（已無引用）
  - 新測試 `filmography.test.ts`；`dates.test.ts` 加 `calendarDateFormatter`
  - gate：typecheck／lint／test（168）／build 全綠；impeccable 偵測器 0 項；
    mock 實測 Nolan（預設幕後、29 部）、梁朝偉（預設演出、108 部、主演標記）、分頁切換與鍵盤焦點、手機 375 無橫向捲動、console 無錯誤
  - 已知限制：TMDB 中文資料的角色名多半仍是英文（「飾 Tony」），是資料來源的狀況
  - 延後（要改資料契約，需先提案）：年表上標出已在片庫的片（要讀 DB）
- [x] 階段 6：解鎖／錯誤／404／載入（2026-09-26 完成，等使用者確認）
  - 新增 `StatusNotice`：整頁只剩一則狀態時的共用版面（粗線起頭，左欄代碼、右欄標題／說明／動作／小字），
    404、錯誤邊界、詳情頁／人物頁／首頁載不出來都改用它
  - 新增 `RefreshButton`：伺服器元件自己回錯誤畫面時用 `router.refresh()` 重抓，不必整頁重新整理
  - `error.tsx`：`reset` 改 `retry`（`reset` 不重抓資料，伺服器元件的錯誤按了只會原樣再錯）；
    有 `digest` 時顯示錯誤代碼供對照伺服器紀錄；client 錯誤 `console.error`
  - `not-found.tsx`：代碼 404＋說明＋「回首頁」「搜尋片名」兩個出口
  - 首頁 `tonightId === null` 原本顯示的 `fallbackError` 文案與情境不符，改為依 TMDB 錯誤給訊息
  - 根 `loading.tsx` 改成首頁形狀（原本是清單頁刊頭＋海報牆，首頁載入時閃一個不存在的版面）；
    `ListSkeleton` 加 `grid`／`search` 兩種；popular／recommendations／search／unlock 補自己的 `loading.tsx`
    （unlock 用空白佔位，未解鎖的人不該看到首頁骨架）
  - `UnlockForm`：送出中 `readOnly`＋`aria-busy`；錯誤時 `aria-invalid`＋`aria-describedby`、底線轉簾幕紅、
    焦點回欄位並全選，可以直接重打
  - 字典 `errors` 新增 `pageNotFoundBody`／`loadFailed`／`reload`／`home`／`searchTitles`；`pageNotFound` 去句號當標題用
  - gate：typecheck／lint／test（168）／build 全綠；impeccable 偵測器 0 項；
    mock 實測 404（桌機 1440／手機 375，無橫向捲動）、解鎖頁輸錯（焦點、全選、底線 `rgb(200,80,63)`、錯誤訊息）
  - 未實測：錯誤邊界與三個「載不出來」畫面在 mock 上不易觸發，只做了程式碼層面的確認
  - 殘留：沒有 `global-error.tsx`（根 layout 出錯時是 Next 預設頁）；已解鎖時進 `/unlock` 仍顯示表單；
    `loading.tsx` 拿不到 searchParams，搜尋頁骨架分不出有沒有查詢字
- [x] 階段 6 使用者確認（2026-09-27）
- [x] 收尾：AGENTS.md 視覺方向段落對齊、PROJECT_STATE 更新（2026-09-27 完成，等使用者確認）
  - `AGENTS.md`：視覺方向改寫為放映表（簾幕紅三個 token 的用途、hover 四種、`StatusNotice`、動畫實際用在哪）；
    「目前狀態」補一行改版分支尚未合進 `main`
  - `PROJECT_STATE.md`：上半部改成 2026-09-27 實測值（分支、未 commit 的檔案數、測試數、Current Phase、Next 3）；
    新增「階段 18」歷史段；Handoff 路徑由 `D:\ClaudeCode` 改為 `~/ClaudeCode`
  - `globals.css`：刪掉沒人用的 `.reveal`（`RankedList` 刪除後的死碼）
  - gate：typecheck／lint／test（168）／build 全綠；impeccable 偵測器 0 項

- [x] 收尾：殘留處理（2026-09-27）
  - `global-error.tsx`：新增；字型定義移到 `src/app/fonts.ts`、錯誤文案與語系 hook 移到 `src/app/error-copy.ts`，
    `layout.tsx`／`error.tsx`／`global-error.tsx` 共用。未實際觸發（要根 layout 壞掉才走得到）
  - `/unlock`：已解鎖時 `proxy.ts` 307 轉回首頁；未解鎖照舊帶 `LOCK_HEADER` 放行。
    回傳路徑四條變六條，全部帶 CSP；`proxy.test.ts` 補 5 題
  - 搜尋頁：外殼只等 cookie 與 params，推薦／筆數／結果各包 Suspense（key 為查詢字），骨架跟著有沒有查詢字走
  - 人物頁：作品列標出片庫狀態（看過 > 想看 > 收藏），用既有三支 list 函式，資料庫錯誤時不標、記 `[person-library-marks]`
  - 角色名：`characterText()` 轉 voice／uncredited／Self；角色本名 TMDB 不翻，維持原文
  - 詳情頁：資料庫讀不到時「我的紀錄」降級為說明＋重試鍵（字典 `movie.ledgerUnavailable`），其餘照常顯示
  - `globals.css`：`.t-*` 移進 `@layer components`，顏色 class 才蓋得過去（影響 16 處）；新增 `.t-original`
    （`font-synthesis-style: none`，日韓中原文片名不再被合成斜體）
  - 字典：職務 `Screenstory` 補「電影故事」
  - gate：typecheck／lint／test（175）／build 全綠；impeccable 偵測器 0 項

- [x] 收尾：發現與限制再處理（2026-09-27）
  - 對比度：`paper-faint` 在 `--ink-raised` 上只有 4.45:1，框內小字（替代片名 ×3、評分備註 placeholder）改 `paper-dim`；
    首頁、看過、人物、詳情、搜尋五頁以 computed style 逐元素量，0 項不及格
  - `global-error.tsx`：新增 `error-boundaries.test.ts` 渲染測試（6 題）
  - mock 邊界：沒有海報、長片名（原片名後再接 24 字）兩種開關實測，375 寬四頁無橫向捲動
  - 角色名：上游限制，只記文件
  - gate：typecheck／lint／test（181）／build 全綠；impeccable 偵測器 0 項
- [x] 推送 `redesign/2026-09-26` 並快轉合進 `main`（2026-09-27，使用者指示）
  - 使用者決定不等真實資料檢查就合併；真實資料檢查改成上線後由使用者看
- [x] 相依升級合進 `main`（2026-09-27，使用者指示；細節在 `PROJECT_STATE.md` Git Status）
- [x] 刪除沒用的分支（遠端 2 條、本機 4 條）；dependabot 已自行關閉 #18 #20 #21。#16 #17 改寫成 16.3.6 的新升級，保留
- [x] 修 CI：`e638c5b` 起 `main` 的 CI 在 Type check 失敗（`PageProps` 要先 `next typegen`），`typecheck` 腳本補上；同批合進 #16 #17（16.3.6）
- [x] 細修一輪（2026-10-06，分支 `claude/optimistic-ride-s7tgpz`；mock 資料，1440／375 截圖逐頁對照）
  - 橫向片列（首頁兩條、詳情頁演員）：`.rail-gutter` 扣掉捲動容器的 `--rail-gap`，第一張海報與段落標題對齊（原本右偏 16–20px）；
    左右箭頭由 `paper-faint` 提到 `paper-dim`
  - 新增頁尾 `SiteFooter`：TMDB 資料來源連結與 TMDB 使用條款要求的免責聲明；解鎖頁不畫
  - 詳情頁：預告片移進 `detail-grid` 左欄（「我的紀錄」右欄不再空著一大段）；
    相關推薦在 5 欄時藏掉第 11、12 部，不留只有 2 部的最後一列；
    片名下事實列每項不斷行，手機上「劇情、愛情」不再拆成兩行
  - 首頁「今晚」片名依字寬分三級字級（`src/lib/title-size.ts`，附測試），兩字片名放大、長片名不擠出五欄
  - 手機：想看表的原文片名獨立一行並截斷；瀏覽頁類型列改橫向捲動（`.pick-scroll`，寫在 `globals.css`
    是因為 `.pick` 不在 layer 內，Tailwind 的 `max-sm:` 蓋不過）
  - gate：typecheck／lint／test（257）／build 全綠
- [x] 細修第 3 輪（2026-10-06，同分支；mock 資料，另用「TMDB 圖全部回 404」的模式截圖）
  - 圖片載入失敗：新增 `FallbackImg`，站上 12 處 `<img>` 全改走它。原本 TMDB 撤檔或斷網時，
    有 alt 的圖露出破圖示加 alt 字，`alt=""` 的劇照在 Chrome 也會沿框畫一圈淺灰細線。
    現在海報框改排片名、人像框改排姓名首字，其餘留空框
  - 鍵盤焦點：首頁 Tab 走 28 站，每站都有 2px 簾幕紅框；橫向片列的框原本被 `overflow-x: auto` 裁掉上下兩條，
    `.rail` 上下各墊 4px 補回，上方從 `mt` 扣掉、下方負 margin 收回，版面不動
  - 英文介面 1440／375 無溢出
  - gate：typecheck／lint／test（257）／build 全綠
- [x] 細修第 4 輪（2026-10-06，同分支；mock 資料，平板寬度、320、鍵盤、減少動態）
  - 平板 768／1024：首頁、詳情、想看、收藏、外面在放無破版
  - 段落標題列（`SectionHead`）改成與 `MovieRow` 同一個結構：放不下時換行的是旁註，
    「看全部」留在標題那一行右邊。原本 375 英文的 See all 會被擠到第二行左邊
  - 英文首頁「Everything watched」改「All watched」，375 標題列不再換行（320 仍換，接受）
  - 320：語言鍵「繁體中文」原本折成兩行，加 `whitespace-nowrap`；全站各頁 320 無橫向溢出
  - 報讀名稱：預告片播放鍵原本只念片名，改「播放預告片：片名」（iframe 仍用片名）；
    首頁「打開這部」用 `aria-describedby` 掛上片名，離開段落（讀屏連結清單）也知道是哪部
  - 鍵盤：想看／看過／收藏／搜尋／瀏覽 1440 與首頁／詳情 375 走過，每站有焦點框；
    排序與篩選是 radiogroup，一組只佔一個 Tab 站
  - 減少動態（`prefers-reduced-motion: reduce`）：首頁與詳情整頁截圖，沒有停在透明的內容；
    Lenis、劇照下沉、Flip、CSS 四處都有守門
  - gate：typecheck／lint／test（257）／build 全綠
- [x] 細修第 5 輪（2026-10-06，同分支；mock 資料，空片庫、TMDB 斷線、載入骨架、CLS）
  - 空片庫：`LibraryEmpty` 原本置中、手機上浮在空白中間，跟全站靠左的表不一致。
    改排成表的「00」那一列，序號欄寬同想看清單，片放進來後第一列長在同一個位置
  - 想看清單空了：狀態列在沒有待復原時不再保留 44px 高，空狀態貼住刊頭；
    `role="status"` 仍在，最後一部記為看過時的復原照樣念得到
  - TMDB 斷線：探索頁第一頁失敗時，原本是置中的通用「載入失敗」加上下兩條線。
    改成跟站內其他錯誤同一個樣子（靠左、左側簾幕紅粗線、重試鍵跟在旁邊），
    訊息照 `tmdbErrorMessage` 說出是哪裡出錯；`ListStatus` 上面沒有片時不畫頂線
  - 載入骨架對照（延遲 2.5 秒截骨架與載完）：首頁、詳情、熱門、想看、人物形狀對得上
  - CLS：詳情頁 0.094，來源是頁尾。骨架只有半個視窗高，頁尾先露在畫面裡，
    內容一到被推出去。所有骨架外層加 `min-h-dvh` 後，延遲情況下 1440 與 375 各頁都在 0.001 以下
  - gate：typecheck／lint／test（257）／build（26 條路由）全綠

- [x] 細修第 6 輪（2026-10-06，同分支；mock 極端資料壓測：超長片名與無空格長字、沒有劇照／海報、長短評、片庫滿載）
  - 長字溢出：詳情頁片名、想看清單列、日誌在 375 寬撐破版面。`body` 加 `overflow-wrap: break-word`，
    外來資料（TMDB 片名、使用者短評）裡沒有空格的長字串在欄內斷開
  - 今晚沒有劇照：原本右欄留著，左邊一欄字、右邊一大塊空白，像圖沒載入。
    沒有劇照時改單欄，文字欄限 46rem，片名不拉成一整條
  - 首頁日誌的短評：`line-clamp-3` 沒作用，因為同一個元素又寫了 `block`，蓋掉 line-clamp 設的 display。
    拿掉 `block`，長短評回到最多三行
  - 收藏牆的分數／日期／拿掉：手機兩欄時有的卡擠得下一行、有的擠不下，同一排兩張卡的「拿掉」一高一低。
    手機上「拿掉」一律自成一行。日期換行時行首會留一個「·」，
    改用 `globals.css` 的 `.dot-run`（每段前面放點、整串左縮一個點寬再裁掉，行首的點落在框外）
  - 看過、未改：想看清單原文片名在詞間換行（正常斷行）；看過頁長短評全文顯示（那一頁本來就是讀短評的地方）；
    看過頁沒有海報時縮圖是空框；測試用的無空格超長片名在詳情頁 375 寬只能在字中間斷
  - gate：typecheck／lint／test（257）／build（26 條路由）全綠

- [x] 細修第 7 輪（2026-10-06，同分支；實際點過每個寫入動作，再讓 mock 的寫入全部回 500 重跑一次；全站文字對比實算）
  - 焦點去向：片庫三頁拿掉一部、想看清單記為看過之後，那一列消失，焦點掉回 `<body>`，
    鍵盤下一個 Tab 從頁首重來。新增 `library/useRefocus.ts`：交給下一列的片名，沒有就上一列，
    一部都不剩就交給空狀態的連結；復原時落在放回來那一列的片名上
  - 詳情頁同一個問題兩處：按「復原」後復原鍵不畫了，焦點改交給「想看」；
    「清除評分」成功後清除鍵不畫了，焦點改交給評分刻度第 1 格（清除後整組唯一可 Tab 到的那格）
  - 送出中的鍵從 `disabled` 改成 `aria-disabled`（片庫三顆鍵、復原、評分的儲存與清除、拿掉的確認列）。
    停用的鍵會把焦點丟回 `<body>`；重複送出改由各自的 handler 擋。`globals.css` 的 hover 與停用外觀一併認 `aria-disabled`
  - 寫入失敗（500）：按鈕翻回原狀、出現「沒有存成功／沒有拿掉，請再試一次。」、焦點留在剛按的鍵上可以直接重試；
    評分失敗時分數與短評都留著，不會出現假的「已儲存」。這一段原本就對，只是第一次實際驗
  - 對比：1440 與 375 寬、主要七頁加拿掉確認列與鎖定頁，逐個文字元素算前景對實際背景。
    最低是 `--paper-faint` 小字 4.63:1，全部過 AA。唯一不到的是鎖定頁沒輸入時停用的「進入」（2.12:1），
    WCAG 1.4.3 不要求停用元件
  - 看過、未改：寫入全失敗時評分欄與片庫鍵各出一則同樣的錯誤訊息（兩個動作各自失敗，各自講）；
    儲存後鍵上一次顯示「儲存」而非「已儲存」，之後連跑六次都是「已儲存」，重現不了
  - gate：typecheck／lint／test（257）／build（26 條路由）全綠

- [x] 細修第 8 輪（2026-10-06，同分支；production build，1440 與 375 寬量 LCP、各類資源體積與圖片尺寸）
  - 熱門、找片、搜尋、收藏的首屏海報全是 `loading="lazy"`，而 LCP 就是其中一張。
    片卡另外有 `fadeIn`：SSR 時帶 `opacity-0`，要等 hydration 跑完才打開，首屏海報會空白到 JS 載完。
    `MovieCard` 加 `eager`／`first`：頁首格線前 10 張（五欄 × 兩列）不延遲、不淡入，第 1 張 `fetchPriority="high"`；
    榜單前 10 列縮圖不延遲；收藏前 8 張（四欄 × 兩列）不延遲、第 1 張 high
  - 結果（1440，mock 後端）：熱門 LCP 1080 → 540ms、找片 1240 → 228ms、搜尋 1236 → 544ms、收藏 548 → 約 600ms（同一量級，雜訊內）。
    首頁與詳情頁原本就由劇照帶 `fetchpriority=high`，700ms／492ms，未動
  - 圖片尺寸：srcset 挑的檔案與實際寬度相符（w342 對 251／307px、w780 對 747px、w1280 對 892px）
  - 看過、未改：
    - 看過清單縮圖 56px 抓 w185。w92 在兩倍螢幕只有 92px，小於所需 112px，會糊，維持 w185
    - 字體：首頁約 1.27 MB，大部分是 Noto Serif TC 400 的 unicode-range 切片（14 片）。
      已是 `preload: false`、不擋首次繪製，檔案以 immutable 快取；要再減就得動字體鎖，不在這一輪處理
    - JS 每頁 193–204 KB、CSS 86 KB，本輪沒有增加
  - gate：typecheck／lint／test（257）／build（26 條路由）全綠

## 之後另外處理（需使用者決定）

- 上線後用真實資料逐頁看一次（本機要補 `.env`，或直接看線上版）
