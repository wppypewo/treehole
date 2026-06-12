import { describe, it, expect } from 'vitest'
import { genreOptions, GENRES } from '@/lib/genres'

describe('genreOptions', () => {
  it('returns same count as GENRES for zh-TW', () => {
    expect(genreOptions('zh-TW')).toHaveLength(GENRES.length)
  })

  it('returns same count as GENRES for en', () => {
    expect(genreOptions('en')).toHaveLength(GENRES.length)
  })

  it('returns Chinese names for zh-TW (id 28 → 動作)', () => {
    const opts = genreOptions('zh-TW')
    const action = opts.find((o) => o.id === 28)
    expect(action?.name).toBe('動作')
  })

  it('returns English names for en (id 28 → Action)', () => {
    const opts = genreOptions('en')
    const action = opts.find((o) => o.id === 28)
    expect(action?.name).toBe('Action')
  })

  it('preserves id order matching GENRES', () => {
    const ids = genreOptions('zh-TW').map((o) => o.id)
    expect(ids).toEqual(GENRES.map((g) => g.id))
  })

  it('each entry has both id (number) and name (string)', () => {
    genreOptions('en').forEach((o) => {
      expect(typeof o.id).toBe('number')
      expect(typeof o.name).toBe('string')
    })
  })
})
