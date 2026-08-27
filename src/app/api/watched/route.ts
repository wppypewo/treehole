import { NextResponse } from "next/server";
import { listWatched, addWatched, removeWatched } from "@/lib/db";

export const runtime = "nodejs";

// GET：取得全部已看過
export async function GET() {
  return NextResponse.json({ items: await listWatched() });
}

// POST：標記已看過（body 帶電影資訊）
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tmdbId = Number(body?.tmdb_id);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  await addWatched({
    tmdb_id: tmdbId,
    title: String(body.title ?? ""),
    poster_path: body.poster_path ?? null,
    vote_average: Number(body.vote_average) || 0,
  });
  return NextResponse.json({ ok: true });
}

// DELETE：取消已看過（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = Number(new URL(request.url).searchParams.get("tmdb_id"));
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  await removeWatched(tmdbId);
  return NextResponse.json({ ok: true });
}
