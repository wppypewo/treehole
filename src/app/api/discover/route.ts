import { NextResponse } from "next/server";
import { getLocale } from "@/i18n/server";
import { discoverMovies, TmdbError } from "@/lib/tmdb";

export const runtime = "nodejs";

// GET ?genre=&year=&minRating=&sort=&page=：條件瀏覽分頁。金鑰只在伺服器讀取。
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const numParam = (key: string): number | undefined => {
    const n = Number(sp.get(key));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const rawPage = Number(sp.get("page") ?? "1");
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const locale = await getLocale();

  try {
    const data = await discoverMovies(locale, {
      genre: numParam("genre"),
      year: numParam("year"),
      minRating: numParam("minRating"),
      sort: sp.get("sort") || undefined,
      page,
    });
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
