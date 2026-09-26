"use client";

import { useRef, useState } from "react";

// 解鎖表單。輸入框語彙沿用 SearchField：一條底線加一個純文字送出鍵，
// 不另外畫外框——這一頁只有一件事可做，不需要再加視覺重量。
export default function UnlockForm({
  labels,
}: {
  labels: { passcode: string; submit: string; wrong: string; failed: string };
}) {
  const [passcode, setPasscode] = useState("");
  // null = 沒有錯；"wrong" = 通行碼不對；"failed" = 伺服器或網路出問題。
  // 分兩種是因為把 500 也說成「通行碼不對」，會讓人一直重打其實沒錯的碼。
  const [error, setError] = useState<"wrong" | "failed" | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !passcode) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (response.ok) {
        // 重新整理而不是導向首頁：proxy 用的是 rewrite，網址列還停在
        // 原本要去的那一頁，reload 就會直接到那裡
        window.location.reload();
        return;
      }
      setError(response.status === 401 ? "wrong" : "failed");
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
    // 打錯時把整串選起來：下一次直接重打就會覆蓋，不用先刪。
    // 送出時按鈕被 disabled，焦點可能已經離開輸入框，一併拉回來。
    // 等 busy 解除、輸入框不再 readOnly 的那次 render 之後再做
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  return (
    <form onSubmit={submit} aria-busy={busy} className="mt-10">
      <div className="relative">
        <label htmlFor="passcode" className="sr-only">
          {labels.passcode}
        </label>
        <input
          id="passcode"
          ref={inputRef}
          type="password"
          name="passcode"
          autoComplete="current-password"
          autoFocus
          readOnly={busy}
          aria-invalid={error !== null}
          aria-describedby={error ? "passcode-error" : undefined}
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value);
            setError(null);
          }}
          placeholder={labels.passcode}
          className="w-full border-b border-paper-dim bg-transparent py-4 pr-20 text-xl text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-paper aria-invalid:border-curtain"
        />
        <button
          type="submit"
          disabled={busy || !passcode}
          className="tap-safe absolute top-1/2 right-0 -translate-y-1/2 px-1 text-[0.8125rem] tracking-[0.06em] text-paper-dim transition-colors hover:text-curtain-ink disabled:opacity-40 disabled:hover:text-paper-dim"
        >
          {labels.submit}
        </button>
      </div>

      {error && (
        <p
          id="passcode-error"
          role="alert"
          className="mt-5 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {error === "wrong" ? labels.wrong : labels.failed}
        </p>
      )}
    </form>
  );
}
