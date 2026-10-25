import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * 推薦彙整遇到 TMDB 失敗時的行為：全部失敗要丟錯（頁面顯示連線錯誤、API 回 502），
 * 部分失敗回殘缺結果但不快取。以前 allSettled 把失敗吞掉，空清單被當成
 * 「沒有相關推薦」快取 10 分鐘，TMDB 恢復了重新整理也不會好。
 *
 * TMDB 與資料層換成 mock，TmdbError 保留真的。快取存在 globalThis，每題前清掉。
 */

vi.mock('@/lib/tmdb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/tmdb')>()
  return { TmdbError: actual.TmdbError, getRecommendations: vi.fn() }
})

vi.mock('@/lib/db', () => ({
  listFavorites: vi.fn(),
  listWatched: vi.fn(),
}))

import { getRecommendations, TmdbError } from '@/lib/tmdb'
import { listFavorites, listWatched } from '@/lib/db'
import { getForYouPage } from '@/lib/recommendations'

const movie = (id: number) => ({ id, title: `m${id}`, vote_average: 7 })
const page = (ids: number[]) => ({ results: ids.map(movie), page: 1, total_pages: 1 })

beforeEach(() => {
  vi.resetAllMocks()
  delete (globalThis as { __recAgg?: unknown }).__recAgg
  vi.mocked(listFavorites).mockResolvedValue([{ tmdb_id: 1 }] as never)
  vi.mocked(listWatched).mockResolvedValue([] as never)
})

describe('getForYouPage', () => {
  it('TMDB 全部失敗時丟出 TmdbError，不回空推薦', async () => {
    vi.mocked(getRecommendations).mockRejectedValue(new TmdbError('network', 'down'))
    await expect(getForYouPage('zh-TW', 1)).rejects.toBeInstanceOf(TmdbError)
  })

  it('全部失敗之後 TMDB 恢復，下一次請求就拿得到推薦（沒有快取空結果）', async () => {
    vi.mocked(getRecommendations).mockRejectedValue(new TmdbError('network', 'down'))
    await expect(getForYouPage('zh-TW', 1)).rejects.toThrow()

    vi.mocked(getRecommendations).mockResolvedValue(page([10]) as never)
    const res = await getForYouPage('zh-TW', 1)
    expect(res.results.map((m) => m.id)).toEqual([10])
  })

  it('部分失敗時回殘缺結果，但下一次會重抓', async () => {
    vi.mocked(getRecommendations)
      .mockRejectedValueOnce(new TmdbError('network', 'down'))
      .mockResolvedValue(page([10]) as never)
    const first = await getForYouPage('zh-TW', 1)
    expect(first.results.map((m) => m.id)).toEqual([10])

    const callsAfterFirst = vi.mocked(getRecommendations).mock.calls.length
    await getForYouPage('zh-TW', 1)
    expect(vi.mocked(getRecommendations).mock.calls.length).toBeGreaterThan(callsAfterFirst)
  })

  it('全部成功時快取，第二次不再打 TMDB', async () => {
    vi.mocked(getRecommendations).mockResolvedValue(page([10, 1]) as never)
    const first = await getForYouPage('zh-TW', 1)
    // 種子本身（id 1）不推薦
    expect(first.results.map((m) => m.id)).toEqual([10])

    const callsAfterFirst = vi.mocked(getRecommendations).mock.calls.length
    await getForYouPage('zh-TW', 1)
    expect(vi.mocked(getRecommendations).mock.calls.length).toBe(callsAfterFirst)
  })

  it('片庫為空時不打 TMDB，回 hasSeeds=false', async () => {
    vi.mocked(listFavorites).mockResolvedValue([] as never)
    const res = await getForYouPage('zh-TW', 1)
    expect(res).toEqual({ hasSeeds: false, results: [], hasMore: false })
    expect(getRecommendations).not.toHaveBeenCalled()
  })
})
