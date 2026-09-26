import { describe, it, expect } from 'vitest'
import {
  sortWatchlist,
  totalRuntime,
  filterWatched,
  groupByMonth,
  sortFavorites,
} from '@/lib/library'

const queue = [
  { queue: 1, title: 'Tár', runtime: 158 },
  { queue: 2, title: 'Aftersun', runtime: null },
  { queue: 3, title: 'Past Lives', runtime: 106 },
  { queue: 4, title: 'Anatomy of a Fall', runtime: 106 },
]

describe('sortWatchlist', () => {
  it('queue 依加入先後，不動原陣列', () => {
    const shuffled = [queue[2], queue[0], queue[3], queue[1]]
    expect(sortWatchlist(shuffled, 'queue', 'en').map((r) => r.queue)).toEqual([1, 2, 3, 4])
    expect(shuffled[0].queue).toBe(3)
  })

  it('runtime 由短到長，同長退回加入先後，不知道片長的排最後', () => {
    expect(sortWatchlist(queue, 'runtime', 'en').map((r) => r.queue)).toEqual([3, 4, 1, 2])
  })

  it('title 照字母排', () => {
    expect(sortWatchlist(queue, 'title', 'en').map((r) => r.title)).toEqual([
      'Aftersun',
      'Anatomy of a Fall',
      'Past Lives',
      'Tár',
    ])
  })

  it('中文片名排序穩定，同名退回加入先後', () => {
    const rows = [
      { queue: 2, title: '花樣年華', runtime: 98 },
      { queue: 1, title: '花樣年華', runtime: 98 },
    ]
    expect(sortWatchlist(rows, 'title', 'zh-TW').map((r) => r.queue)).toEqual([1, 2])
  })
})

describe('totalRuntime', () => {
  it('全部都知道才加總', () => {
    expect(totalRuntime([100, 120, 95])).toBe(315)
  })
  it('任何一部不知道就回 null', () => {
    expect(totalRuntime([100, null])).toBeNull()
    expect(totalRuntime([100, 0])).toBeNull()
  })
  it('空清單回 null', () => {
    expect(totalRuntime([])).toBeNull()
  })
})

describe('filterWatched', () => {
  const rows = [{ score: 9 }, { score: 8 }, { score: 7 }, { score: null }]
  it('high 是 8 分以上（含 8）', () => {
    expect(filterWatched(rows, 'high')).toEqual([{ score: 9 }, { score: 8 }])
  })
  it('unrated 只留沒評分的', () => {
    expect(filterWatched(rows, 'unrated')).toEqual([{ score: null }])
  })
  it('all 原樣回傳', () => {
    expect(filterWatched(rows, 'all')).toHaveLength(4)
  })
})

describe('groupByMonth', () => {
  const m = (key: string) => ({ key, label: key })
  it('保留順序，同月併成一組，沒日期的收在最後', () => {
    const groups = groupByMonth([
      { id: 1, month: m('2026-09') },
      { id: 2, month: m('2026-09') },
      { id: 3, month: null },
      { id: 4, month: m('2026-08') },
    ])
    expect(groups.map((g) => g.key)).toEqual(['2026-09', '2026-08', ''])
    expect(groups[0].entries.map((e) => e.id)).toEqual([1, 2])
    expect(groups[2].entries.map((e) => e.id)).toEqual([3])
  })
  it('全部沒日期時不產生空組', () => {
    expect(groupByMonth([])).toEqual([])
  })
})

describe('sortFavorites', () => {
  const rows = [
    { title: 'B', added_at: '2026-09-01T00:00:00Z', score: 7 },
    { title: 'A', added_at: '2026-09-03T00:00:00Z', score: null },
    { title: 'C', added_at: '2026-09-02T00:00:00Z', score: 9 },
    { title: 'D', added_at: '2026-09-04T00:00:00Z', score: 7 },
  ]
  it('recent 新的在前', () => {
    expect(sortFavorites(rows, 'recent', 'en').map((r) => r.title)).toEqual(['D', 'A', 'C', 'B'])
  })
  it('mine 分數高的在前，同分新的在前，沒評分最後', () => {
    expect(sortFavorites(rows, 'mine', 'en').map((r) => r.title)).toEqual(['C', 'D', 'B', 'A'])
  })
  it('title 照字母', () => {
    expect(sortFavorites(rows, 'title', 'en').map((r) => r.title)).toEqual(['A', 'B', 'C', 'D'])
  })
})
