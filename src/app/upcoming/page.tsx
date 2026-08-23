import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getUpcoming } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import UpcomingCard, { upcomingDateFormatter } from "@/components/UpcomingCard";
import { IMAGE_SIZES } from "@/lib/images";
import ErrorNotice from "@/components/ErrorNotice";
import PageHeader from "@/components/PageHeader";

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

  const list = movies ?? [];
  const fmt = upcomingDateFormatter(locale);

  return (
    <section className="page-shell space-y-10">
      <PageHeader
        title={dict.pages.upcoming}
        subtitle={dict.pages.upcomingSubtitle}
        meta={dict.common.filmCount.replace("{n}", String(list.length))}
      />
      {/* 不是海報牆：未上映的片重點在「哪一天」，所以用 16:9 劇照配日期，
          欄數也比海報牆少，讓每一部有足夠的份量 */}
      {list.length === 0 ? (
        <p className="border-t border-hairline py-20 text-center text-sm text-paper-faint">
          {dict.common.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <UpcomingCard
              key={m.id}
              movie={m}
              fmt={fmt}
              sizes={IMAGE_SIZES.upcomingGrid}
            />
          ))}
        </div>
      )}
    </section>
  );
}
