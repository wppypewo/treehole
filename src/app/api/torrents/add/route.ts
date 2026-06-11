import { NextResponse } from "next/server";
import { getCachedRelease, fetchDownload, ProwlarrError } from "@/lib/prowlarr";
import { addTorrent, QbError } from "@/lib/qbittorrent";

export const runtime = "nodejs";

// POST { guid }：由 guid 取回伺服器端快取的下載資訊 → 抓種子 → 丟給 qBittorrent
export async function POST(request: Request) {
  if (process.env.DEMO_MODE === "1") {
    return NextResponse.json({ error: "demo-mode" }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const guid = typeof body?.guid === "string" ? body.guid : "";
  if (!guid) {
    return NextResponse.json({ error: "missing-guid" }, { status: 400 });
  }

  const release = getCachedRelease(guid);
  if (!release) {
    // 快取過期或伺服器重啟 → 請使用者重新搜尋
    return NextResponse.json({ error: "cache-miss" }, { status: 410 });
  }

  try {
    const download = await fetchDownload(release);
    await addTorrent(download);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof QbError) {
      const map: Record<string, string> = {
        unreachable: "qb-unreachable",
        auth: "qb-auth",
        "add-failed": "qb-failed",
      };
      return NextResponse.json(
        { error: map[error.kind] ?? "qb-failed" },
        { status: 502 },
      );
    }
    if (error instanceof ProwlarrError) {
      return NextResponse.json({ error: error.kind }, { status: 502 });
    }
    return NextResponse.json({ error: "generic" }, { status: 502 });
  }
}
