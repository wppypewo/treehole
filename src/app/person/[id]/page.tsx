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
    <article className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto w-44 shrink-0 sm:mx-0">
          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={person.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-zinc-600">
                {person.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-bold">{person.name}</h1>
          <p className="line-clamp-[12] text-sm leading-relaxed whitespace-pre-line text-zinc-300">
            {person.biography || dict.person.noBio}
          </p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">{dict.person.filmography}</h2>
        <MovieGrid movies={films} emptyText={dict.common.empty} />
      </section>

      <Link
        href="/"
        className="inline-block text-sm text-zinc-500 hover:underline"
      >
        ← {dict.nav.popular}
      </Link>
    </article>
  );
}
