"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks, { type NavLink } from "./NavLinks";
import NavCount, { type NavCounts } from "./NavCount";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// 導覽列：實色底 + 一條 hairline。不用 backdrop-blur——
// 毛玻璃在這裡沒有承擔任何資訊，只是裝飾。
export default function Navbar({
  locale,
  dict,
  counts,
}: {
  locale: Locale;
  dict: Dictionary;
  /** 想看／看過的片數，layout 傳下來的未解 promise。null 代表不顯示數字。 */
  counts: Promise<NavCounts | null> | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Escape 收起
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // 順序依使用頻率：想看、看過緊跟在瀏覽後面，收藏是回頭翻的，排後面。
  // 只有想看與看過帶片數——這兩個數字會隨著看片變動，收藏的數字沒有訊息量。
  const links: NavLink[] = [
    { href: "/browse", label: dict.nav.browse },
    { href: "/watchlist", label: dict.nav.watchlist, count: "watchlist" },
    { href: "/watched", label: dict.nav.watched, count: "watched" },
    { href: "/favorites", label: dict.nav.favorites },
    { href: "/search", label: dict.nav.search },
  ];

  const langLabels = {
    "zh-TW": dict.language.zhTW,
    en: dict.language.en,
  } as Record<Locale, string>;

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-ink">
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-5 sm:px-8">
        <Link
          href="/"
          className="t-film tap-safe shrink-0 text-xl whitespace-nowrap text-paper"
        >
          {dict.appTitle}
        </Link>

        {/* Desktop nav links */}
        <div className="hidden flex-1 items-center gap-7 sm:flex">
          <NavLinks links={links} counts={counts} />
        </div>

        <div className="hidden sm:block">
          <LanguageSwitcher
            current={locale}
            labels={langLabels}
            groupLabel={dict.language.label}
          />
        </div>

        {/* Mobile: language + hamburger */}
        <div className="flex flex-1 items-center justify-end gap-3 sm:hidden">
          <LanguageSwitcher
            current={locale}
            labels={langLabels}
            groupLabel={dict.language.label}
          />
          <button
            type="button"
            aria-label={menuOpen ? dict.nav.closeMenu : dict.nav.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="-mr-2 flex h-11 w-11 items-center justify-center text-paper-dim transition-colors hover:text-paper"
          >
            {/* 兩條線 ↔ 叉：交叉淡出，讓開關狀態有回饋 */}
            <span className="relative h-4 w-4" aria-hidden="true">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              >
                <line x1="1" y1="5" x2="15" y2="5" />
                <line x1="1" y1="11" x2="15" y2="11" />
              </svg>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
                  menuOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu：max-height 過渡；inert 讓收合時完全脫離 Tab 順序 */}
      <div
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out sm:hidden ${
          menuOpen ? "max-h-80 opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col border-t border-hairline px-5 pb-5">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`border-b border-hairline py-4 text-sm tracking-wide transition-colors ${
                  isActive ? "text-paper" : "text-paper-dim hover:text-paper"
                }`}
              >
                {link.label}
                {link.count && <NavCount counts={counts} kind={link.count} />}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
