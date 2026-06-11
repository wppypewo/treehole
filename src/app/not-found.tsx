import Link from "next/link";

// 404 頁
export default function NotFound() {
  return (
    <div className="space-y-4 py-20 text-center">
      <p className="text-4xl font-bold text-zinc-100">404</p>
      <p className="text-sm text-zinc-400">找不到這個頁面。</p>
      <Link
        href="/"
        className="inline-block rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10"
      >
        回首頁
      </Link>
    </div>
  );
}
