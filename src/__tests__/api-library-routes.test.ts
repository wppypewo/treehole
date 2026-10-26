import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * 片庫四個 route handler 的本體測試。
 *
 * db-route.test.ts 驗的是解析函式本身；這裡驗的是 handler 有沒有真的用它們：
 * 不合法的輸入回 400 而且**沒有碰資料庫**、合法的輸入把正規化後的值交給資料層、
 * 資料層丟錯時回 503 而不是讓 handler 直接 throw。
 *
 * 資料層整個換成 mock。本機開發連的是正式資料庫，測試不能碰它。
 */

vi.mock('@/lib/db', () => ({
  listFavorites: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  listWatchlist: vi.fn(),
  addWatchlist: vi.fn(),
  removeWatchlist: vi.fn(),
  listWatched: vi.fn(),
  markWatched: vi.fn(),
  removeWatched: vi.fn(),
  upsertRating: vi.fn(),
  removeRating: vi.fn(),
}))

import * as db from '@/lib/db'
import * as favorites from '@/app/api/favorites/route'
import * as watchlist from '@/app/api/watchlist/route'
import * as watched from '@/app/api/watched/route'
import * as ratings from '@/app/api/ratings/route'

const BASE = 'https://example.test'

// 送進 handler 的一部片，與資料層應該收到的正規化結果
const MOVIE_BODY = { tmdb_id: '550', title: 'Fight Club', poster_path: '/p.jpg', vote_average: '8.4' }
const MOVIE = { tmdb_id: 550, title: 'Fight Club', poster_path: '/p.jpg', vote_average: 8.4 }

// 故意帶一段不該出現在回應裡的內部訊息，用來確認錯誤原文沒有外洩
const DB_FAILURE = new Error('connect ECONNREFUSED 10.0.0.1:5432 password=hunter2')

function post(path: string, body: unknown): Request {
  return new Request(new URL(path, BASE), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function del(path: string): Request {
  return new Request(new URL(path, BASE), { method: 'DELETE' })
}

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.resetAllMocks()
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** 503 的形狀，以及錯誤有寫進日誌、沒有寫進回應 */
async function expectDbUnavailable(res: Response) {
  expect(res.status).toBe(503)
  const text = await res.text()
  expect(JSON.parse(text)).toEqual({ error: 'db-unavailable', message: 'Database is unavailable' })
  expect(text).not.toContain('hunter2')
  expect(consoleError).toHaveBeenCalledWith(expect.any(String), DB_FAILURE)
}

describe('GET 清單', () => {
  const cases = [
    { name: 'favorites', GET: favorites.GET, list: () => vi.mocked(db.listFavorites) },
    { name: 'watchlist', GET: watchlist.GET, list: () => vi.mocked(db.listWatchlist) },
    { name: 'watched', GET: watched.GET, list: () => vi.mocked(db.listWatched) },
  ] as const

  it.each(cases)('$name：回傳 { items }', async ({ GET, list }) => {
    list().mockResolvedValue([MOVIE] as never)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ items: [MOVIE] })
  })

  it.each(cases)('$name：資料庫失敗回 503', async ({ GET, list }) => {
    list().mockRejectedValue(DB_FAILURE)
    await expectDbUnavailable(await GET())
  })
})

