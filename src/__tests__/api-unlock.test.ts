import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * /api/unlock 是唯一發出解鎖 cookie 的地方。owner-session 的原語與 proxy 的
 * 組合各有測試，這裡驗的是 handler 本身：沒設定就不發、通行碼錯不發、
 * 發出去的 cookie 帶對屬性而且 proxy 認得、固定延遲真的有等、
 * 以及內部出錯時回 500 而不是放行或說成「通行碼不對」。
 */

// 保留真的實作，只把 passcodeMatches 包成可以在單一測試裡讓它丟錯的 mock
vi.mock('@/lib/owner-session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/owner-session')>()
  return { ...actual, passcodeMatches: vi.fn(actual.passcodeMatches) }
})

import { POST } from '@/app/api/unlock/route'
import { OWNER_COOKIE, SESSION_MAX_AGE, ownerConfig, passcodeMatches, verifyToken } from '@/lib/owner-session'

const SECRET = 'unlock-test-secret-not-used-anywhere-real'
const PASSCODE = 'unlock-test-passcode'
const DELAY_MS = 400

function unlockRequest(body: unknown): Request {
  return new Request('https://example.test/api/unlock', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

/** 送出請求並把固定延遲快轉過去 */
async function send(body: unknown): Promise<Response> {
  const pending = POST(unlockRequest(body))
  await vi.advanceTimersByTimeAsync(DELAY_MS)
  return pending
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv('OWNER_PASSCODE', PASSCODE)
  vi.stubEnv('OWNER_SECRET', SECRET)
})

afterEach(() => {
  vi.useRealTimers()
  // 不還原的話，環境變數會漏到同一個 worker 的其他測試檔
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('沒設定就不發 cookie', () => {
  it.each(['OWNER_PASSCODE', 'OWNER_SECRET'])('缺 %s 回 503', async (name) => {
    vi.stubEnv(name, '')
    const res = await send({ passcode: PASSCODE })
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'not-configured' })
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

describe('通行碼錯誤', () => {
  it('錯的、空的、型別不對、body 壞掉，都回 401 且不發 cookie', async () => {
    const bodies: unknown[] = [
      { passcode: 'wrong' },
      { passcode: '' },
      { passcode: PASSCODE.slice(0, -1) },
      { passcode: [PASSCODE] },
      {},
      'not json',
    ]
    for (const body of bodies) {
      const res = await send(body)
      expect(res.status, JSON.stringify(body)).toBe(401)
      expect(await res.json()).toEqual({ error: 'wrong-passcode' })
      expect(res.headers.get('set-cookie')).toBeNull()
    }
  })
})

describe('通行碼正確', () => {
  it('發一張 proxy 認得的 cookie', async () => {
    const res = await send({ passcode: PASSCODE })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    const token = res.headers.get('set-cookie')?.match(new RegExp(`^${OWNER_COOKIE}=([^;]+)`))?.[1]
    expect(token).toBeDefined()
    expect(await verifyToken(decodeURIComponent(token!), ownerConfig()!.secret)).toBe(true)
  })

  it('cookie 屬性：HttpOnly、SameSite=Lax、Path=/、半年期限；非正式環境不加 Secure', async () => {
    const cookie = (await send({ passcode: PASSCODE })).headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(/;\s*HttpOnly/i)
    expect(cookie).toMatch(/;\s*SameSite=Lax/i)
    expect(cookie).toMatch(/;\s*Path=\/(;|$)/i)
    expect(cookie).toMatch(new RegExp(`;\\s*Max-Age=${SESSION_MAX_AGE}(;|$)`, 'i'))
    // 本機是 http://localhost，帶 Secure 的話 cookie 存不進去
    expect(cookie).not.toMatch(/;\s*Secure/i)
  })

  it('正式環境加上 Secure', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const cookie = (await send({ passcode: PASSCODE })).headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(/;\s*Secure/i)
  })
})

describe('固定延遲', () => {
  // 這段延遲是唯一的暴力嘗試減速，被誰順手拿掉的話不會有任何別的東西壞
  it.each([
    ['通行碼錯誤', 'wrong'],
    ['通行碼正確', PASSCODE],
  ])('%s：不到 400ms 不回應', async (_, passcode) => {
    let settled = false
    const pending = POST(unlockRequest({ passcode })).then((res) => {
      settled = true
      return res
    })
    await vi.advanceTimersByTimeAsync(DELAY_MS - 1)
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(settled).toBe(true)
  })
})

describe('內部出錯', () => {
  it('比對時丟錯回 500 unlock-failed，不發 cookie、不說成通行碼錯誤', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Error('crypto.subtle unavailable')
    vi.mocked(passcodeMatches).mockRejectedValueOnce(failure)

    const res = await send({ passcode: PASSCODE })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'unlock-failed' })
    expect(res.headers.get('set-cookie')).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), failure)
  })
})
