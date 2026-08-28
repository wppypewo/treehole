import { NextResponse } from "next/server";
import { listWatched, addWatched, removeWatched } from "@/lib/db";
import {
  dbErrorResponse,
  movieFromBody,
  tmdbIdFromQuery,
} from "@/lib/db-route";

export const runtime = "nodejs";

// GET：取得全部已看過
export async function GET() {
  try {
    return NextResponse.json({ items: await listWatched() });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// POST：標記已看過（body 帶電影資訊）
export async function POST(request: Request) {
  const movie = movieFromBody(await request.json().catch(() => null));
  if (!movie) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  try {
    await addWatched(movie);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// DELETE：取消已看過（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = tmdbIdFromQuery(request.url);
  if (tmdbId === null) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  try {
    await removeWatched(tmdbId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
