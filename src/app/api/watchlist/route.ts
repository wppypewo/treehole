import { NextResponse } from "next/server";
import { listWatchlist, addWatchlist, removeWatchlist } from "@/lib/db";
import {
  dbErrorResponse,
  movieFromBody,
  tmdbIdFromQuery,
} from "@/lib/db-route";

export const runtime = "nodejs";

// GET：取得全部「想看」
export async function GET() {
  try {
    return NextResponse.json({ items: await listWatchlist() });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// POST：加入「想看」（body 帶電影資訊）
export async function POST(request: Request) {
  const movie = movieFromBody(await request.json().catch(() => null));
  if (!movie) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  try {
    await addWatchlist(movie);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// DELETE：移除「想看」（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = tmdbIdFromQuery(request.url);
  if (tmdbId === null) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  try {
    await removeWatchlist(tmdbId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