describe('DELETE ?tmdb_id=', () => {
  const cases = [
    { name: 'favorites', DELETE: favorites.DELETE, remove: () => vi.mocked(db.removeFavorite) },
    { name: 'watchlist', DELETE: watchlist.DELETE, remove: () => vi.mocked(db.removeWatchlist) },
    { name: 'watched', DELETE: watched.DELETE, remove: () => vi.mocked(db.removeWatched) },
    { name: 'ratings', DELETE: ratings.DELETE, remove: () => vi.mocked(db.removeRating) },
  ] as const

  it.each(cases)('$name：合法 id 轉成數字交給資料層', async ({ name, DELETE, remove }) => {
    remove().mockResolvedValue(undefined as never)
    const res = await DELETE(del(`/api/${name}?tmdb_id=550`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(remove()).toHaveBeenCalledExactlyOnceWith(550)
  })

  it.each(cases)('$name：缺 id 或不合法回 400，不碰資料庫', async ({ name, DELETE, remove }) => {
    for (const query of ['', '?tmdb_id=', '?tmdb_id=abc', '?tmdb_id=0', '?tmdb_id=1.5', '?tmdb_id=2147483648']) {
      const res = await DELETE(del(`/api/${name}${query}`))
      expect(res.status, query).toBe(400)
      expect(await res.json()).toEqual({ error: 'invalid-id' })
    }
    expect(remove()).not.toHaveBeenCalled()
  })

  it.each(cases)('$name：資料庫失敗回 503', async ({ name, DELETE, remove }) => {
    remove().mockRejectedValue(DB_FAILURE)
    await expectDbUnavailable(await DELETE(del(`/api/${name}?tmdb_id=550`)))
  })
})

describe('POST 的共同守門：id 不合法就不碰資料庫', () => {
  const cases = [
    { name: 'favorites', POST: favorites.POST, write: () => vi.mocked(db.addFavorite) },
    { name: 'watchlist', POST: watchlist.POST, write: () => vi.mocked(db.addWatchlist) },
    { name: 'watched', POST: watched.POST, write: () => vi.mocked(db.markWatched) },
    { name: 'ratings', POST: ratings.POST, write: () => vi.mocked(db.upsertRating) },
  ] as const

  it.each(cases)('$name：壞 id、壞 JSON、空 body 都回 400', async ({ name, POST, write }) => {
    // ratings 帶上合法分數，確認擋下來的是 id 而不是分數
    const bodies: unknown[] = [
      { tmdb_id: true, score: 7 },
      { tmdb_id: [550], score: 7 },
      { title: 'no id', score: 7 },
      'not json',
      '',
    ]
    for (const body of bodies) {
      const res = await POST(post(`/api/${name}`, body))
      expect(res.status, JSON.stringify(body)).toBe(400)
      expect(await res.json()).toEqual({ error: 'invalid-id' })
    }
    expect(write()).not.toHaveBeenCalled()
  })
})

describe('POST /api/favorites', () => {
  it('把正規化後的片交給資料層', async () => {
    vi.mocked(db.addFavorite).mockResolvedValue(undefined)
    const res = await favorites.POST(post('/api/favorites', MOVIE_BODY))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(db.addFavorite).toHaveBeenCalledExactlyOnceWith(MOVIE)
  })

  it('資料庫失敗回 503', async () => {
    vi.mocked(db.addFavorite).mockRejectedValue(DB_FAILURE)
    await expectDbUnavailable(await favorites.POST(post('/api/favorites', MOVIE_BODY)))
  })
})

describe('POST /api/watchlist', () => {
  it('沒帶 added_at：以 null 交給資料層，由資料層用現在時間', async () => {
    vi.mocked(db.addWatchlist).mockResolvedValue(undefined)
    const res = await watchlist.POST(post('/api/watchlist', MOVIE_BODY))
    expect(res.status).toBe(200)
    expect(db.addWatchlist).toHaveBeenCalledExactlyOnceWith(MOVIE, null)
  })

  it('復原時帶回的 added_at 原樣交給資料層', async () => {
    vi.mocked(db.addWatchlist).mockResolvedValue(undefined)
    const addedAt = '2026-09-12T13:05:00Z'
    const res = await watchlist.POST(post('/api/watchlist', { ...MOVIE_BODY, added_at: addedAt }))
    expect(res.status).toBe(200)
    expect(db.addWatchlist).toHaveBeenCalledExactlyOnceWith(MOVIE, addedAt)
  })

  it('added_at 不合法回 400，不碰資料庫', async () => {
    for (const addedAt of ['yesterday', '2026-02-30T00:00:00Z', '2999-01-01T00:00:00Z', 12345]) {
      const res = await watchlist.POST(post('/api/watchlist', { ...MOVIE_BODY, added_at: addedAt }))
      expect(res.status, String(addedAt)).toBe(400)
      expect(await res.json()).toEqual({ error: 'invalid-added-at' })
    }
    expect(db.addWatchlist).not.toHaveBeenCalled()
  })

  it('資料庫失敗回 503', async () => {
    vi.mocked(db.addWatchlist).mockRejectedValue(DB_FAILURE)
    await expectDbUnavailable(await watchlist.POST(post('/api/watchlist', MOVIE_BODY)))
  })
})

describe('POST /api/watched', () => {
  // 前端的「已移出想看／復原」完全靠這兩個欄位，形狀變了復原就壞
  it('原本在想看裡：帶回原加入時間', async () => {
    vi.mocked(db.markWatched).mockResolvedValue({
      removedFromWatchlistAt: '2026-09-12T13:05:00Z',
      watchedAdded: true,
    })
    const res = await watched.POST(post('/api/watched', MOVIE_BODY))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ok: true,
      removedFromWatchlist: { added_at: '2026-09-12T13:05:00Z' },
      watchedAdded: true,
    })
    expect(db.markWatched).toHaveBeenCalledExactlyOnceWith(MOVIE)
  })

  it('原本不在想看裡、而且早就看過：removedFromWatchlist 為 null、watchedAdded 為 false', async () => {
    vi.mocked(db.markWatched).mockResolvedValue({ removedFromWatchlistAt: null, watchedAdded: false })
    const res = await watched.POST(post('/api/watched', MOVIE_BODY))
    expect(await res.json()).toEqual({ ok: true, removedFromWatchlist: null, watchedAdded: false })
  })

  it('資料庫失敗回 503', async () => {
    vi.mocked(db.markWatched).mockRejectedValue(DB_FAILURE)
    await expectDbUnavailable(await watched.POST(post('/api/watched', MOVIE_BODY)))
  })
})

