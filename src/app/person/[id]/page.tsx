import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getPerson, getPersonMovieCredits } from "@/lib/tmdb";
import type { MovieSummary } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import { tmdbImage } from "@/lib/images";
import ErrorNotice from "@/components/ErrorNotice";
import MovieGrid from "@/components/MovieGrid";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { id } = await params;
  const personId = Number(id);

  if (!Number.isInteger(personId) || personId <= 0) {
    return <ErrorNotice message={dict.errors.notFound} />;
  }

  let person;
  try {
    person = await getPerson(locale, personId);
  } catch (error) {
    return <ErrorNotice message={tmdbErrorMessage(error, dict)} />;
  }

  // 作品取得失敗不應拖垮整頁
  let films: MovieSummary[] = [];
  try {
    films = await getPersonMovieCredits(locale, personId);
  } catch {
    films = [];
  }

  const photo = tmdbImage(person.profile_path, "w342");

  return (
    <article className="page-shell">
      <Link
        href="/"
        className="tap-safe gap-2 text-[0.75rem] tracking-[0.08em] text-paper-dim transition-colors hover:text-paper"
      >
        <span aria-hidden>←</span>
        {dict.movie.back}
      </Link>

      {/* 人物首屏：照片與姓名並置。照片欄固定寬，與詳情頁的海報欄同一個尺度，
          讓兩種「人／片」的頁面在視覺上是同一個系統。 */}
      <div className="animate-rise mt-8 grid gap-8 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-16">
        <div className="w-32 md:w-full">
          <div className="aspect-[2/3] overflow-hidden bg-ink-raised">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={person.name}
                loading="eager"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="t-film flex h-full w-full items-center justify-center text-5xl text-paper-faint">
                {person.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="t-film text-[2.125rem] text-paper sm:text-[3rem]">
            {person.name}
          </h1>
          <div className="mt-6 border-t border-hairline pt-6">
            <p className="t-prose line-clamp-[14] whitespace-pre-line">
              {person.biography || dict.person.noBio}
            </p>
          </div>
        </div>
      </div>

      {/* 作品列表 */}
      <section className="mt-20">
        <div className="flex items-baseline justify-between gap-6 border-b border-hairline pb-5">
          <h2 className="t-section text-paper">{dict.person.filmography}</h2>
          {films.length > 0 && (
            <p className="t-meta shrink-0 text-paper-faint">
              {dict.common.filmCount.replace("{n}", String(films.length))}
            </p>
          )}
        </div>
        <div className="mt-10">
          <MovieGrid movies={films} emptyText={dict.common.empty} />
        </div>
      </section>
    </article>
  );
}
