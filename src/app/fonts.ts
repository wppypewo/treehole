import { Geist, Bodoni_Moda, Noto_Serif_TC } from "next/font/google";

// 字體定義集中在這裡：layout 與 global-error 各自畫一份 <html>，
// 兩邊都要掛同一組 CSS 變數。next/font 每呼叫一次就多託管一份，
// 所以只在這裡呼叫，兩邊 import 同一個物件。

// 介面與內文：撐資訊層，不搶戲
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// 片名與標題：高反差 didone，對應電影海報與影展主視覺的字體傳統
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

// 中文標題：明體。CJK 檔案大，關掉 preload 讓它在首屏之後才到位，
// fallback 走系統宋體（Songti TC / PMingLiU），不會出現無字可用的空窗。
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["400", "500"],
  preload: false,
});

/** 掛在 <html> 上的字體變數 class */
export const fontVariables = `${geistSans.variable} ${bodoni.variable} ${notoSerifTC.variable}`;
