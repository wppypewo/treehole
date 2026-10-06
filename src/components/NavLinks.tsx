"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavCount, { type NavCountKind, type NavCounts } from "./NavCount";

export interface NavLink {
  href: string;
  label: string;
  /** 有值時在標籤後面接片數 */
  count?: NavCountKind;
}

// 桌機導覽連結：目前頁面用簾幕紅底線標示，不用色塊。
// 底線是編輯排版的語彙，色塊是應用程式的語彙。
export default function NavLinks({
  links,
  counts,
}: {
  links: NavLink[];
  counts: Promise<NavCounts | null> | null;
}) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative py-1 text-[0.8125rem] tracking-[0.06em] transition-colors ${
              isActive ? "text-paper" : "text-paper-dim hover:text-paper"
            }`}
          >
            {link.label}
            {link.count && <NavCount counts={counts} kind={link.count} />}
            <span
              aria-hidden
              className={`nav-mark absolute -bottom-0.5 left-0 h-px bg-curtain transition-all duration-300 ease-out ${
                isActive ? "w-full" : "w-0"
              }`}
            />
          </Link>
        );
      })}
    </>
  );
}
