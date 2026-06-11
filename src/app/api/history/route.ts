import { NextResponse } from "next/server";
import { listHistory, clearHistory } from "@/lib/db";

export const runtime = "nodejs";

// GET：取得搜尋紀錄（依最近搜尋排序）
export async function GET() {
  return NextResponse.json({ items: listHistory() });
}

// DELETE：清除全部搜尋紀錄
export async function DELETE() {
  clearHistory();
  return NextResponse.json({ ok: true });
}
