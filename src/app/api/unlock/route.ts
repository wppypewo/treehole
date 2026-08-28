import { NextResponse } from "next/server";
import {
  OWNER_COOKIE,
  SESSION_MAX_AGE,
  issueToken,
  ownerConfig,
  passcodeMatches,
} from "@/lib/owner-session";

export const runtime = "nodejs";

// POST：用通行碼換一張解鎖 cookie
export async function POST(request: Request) {
  const config = ownerConfig();
  if (!config) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  // 這裡沒有共享狀態可以做真正的 rate limit（serverless 每個實例各自獨立），
  // 固定延遲至少讓線上暴力嘗試變慢。真正的防線是通行碼本身要夠長。
  await new Promise((resolve) => setTimeout(resolve, 400));

  try {
    if (!(await passcodeMatches(passcode, config.passcode))) {
      return NextResponse.json({ error: "wrong-passcode" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(OWNER_COOKIE, await issueToken(config.secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    // Web Crypto 這兩步理論上不該炸，真炸了也不能放行——沒發出 cookie 就是關著的。
    // 回 500 而不是 401，是為了不讓「伺服器壞了」被表單說成「通行碼不對」。
    console.error("[api/unlock] POST failed:", error);
    return NextResponse.json({ error: "unlock-failed" }, { status: 500 });
  }
}
