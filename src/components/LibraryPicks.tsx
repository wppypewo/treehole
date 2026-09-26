import Link from "next/link";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import type { SavedMovie } from "@/lib/db";

/**
 * 搜尋頁空狀態的片庫入口。
 *
 * 存在理由只有一個：還沒輸入關鍵字時，整頁只有一個輸入框，使用者沒有下一步。
 * 與其塞熱門片填版面，不如把他自己已經放進片庫的片放回來——那是這一頁唯一
 * 保證有意義、也保證不是編造的內容。
 *
 * 刻意做小。卡片寬度只有列表頁的三分之一，整區與搜尋框切齊，
 * 讓它明確是次要的。這一頁的主體仍然是那個輸入框。
 *
 * 卡片語彙沿用 MovieCard 的 .hov-poster：不放大，海報恢復亮度、片名加底線。
 */
export default function LibraryPicks({
  items,
  title,
  moreHref,
  moreLabel,
}: {
  items: SavedMovie[];
  title: string;
  moreHref: string;
  moreLabel: string;
}) {
  if (items.length === 0) return null;

  // 6 部：手機 3×2、桌機一排 6，兩種斷點都不會留下落單的一張
  const shown = items.slice(0, 6);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-6 border-b border-hairline pb-3">
        <h2 className="eyebrow">{title}</h2>
        <Link
          href={moreHref}
          className="tap-inline text-[0.75rem] tracking-[0.08em] text-paper-faint transition-colors hover:text-paper"
        >
          {moreLabel}
        </Link>
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-6">
        {shown.map((movie) => {
          const poster = tmdbImage(movie.poster_path, "w185");
          return (
            <li key={movie.tmdb_id} className="min-w-0">
              <Link href={`/movie/${movie.tmdb_id}`} className="hov-poster block">
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-raised">
                  {poster ? (
                    // 原生 img：與站上其他海報一致，不走 next/image
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      srcSet={tmdbSrcSet(movie.poster_path, "poster")}
                      sizes={IMAGE_SIZES.libraryPicks}
                      alt={movie.title}
                      loading="lazy"
                      className="poster-img h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-2 text-center text-[0.625rem] text-paper-faint">
                      {movie.title}
                    </div>
                  )}
                </div>
                <h3 className="poster-cap mt-2 line-clamp-2 text-[0.75rem] leading-snug">
                  {movie.title}
                </h3>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
