import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// 404 頁：語系由 cookie 決定，與全站一致
export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="page-shell space-y-4 py-32 text-center">
      <p className="text-4xl font-bold text-paper">404</p>
      <p className="text-sm text-paper-dim">{dict.errors.notFound}</p>
      <Link
        href="/"
        className="inline-block border border-paper-dim px-4 py-2 text-sm text-paper transition-colors hover:bg-white/10"
      >
        {dict.appTitle}
      </Link>
    </div>
  );
}
