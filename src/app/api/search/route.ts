import { NextResponse } from "next/server";
import { getLocale } from "@/i18n/server";
import { searchMovies, TmdbError } from "@/lib/tmdb";

export const runtime = "nodejs";

// GET ?q=關鍵字&page=N：搜尋結果分頁。金鑰只在伺服器讀取，瀏覽器只呼叫本端點。
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim();
  if (!query) {
    return NextResponse.json({ results: [], hasMore: false });
  }
  const raw = Number(params.get("page") ?? "1");
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1;
  const locale = await getLocale();

  try {
    const data = await searchMovies(locale, query, page);
    return NextResponse.json({
      results: data.results,
      hasMore: page < data.total_pages,
    });
  } catch (error) {
    const status =
      error instanceof TmdbError && error.kind === "missing-key" ? 500 : 502;
    return NextResponse.json({ error: "tmdb" }, { status });
  }
}
