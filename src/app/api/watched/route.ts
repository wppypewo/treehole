import { NextResponse } from "next/server";
import { listWatched, markWatched, removeWatched, restoreWatched } from "@/lib/db";
import {
  dbErrorResponse,
  movieFromBody,
  timestampFromBody,
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

// POST：標記已看過（body 帶電影資訊），同一部片會一併移出想看。
// removedFromWatchlist 帶原本的加入時間，前端靠它顯示「已移出想看」並提供復原；
// 原本就不在想看裡則是 null。
// watchedAdded 是這次有沒有真的新增一列看過；本來就看過的話復原不該去刪它。
//
// 帶 watched_at 是「取消看過後復原」：只把看過那一列連同原日期放回去，不動想看清單。
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const movie = movieFromBody(body);
  if (!movie) {
    return NextResponse.json({ error: "invalid-id" }, { status: 400 });
  }
  const watchedAt = timestampFromBody(body, "watched_at");
  if (watchedAt === "invalid") {
    return NextResponse.json({ error: "invalid-watched-at" }, { status: 400 });
  }
  try {
    if (watchedAt) {
      await restoreWatched(movie, watchedAt);
      return NextResponse.json({ ok: true, removedFromWatchlist: null, watchedAdded: true });
    }
    const { removedFromWatchlistAt, watchedAdded } = await markWatched(movie);
    return NextResponse.json({
      ok: true,
      removedFromWatchlist: removedFromWatchlistAt
        ? { added_at: removedFromWatchlistAt }
        : null,
      watchedAdded,
    });
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
