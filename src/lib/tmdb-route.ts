import { NextResponse } from "next/server";
import { TmdbError, type TmdbErrorKind } from "./tmdb";

// 把 TMDB 錯誤轉成帶適當 HTTP 狀態碼的 JSON 回應（供 route handler 用）
export function tmdbErrorResponse(error: unknown): NextResponse {
  if (error instanceof TmdbError) {
    const status: Record<TmdbErrorKind, number> = {
      "missing-key": 500,
      "invalid-key": 401,
      "not-found": 404,
      network: 502,
      http: 502,
    };
    return NextResponse.json(
      { error: error.kind, message: error.message },
      { status: status[error.kind] },
    );
  }
  return NextResponse.json(
    { error: "unknown", message: "Unexpected error" },
    { status: 500 },
  );
}
