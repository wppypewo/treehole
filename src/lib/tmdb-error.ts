import { TmdbError, type TmdbErrorKind } from "./tmdb";
import type { Dictionary } from "@/i18n/dictionaries";

// 把 TMDB 錯誤轉成對應語系的人類可讀訊息
export function tmdbErrorMessage(error: unknown, dict: Dictionary): string {
  if (error instanceof TmdbError) {
    const map: Record<TmdbErrorKind, string> = {
      "missing-key": dict.errors.missingKey,
      "invalid-key": dict.errors.invalidKey,
      network: dict.errors.network,
      http: dict.errors.http,
      "not-found": dict.errors.notFound,
    };
    return map[error.kind];
  }
  return dict.errors.generic;
}
