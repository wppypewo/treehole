import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * TMDB 六個 route handler 的本體測試：分頁參數怎麼清洗、hasMore 怎麼算、
 * 以及上游出錯時回 500 還是 502。
 *
 * TMDB 存取層與推薦彙整整個換成 mock，TmdbError 保留真的——
 * handler 靠 instanceof 分辨錯誤種類，換成假的就驗不到那一段。
 * getLocale 讀的是 next/headers 的 cookies()，測試裡沒有請求範圍可讀，一併換掉。
 */

vi.mock('@/i18n/server', () => ({ getLocale: vi.fn(async () => 'zh-TW') }))

vi.mock('@/lib/tmdb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/tmdb')>()
  return {
    TmdbError: actual.TmdbError,
    getPopular: vi.fn(),
    getTopRated: vi.fn(),
    getHighestGrossing: vi.fn(),
    searchMovies: vi.fn(),
    discoverMovies: vi.fn(),
  }
})

vi.mock('@/lib/recommendations', () => ({ getForYouPage: vi.fn() }))

import * as tmdb from '@/lib/tmdb'
import { TmdbError } from '@/lib/tmdb'
import { getForYouPage } from '@/lib/recommendations'
import * as popular from '@/app/api/popular/route'
import * as topRated from '@/app/api/top-rated/route'
import * as highestGrossing from '@/app/api/highest-grossing/route'
import * as search from '@/app/api/search/route'
import * as discover from '@/app/api/discover/route'
import * as recommendations from '@/app/api/recommendations/route'

const BASE = 'https://example.test'
const RESULTS = [{ id: 550, title: 'Fight Club' }]

function get(path: string): Request {
  return new Request(new URL(path, BASE))
}

/** TMDB 一頁的回應，只填 handler 會讀的欄位 */
function tmdbPage(page: number, totalPages: number) {
  return { page, results: RESULTS, total_pages: totalPages, total_results: totalPages * 20 } as never
}

// 不合法的 page 一律退回第 1 頁，不是丟給 TMDB 去報錯
const BAD_PAGES = ['0', '-1', 'abc', '1.5', '']

// 帶一段不該外洩的上游原文
const UPSTREAM_DETAIL = 'api_key=secret-should-not-leak'

// 除了 missing-key 是自己的設定問題（500），其餘都是上游的問題（502）
const ERROR_STATUS = [
  { error: new TmdbError('missing-key', UPSTREAM_DETAIL), status: 500 },
  { error: new TmdbError('invalid-key', UPSTREAM_DETAIL), status: 502 },
  { error: new TmdbError('network', UPSTREAM_DETAIL), status: 502 },
  { error: new TmdbError('http', UPSTREAM_DETAIL), status: 502 },
  { error: new TmdbError('not-found', UPSTREAM_DETAIL), status: 502 },
  { error: new Error(UPSTREAM_DETAIL), status: 502 },
]

