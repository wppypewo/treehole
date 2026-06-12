import { describe, it, expect } from 'vitest'
import { tmdbErrorMessage } from '@/lib/tmdb-error'
import { TmdbError } from '@/lib/tmdb'
import type { Dictionary } from '@/i18n/dictionaries'

const dict = {
  errors: {
    missingKey: 'missing-key-msg',
    invalidKey: 'invalid-key-msg',
    network: 'network-msg',
    http: 'http-msg',
    notFound: 'not-found-msg',
    generic: 'generic-msg',
  },
} as Dictionary

describe('tmdbErrorMessage', () => {
  it("maps 'missing-key' TmdbError to dict.errors.missingKey", () => {
    expect(tmdbErrorMessage(new TmdbError('missing-key', 'x'), dict)).toBe('missing-key-msg')
  })

  it("maps 'invalid-key' TmdbError to dict.errors.invalidKey", () => {
    expect(tmdbErrorMessage(new TmdbError('invalid-key', 'x'), dict)).toBe('invalid-key-msg')
  })

  it("maps 'network' TmdbError to dict.errors.network", () => {
    expect(tmdbErrorMessage(new TmdbError('network', 'x'), dict)).toBe('network-msg')
  })

  it("maps 'http' TmdbError to dict.errors.http", () => {
    expect(tmdbErrorMessage(new TmdbError('http', 'x'), dict)).toBe('http-msg')
  })

  it("maps 'not-found' TmdbError to dict.errors.notFound", () => {
    expect(tmdbErrorMessage(new TmdbError('not-found', 'x'), dict)).toBe('not-found-msg')
  })

  it('non-TmdbError returns dict.errors.generic', () => {
    expect(tmdbErrorMessage(new Error('other'), dict)).toBe('generic-msg')
  })

  it('string error returns dict.errors.generic', () => {
    expect(tmdbErrorMessage('something went wrong', dict)).toBe('generic-msg')
  })

  it('null returns dict.errors.generic', () => {
    expect(tmdbErrorMessage(null, dict)).toBe('generic-msg')
  })
})
