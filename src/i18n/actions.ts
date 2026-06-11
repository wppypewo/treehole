"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "./config";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Server Action：把使用者選的語系寫入 cookie，由伺服器端設定
export async function setLocale(value: string): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, normalizeLocale(value), {
    path: "/",
    maxAge: ONE_YEAR,
  });
}
