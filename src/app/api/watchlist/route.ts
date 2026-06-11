import { NextResponse } from "next/server";
import { listWatchlist, addWatchlist, removeWatchlist } from "@/lib/db";

export const runtime = "nodejs";

// GET：取得全部「想看」
export async function GET() {
  return NextResponse.json({ items: listWatchlist() });
}

// POST：加入「想看」（body 帶電影資訊）
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tmdbId = Number(body?.tmdb_id);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  addWatchlist({
    tmdb_id: tmdbId,
    title: String(body.title ?? ""),
    poster_path: body.poster_path ?? null,
    vote_average: Number(body.vote_average) || 0,
  });
  return NextResponse.json({ ok: true });
}

// DELETE：移除「想看」（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = Number(new URL(request.url).searchParams.get("tmdb_id"));
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  removeWatchlist(tmdbId);
  return NextResponse.json({ ok: true });
}
