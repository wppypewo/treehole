import type { Dictionary } from "@/i18n/dictionaries";

/**
 * 全站頁尾，只放資料來源。
 *
 * 這個站幾乎每一格片名、劇照、分數都是 TMDB 的，
 * 而 TMDB 的使用條款要求標示來源並註明未經其背書。
 * 原本整站沒有任何一處寫到，最後一段內容後面直接是空白。
 */
export default function SiteFooter({ dict }: { dict: Dictionary }) {
  return (
    <footer
      aria-label={dict.footer.label}
      className="border-t border-hairline"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 pt-6 pb-10 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 sm:px-8">
        <p className="text-[0.8125rem] text-paper-dim">
          <a
            href="https://www.themoviedb.org/"
            rel="noopener noreferrer"
            target="_blank"
            className="link-hair tap-inline"
          >
            {dict.footer.source}
          </a>
        </p>
        <p className="text-[0.75rem] leading-relaxed text-paper-faint">
          {dict.footer.notice}
        </p>
      </div>
    </footer>
  );
}
