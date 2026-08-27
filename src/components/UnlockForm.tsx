"use client";

import { useState } from "react";

// 解鎖表單。輸入框語彙沿用 SearchField：一條底線加一個純文字送出鍵，
// 不另外畫外框——這一頁只有一件事可做，不需要再加視覺重量。
export default function UnlockForm({
  labels,
}: {
  labels: { passcode: string; submit: string; wrong: string };
}) {
  const [passcode, setPasscode] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !passcode) return;

    setBusy(true);
    setFailed(false);
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
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-10">
      <div className="relative">
        <label htmlFor="passcode" className="sr-only">
          {labels.passcode}
        </label>
        <input
          id="passcode"
          type="password"
          name="passcode"
          autoComplete="current-password"
          autoFocus
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value);
            setFailed(false);
          }}
          placeholder={labels.passcode}
          className="w-full border-b border-paper-dim bg-transparent py-4 pr-20 text-xl text-paper outline-none transition-colors placeholder:text-paper-faint focus:border-paper"
        />
        <button
          type="submit"
          disabled={busy || !passcode}
          className="tap-safe absolute top-1/2 right-0 -translate-y-1/2 px-1 text-[0.8125rem] tracking-[0.06em] text-paper-dim transition-colors hover:text-curtain-ink disabled:opacity-40 disabled:hover:text-paper-dim"
        >
          {labels.submit}
        </button>
      </div>

      {failed && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-curtain py-1 pl-4 text-sm text-paper-dim"
        >
          {labels.wrong}
        </p>
      )}
    </form>
  );
}
