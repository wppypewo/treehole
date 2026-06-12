import { describe, it, expect } from 'vitest'
import { isV4Token, pickTrailer } from '@/lib/tmdb'

describe('isV4Token', () => {
  it('identifies v4 JWT (contains dot) as true', () => {
    expect(isV4Token('eyJhbGciOiJIUzI1NiJ9.payload.sig')).toBe(true)
  })

  it('identifies v3 hex api_key (no dot) as false', () => {
    expect(isV4Token('abcdef1234567890abcdef1234567890')).toBe(false)
  })

  it('any string with a dot returns true', () => {
    expect(isV4Token('a.b')).toBe(true)
  })

  it('string without dot returns false', () => {
    expect(isV4Token('nodothere')).toBe(false)
  })
})

describe('pickTrailer', () => {
  const yt = (type: string, official: boolean, key: string) => ({
    key,
    site: 'YouTube',
    type,
    official,
  })

  const vimeo = (type: string, official: boolean, key: string) => ({
    key,
    site: 'Vimeo',
    type,
    official,
  })

  it('returns null for empty array', () => {
    expect(pickTrailer([])).toBeNull()
  })

  it('returns null when all videos are non-YouTube', () => {
    expect(pickTrailer([vimeo('Trailer', true, 'v1')])).toBeNull()
  })

  it('picks official Trailer (rank 0) over non-official Trailer (rank 1)', () => {
    expect(
      pickTrailer([yt('Trailer', false, 'unofficial'), yt('Trailer', true, 'official')]),
    ).toBe('official')
  })

  it('picks non-official Trailer (rank 1) over official Teaser (rank 2)', () => {
    expect(
      pickTrailer([yt('Teaser', true, 'teaser'), yt('Trailer', false, 'trailer')]),
    ).toBe('trailer')
  })

  it('picks official Teaser (rank 2) over non-official Teaser (rank 3)', () => {
    expect(
      pickTrailer([yt('Teaser', false, 'unofficial-teaser'), yt('Teaser', true, 'official-teaser')]),
    ).toBe('official-teaser')
  })

  it('returns key when only a non-Trailer non-Teaser YouTube video is present', () => {
    expect(pickTrailer([yt('Clip', false, 'clip-key')])).toBe('clip-key')
  })

  it('ignores Vimeo Trailer and picks available YouTube Teaser', () => {
    expect(
      pickTrailer([vimeo('Trailer', true, 'vimeo'), yt('Teaser', false, 'yt-teaser')]),
    ).toBe('yt-teaser')
  })
})
