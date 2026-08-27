/**
 * 線上版只有擁有者一個人能用，這個檔案就是那道鎖的全部。
 *
 * 原本要用 Vercel Authentication，但那條路得把保護範圍設成 All Deployments
 * 才擋得住 production 網域，而那個範圍在 Hobby 方案要付費。改成自己做：
 * 一組通行碼換一張帶 HMAC 簽章的 cookie——沒有帳號、沒有資料表、沒有第三方
 * 服務，用站的瀏覽器也不必登入任何東西。
 *
 * 用 Web Crypto 而不是 node:crypto，是為了讓 proxy 與 route handler 共用同
 * 一份實作，不必因為執行環境不同各寫一套。
 */

// 存放解鎖憑證的 cookie 名稱
export const OWNER_COOKIE = "mv_owner";

// proxy 攔下未解鎖的請求時，用這個 request header 通知 layout 別畫導覽列
export const LOCK_HEADER = "x-owner-locked";

// 半年。這是一個人用的私人站，不需要短期 session 那套權衡
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180;

const encoder = new TextEncoder();

export interface OwnerConfig {
  passcode: string;
  secret: string;
}

/**
 * 兩個環境變數缺任何一個就回 null，呼叫端一律當成「鎖住」處理。
 * 這裡刻意不給預設值——設定漏掉時整站進不去，比預設放行安全。
 */
export function ownerConfig(): OwnerConfig | null {
  const passcode = process.env.OWNER_PASSCODE;
  const secret = process.env.OWNER_SECRET;
  if (!passcode || !secret) return null;
  return { passcode, secret };
}

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(signature);
}

async function sha256(value: string): Promise<string> {
  return toBase64Url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

// 只在長度相同時逐字元比對。呼叫端傳進來的都是等長的雜湊值，
// 所以那個提早回傳不會洩漏任何祕密的長度。
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** 發一張新憑證，格式為 `到期時間.簽章`。 */
export async function issueToken(secret: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  return `${expiresAt}.${await hmac(String(expiresAt), secret)}`;
}

/** 驗章並檢查是否過期。任何格式不對的字串一律視為無效。 */
export async function verifyToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const separator = token.indexOf(".");
  if (separator < 1) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  return timingSafeEqual(signature, await hmac(expiresAt, secret));
}

/**
 * 比對通行碼。先各自雜湊再比，兩邊長度必然相同，
 * 不會因為長度不同提早回傳而洩漏通行碼有幾個字。
 */
export async function passcodeMatches(
  input: string,
  expected: string,
): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  return timingSafeEqual(a, b);
}
