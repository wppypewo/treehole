import { describe, it, expect } from 'vitest'
import { normalizeLocale, tmdbLanguage, htmlLang, defaultLocale } from '@/i18n/config'

describe('normalizeLocale', () => {
  it("maps 'zh-TW' to 'zh-TW'", () => {
    expect(normalizeLocale('zh-TW')).toBe('zh-TW')
  })

  it("maps 'en' to 'en'", () => {
    expect(normalizeLocale('en')).toBe('en')
  })

  it('unknown string falls back to defaultLocale', () => {
    expect(normalizeLocale('fr')).toBe(defaultLocale)
  })

  it('null falls back to defaultLocale', () => {
    expect(normalizeLocale(null)).toBe(defaultLocale)
  })

  it('undefined falls back to defaultLocale', () => {
    expect(normalizeLocale(undefined)).toBe(defaultLocale)
  })

  it('empty string falls back to defaultLocale', () => {
    expect(normalizeLocale('')).toBe(defaultLocale)
  })
})

describe('tmdbLanguage', () => {
  it("maps 'zh-TW' to TMDB language 'zh-TW'", () => {
    expect(tmdbLanguage('zh-TW')).toBe('zh-TW')
  })

  it("maps 'en' to TMDB language 'en-US'", () => {
    expect(tmdbLanguage('en')).toBe('en-US')
  })
})

describe('htmlLang', () => {
  it("maps 'zh-TW' to HTML lang 'zh-Hant'", () => {
    expect(htmlLang('zh-TW')).toBe('zh-Hant')
  })

  it("maps 'en' to HTML lang 'en'", () => {
    expect(htmlLang('en')).toBe('en')
  })
})
