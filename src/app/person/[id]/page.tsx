import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getPerson, getPersonMovieCredits } from "@/lib/tmdb";
import { TmdbError } from "@/lib/tmdb";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from "@/lib/images";
import { calendarDateFormatter, todayInTaipei } from "@/lib/dates";
import {
  actingRoleText,
  crewRoleText,
  groupByYear,
  isLeadRole,
  type Credit,
  type Filmography as FilmographyData,
  type RoleLabels,
} from "@/lib/filmography";
import Link from "next/link";
import StatusNotice from "@/components/StatusNotice";
import RefreshButton from "@/components/RefreshButton";
import Biography from "@/components/Biography";
import Filmography, { type FilmographyYear } from "@/components/Filmography";

export async function generateMetadata({
  params,
}: PageProps<"/person/[id]">): Promise<Metadata> {
  const { id } = await params;
  const personId = Number(id);
  if (!Number.isInteger(personId) || personId <= 0) return {};
  try {
    const person = await getPerson(await getLocale(), personId);
    return { title: person.name };
  } catch {
    return {};
  }
}

/**
 * 人物頁：照片、姓名、一行基本資料、簡介，底下是作品年表。
 *
 * 沒有「返回」：原本那顆固定連回首頁，從詳情頁點進來的人按了反而離開原路。
 * 回上一頁交給瀏覽器。
 */
export default async function PersonPage({ params }: PageProps<"/person/[id]">) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { id } = await params;
  const personId = Number(id);

  // 同詳情頁：不存在的 id 回真正的 404
  if (!Number.isInteger(personId) || personId <= 0) {
    notFound();
  }

  let person;
  try {
    person = await getPerson(locale, personId);
  } catch (error) {
    if (error instanceof TmdbError && error.kind === "not-found") {
      notFound();
    }
    return (
      <StatusNotice
        title={dict.errors.loadFailed}
        body={tmdbErrorMessage(error, dict)}
      >
        <RefreshButton label={dict.errors.reload} />
        <Link href="/" className="btn-line">
          {dict.errors.home}
        </Link>
      </StatusNotice>
    );
  }

  // 作品取得失敗不拖垮整頁，年表顯示成沒有作品
  let credits: FilmographyData = { acting: [], crew: [] };
  try {
    credits = await getPersonMovieCredits(locale, personId);
  } catch {
    // 維持空年表
  }

  const date = calendarDateFormatter(locale);
  const today = todayInTaipei();
  const roleLabels: RoleLabels = {
    as: dict.person.as,
    self: dict.person.self,
    voice: dict.person.voice,
    uncredited: dict.person.uncredited,
    jobs: dict.person.jobs,
  };

  function toYears(list: Credit[], kind: "acting" | "crew"): FilmographyYear[] {
    return groupByYear(list).map((g) => ({
      year: g.year,
      rows: g.credits.map((c) => {
        const released = c.film.release_date;
        const opensOn = released && released > today ? date(released) : null;
        return {
          id: c.film.id,
          title: c.film.title,
          original:
            c.film.original_title && c.film.original_title !== c.film.title
              ? c.film.original_title
              : null,
          poster: tmdbImage(c.film.poster_path, "w185"),
          role:
            kind === "acting"
              ? actingRoleText(c.roles, roleLabels)
              : crewRoleText(c.roles, roleLabels),
          lead: kind === "acting" && isLeadRole(c),
          opens: opensOn ? dict.person.opens.replace("{date}", opensOn) : null,
        };
      }),
    }));
  }

  // 預設分頁：以演員為人所知的看演出，其餘（導演、編劇、攝影⋯⋯）看幕後
  const defaultKind =
    person.known_for_department === "Acting" || credits.crew.length === 0
      ? "acting"
      : "crew";

  // 基本資料一行：領域 · 生 · 卒 · 出生地。缺哪項就略過哪項
  const facts: string[] = [];
  const dept = person.known_for_department;
  if (dept) facts.push(dict.person.departments[dept] ?? dept);
  const born = date(person.birthday);
  if (born) facts.push(dict.person.born.replace("{date}", born));
  const died = date(person.deathday);
  if (died) facts.push(dict.person.died.replace("{date}", died));
  if (person.place_of_birth) facts.push(person.place_of_birth);

  const photo = tmdbImage(person.profile_path, "w342");

  return (
    <article className="page-shell">
      {/* 首屏：照片與姓名並置。照片欄固定寬，跟詳情頁的海報同一個尺度 */}
      <div className="animate-rise grid gap-8 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-16">
        <div className="w-32 md:w-full">
          <div className="aspect-[2/3] overflow-hidden bg-ink-raised">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                srcSet={tmdbSrcSet(person.profile_path, "profile")}
                sizes={IMAGE_SIZES.personPhoto}
                alt={person.name}
                loading="eager"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="t-film flex h-full w-full items-center justify-center text-5xl text-paper-faint"
              >
                {person.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="t-film text-[clamp(2.25rem,4.6vw,3.75rem)] text-paper">
            {person.name}
          </h1>
          {facts.length > 0 && (
            <p className="t-meta mt-4 text-paper-dim">
              {facts.map((f, i) => (
                <span key={f}>
                  {i > 0 && (
                    <span aria-hidden className="px-2 text-paper-faint">
                      ·
                    </span>
                  )}
                  {f}
                </span>
              ))}
            </p>
          )}
          <div className="mt-7 max-w-[62ch] border-t border-hairline pt-6">
            <Biography
              text={person.biography || dict.person.noBio}
              showMore={dict.person.showMore}
              showLess={dict.person.showLess}
            />
          </div>
        </div>
      </div>

      <Filmography
        acting={toYears(credits.acting, "acting")}
        crew={toYears(credits.crew, "crew")}
        counts={{ acting: credits.acting.length, crew: credits.crew.length }}
        defaultKind={defaultKind}
        labels={{
          title: dict.person.filmography,
          acting: dict.person.acting,
          crew: dict.person.crew,
          creditKind: dict.person.creditKind,
          lead: dict.person.lead,
          undated: dict.person.undated,
          noCredits: dict.person.noCredits,
          filmCount: dict.common.filmCount,
        }}
      />
    </article>
  );
}
