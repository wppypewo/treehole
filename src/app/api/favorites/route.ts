import { NextResponse } from "next/server";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/db";

export const runtime = "nodejs";

// GET：取得全部收藏
export async function GET() {
  return NextResponse.json({ items: await listFavorites() });
}

// POST：新增收藏（body 帶電影資訊）
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tmdbId = Number(body?.tmdb_id);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  await addFavorite({
    tmdb_id: tmdbId,
    title: String(body.title ?? ""),
    poster_path: body.poster_path ?? null,
    vote_average: Number(body.vote_average) || 0,
  });
  return NextResponse.json({ ok: true });
}

// DELETE：移除收藏（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = Number(new URL(request.url).searchParams.get("tmdb_id"));
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  await removeFavorite(tmdbId);
  return NextResponse.json({ ok: true });
}
