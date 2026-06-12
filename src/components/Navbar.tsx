import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks from "./NavLinks";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// 頂部導覽列。
export default function Navbar({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const links = [
    // 熱門／推薦／即將上映已在首頁 landing 以分類列呈現，導覽列不再重複
    { href: "/browse", label: dict.nav.browse },
    { href: "/favorites", label: dict.nav.favorites },
    { href: "/watchlist", label: dict.nav.watchlist },
    { href: "/watched", label: dict.nav.watched },
    { href: "/search", label: dict.nav.search },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-base font-bold whitespace-nowrap text-white"
        >
          {dict.appTitle}
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-1">
          <NavLinks links={links} />
        </div>
        <LanguageSwitcher
          current={locale}
          labels={{ "zh-TW": dict.language.zhTW, en: dict.language.en }}
        />
      </nav>
    </header>
  );
}
