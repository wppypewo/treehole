import { NextResponse } from "next/server";
import { upsertRating, removeRating } from "@/lib/db";

export const runtime = "nodejs";

// POST：新增或更新個人評分（1–10）與短評
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tmdbId = Number(body?.tmdb_id);
  const score = Number(body?.score);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return NextResponse.json({ error: "invalid-score" }, { status: 400 });
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : "";
  await upsertRating(
    {
      tmdb_id: tmdbId,
      title: String(body.title ?? ""),
      poster_path: body.poster_path ?? null,
      vote_average: Number(body.vote_average) || 0,
    },
    score,
    note,
  );
  return NextResponse.json({ ok: true });
}

// DELETE：清除個人評分（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = Number(new URL(request.url).searchParams.get("tmdb_id"));
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  await removeRating(tmdbId);
  return NextResponse.json({ ok: true });
}
