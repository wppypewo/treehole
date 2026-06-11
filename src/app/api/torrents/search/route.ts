import { NextResponse } from "next/server";
import { searchTorrents, ProwlarrError } from "@/lib/prowlarr";

export const runtime = "nodejs";

// GET ?q=：用片名查 Prowlarr，回傳去敏化的種子清單（已依 seeders 排序）
export async function GET(request: Request) {
  if (process.env.DEMO_MODE === "1") {
    return NextResponse.json({ error: "demo-mode" }, { status: 503 });
  }
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "missing-query" }, { status: 400 });
  }

  try {
    const results = await searchTorrents(query);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof ProwlarrError) {
      const status = error.kind === "missing-config" ? 500 : 502;
      return NextResponse.json({ error: error.kind }, { status });
    }
    return NextResponse.json({ error: "http" }, { status: 502 });
  }
}
