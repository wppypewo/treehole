import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import StatusNotice from "@/components/StatusNotice";

// 404 頁：語系由 cookie 決定，與全站一致。
// 文案用 pageNotFound 而不是 notFound——這頁也會接到人物頁的 404，
// 寫「找不到這部電影」就變成人物頁在講電影。
//
// 兩個出口對應兩種來由：網址打錯的人多半想回首頁，
// 從舊連結點進來、片已經下架的人多半想用片名再找一次。
export default async function NotFound() {
  const dict = getDictionary(await getLocale());

  return (
    <StatusNotice
      code="404"
      title={dict.errors.pageNotFound}
      body={dict.errors.pageNotFoundBody}
    >
      <Link href="/" className="btn-line">
        {dict.errors.home}
      </Link>
      <Link href="/search" className="btn-line">
        {dict.errors.searchTitles}
      </Link>
    </StatusNotice>
  );
}
