import Link from "next/link";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";

// 人物頭像卡（演員／導演）。hover 回饋與 MovieCard 一致：不放大，只浮現片夾框。
export default function PersonCard({
  id,
  name,
  sub,
  profilePath,
}: {
  id: number;
  name: string;
  sub?: string;
  profilePath: string | null;
}) {
  const img = tmdbImage(profilePath, "w185");

  return (
    <Link href={`/person/${id}`} className="group/person block w-28 shrink-0">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            srcSet={tmdbSrcSet(profilePath, "profile")}
            sizes={IMAGE_SIZES.personThumb}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="t-film flex h-full w-full items-center justify-center text-3xl text-paper-faint">
            {name.slice(0, 1)}
          </div>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-2 border border-paper/0 transition-colors duration-300 group-hover/person:border-paper/60 group-focus-visible/person:border-paper/60"
        />
      </div>
      <p className="mt-3 line-clamp-2 text-[0.75rem] text-paper-dim transition-colors duration-300 group-hover/person:text-paper">
        {name}
      </p>
      {sub && (
        <p className="mt-0.5 line-clamp-1 text-[0.6875rem] text-paper-faint">
          {sub}
        </p>
      )}
    </Link>
  );
}
