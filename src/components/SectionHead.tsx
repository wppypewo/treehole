import Link from "next/link";

/**
 * 首頁各段的標題列：標題、一句資料來源或份量、右側「看全部」。
 *
 * aside 放的是事實（「12 部」「TMDB 熱門」），不是副標語。
 * 它讓人一眼知道這一段的資料從哪來、有多少，所以緊跟在標題後面，
 * 不跟「看全部」一起推到右邊。
 */
export default function SectionHead({
  id,
  title,
  aside,
  more,
}: {
  /** 給 section 的 aria-labelledby 用 */
  id: string;
  title: string;
  aside?: string;
  more?: { href: string; label: string };
}) {
  return (
    // 窄螢幕放不下時，換行的是 aside，「看全部」留在標題那一行的右邊（與 MovieRow 同一個結構）
    <div className="flex items-baseline justify-between gap-6">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 id={id} className="t-section text-paper">
          {title}
        </h2>
        {aside && <p className="t-meta text-paper-faint">{aside}</p>}
      </div>
      {more && (
        <Link
          href={more.href}
          className="tap-safe shrink-0 text-[0.75rem] tracking-[0.08em] text-paper-faint transition-colors hover:text-paper"
        >
          {more.label}
        </Link>
      )}
    </div>
  );
}
