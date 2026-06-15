"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks from "./NavLinks";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export default function Navbar({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
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

  const links = [
    { href: "/browse", label: dict.nav.browse },
    { href: "/favorites", label: dict.nav.favorites },
    { href: "/watchlist", label: dict.nav.watchlist },
    { href: "/watched", label: dict.nav.watched },
    { href: "/search", label: dict.nav.search },
  ];

  const langLabels = {
    "zh-TW": dict.language.zhTW,
    en: dict.language.en,
  } as Record<Locale, string>;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-base font-bold text-white"
        >
          {dict.appTitle}
        </Link>

        {/* Desktop nav links */}
        <div className="hidden flex-1 items-center gap-1 sm:flex">
          <NavLinks links={links} />
        </div>

        {/* Desktop language switcher */}
        <div className="hidden sm:block">
          <LanguageSwitcher current={locale} labels={langLabels} />
        </div>

        {/* Mobile: language + hamburger */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:hidden">
          <LanguageSwitcher current={locale} labels={langLabels} />
          <button
            type="button"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {/* Hamburger ↔ X icon cross-fade */}
            <span className="relative h-4 w-4" aria-hidden="true">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              >
                <line x1="2" y1="4" x2="14" y2="4" />
                <line x1="2" y1="8" x2="14" y2="8" />
                <line x1="2" y1="12" x2="14" y2="12" />
              </svg>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
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

      {/* Mobile menu panel — max-height transition for smooth open/close */}
      {/* inert 讓收合時的連結完全脫離 Tab 順序；aria-hidden 給螢幕閱讀器 */}
      <div
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out sm:hidden ${
          menuOpen
            ? "max-h-64 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-0.5 border-t border-white/10 px-4 pb-4 pt-2">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
