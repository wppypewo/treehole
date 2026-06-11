import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getUpcoming } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import MovieGrid from "@/components/MovieGrid";
import ErrorNotice from "@/components/ErrorNotice";

export default async function UpcomingPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  let movies;
  let errorMessage;
  try {
    movies = (await getUpcoming(locale)).results;
  } catch (error) {
    errorMessage = tmdbErrorMessage(error, dict);
  }

  if (errorMessage) {
    return <ErrorNotice message={errorMessage} />;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold">{dict.pages.upcoming}</h1>
      <MovieGrid movies={movies ?? []} emptyText={dict.common.empty} />
    </section>
  );
}
