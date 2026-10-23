import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 不設 images.remotePatterns：全站都用原生 <img>（見 MovieCard、csp.ts），
  // 沒有用到 next/image。設了的話任何人都能透過 /_next/image 讓本站代抓、
  // 轉檔 image.tmdb.org 的圖，白白消耗 Vercel 的圖片最佳化額度。

  // 全站安全標頭。這四個都是靜態值，放在這裡就夠了。
  //
  // CSP 不在這裡：它每個 request 要換一次 nonce，是動態值，
  // 由 src/proxy.ts 呼叫 src/lib/csp.ts 產生後掛上去（2026-09-03 加）。
  // 目前是 Report-Only，翻成強制執行的開關是 csp.ts 的 CSP_ENFORCE，
  // 翻之前要做的事寫在那支檔案的註解裡。
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 擋 MIME 嗅探：回應宣告什麼型別就是什麼型別
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 不准別人把這個站塞進 iframe（本站自己嵌 YouTube 不受影響，
          // 這個標頭管的是「被嵌」不是「嵌別人」）
          { key: "X-Frame-Options", value: "DENY" },
          // 跨站時只送 origin，不外洩完整路徑（片單網址會透露看了什麼）
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // 這個站不需要這三個裝置權限，一律關掉
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