async function expectTmdbError(res: Response, status: number) {
  expect(res.status).toBe(status)
  const text = await res.text()
  expect(JSON.parse(text)).toEqual({ error: 'tmdb' })
  expect(text).not.toContain('secret-should-not-leak')
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('單純分頁的三個榜單', () => {
  const cases = [
    { name: 'popular', GET: popular.GET, fetch: () => vi.mocked(tmdb.getPopular) },
    { name: 'top-rated', GET: topRated.GET, fetch: () => vi.mocked(tmdb.getTopRated) },
    { name: 'highest-grossing', GET: highestGrossing.GET, fetch: () => vi.mocked(tmdb.getHighestGrossing) },
  ] as const

  it.each(cases)('$name：帶語系與頁碼呼叫，還有下一頁時 hasMore 為 true', async ({ name, GET, fetch }) => {
    fetch().mockResolvedValue(tmdbPage(3, 10))
    const res = await GET(get(`/api/${name}?page=3`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ results: RESULTS, hasMore: true })
    expect(fetch()).toHaveBeenCalledExactlyOnceWith('zh-TW', 3)
  })

  it.each(cases)('$name：最後一頁 hasMore 為 false', async ({ name, GET, fetch }) => {
    fetch().mockResolvedValue(tmdbPage(10, 10))
    expect(await (await GET(get(`/api/${name}?page=10`))).json()).toMatchObject({ hasMore: false })
  })

  it.each(cases)('$name：沒帶或不合法的 page 退回第 1 頁', async ({ name, GET, fetch }) => {
    fetch().mockResolvedValue(tmdbPage(1, 10))
    await GET(get(`/api/${name}`))
    for (const page of BAD_PAGES) await GET(get(`/api/${name}?page=${page}`))
    expect(fetch().mock.calls.map((call) => call[1])).toEqual(Array(1 + BAD_PAGES.length).fill(1))
  })

  it.each(cases)('$name：錯誤種類對應 500／502，不外洩原文', async ({ name, GET, fetch }) => {
    for (const { error, status } of ERROR_STATUS) {
      fetch().mockRejectedValueOnce(error)
      await expectTmdbError(await GET(get(`/api/${name}`)), status)
    }
  })
})

describe('GET /api/search', () => {
  it('空白或沒帶 q 直接回空結果，不打 TMDB', async () => {
    for (const path of ['/api/search', '/api/search?q=', '/api/search?q=%20%20']) {
      const res = await search.GET(get(path))
      expect(await res.json(), path).toEqual({ results: [], hasMore: false })
    }
    expect(tmdb.searchMovies).not.toHaveBeenCalled()
  })

  it('q 去掉前後空白後交給 TMDB，頁碼照常清洗', async () => {
    vi.mocked(tmdb.searchMovies).mockResolvedValue(tmdbPage(2, 5))
    const res = await search.GET(get('/api/search?q=%20fight%20club%20&page=2'))
    expect(await res.json()).toEqual({ results: RESULTS, hasMore: true })
    expect(tmdb.searchMovies).toHaveBeenCalledExactlyOnceWith('zh-TW', 'fight club', 2)

    await search.GET(get('/api/search?q=x&page=-3'))
    expect(tmdb.searchMovies).toHaveBeenLastCalledWith('zh-TW', 'x', 1)
  })

  it('錯誤種類對應 500／502', async () => {
    for (const { error, status } of ERROR_STATUS) {
      vi.mocked(tmdb.searchMovies).mockRejectedValueOnce(error)
      await expectTmdbError(await search.GET(get('/api/search?q=x')), status)
    }
  })
})

describe('GET /api/discover', () => {
  it('數字條件轉成數字，sort 原樣交給 TMDB', async () => {
    vi.mocked(tmdb.discoverMovies).mockResolvedValue(tmdbPage(2, 2))
    const res = await discover.GET(
      get('/api/discover?genre=18&year=1999&minRating=7.5&sort=vote_average.desc&page=2'),
    )
    expect(await res.json()).toEqual({ results: RESULTS, hasMore: false })
    expect(tmdb.discoverMovies).toHaveBeenCalledExactlyOnceWith('zh-TW', {
      genre: 18,
      year: 1999,
      minRating: 7.5,
      sort: 'vote_average.desc',
      page: 2,
    })
  })

  it('不合法或沒帶的條件一律當作沒指定，不把 NaN 或 0 送出去', async () => {
    vi.mocked(tmdb.discoverMovies).mockResolvedValue(tmdbPage(1, 1))
    await discover.GET(get('/api/discover?genre=abc&year=0&minRating=-2&sort=&page=0'))
    expect(tmdb.discoverMovies).toHaveBeenCalledExactlyOnceWith('zh-TW', {
      genre: undefined,
      year: undefined,
      minRating: undefined,
      sort: undefined,
      page: 1,
    })
  })

  it('錯誤種類對應 500／502', async () => {
    for (const { error, status } of ERROR_STATUS) {
      vi.mocked(tmdb.discoverMovies).mockRejectedValueOnce(error)
      await expectTmdbError(await discover.GET(get('/api/discover')), status)
    }
  })
})

describe('GET /api/recommendations', () => {
  it('帶語系與頁碼呼叫，只回 results 與 hasMore', async () => {
    vi.mocked(getForYouPage).mockResolvedValue({ hasSeeds: true, results: RESULTS as never, hasMore: true })
    const res = await recommendations.GET(get('/api/recommendations?page=2'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ results: RESULTS, hasMore: true })
    expect(getForYouPage).toHaveBeenCalledExactlyOnceWith('zh-TW', 2)
  })

  it('不合法的 page 退回第 1 頁', async () => {
    vi.mocked(getForYouPage).mockResolvedValue({ hasSeeds: false, results: [], hasMore: false })
    for (const page of BAD_PAGES) await recommendations.GET(get(`/api/recommendations?page=${page}`))
    expect(vi.mocked(getForYouPage).mock.calls.map((call) => call[1])).toEqual(Array(BAD_PAGES.length).fill(1))
  })

  // 推薦要同時讀片庫與打 TMDB，哪一邊壞都一樣回 502；這裡不分 missing-key
  it('任何錯誤都回 502，包括 missing-key', async () => {
    for (const { error } of ERROR_STATUS) {
      vi.mocked(getForYouPage).mockRejectedValueOnce(error)
      await expectTmdbError(await recommendations.GET(get('/api/recommendations')), 502)
    }
  })
})
