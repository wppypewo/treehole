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
import FeatureFilm from "@/components/FeatureFilm";
import MovieRow from "@/components/MovieRow";
import RankedList from "@/components/RankedList";
import UpcomingStrip from "@/components/UpcomingStrip";
import ErrorNotice from "@/components/ErrorNotice";

// 首頁含「為你推薦」需讀雲端片庫，故每次請求即時渲染
export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  // 五個來源並行；熱門為核心，失敗才整頁報錯，其餘失敗則該區塊略過
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

  // 開場只推一部：熱門榜上第一部有劇照的片
  const feature = popular.results.find((m) => m.backdrop_path);

  // 熱門在開場已經露過臉一次，列表裡就跳過那一部，避免同一頁重複
  const popularRest = popular.results.filter((m) => m.id !== feature?.id);

  const hasRecs = Boolean(recs?.hasSeeds && recs.results.length > 0);

  const railProps = {
    moreLabel: dict.common.seeAll,
    prevLabel: dict.common.prev,
    nextLabel: dict.common.next,
  };

  return (
    <div className="pb-28">
      {feature && (
        <FeatureFilm
          item={{
            id: feature.id,
            title: feature.title,
            backdrop_path: feature.backdrop_path,
            overview: feature.overview,
            release_date: feature.release_date,
          }}
          eyebrow={dict.home.eyebrow}
          viewLabel={dict.common.viewDetails}
        />
      )}

      {/* 區塊間距刻意不等寬：開場之後留得最多，之後逐段收緊，
          讓「翻頁」的節奏落在開場與片單之間，而不是每一段都一樣重。 */}
      <div className="mt-20 space-y-20 sm:mt-28 sm:space-y-24">
        {/* 有個人化種子時，「為你挑的」領頭並用大卡；否則熱門接手大卡的位置 */}
        {hasRecs ? (
          <>
            <MovieRow
              {...railProps}
              title={dict.home.rows.forYou}
              movies={recs!.results.slice(0, 16)}
              moreHref="/recommendations"
              size="lg"
            />
            <MovieRow
              {...railProps}
              title={dict.home.rows.popular}
              movies={popularRest.slice(0, 18)}
              moreHref="/popular"
            />
          </>
        ) : (
          <MovieRow
            {...railProps}
            title={dict.home.rows.popular}
            movies={popularRest.slice(0, 16)}
            moreHref="/popular"
            size="lg"
          />
        )}

        {topRated && topRated.results.length > 0 && (
          <RankedList
            title={dict.home.rows.topRated}
            movies={topRated.results.slice(0, 8)}
            moreHref="/top-rated"
            moreLabel={dict.common.seeAll}
          />
        )}

        {grossing && grossing.results.length > 0 && (
          <MovieRow
            {...railProps}
            title={dict.home.rows.grossing}
            movies={grossing.results.slice(0, 18)}
            moreHref="/highest-grossing"
          />
        )}

        {upcoming && upcoming.results.length > 0 && (
          <UpcomingStrip
            title={dict.home.rows.upcoming}
            movies={upcoming.results.slice(0, 10)}
            moreHref="/upcoming"
            moreLabel={dict.common.seeAll}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
