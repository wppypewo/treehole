import type { Metadata } from "next";
import { Geist, Bodoni_Moda, Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { htmlLang } from "@/i18n/config";

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

export const metadata: Metadata = {
  title: "Treehole",
  description: "電影導覽站。瀏覽 TMDB 片單、收藏想看的、記下看過的。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html
      lang={htmlLang(locale)}
      className={`${geistSans.variable} ${bodoni.variable} ${notoSerifTC.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-paper">
        <SmoothScroll />
        <Navbar locale={locale} dict={dict} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
