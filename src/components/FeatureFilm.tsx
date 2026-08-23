import Link from "next/link";
import ParallaxImage from "./ParallaxImage";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";

export interface FeatureItem {
  id: number;
  title: string;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
}

/**
 * 首頁開場：一次只推一部。
 *
 * 取代原本 6 秒自動換片的輪播。自動輪播會持續搶注意力，而且等於承認
 * 「我們也不知道要推哪一部」。一天一部是編輯策展的基本動作，也讓這塊
 * 版面真的有份量。
 *
 * 這個元件本身是 Server Component，只有影像層是 client leaf。
 */
export default function FeatureFilm({
  item,
  eyebrow,
  viewLabel,
}: {
  item: FeatureItem;
  eyebrow: string;
  viewLabel: string;
}) {
  const backdrop = tmdbImage(item.backdrop_path, "w1280");
  const backdropSrcSet = tmdbSrcSet(item.backdrop_path, "backdrop");
  const year = item.release_date ? item.release_date.slice(0, 4) : null;

  return (
    // 手機：影像一段、文字一段，上下排。桌機：文字壓在影像底部。
    // 分開排不是退讓——每張劇照亮度不同，壓字的可讀性等於在賭運氣，
    // 而手機的文字量（eyebrow＋片名＋年份＋兩行簡介＋按鈕）本來就吃掉半個畫面。
    <section className="relative w-full">
      <div className="relative h-[44dvh] max-h-[420px] min-h-[240px] w-full overflow-hidden bg-ink-raised sm:h-[74dvh] sm:max-h-[780px] sm:min-h-[440px]">
        {backdrop && (
          <ParallaxImage
            src={backdrop}
            srcSet={backdropSrcSet}
            sizes={IMAGE_SIZES.fullBleed}
            priority
          />
        )}
        <div aria-hidden className="scrim-bottom pointer-events-none absolute inset-0" />
      </div>

      <div className="sm:absolute sm:inset-x-0 sm:bottom-0">
        <div className="animate-rise mx-auto max-w-[1400px] px-5 pt-7 pb-2 sm:px-8 sm:pt-0 sm:pb-16">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="t-film mt-4 max-w-[16ch] text-[2.5rem] text-paper sm:text-6xl lg:text-7xl">
            {item.title}
          </h1>
          {year && <p className="t-meta mt-3">{year}</p>}
          <p className="mt-4 line-clamp-2 max-w-[52ch] text-sm leading-relaxed text-paper-dim sm:text-base">
            {item.overview}
          </p>
          <Link href={`/movie/${item.id}`} className="btn-solid mt-7">
            {viewLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
