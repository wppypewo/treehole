import { describe, expect, it } from "vitest";
import {
  buildCsp,
  createNonce,
  CSP_ENFORCE,
  CSP_REQUEST_HEADER,
  CSP_RESPONSE_HEADER,
} from "@/lib/csp";

/** 取出某個指令的值，找不到回 null。 */
function directive(csp: string, name: string): string | null {
  for (const part of csp.split(";")) {
    const trimmed = part.trim();
    if (trimmed === name) return "";
    if (trimmed.startsWith(`${name} `)) return trimmed.slice(name.length + 1);
  }
  return null;
}

describe("buildCsp：script-src", () => {
  it("帶上這次請求的 nonce，並保留 'self'", () => {
    const value = directive(buildCsp("abc123", false), "script-src");
    expect(value).toContain("'nonce-abc123'");
    expect(value).toContain("'self'");
  });

  it("不得加入 strict-dynamic", () => {
    // 加了會讓 'self' 被瀏覽器忽略，而初始 HTML 裡有 Next 直接寫進去、
    // 沒帶 nonce 的 <script src>（parser-inserted），會被擋掉。
    // 這條測試是防止日後有人「照官方範例補回去」。
    expect(directive(buildCsp("abc123", false), "script-src")).not.toContain(
      "strict-dynamic",
    );
  });

  it("production 不得出現 unsafe-eval 或 unsafe-inline", () => {
    const value = directive(buildCsp("abc123", false), "script-src")!;
    expect(value).not.toContain("unsafe-eval");
    expect(value).not.toContain("unsafe-inline");
  });

  it("dev 才加 unsafe-eval（React 用 eval 重建伺服器端錯誤堆疊）", () => {
    expect(directive(buildCsp("abc123", true), "script-src")).toContain(
      "'unsafe-eval'",
    );
  });
});

describe("buildCsp：style-src", () => {
  it("不得有 unsafe-inline", () => {
    // 這個站沒有任何 style={{...}}，建置產物實測 0 個內聯 <style> 與
    // 0 個 style="..." 屬性，所以收得到 'self'。GSAP 與 Lenis 走 CSSOM
    // 寫 element.style，不歸 style-src 管。
    // 這條紅了通常代表有人加了內聯樣式——先問要不要改成 class，
    // 而不是直接把 'unsafe-inline' 加回來。
    expect(directive(buildCsp("abc123", false), "style-src")).toBe("'self'");
  });
});

describe("buildCsp：外部來源", () => {
  it("img-src 放行 TMDB 與 YouTube 縮圖，並允許 data:", () => {
    const value = directive(buildCsp("n", false), "img-src")!;
    expect(value).toContain("https://image.tmdb.org");
    // TrailerPlayer 未播放時的縮圖
    expect(value).toContain("https://img.youtube.com");
    // globals.css 的下拉箭頭是 inline SVG 的 background-image
    expect(value).toContain("data:");
  });

  it("img-src 放行 i.ytimg.com（YouTube 播放器的封面圖）", () => {
    // 這一條不是照著原始碼推出來的，是 2026-09-03 在瀏覽器裡撞到的：
    // iframe 還沒 commit 到 youtube.com 之前是初始空文件，繼承父層 CSP，
    // 播放器最早的封面預載就在那個視窗裡發出去，於是記在我們這份政策上。
    // 拿掉這一條、又把 CSP_ENFORCE 翻成 true，預告片封面就會破在
    // /movie/[id]——本機唯一渲染不出來、因此最不容易被發現的那一頁。
    expect(directive(buildCsp("n", false), "img-src")).toContain(
      "https://i.ytimg.com",
    );
  });

  it("frame-src 只放行 YouTube 嵌入", () => {
    expect(directive(buildCsp("n", false), "frame-src")).toBe(
      "https://www.youtube.com",
    );
  });

  it("connect-src 只有自己（TMDB 呼叫全在伺服器端）", () => {
    expect(directive(buildCsp("n", false), "connect-src")).toBe("'self'");
  });

  it("font-src 只有自己（next/font 建置期自架）", () => {
    expect(directive(buildCsp("n", false), "font-src")).toBe("'self'");
  });
});

describe("buildCsp：其餘指令", () => {
  it("該有的都在", () => {
    const csp = buildCsp("n", false);
    expect(directive(csp, "default-src")).toBe("'self'");
    expect(directive(csp, "object-src")).toBe("'none'");
    expect(directive(csp, "base-uri")).toBe("'self'");
    expect(directive(csp, "form-action")).toBe("'self'");
    expect(directive(csp, "frame-ancestors")).toBe("'none'");
  });

  it("upgrade-insecure-requests 跟著 CSP_ENFORCE 走", () => {
    // Report-Only 政策裡這個指令規範上無效，瀏覽器只會印一則 error。
    // 只在強制執行時才送，避免每頁一則假警報蓋掉真的違規。
    expect(directive(buildCsp("n", false), "upgrade-insecure-requests")).toBe(
      CSP_ENFORCE ? "" : null,
    );
  });
});

describe("標頭名稱", () => {
  it("目前是 Report-Only", () => {
    // 翻 CSP_ENFORCE 時這兩條會一起紅，提醒確實是有意為之。
    // 翻之前 /movie/[id] 的預告片一定要在有資料庫的環境按過一次播放，
    // 那是唯一沒被瀏覽器實測涵蓋的路徑。
    expect(CSP_ENFORCE).toBe(false);
    expect(CSP_RESPONSE_HEADER).toBe("Content-Security-Policy-Report-Only");
  });

  it("送進 request 的標頭永遠是 Content-Security-Policy", () => {
    // Next 從 request 上的這個標頭解析 nonce。名字換掉就抓不到，
    // 翻成強制執行的那一刻整站會白。
    expect(CSP_REQUEST_HEADER).toBe("Content-Security-Policy");
  });
});

describe("createNonce", () => {
  it("每次都不一樣，且是合法的 base64 字元", () => {
    const a = createNonce();
    const b = createNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(a.length).toBeGreaterThan(20);
  });
});
