import { describe, it, expect } from 'vitest'
import { tmdbImage, tmdbSrcSet, IMAGE_SIZES } from '@/lib/images'

describe('tmdbImage', () => {
  it('returns null when path is null', () => {
    expect(tmdbImage(null)).toBeNull()
  })

  it('returns null when path is undefined', () => {
    expect(tmdbImage(undefined)).toBeNull()
  })

  it('returns null when path is empty string', () => {
    expect(tmdbImage('')).toBeNull()
  })

  it('builds URL with default size w500', () => {
    expect(tmdbImage('/abc.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc.jpg')
  })

  it('builds URL with explicit size w185', () => {
    expect(tmdbImage('/abc.jpg', 'w185')).toBe('https://image.tmdb.org/t/p/w185/abc.jpg')
  })

  it('builds URL with explicit size w342', () => {
    expect(tmdbImage('/abc.jpg', 'w342')).toBe('https://image.tmdb.org/t/p/w342/abc.jpg')
  })

  it('builds URL with explicit size w780', () => {
    expect(tmdbImage('/abc.jpg', 'w780')).toBe('https://image.tmdb.org/t/p/w780/abc.jpg')
  })

  it('builds URL with size original', () => {
    expect(tmdbImage('/abc.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/abc.jpg')
  })
})

describe('tmdbSrcSet', () => {
  it('returns undefined when path is missing', () => {
    expect(tmdbSrcSet(null, 'poster')).toBeUndefined()
    expect(tmdbSrcSet(undefined, 'poster')).toBeUndefined()
    expect(tmdbSrcSet('', 'poster')).toBeUndefined()
  })

  it('builds poster candidates with width descriptors', () => {
    expect(tmdbSrcSet('/abc.jpg', 'poster')).toBe(
      'https://image.tmdb.org/t/p/w185/abc.jpg 185w, ' +
        'https://image.tmdb.org/t/p/w342/abc.jpg 342w, ' +
        'https://image.tmdb.org/t/p/w500/abc.jpg 500w',
    )
  })

  it('builds backdrop candidates', () => {
    expect(tmdbSrcSet('/abc.jpg', 'backdrop')).toBe(
      'https://image.tmdb.org/t/p/w300/abc.jpg 300w, ' +
        'https://image.tmdb.org/t/p/w780/abc.jpg 780w, ' +
        'https://image.tmdb.org/t/p/w1280/abc.jpg 1280w',
    )
  })

  it('builds profile candidates', () => {
    expect(tmdbSrcSet('/abc.jpg', 'profile')).toBe(
      'https://image.tmdb.org/t/p/w185/abc.jpg 185w, ' +
        'https://image.tmdb.org/t/p/w342/abc.jpg 342w',
    )
  })

  it('only offers widths TMDB actually serves', () => {
    // w999 回 400（已實測）。若有人往清單裡加了 TMDB 不支援的寬度，
    // 瀏覽器挑到它就會壞圖，而且沒有任何錯誤訊息。
    const served = [45, 92, 154, 185, 300, 342, 500, 780, 1280]
    for (const kind of ['poster', 'backdrop', 'profile'] as const) {
      const widths = (tmdbSrcSet('/a.jpg', kind) as string)
        .split(', ')
        .map((c) => Number(c.split(' ')[1].replace('w', '')))
      for (const w of widths) expect(served).toContain(w)
    }
  })

  it('lists candidates in ascending width order', () => {
    for (const kind of ['poster', 'backdrop', 'profile'] as const) {
      const widths = (tmdbSrcSet('/a.jpg', kind) as string)
        .split(', ')
        .map((c) => Number(c.split(' ')[1].replace('w', '')))
      expect(widths).toEqual([...widths].sort((a, b) => a - b))
    }
  })
})

describe('IMAGE_SIZES', () => {
  it('every entry ends with an unconditional fallback', () => {
    // sizes 的最後一項不能帶媒體條件，否則不符合條件時瀏覽器會退回 100vw
    // 並挑最大的檔案——正是這次要修掉的問題
    for (const [name, value] of Object.entries(IMAGE_SIZES)) {
      const last = value.split(',').pop()!.trim()
      expect(last.startsWith('('), `${name} 的最後一項仍帶條件`).toBe(false)
    }
  })
})
