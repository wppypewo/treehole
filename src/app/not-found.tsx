import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

// 404 頁：語系由 cookie 決定，與全站一致
export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="page-shell">
      {/* 數字用襯線大字，與片名同一個字體系統——404 在這裡是一個標題，
          不是一個錯誤代碼徽章 */}
      <div className="max-w-lg border-b border-hairline py-24">
        <p className="t-film text-[5rem] leading-none text-paper-faint sm:text-[7rem]">
          404
        </p>
        <p className="mt-6 text-[0.9375rem] text-paper-dim">
          {dict.errors.notFound}
        </p>
        <Link href="/" className="btn-line mt-8">
          {dict.appTitle}
        </Link>
      </div>
    </div>
  );
}
