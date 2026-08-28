import { NextResponse } from "next/server";
import { upsertRating, removeRating } from "@/lib/db";
import {
  dbErrorResponse,
  movieFromBody,
  tmdbIdFromQuery,
} from "@/lib/db-route";

export const runtime = "nodejs";

// POST：新增或更新個人評分（1–10）與短評
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const movie = movieFromBody(body);
  if (!movie) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  const score = Number((body as Record<string, unknown> | null)?.score);
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return NextResponse.json({ error: "invalid-score" }, { status: 400 });
  }
  const rawNote = (body as Record<string, unknown> | null)?.note;
  const note = typeof rawNote === "string" ? rawNote.slice(0, 1000) : "";
  try {
    await upsertRating(movie, score, note);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}

// DELETE：清除個人評分（?tmdb_id=）
export async function DELETE(request: Request) {
  const tmdbId = tmdbIdFromQuery(request.url);
  if (tmdbId === null) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  try {
    await removeRating(tmdbId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
