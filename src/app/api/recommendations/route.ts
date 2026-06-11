import { NextResponse } from "next/server";
import { getLocale } from "@/i18n/server";
import { getForYouPage } from "@/lib/recommendations";

export const runtime = "nodejs";

// GET ?page=N：為你推薦分頁（依本機收藏／已看過彙整 TMDB 推薦）。
export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("page") ?? "1");
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1;
  const locale = await getLocale();

  try {
    const { results, hasMore } = await getForYouPage(locale, page);
    return NextResponse.json({ results, hasMore });
  } catch {
    return NextResponse.json({ error: "tmdb" }, { status: 502 });
  }
}
