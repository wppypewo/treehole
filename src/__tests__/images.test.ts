import { describe, it, expect } from 'vitest'
import { tmdbImage } from '@/lib/images'

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
