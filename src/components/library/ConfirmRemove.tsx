"use client";

import { useEffect, useRef, useState } from "react";

export interface RemoveLabels {
  remove: string;
  confirmRemove: string;
  cancel: string;
  /** 「從這張清單拿掉《{title}》」 */
  removeNamed: string;
}

/**
 * 兩段式的「拿掉」。第一下換成「確定拿掉／取消」，第二下才送出。
 *
 * 片庫的東西拿掉就沒了（看過的日期、收藏的時間都跟著消失），
 * 而這個鍵就排在片名旁邊，誤觸的成本比多按一下高。
 * 不用 confirm() 對話框：那會把整頁擋住，為了一列清單不值得。
 *
 * 沒有倒數自動還原。確認狀態會一直停在那裡，直到按取消、按 Esc，
 * 或焦點離開這一組——計時器會在人還在讀字的時候把按鈕換掉。
 *
 * 送出中用 aria-disabled，不用 disabled：「確定拿掉」被停用的那一刻焦點會掉回
 * <body>，這一組跟著因為失焦收起來；寫入失敗時人就停在頁首，看不到重試的鍵。
 */
export default function ConfirmRemove({
  title,
  labels,
  busy,
  onConfirm,
  className = "",
}: {
  title: string;
  labels: RemoveLabels;
  busy: boolean;
  onConfirm: () => void;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  // 取消後焦點要回到「拿掉」，但只在確認狀態真的結束時做一次
  const returnFocus = useRef(false);

  useEffect(() => {
    if (asking) confirmRef.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [asking]);

  function cancel(restoreFocus: boolean) {
    returnFocus.current = restoreFocus;
    setAsking(false);
  }

  const named = labels.removeNamed.replace("{title}", title);
  const base =
    "tap-safe text-[0.8125rem] tracking-[0.02em] transition-colors aria-disabled:opacity-40";

  if (!asking) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !busy && setAsking(true)}
        aria-disabled={busy || undefined}
        aria-label={named}
        className={`${base} text-paper-faint hover:text-paper ${className}`}
      >
        {labels.remove}
      </button>
    );
  }

  return (
    <span
      ref={wrapRef}
      role="group"
      aria-label={named}
      className={`inline-flex items-center gap-4 ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          cancel(true);
        }
      }}
      onBlur={(e) => {
        // 焦點移到這一組以外才收起；在兩顆鍵之間 Tab 不算離開
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null))
          cancel(false);
      }}
    >
      <button
        ref={confirmRef}
        type="button"
        onClick={() => !busy && onConfirm()}
        aria-disabled={busy || undefined}
        className={`${base} text-paper underline decoration-paper-dim decoration-1 underline-offset-4`}
      >
        {labels.confirmRemove}
      </button>
      <button
        type="button"
        onClick={() => !busy && cancel(true)}
        aria-disabled={busy || undefined}
        className={`${base} text-paper-faint hover:text-paper`}
      >
        {labels.cancel}
      </button>
    </span>
  );
}
