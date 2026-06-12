import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// 404 頁：語系由 cookie 決定，與全站一致
export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="space-y-4 py-20 text-center">
      <p className="text-4xl font-bold text-zinc-100">404</p>
      <p className="text-sm text-zinc-400">{dict.errors.notFound}</p>
      <Link
        href="/"
        className="inline-block rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10"
      >
        {dict.appTitle}
      </Link>
    </div>
  );
}
