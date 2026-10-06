// 「今晚」片名的字級依長度分三檔。
//
// 原本固定 clamp(2.5rem,6vw,4.75rem)：四個字的中文片名在左欄只佔一半寬，
// 首頁最重要的一行反而顯得小；二十幾個字母的英文片名又斷成三四行。
// 寬度以「全形字＝1、半形字＝0.55」估算——Bodoni Moda 的平均字寬約是
// 字級的一半多一點，Noto Serif TC 的漢字是一個字級。只求分檔，不求精確。
// 第一檔的 7vw 是讓五個漢字在 900–1400px 的左欄（5fr）內排得下一行。

/** 估算片名排出來大約幾個全形字寬 */
export function titleWidth(title: string): number {
  let w = 0;
  for (const ch of title) {
    // U+2E80 以後涵蓋 CJK 部首、假名、漢字、全形標點與韓文
    w += ch.codePointAt(0)! >= 0x2e80 ? 1 : 0.55;
  }
  return w;
}

/**
 * 依估算寬度回傳字級 class。
 * 三檔的 class 要寫成完整字串，Tailwind 才掃得到
 */
export function tonightTitleSize(title: string): string {
  const w = titleWidth(title);
  if (w <= 5) return "text-[clamp(3rem,7vw,6.25rem)]";
  if (w <= 10) return "text-[clamp(2.5rem,6vw,4.75rem)]";
  return "text-[clamp(2.25rem,4.4vw,3.5rem)]";
}
