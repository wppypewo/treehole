import Link from "next/link";
import FallbackImg from "@/components/FallbackImg";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";

// 人物頭像卡（演員／導演）。hover 只給名字加底線、轉亮，頭像不壓暗：
// 壓暗是海報的語彙（「這是一部片」），人物不是片，借用會混淆兩種東西。
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
  const initial = (
    <div className="t-film flex h-full w-full items-center justify-center text-3xl text-paper-faint">
      {name.slice(0, 1)}
    </div>
  );

  return (
    <Link href={`/person/${id}`} className="hov-poster block w-28 shrink-0">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-ink-raised">
        {img ? (
          <FallbackImg
            src={img}
            srcSet={tmdbSrcSet(profilePath, "profile")}
            sizes={IMAGE_SIZES.personThumb}
            alt={name}
            loading="lazy"
            fallback={initial}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      <p className="poster-cap mt-3 line-clamp-2 text-[0.75rem]">
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
