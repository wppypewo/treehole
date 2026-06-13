import { getLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getPopular,
  getUpcoming,
  getTopRated,
  getHighestGrossing,
} from "@/lib/tmdb";
import { getForYouPage } from "@/lib/recommendations";
import { tmdbErrorMessage } from "@/lib/tmdb-error";
import HeroCarousel from "@/components/HeroCarousel";
import MovieRow from "@/components/MovieRow";
import ErrorNotice from "@/components/ErrorNotice";

// 首頁 landing 含「為你推薦」需讀本機 SQLite，故每次請求即時渲染
export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  // 三個來源並行；熱門為核心，失敗才整頁報錯，其餘失敗則該列略過
  const [pRes, uRes, rRes, tRes, gRes] = await Promise.allSettled([
    getPopular(locale, 1),
    getUpcoming(locale, 1),
    getForYouPage(locale, 1),
    getTopRated(locale, 1),
    getHighestGrossing(locale, 1),
  ]);

  if (pRes.status !== "fulfilled") {
    return <ErrorNotice message={tmdbErrorMessage(pRes.reason, dict)} />;
  }
  const popular = pRes.value;
  const upcoming = uRes.status === "fulfilled" ? uRes.value : null;
  const recs = rRes.status === "fulfilled" ? rRes.value : null;
  const topRated = tRes.status === "fulfilled" ? tRes.value : null;
  const grossing = gRes.status === "fulfilled" ? gRes.value : null;

  // Hero 取熱門前幾部且有 backdrop 者
  const heroItems = popular.results
    .filter((m) => m.backdrop_path)
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      title: m.title,
      backdrop_path: m.backdrop_path,
      overview: m.overview,
    }));

  return (
    <div className="space-y-8">
      {/* 左對齊開場：克制的片庫入口語氣，非置中 landing hero、無額外特效 */}
      <header className="space-y-1 px-0.5 pt-1">
        <p className="eyebrow">{dict.home.eyebrow}</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          {dict.home.title}
        </h1>
        <p className="text-sm text-zinc-400">{dict.home.subtitle}</p>
      </header>

      <HeroCarousel items={heroItems} viewLabel={dict.common.viewDetails} />

      {/* 有個人化種子時，「為你挑的」領頭，把個人記憶排在熱門之前 */}
      {recs?.hasSeeds && recs.results.length > 0 && (
        <MovieRow
          eyebrow={dict.home.rows.forYou.eyebrow}
          title={dict.home.rows.forYou.title}
          movies={recs.results.slice(0, 20)}
          moreHref="/recommendations"
          moreLabel={dict.common.seeAll}
        />
      )}

      <MovieRow
        eyebrow={dict.home.rows.popular.eyebrow}
        title={dict.home.rows.popular.title}
        movies={popular.results.slice(0, 20)}
        moreHref="/popular"
        moreLabel={dict.common.seeAll}
      />

      {topRated && topRated.results.length > 0 && (
        <MovieRow
          eyebrow={dict.home.rows.topRated.eyebrow}
          title={dict.home.rows.topRated.title}
          movies={topRated.results.slice(0, 20)}
          moreHref="/top-rated"
          moreLabel={dict.common.seeAll}
        />
      )}

      {grossing && grossing.results.length > 0 && (
        <MovieRow
          eyebrow={dict.home.rows.grossing.eyebrow}
          title={dict.home.rows.grossing.title}
          movies={grossing.results.slice(0, 20)}
          moreHref="/highest-grossing"
          moreLabel={dict.common.seeAll}
        />
      )}

      {upcoming && upcoming.results.length > 0 && (
        <MovieRow
          eyebrow={dict.home.rows.upcoming.eyebrow}
          title={dict.home.rows.upcoming.title}
          movies={upcoming.results.slice(0, 20)}
          moreHref="/upcoming"
          moreLabel={dict.common.seeAll}
        />
      )}
    </div>
  );
}
