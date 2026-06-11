// Prowlarr 伺服器端存取層。apikey 只在此使用，搜尋結果中含金鑰的下載網址
// 一律留在伺服器端快取，前端只拿到去敏化後的欄位（見 TorrentResult）。

export type ProwlarrErrorKind =
  | "missing-config"
  | "unreachable"
  | "auth"
  | "http";

export class ProwlarrError extends Error {
  kind: ProwlarrErrorKind;
  constructor(kind: ProwlarrErrorKind, message: string) {
    super(message);
    this.name = "ProwlarrError";
    this.kind = kind;
  }
}

// 傳給瀏覽器的安全結果（不含任何金鑰或內部下載網址）
export interface TorrentResult {
  guid: string;
  title: string;
  indexer: string;
  size: number;
  seeders: number;
  leechers: number;
  resolution: string;
}

// 僅存在伺服器端的原始下載資訊
interface RawRelease {
  guid: string;
  title: string;
  downloadUrl: string | null;
  magnetUrl: string | null;
  infoHash: string | null;
}

interface ProwlarrSearchItem {
  guid: string;
  title: string;
  indexer: string;
  size: number;
  seeders: number;
  leechers: number;
  protocol: string;
  downloadUrl?: string;
  magnetUrl?: string;
  infoHash?: string;
}

// guid → 原始下載資訊 的短期快取，供加入下載時取回（避免重複搜尋、也不洩漏金鑰給前端）
const CACHE_TTL = 15 * 60 * 1000;
const globalForProwlarr = globalThis as unknown as {
  __prowlarrCache?: Map<string, { release: RawRelease; at: number }>;
};
const cache = globalForProwlarr.__prowlarrCache ?? new Map();
globalForProwlarr.__prowlarrCache = cache;

function baseUrl(): string {
  return (process.env.PROWLARR_URL ?? "http://localhost:9696").replace(
    /\/+$/,
    "",
  );
}

// 由標題解析解析度，供顯示與排序
export function parseResolution(title: string): string {
  const m = title.match(/(2160p|1080p|720p|480p|4k|uhd)/i);
  if (!m) return "—";
  const v = m[1].toLowerCase();
  if (v === "4k" || v === "uhd") return "2160p";
  return v;
}

export function resolutionRank(resolution: string): number {
  switch (resolution) {
    case "2160p":
      return 4;
    case "1080p":
      return 3;
    case "720p":
      return 2;
    case "480p":
      return 1;
    default:
      return 0;
  }
}

export async function searchTorrents(query: string): Promise<TorrentResult[]> {
  const apiKey = process.env.PROWLARR_API_KEY?.trim();
  if (!apiKey) {
    throw new ProwlarrError("missing-config", "PROWLARR_API_KEY is not set");
  }

  const url = new URL(`${baseUrl()}/api/v1/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("type", "search");
  url.searchParams.set("categories", "2000"); // Newznab 2000 = Movies
  url.searchParams.set("limit", "100");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-Api-Key": apiKey, accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ProwlarrError("unreachable", "Failed to reach Prowlarr");
  }

  if (res.status === 401) {
    throw new ProwlarrError("auth", "Prowlarr rejected the API key");
  }
  if (!res.ok) {
    throw new ProwlarrError("http", `Prowlarr responded with ${res.status}`);
  }

  const items = (await res.json()) as ProwlarrSearchItem[];

  return items
    .filter((it) => it.protocol === "torrent")
    .map((it) => {
      cache.set(it.guid, {
        at: Date.now(),
        release: {
          guid: it.guid,
          title: it.title,
          downloadUrl: it.downloadUrl ?? null,
          magnetUrl: it.magnetUrl ?? null,
          infoHash: it.infoHash ?? null,
        },
      });
      return {
        guid: it.guid,
        title: it.title,
        indexer: it.indexer,
        size: it.size,
        seeders: it.seeders ?? 0,
        leechers: it.leechers ?? 0,
        resolution: parseResolution(it.title),
      };
    })
    .sort((a, b) => b.seeders - a.seeders);
}

// 由 guid 取回原始下載資訊（伺服器端用），過期或不存在回 null
export function getCachedRelease(guid: string): RawRelease | null {
  const hit = cache.get(guid);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL) {
    cache.delete(guid);
    return null;
  }
  return hit.release;
}

// 帶 apikey 從 Prowlarr 取得 .torrent 檔或 magnet（僅伺服器端呼叫）
export async function fetchDownload(
  release: RawRelease,
): Promise<
  | { kind: "file"; bytes: Buffer; filename: string }
  | { kind: "magnet"; magnet: string }
> {
  const apiKey = process.env.PROWLARR_API_KEY?.trim();
  if (!apiKey) {
    throw new ProwlarrError("missing-config", "PROWLARR_API_KEY is not set");
  }

  // 若已有現成 magnet（infoHash），直接組 magnet 連結
  if (release.infoHash && !release.downloadUrl) {
    const dn = encodeURIComponent(release.title);
    return {
      kind: "magnet",
      magnet: `magnet:?xt=urn:btih:${release.infoHash}&dn=${dn}`,
    };
  }

  const target = release.downloadUrl ?? release.magnetUrl;
  if (!target) {
    throw new ProwlarrError("http", "Release has no download link");
  }

  let res: Response;
  try {
    res = await fetch(target, { redirect: "manual", cache: "no-store" });
  } catch {
    throw new ProwlarrError("unreachable", "Failed to reach Prowlarr download");
  }

  // 轉址到 magnet
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location") ?? "";
    if (loc.startsWith("magnet:")) return { kind: "magnet", magnet: loc };
    throw new ProwlarrError("http", "Unexpected redirect from Prowlarr");
  }
  if (!res.ok) {
    throw new ProwlarrError("http", `Prowlarr download failed ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/x-bittorrent") ||
    contentType.includes("application/octet-stream")
  ) {
    const bytes = Buffer.from(await res.arrayBuffer());
    return {
      kind: "file",
      bytes,
      filename: `${release.guid}.torrent`,
    };
  }

  // 有些 indexer 直接以文字回傳 magnet
  const text = await res.text();
  if (text.startsWith("magnet:")) return { kind: "magnet", magnet: text };

  throw new ProwlarrError("http", "Unrecognized download response");
}
