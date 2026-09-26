import Link from "next/link";
import ParallaxImage from "../ParallaxImage";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";

export interface TonightFilm {
  id: number;
  title: string;
  originalTitle: string | null;
  year: string | null;
  runtime: number | null;
  director: string | null;
  genres: string[];
  backdropPath: string | null;
}

export interface TonightLabels {
  open: string;
  year: string;
  runtime: string;
  director: string;
  genres: string;
  minutes: string;
}

/**
 * 首頁開場：今晚放哪一部。
 *
 * 取代原本「熱門榜第一名＋大劇照＋字壓在圖上」的開場。那一部跟使用者無關，
 * 而那個版型（eyebrow、大標、兩行簡介、按鈕）搬到任何片商網站都成立。
 * 這裡改成放映表的頭一行：先講為什麼是這部（reason），再給片名與基本資料，
 * 劇照放在旁邊當證據，不當背景。
 *
 * 手機上文字與劇照上下排，文字不壓在影像上。
 * 劇照沿用全站唯一的捲動動畫（ParallaxImage：隨捲動下沉）。
 */
export default function Tonight({
  film,
  reason,
  caption,
  next,
  labels,
}: {
  film: TonightFilm;
  /** 這部片為什麼出現在這裡，一句話 */
  reason: string;
  /** 劇照說明，含片名與出處。括號與標點依語系不同，由呼叫端組好 */
  caption: string;
  /** 換一部：沒有下一部可換時不給 */
  next: { href: string; label: string } | null;
  labels: TonightLabels;
}) {
  const still = tmdbImage(film.backdropPath, "w1280");
  const stillSrcSet = tmdbSrcSet(film.backdropPath, "backdrop");

  // 事實欄只列拿得到的，缺哪個就不排哪一列，不寫「未知」
  const facts: { label: string; value: string }[] = [];
  if (film.year) facts.push({ label: labels.year, value: film.year });
  if (film.runtime)
    facts.push({
      label: labels.runtime,
      value: labels.minutes.replace("{n}", String(film.runtime)),
    });
  if (film.director) facts.push({ label: labels.director, value: film.director });
  if (film.genres.length > 0)
    facts.push({ label: labels.genres, value: film.genres.join("、") });

  // 原文片名與譯名相同時不重複列
  const showOriginal =
    film.originalTitle !== null && film.originalTitle !== film.title;

  return (
    <section
      aria-labelledby="tonight-title"
      className="grid gap-7 pt-9 min-[900px]:grid-cols-[5fr_7fr] min-[900px]:items-end min-[900px]:gap-14 min-[900px]:pt-16"
    >
      <div className="animate-rise">
        <p className="t-reason">{reason}</p>
        <h1
          id="tonight-title"
          className="t-film mt-3.5 text-[clamp(2.5rem,6vw,4.75rem)] text-paper"
        >
          {film.title}
        </h1>
        {showOriginal && (
          <p
            lang="und"
            className="mt-2.5 font-display text-[clamp(1.125rem,2vw,1.5rem)] italic text-paper-dim"
          >
            {film.originalTitle}
          </p>
        )}

        {facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-[1.125rem] gap-y-1.5 border-t border-hairline pt-[1.125rem] text-[0.8125rem]">
            {facts.map((f) => (
              <div key={f.label} className="contents">
                <dt className="text-paper-faint">{f.label}</dt>
                <dd className="text-paper tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Link href={`/movie/${film.id}`} className="btn-solid">
            {labels.open}
          </Link>
          {next && (
            <Link href={next.href} className="btn-line" scroll={false}>
              {next.label}
            </Link>
          )}
        </div>
      </div>

      {still && (
        <figure>
          <div className="relative aspect-video overflow-hidden bg-ink-raised">
            <ParallaxImage
              src={still}
              srcSet={stillSrcSet}
              sizes={IMAGE_SIZES.tonightStill}
              priority
            />
          </div>
          <figcaption className="t-meta mt-2.5 text-paper-faint">
            {caption}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
