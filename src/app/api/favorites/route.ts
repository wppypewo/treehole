import { NextResponse } from "next/server";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/db";
import {
  dbErrorResponse,
  movieFromBody,
  tmdbIdFromQuery,
} from "@/lib/db-route";

export const runtime = "nodejs";

// GET：取得全部收藏
export async function GET() {
  try {
    return NextResponse.json({ items: await listFavorites() });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// POST：新增收藏（body 帶電影資訊）
export async function POST(request: Request) {
  const movie = movieFromBody(await request.json().catch(() => null));
  if (!movie) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  try {
    await addFavorite(movie);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// DELETE：移除收藏（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = tmdbIdFromQuery(request.url);
  if (tmdbId === null) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  try {
    await removeFavorite(tmdbId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
