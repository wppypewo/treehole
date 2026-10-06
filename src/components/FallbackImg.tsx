"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 原生 img，載入失敗時改畫 fallback。
 *
 * TMDB 偶爾會有海報路徑還在、檔案已經被撤掉的情況，網路斷掉也一樣。沒有這層，
 * 有 alt 的圖會露出瀏覽器的破圖示加一行 alt 字，壓在深色框的左上角；
 * alt="" 的裝飾圖在 Chrome 也會沿著框畫一圈淺灰細線。站上的 img 一律走這裡。
 *
 * 圖片可能在 hydration 之前就已經失敗，那時 onError 還沒掛上，所以掛載時再看一次
 * complete + naturalWidth。
 *
 * fadeIn：載入完成才淡入（片卡用），避免 decode 完成瞬間「跳出」。
 */
export default function FallbackImg({
  fallback = null,
  fadeIn = false,
  className = "",
  ...img
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: ReactNode;
  fadeIn?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");

  useEffect(() => {
    const el = ref.current;
    if (!el?.complete) return;
    setState(el.naturalWidth > 0 ? "loaded" : "failed");
  }, []);

  if (state === "failed") return <>{fallback}</>;

  const fade = fadeIn ? (state === "loaded" ? " opacity-100" : " opacity-0") : "";
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      ref={ref}
      {...img}
      onLoad={() => setState("loaded")}
      onError={() => setState("failed")}
      className={className + fade}
    />
  );
}
