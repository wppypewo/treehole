// 解鎖頁幾乎不用等（只讀 cookie 與環境變數）。有這個檔只是為了不讓根目錄的
// 首頁骨架套到這裡：鎖著的人不該先看到一個片庫首頁的輪廓。
export default function Loading() {
  return <div className="page-shell min-h-[78dvh]" />;
}
