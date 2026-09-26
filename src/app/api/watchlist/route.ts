import { NextResponse } from "next/server";
import { listWatchlist, addWatchlist, removeWatchlist } from "@/lib/db";
import {
  addedAtFromBody,
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

// POST：加入「想看」（body 帶電影資訊）。
// 可選的 added_at 只給「標記看過後復原」用，讓那部片回到清單原本的位置。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const movie = movieFromBody(body);
  if (!movie) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  const addedAt = addedAtFromBody(body);
  if (addedAt === "invalid") {
    return NextResponse.json({ error: "invalid-added-at" }, { status: 400 });
  }
  try {
    await addWatchlist(movie, addedAt);
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
