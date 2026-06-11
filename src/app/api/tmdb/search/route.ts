import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";
import { tmdbErrorResponse } from "@/lib/tmdb-route";
import { normalizeLocale } from "@/i18n/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get("locale"));
  const page = Number(searchParams.get("page")) || 1;
  const query = (searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json(
      { error: "missing-query", message: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await searchMovies(locale, query, page));
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