describe('POST /api/ratings', () => {
  it('1 與 10 兩端都收', async () => {
    vi.mocked(db.upsertRating).mockResolvedValue(undefined)
    for (const score of [1, 10]) {
      const res = await ratings.POST(post('/api/ratings', { ...MOVIE_BODY, score, note: '好看' }))
      expect(res.status, String(score)).toBe(200)
      expect(db.upsertRating).toHaveBeenLastCalledWith(MOVIE, score, '好看')
    }
  })

  it('分數不是 1–10 的整數回 400，不碰資料庫', async () => {
    for (const score of [0, 11, -1, 7.5, 'abc', null, undefined]) {
      const res = await ratings.POST(post('/api/ratings', { ...MOVIE_BODY, score }))
      expect(res.status, String(score)).toBe(400)
      expect(await res.json()).toEqual({ error: 'invalid-score' })
    }
    expect(db.upsertRating).not.toHaveBeenCalled()
  })

  it('短評超過 1000 字回 400、不寫入；剛好 1000 字照存', async () => {
    vi.mocked(db.upsertRating).mockResolvedValue(undefined)

    const tooLong = await ratings.POST(post('/api/ratings', { ...MOVIE_BODY, score: 8, note: 'a'.repeat(1001) }))
    expect(tooLong.status).toBe(400)
    expect(await tooLong.json()).toEqual({ error: 'note-too-long' })
    expect(db.upsertRating).not.toHaveBeenCalled()

    await ratings.POST(post('/api/ratings', { ...MOVIE_BODY, score: 8, note: 'a'.repeat(1000) }))
    expect(vi.mocked(db.upsertRating).mock.lastCall?.[2]).toHaveLength(1000)
  })

  it('短評以字元計：1000 個 emoji 是 2000 個 code unit，照存不截斷', async () => {
    vi.mocked(db.upsertRating).mockResolvedValue(undefined)
    const note = '🎬'.repeat(1000)
    const res = await ratings.POST(post('/api/ratings', { ...MOVIE_BODY, score: 8, note }))
    expect(res.status).toBe(200)
    expect(db.upsertRating).toHaveBeenLastCalledWith(MOVIE, 8, note)
  })

  it('短評不是字串就存空字串', async () => {
    vi.mocked(db.upsertRating).mockResolvedValue(undefined)
    for (const note of [{ text: 'x' }, 42, null, undefined]) {
      await ratings.POST(post('/api/ratings', { ...MOVIE_BODY, score: 8, note }))
      expect(db.upsertRating).toHaveBeenLastCalledWith(MOVIE, 8, '')
    }
  })

  it('資料庫失敗回 503', async () => {
    vi.mocked(db.upsertRating).mockRejectedValue(DB_FAILURE)
    await expectDbUnavailable(await ratings.POST(post('/api/ratings', { ...MOVIE_BODY, score: 8 })))
  })
})
