import { NextResponse } from "next/server";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/db";
import {
  addedAtFromBody,
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

// POST：新增收藏（body 帶電影資訊）。
// 可選的 added_at 只給「取消收藏後復原」用，放回原本的收藏時間。
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
    await addFavorite(movie, addedAt);
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
