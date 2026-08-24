#!/usr/bin/env node
/**
 * 片庫備份。
 *
 * 為什麼需要這個：`data/movies.sqlite` 是收藏 / 想看 / 已看過 / 評分 /
 * 搜尋紀錄的唯一一份資料，而且被 .gitignore 排除在版控外（那是對的，
 * 個人資料不該推上 GitHub）。結果是程式碼有 git 保護，這份累積型的資料
 * 完全沒有副本。
 *
 * 為什麼不能用 cp：資料庫跑 WAL 模式。實測過主檔停在幾週前、近期資料
 * 全在 -wal 裡的情況——直接複製主檔會得到一份看起來正常但內容過期的備份。
 * `db.backup()` 會把 WAL 內容 checkpoint 進目的檔，這是唯一正確的做法。
 *
 * 備份完一定驗證。沒驗證過的備份不算備份，出事時才發現是壞的就太遲了。
 *
 * 用法：npm run backup
 * 還原：關掉 dev server，然後
 *   rm data/movies.sqlite data/movies.sqlite-wal data/movies.sqlite-shm
 *   cp data/movies.sqlite.<你要的時間>.bak data/movies.sqlite
 */

import Database from "better-sqlite3";
import { existsSync, statSync, unlinkSync, readdirSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "movies.sqlite");

/** 這些表是實際存放使用者資料的地方，備份後逐一比對 */
const USER_TABLES = [
  "favorites",
  "watchlist",
  "watched",
  "ratings",
  "search_history",
];

function fmtBytes(n) {
  return n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(n / 1024)} KB`;
}

/** 逐表計數；表不存在就跳過（schema 可能隨版本增減） */
function countRows(db) {
  const counts = {};
  for (const t of USER_TABLES) {
    try {
      counts[t] = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
    } catch {
      // 這張表在這個 schema 版本裡不存在，不是錯誤
    }
  }
  return counts;
}

if (!existsSync(DB_PATH)) {
  console.error(`找不到資料庫：${DB_PATH}`);
  console.error("先跑過 npm run dev 並在片庫留下資料，才會產生這個檔案。");
  process.exit(1);
}

// 檔名帶到秒，並且絕不覆蓋既有檔案。
// 只帶到分鐘不夠——實測同一分鐘內連跑兩次會直接蓋掉前一份好的備份，
// 「備份指令毀掉你的備份」是最不能接受的失敗方式。
const stamp = new Date()
  .toLocaleString("sv-SE", { hour12: false })
  .replace(" ", "T")
  .replace(/:/g, "");
let outPath = path.join(DATA_DIR, `movies.sqlite.${stamp}.bak`);
for (let n = 2; existsSync(outPath); n += 1) {
  outPath = path.join(DATA_DIR, `movies.sqlite.${stamp}-${n}.bak`);
}

const src = new Database(DB_PATH, { readonly: true });
const before = countRows(src);

try {
  await src.backup(outPath);
} catch (err) {
  console.error(`備份失敗：${err.message}`);
  process.exit(1);
} finally {
  src.close();
}

// ── 驗證：開起來，檢查完整性，逐表比對筆數 ──────────────────
// 整段包在 try 裡，連 new Database() 也是。備份檔如果根本不是合法的
// SQLite 檔，開檔當下就會拋 SQLITE_NOTADB——那正是最該被攔下來的情況，
// 不能讓它變成一個未捕捉的例外把壞檔留在原地。
let ok = true;
let verify = null;
try {
  verify = new Database(outPath, { readonly: true });

  const integrity = verify.pragma("integrity_check", { simple: true });
  if (integrity !== "ok") {
    console.error(`備份檔完整性檢查失敗：${integrity}`);
    ok = false;
  }

  const after = countRows(verify);
  for (const [table, n] of Object.entries(before)) {
    if (after[table] !== n) {
      console.error(`  ${table}：原本 ${n} 筆，備份裡是 ${after[table] ?? "讀不到"} 筆`);
      ok = false;
    }
  }

  if (ok) {
    console.log(`已備份 → ${path.relative(process.cwd(), outPath)}`);
    console.log(`  大小 ${fmtBytes(statSync(outPath).size)}，integrity_check ok`);
    const rows = Object.entries(after)
      .map(([t, n]) => `${t} ${n}`)
      .join("、");
    console.log(`  ${rows}`);
  }
} catch (err) {
  console.error(`備份檔無法讀取：${err.code ?? err.message}`);
  ok = false;
} finally {
  try {
    verify?.close();
  } catch {
    // 開檔就失敗的話沒有東西要關
  }
  // 驗證時開啟會產生附屬檔，收掉免得留一地垃圾
  for (const suffix of ["-wal", "-shm"]) {
    const f = outPath + suffix;
    if (existsSync(f)) unlinkSync(f);
  }
}

if (!ok) {
  // 壞掉的備份比沒有備份更危險——會讓人以為自己有保障
  unlinkSync(outPath);
  console.error("驗證未通過，已刪除這份備份檔。");
  process.exit(1);
}

// ── 累積提醒：不自動刪，只讓數量可見 ──────────────────────────
const backups = readdirSync(DATA_DIR).filter(
  (f) => f.startsWith("movies.sqlite.") && f.endsWith(".bak"),
);
if (backups.length > 10) {
  const total = backups.reduce(
    (sum, f) => sum + statSync(path.join(DATA_DIR, f)).size,
    0,
  );
  console.log(
    `\n目前有 ${backups.length} 份備份，共 ${fmtBytes(total)}。` +
      `舊的可以自己刪，這個指令不會動它們。`,
  );
}
