"use client";

import { useState } from "react";
import FallbackImg from "@/components/FallbackImg";

// 預告片：先顯示 YouTube 縮圖與播放鈕，點擊後才嵌入播放器（避免一進頁面就載入 YouTube）
export default function TrailerPlayer({
  youTubeKey,
  title,
  playLabel,
}: {
  youTubeKey: string;
  /** 播放器 iframe 的名稱（片名） */
  title: string;
  /** 播放鍵的報讀名稱，要說出按下會做什麼（「播放預告片：片名」） */
  playLabel: string;
}) {
  const [play, setPlay] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-ink-raised">
      {play ? (
        <iframe
          src={`https://www.youtube.com/embed/${youTubeKey}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label={playLabel}
          className="group relative block h-full w-full"
        >
          {/* 名字已在按鈕的 aria-label 上，alt 留空，報讀不念兩次 */}
          <FallbackImg
            src={`https://img.youtube.com/vi/${youTubeKey}/hqdefault.jpg`}
            alt=""
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
