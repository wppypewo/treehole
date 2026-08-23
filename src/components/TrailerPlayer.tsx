"use client";

import { useState } from "react";

// 預告片：先顯示 YouTube 縮圖與播放鈕，點擊後才嵌入播放器（避免一進頁面就載入 YouTube）
export default function TrailerPlayer({
  youTubeKey,
  label,
}: {
  youTubeKey: string;
  label: string;
}) {
  const [play, setPlay] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-ink-raised">
      {play ? (
        <iframe
          src={`https://www.youtube.com/embed/${youTubeKey}?autoplay=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label={label}
          className="group relative block h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${youTubeKey}/hqdefault.jpg`}
            alt={label}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/35 transition-colors group-hover:bg-ink/20">
            <span className="flex h-14 w-14 items-center justify-center border border-paper/70 pl-1 text-lg text-paper transition-colors group-hover:border-paper group-hover:bg-paper group-hover:text-ink">
              ▶
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
