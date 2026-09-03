import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LOCK_HEADER,
  OWNER_COOKIE,
  ownerConfig,
  verifyToken,
} from "@/lib/owner-session";
import {
  buildCsp,
  createNonce,
  CSP_REQUEST_HEADER,
  CSP_RESPONSE_HEADER,
  NONCE_HEADER,
} from "@/lib/csp";

// 解鎖頁與解鎖端點本身必須放行，否則沒有人進得來
const OPEN_PATHS = new Set(["/unlock", "/api/unlock"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // nonce 必須在渲染前就進到 request 標頭裡：Next 從 request 上的
  // Content-Security-Policy 解析出 nonce，自動加到框架 script 與自家的
  // inline script 上。四條回傳路徑都要帶，漏掉哪一條，那一條就沒有政策。
  const nonce = createNonce();
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set(CSP_REQUEST_HEADER, csp);

  const withCsp = (response: NextResponse): NextResponse => {
    response.headers.set(CSP_RESPONSE_HEADER, csp);
    return response;
  };

  if (OPEN_PATHS.has(pathname)) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const config = ownerConfig();
  const token = request.cookies.get(OWNER_COOKIE)?.value;
  const unlocked =
    config !== null &&
    token !== undefined &&
    (await verifyToken(token, config.secret));

  if (unlocked) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // API 回 401 JSON。丟解鎖頁的 HTML 給 fetch() 只會讓前端拿到一坨解析不了的東西
  if (pathname.startsWith("/api/")) {
    return withCsp(NextResponse.json({ error: "locked" }, { status: 401 }));
  }

  // 頁面用 rewrite 不用 redirect：網址列保持原樣，解鎖後重新整理就會停在
  // 原本要去的那一頁，不會被丟回首頁
  requestHeaders.set(LOCK_HEADER, "1");
  return withCsp(
    NextResponse.rewrite(new URL("/unlock", request.url), {
      request: { headers: requestHeaders },
    }),
  );
}

export const config = {
  matcher: [
    // 排除靜態資產。漏掉這條的話連 CSS 和 JS 都會被鎖，解鎖頁自己會先壞掉。
    // 這些路徑同時也拿不到 CSP 標頭——它們不是文件，沒有腳本執行環境，
    // 由 script-src / style-src 在載入它們的那份文件上管即可。
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
