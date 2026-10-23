import { NextResponse } from "next/server";
import { upsertRating, removeRating } from "@/lib/db";
import {
  dbErrorResponse,
  movieFromBody,
  tmdbIdFromQuery,
} from "@/lib/db-route";
import { NOTE_MAX_LENGTH, noteLength } from "@/lib/library";

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
  const note = typeof rawNote === "string" ? rawNote : "";
  // 超長就拒絕，不截斷：以前靜默截到 1000 個 code unit 再回 200，畫面顯示
  // 「已儲存」，重新整理才發現後半段不見，截點落在 emoji 中間還會存進半個字。
  // 輸入框有 maxLength，正常操作走不到這裡。
  if (noteLength(note) > NOTE_MAX_LENGTH) {
    return NextResponse.json({ error: "note-too-long" }, { status: 400 });
  }
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
