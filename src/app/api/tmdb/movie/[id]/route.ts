import { NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/tmdb";
import { tmdbErrorResponse } from "@/lib/tmdb-route";
import { normalizeLocale } from "@/i18n/config";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get("locale"));
  const { id } = await params;
  const movieId = Number(id);

  if (!Number.isInteger(movieId) || movieId <= 0) {
    return NextResponse.json(
      { error: "not-found", message: "Invalid movie id" },
      { status: 404 },
    );
  }

  try {
    return NextResponse.json(await getMovieDetails(locale, movieId));
  } catch (error) {
    return tmdbErrorResponse(error);
  }
}
