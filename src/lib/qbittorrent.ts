// qBittorrent Web API v2 伺服器端存取層。帳密只在此使用。
// 流程：先 POST /api/v2/auth/login 取得 SID cookie，再帶 cookie 呼叫 torrents/add。

export type QbErrorKind = "unreachable" | "auth" | "add-failed";

export class QbError extends Error {
  kind: QbErrorKind;
  constructor(kind: QbErrorKind, message: string) {
    super(message);
    this.name = "QbError";
    this.kind = kind;
  }
}

function baseUrl(): string {
  return (process.env.QBITTORRENT_URL ?? "http://localhost:8080").replace(
    /\/+$/,
    "",
  );
}

async function login(): Promise<string> {
  const base = baseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}/api/v2/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        // qBittorrent 的 CSRF 防護會比對 Referer，與自身位址相同即放行
        Referer: base,
      },
      body: new URLSearchParams({
        username: process.env.QBITTORRENT_USERNAME ?? "",
        password: process.env.QBITTORRENT_PASSWORD ?? "",
      }),
      cache: "no-store",
    });
  } catch {
    throw new QbError("unreachable", "Failed to reach qBittorrent");
  }

  if (res.status === 403) {
    throw new QbError("auth", "qBittorrent banned the client (403)");
  }
  const body = (await res.text()).trim();
  if (!res.ok || body !== "Ok.") {
    throw new QbError("auth", "qBittorrent login failed");
  }

  const setCookie = res.headers.get("set-cookie") ?? "";
  const sid = setCookie.match(/SID=([^;]+)/)?.[1];
  if (!sid) {
    throw new QbError("auth", "qBittorrent did not return a session id");
  }
  return sid;
}

// 加入下載：種子檔（bytes）或 magnet 連結二擇一
export async function addTorrent(
  input:
    | { kind: "file"; bytes: Buffer; filename: string }
    | { kind: "magnet"; magnet: string },
): Promise<void> {
  const base = baseUrl();
  const sid = await login();

  const form = new FormData();
  if (input.kind === "file") {
    form.append(
      "torrents",
      new Blob([new Uint8Array(input.bytes)], {
        type: "application/x-bittorrent",
      }),
      input.filename,
    );
  } else {
    form.append("urls", input.magnet);
  }

  let res: Response;
  try {
    res = await fetch(`${base}/api/v2/torrents/add`, {
      method: "POST",
      headers: { Cookie: `SID=${sid}`, Referer: base },
      body: form,
      cache: "no-store",
    });
  } catch {
    throw new QbError("unreachable", "Failed to reach qBittorrent");
  }

  if (!res.ok) {
    // 415：種子檔無效；其餘非 2xx 一律視為加入失敗
    throw new QbError("add-failed", `qBittorrent add failed (${res.status})`);
  }
}
