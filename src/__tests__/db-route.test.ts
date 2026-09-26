import { describe, it, expect } from 'vitest'
import { addedAtFromBody, movieFromBody, tmdbIdFromQuery } from '@/lib/db-route'

/**
 * 片庫四個 route handler 的輸入全部經過這兩支函式。它們回 null 就是 400，
 * 放行就是直接寫進 Postgres——所以邊界在這裡守，不是在資料庫那裡守。
 */

const BASE = 'https://example.test/api/favorites'

describe('movieFromBody 的 id 驗證', () => {
  it('收下正整數與數字字串', () => {
    expect(movieFromBody({ tmdb_id: 550 })?.tmdb_id).toBe(550)
    expect(movieFromBody({ tmdb_id: '550' })?.tmdb_id).toBe(550)
  })

  it('擋掉布林值', () => {
    // Number(true) === 1，會變成一個沒有人送出過的 ID 1
    expect(movieFromBody({ tmdb_id: true })).toBeNull()
    expect(movieFromBody({ tmdb_id: false })).toBeNull()
  })

  it('擋掉陣列', () => {
    // Number([550]) === 550
    expect(movieFromBody({ tmdb_id: [550] })).toBeNull()
    expect(movieFromBody({ tmdb_id: [] })).toBeNull()
  })

  it('擋掉物件、null、undefined 與整包 null', () => {
    expect(movieFromBody({ tmdb_id: {} })).toBeNull()
    expect(movieFromBody({ tmdb_id: null })).toBeNull()
    expect(movieFromBody({})).toBeNull()
    expect(movieFromBody(null)).toBeNull()
  })

  it('擋掉零、負數與小數', () => {
    for (const bad of [0, -1, -550, 1.5, '3.7']) {
      expect(movieFromBody({ tmdb_id: bad }), String(bad)).toBeNull()
    }
  })

  it('擋掉 NaN 與無限大', () => {
    for (const bad of [NaN, Infinity, -Infinity, 'abc', '']) {
      expect(movieFromBody({ tmdb_id: bad }), String(bad)).toBeNull()
    }
  })

  // 這一條擋的是「400 被誤報成 503」：超過 int4 的值過得了 Number.isInteger，
  // 但 Postgres 的 INTEGER 收不下，會在 insert 才炸成資料庫錯誤
  it('擋掉超過 Postgres INTEGER 上限的值', () => {
    expect(movieFromBody({ tmdb_id: 2_147_483_647 })?.tmdb_id).toBe(2_147_483_647)
    expect(movieFromBody({ tmdb_id: 2_147_483_648 })).toBeNull()
    expect(movieFromBody({ tmdb_id: 1e21 })).toBeNull()
    expect(movieFromBody({ tmdb_id: Number.MAX_SAFE_INTEGER })).toBeNull()
  })
})

describe('movieFromBody 的其餘欄位', () => {
  it('title 不是字串就當空字串，不做 String() 硬轉', () => {
    // String({}) 會給 "[object Object]"，那個字串會一路存進資料庫
    expect(movieFromBody({ tmdb_id: 550, title: { a: 1 } })?.title).toBe('')
    expect(movieFromBody({ tmdb_id: 550, title: 123 })?.title).toBe('')
    expect(movieFromBody({ tmdb_id: 550 })?.title).toBe('')
    expect(movieFromBody({ tmdb_id: 550, title: 'Fight Club' })?.title).toBe(
      'Fight Club',
    )
  })

  it('poster_path 只收字串，其餘一律 null', () => {
    // 這個值之後會接進 <img src>，讓非字串通過的話壞在很遠的地方
    expect(movieFromBody({ tmdb_id: 550, poster_path: 123 })?.poster_path).toBeNull()
    expect(
      movieFromBody({ tmdb_id: 550, poster_path: { evil: 1 } })?.poster_path,
    ).toBeNull()
    expect(
      movieFromBody({ tmdb_id: 550, poster_path: ['/a.jpg'] })?.poster_path,
    ).toBeNull()
    expect(
      movieFromBody({ tmdb_id: 550, poster_path: '/a.jpg' })?.poster_path,
    ).toBe('/a.jpg')
    expect(movieFromBody({ tmdb_id: 550 })?.poster_path).toBeNull()
  })

  it('vote_average 算不出數字就給 0', () => {
    expect(movieFromBody({ tmdb_id: 550, vote_average: 'abc' })?.vote_average).toBe(0)
    expect(movieFromBody({ tmdb_id: 550, vote_average: Infinity })?.vote_average).toBe(0)
    expect(movieFromBody({ tmdb_id: 550, vote_average: 8.4 })?.vote_average).toBe(8.4)
    // 0 分是合法的評分，不能被當成缺值
    expect(movieFromBody({ tmdb_id: 550, vote_average: 0 })?.vote_average).toBe(0)
  })
})

