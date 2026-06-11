import { NextResponse } from "next/server";
import { getUpcoming } from "@/lib/tmdb";
import { tmdbErrorResponse } from "@/lib/tmdb-route";
import { normalizeLocale } from "@/i18n/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get("locale"));
  const page = Number(searchParams.get("page")) || 1;

  try {
    return NextResponse.json(await getUpcoming(locale, page));
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
