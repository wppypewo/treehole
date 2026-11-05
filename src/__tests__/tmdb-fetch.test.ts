import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPopular, TmdbError } from '@/lib/tmdb'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('tmdbFetch：回應內容', () => {
  it('200 但不是 JSON 時丟 TmdbError(http)，不是 SyntaxError', async () => {
    vi.stubEnv('TMDB_API_KEY', '0123456789abcdef0123456789abcdef')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>bad gateway</html>', { status: 200 })),
    )
    const err = await getPopular('zh-TW').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(TmdbError)
    expect((err as TmdbError).kind).toBe('http')
  })

  it('正常 JSON 照樣回傳', async () => {
    vi.stubEnv('TMDB_API_KEY', '0123456789abcdef0123456789abcdef')
    const body = { page: 1, results: [], total_pages: 1, total_results: 0 }
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(body)))
    await expect(getPopular('zh-TW')).resolves.toEqual(body)
  })
})
