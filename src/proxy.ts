import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LOCK_HEADER,
  OWNER_COOKIE,
  ownerConfig,
  verifyToken,
} from "@/lib/owner-session";

// 解鎖頁與解鎖端點本身必須放行，否則沒有人進得來
const OPEN_PATHS = new Set(["/unlock", "/api/unlock"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (OPEN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const config = ownerConfig();
  const token = request.cookies.get(OWNER_COOKIE)?.value;
  const unlocked =
    config !== null &&
    token !== undefined &&
    (await verifyToken(token, config.secret));

  if (unlocked) {
    return NextResponse.next();
  }

  // API 回 401 JSON。丟解鎖頁的 HTML 給 fetch() 只會讓前端拿到一坨解析不了的東西
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "locked" }, { status: 401 });
  }

  // 頁面用 rewrite 不用 redirect：網址列保持原樣，解鎖後重新整理就會停在
  // 原本要去的那一頁，不會被丟回首頁
  const headers = new Headers(request.headers);
  headers.set(LOCK_HEADER, "1");
  return NextResponse.rewrite(new URL("/unlock", request.url), {
    request: { headers },
  });
}

export const config = {
  matcher: [
    // 排除靜態資產。漏掉這條的話連 CSS 和 JS 都會被鎖，解鎖頁自己會先壞掉
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)",
  ],
};
