"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 人物傳記：預設夾到 14 行，超出才給展開控制。
 *
 * 原本只有 line-clamp 沒有展開鈕，長傳記（TMDB 常見 2000 字以上）就這樣
 * 被切斷，最後一行沒有任何跡象說下面還有東西。
 *
 * 「超出才顯示按鈕」必須量過才知道——同一段字在手機上會超出、桌機上不會。
 * 所以量的是實際的 scrollHeight，不是字數。
 */
export default function Biography({
  text,
  showMore,
  showLess,
}: {
  text: string;
  showMore: string;
  showLess: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // 展開狀態下沒有夾線可量，先確定收合時是否溢出
      if (expanded) return;
      setClipped(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, text]);

  return (
    <div>
      <p
        ref={ref}
        id="person-bio"
        className={`t-prose whitespace-pre-line ${
          expanded ? "" : "line-clamp-[14]"
        }`}
      >
        {text}
      </p>
      {clipped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="person-bio"
          className="tap-safe mt-3 text-[0.8125rem] tracking-[0.04em] text-paper-faint transition-colors hover:text-paper"
        >
          {expanded ? showLess : showMore}
        </button>
      )}
    </div>
  );
}
