import Link from "next/link";
import { tmdbImage } from "@/lib/images";

// 人物頭像卡（演員／導演），點擊進人物頁
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
    <Link
      href={`/person/${id}`}
      className="group/person block w-24 shrink-0 text-center"
    >
      <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/5 transition-transform duration-300 group-hover/person:scale-[1.04]">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-zinc-600">
            {name.slice(0, 1)}
          </div>
        )}
      </div>
      <p className="mt-1 line-clamp-1 text-xs font-medium text-zinc-100">
        {name}
      </p>
      {sub && <p className="line-clamp-1 text-[11px] text-zinc-500">{sub}</p>}
    </Link>
  );
}
