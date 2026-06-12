import { describe, it, expect } from 'vitest'
import { parseResolution, resolutionRank } from '@/lib/prowlarr'

describe('parseResolution', () => {
  it('parses 1080p', () => {
    expect(parseResolution('Movie.Title.1080p.BluRay')).toBe('1080p')
  })

  it('parses 720p', () => {
    expect(parseResolution('Movie.720p.WEB-DL')).toBe('720p')
  })

  it('parses 480p', () => {
    expect(parseResolution('Movie.480p.x264')).toBe('480p')
  })

  it('parses 2160p directly', () => {
    expect(parseResolution('Movie.2160p.HDR.BluRay')).toBe('2160p')
  })

  it('normalises 4k to 2160p', () => {
    expect(parseResolution('Movie.4K.HDR.BluRay')).toBe('2160p')
  })

  it('normalises UHD to 2160p', () => {
    expect(parseResolution('Movie.UHD.BluRay')).toBe('2160p')
  })

  it('returns — when no resolution token present', () => {
    expect(parseResolution('Movie.Title.BluRay')).toBe('—')
  })

  it('is case-insensitive (1080P → 1080p)', () => {
    expect(parseResolution('Movie.1080P.BluRay')).toBe('1080p')
  })
})

describe('resolutionRank', () => {
  it('ranks 2160p as 4', () => {
    expect(resolutionRank('2160p')).toBe(4)
  })

  it('ranks 1080p as 3', () => {
    expect(resolutionRank('1080p')).toBe(3)
  })

  it('ranks 720p as 2', () => {
    expect(resolutionRank('720p')).toBe(2)
  })

  it('ranks 480p as 1', () => {
    expect(resolutionRank('480p')).toBe(1)
  })

  it('ranks unknown string as 0', () => {
    expect(resolutionRank('—')).toBe(0)
  })

  it('ranks empty string as 0', () => {
    expect(resolutionRank('')).toBe(0)
  })

  it('rank ordering: 2160p > 1080p > 720p > 480p', () => {
    expect(resolutionRank('2160p')).toBeGreaterThan(resolutionRank('1080p'))
    expect(resolutionRank('1080p')).toBeGreaterThan(resolutionRank('720p'))
    expect(resolutionRank('720p')).toBeGreaterThan(resolutionRank('480p'))
    expect(resolutionRank('480p')).toBeGreaterThan(resolutionRank(''))
  })
})