describe('tmdbIdFromQuery', () => {
  it('取得合法的 id', () => {
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=550`)).toBe(550)
  })

  it('缺參數、空值與非數字都回 null', () => {
    expect(tmdbIdFromQuery(BASE)).toBeNull()
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=`)).toBeNull()
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=abc`)).toBeNull()
    expect(tmdbIdFromQuery(`${BASE}?other=550`)).toBeNull()
  })

  it('零、負數與小數回 null', () => {
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=0`)).toBeNull()
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=-1`)).toBeNull()
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=1.5`)).toBeNull()
  })

  it('超過 Postgres INTEGER 上限回 null', () => {
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=2147483647`)).toBe(2_147_483_647)
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=2147483648`)).toBeNull()
  })

  it('重複參數取第一個', () => {
    expect(tmdbIdFromQuery(`${BASE}?tmdb_id=550&tmdb_id=1`)).toBe(550)
  })
})

describe('addedAtFromBody（標記看過後的復原）', () => {
  const NOW = Date.parse('2026-09-26T12:00:00Z')

  it('沒帶或帶 null 是一般加入，回 null', () => {
    expect(addedAtFromBody({ id: 550 }, NOW)).toBeNull()
    expect(addedAtFromBody({ id: 550, added_at: null }, NOW)).toBeNull()
    expect(addedAtFromBody(null, NOW)).toBeNull()
  })

  it('收下 markWatched 回傳的格式', () => {
    expect(addedAtFromBody({ added_at: '2026-09-12T08:30:00Z' }, NOW)).toBe('2026-09-12T08:30:00Z')
  })

  it('格式不對一律拒絕', () => {
    expect(addedAtFromBody({ added_at: 1726130000000 }, NOW)).toBe('invalid')
    expect(addedAtFromBody({ added_at: '2026-09-12' }, NOW)).toBe('invalid')
    expect(addedAtFromBody({ added_at: '2026-09-12T08:30:00.000Z' }, NOW)).toBe('invalid')
    expect(addedAtFromBody({ added_at: '2026-09-12T08:30:00+08:00' }, NOW)).toBe('invalid')
    expect(addedAtFromBody({ added_at: "2026-09-12T08:30:00Z'; --" }, NOW)).toBe('invalid')
  })

  it('格式對但日期不存在也拒絕', () => {
    expect(addedAtFromBody({ added_at: '2026-02-30T08:30:00Z' }, NOW)).toBe('invalid')
    expect(addedAtFromBody({ added_at: '2026-09-12T25:00:00Z' }, NOW)).toBe('invalid')
  })

  it('未來時間拒絕，60 秒內的時鐘誤差放行', () => {
    expect(addedAtFromBody({ added_at: '2026-09-26T12:00:59Z' }, NOW)).toBe('2026-09-26T12:00:59Z')
    expect(addedAtFromBody({ added_at: '2026-09-26T12:01:01Z' }, NOW)).toBe('invalid')
  })
})
