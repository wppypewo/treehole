import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'
import {
  OWNER_COOKIE,
  LOCK_HEADER,
  SESSION_MAX_AGE,
  issueToken,
} from '@/lib/owner-session'
import { CSP_REQUEST_HEADER, CSP_RESPONSE_HEADER, NONCE_HEADER } from '@/lib/csp'

/**
 * proxy.ts 是這個站唯一的存取控制。owner-session 的密碼學原語各自有測試，
 * 但「組起來之後鎖得住嗎」原本沒有任何東西釘住——fail open 的 bug 就住在這一層。
 *
 * 這裡驗的是組合行為，不是雜湊本身：哪些路徑放行、擋下來回什麼、
 * 以及環境變數缺失時到底是關著還是開著。
 */

const SECRET = 'proxy-test-secret-not-used-anywhere-real'
const PASSCODE = 'proxy-test-passcode'

// rewrite 的目的地藏在這個 header 裡，NextResponse 沒有公開的讀取介面
const REWRITE_HEADER = 'x-middleware-rewrite'

function request(path: string, cookie?: string): NextRequest {
  const req = new NextRequest(new URL(path, 'https://example.test'))
  if (cookie !== undefined) req.cookies.set(OWNER_COOKIE, cookie)
  return req
}

/** 放行 = 沒有改寫、沒有 body 狀態碼異動 */
function isPassThrough(res: Response): boolean {
  return res.status === 200 && res.headers.get(REWRITE_HEADER) === null
}

let savedPasscode: string | undefined
let savedSecret: string | undefined

beforeEach(() => {
  savedPasscode = process.env.OWNER_PASSCODE
  savedSecret = process.env.OWNER_SECRET
  process.env.OWNER_PASSCODE = PASSCODE
  process.env.OWNER_SECRET = SECRET
})

afterEach(() => {
  // 不還原的話，環境變數會漏到同一個 worker 的其他測試檔
  if (savedPasscode === undefined) delete process.env.OWNER_PASSCODE
  else process.env.OWNER_PASSCODE = savedPasscode
  if (savedSecret === undefined) delete process.env.OWNER_SECRET
  else process.env.OWNER_SECRET = savedSecret
})

describe('放行清單', () => {
  // 這兩條漏掉的話沒有人進得來——解鎖頁自己會被鎖在門外
  it('未解鎖也放行 /unlock', async () => {
    expect(isPassThrough(await proxy(request('/unlock')))).toBe(true)
  })

  it('未解鎖也放行 /api/unlock', async () => {
    expect(isPassThrough(await proxy(request('/api/unlock')))).toBe(true)
  })

  it('放行清單是完整路徑比對，不是前綴比對', async () => {
    // /unlock-everything 這種路徑不該因為開頭像 /unlock 就放行
    const res = await proxy(request('/unlock-everything'))
    expect(isPassThrough(res)).toBe(false)
  })
})

describe('解鎖頁', () => {
  it('已解鎖的人打開 /unlock 會被送回首頁', async () => {
    const token = await issueToken(SECRET)
    const res = await proxy(request('/unlock', token))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/')
  })

  it('鎖著時直接打開 /unlock 也帶 LOCK_HEADER，layout 才不會查片數', async () => {
    const res = await proxy(request('/unlock'))
    const forwarded = res.headers.get('x-middleware-override-headers')
    expect(forwarded ?? '').toContain(LOCK_HEADER)
  })

  it('憑證無效時 /unlock 照常顯示，不轉址', async () => {
    const res = await proxy(request('/unlock', 'abc.def'))
    expect(isPassThrough(res)).toBe(true)
  })

  it('設定缺漏時，帶著有效憑證也不會被當成已解鎖', async () => {
    const token = await issueToken(SECRET)
    delete process.env.OWNER_SECRET
    expect(isPassThrough(await proxy(request('/unlock', token)))).toBe(true)
  })

})

describe('未解鎖的請求', () => {
  it('頁面改寫到 /unlock 而不是轉址', async () => {
    const res = await proxy(request('/movie/550'))
    const rewrite = res.headers.get(REWRITE_HEADER)
    expect(rewrite).not.toBeNull()
    expect(new URL(rewrite!).pathname).toBe('/unlock')
    // 轉址會把網址列換掉，解鎖後就回不到原本要去的那一頁
    expect(res.status).not.toBe(307)
    expect(res.status).not.toBe(308)
  })

  it('改寫時帶上 LOCK_HEADER 讓 layout 知道要收起導覽列', async () => {
    const res = await proxy(request('/movie/550'))
    // proxy 是把 header 設在轉交給下游的 request 上
    const forwarded = res.headers.get('x-middleware-override-headers')
    expect(forwarded ?? '').toContain(LOCK_HEADER)
  })

  it('API 回 401 JSON 而不是解鎖頁的 HTML', async () => {
    const res = await proxy(request('/api/favorites'))
    expect(res.status).toBe(401)
    expect(res.headers.get('content-type')).toContain('application/json')
    await expect(res.json()).resolves.toEqual({ error: 'locked' })
  })
})

describe('憑證驗證', () => {
  it('有效憑證放行', async () => {
    const token = await issueToken(SECRET)
    expect(isPassThrough(await proxy(request('/movie/550', token)))).toBe(true)
  })

  it('別把金鑰簽的憑證擋下來', async () => {
    const token = await issueToken('a-different-secret')
    expect(isPassThrough(await proxy(request('/movie/550', token)))).toBe(false)
  })

  it('過期憑證擋下來', async () => {
    const fresh = await issueToken(SECRET)
    const signature = fresh.slice(fresh.indexOf('.') + 1)
    const past = Math.floor(Date.now() / 1000) - 1
    expect(
      isPassThrough(await proxy(request('/movie/550', `${past}.${signature}`))),
    ).toBe(false)
  })

  it('亂填的 cookie 值擋下來', async () => {
    for (const bad of ['', '.', 'abc', 'abc.def', 'x.y.z']) {
      const res = await proxy(request('/movie/550', bad))
      expect(isPassThrough(res), `cookie=${JSON.stringify(bad)}`).toBe(false)
    }
  })

  it('把到期時間往後改也沒用', async () => {
    const token = await issueToken(SECRET)
    const signature = token.slice(token.indexOf('.') + 1)
    const far = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE * 10
    expect(
      isPassThrough(await proxy(request('/movie/550', `${far}.${signature}`))),
    ).toBe(false)
  })
})

describe('環境變數缺失時必須關著', () => {
  // ownerConfig() 回 null 時如果放行，等於設定漏掉就全站公開。
  // 這是這個檔案最重要的一條。
  it('缺 OWNER_SECRET 時，連有效憑證也不放行', async () => {
    const token = await issueToken(SECRET)
    delete process.env.OWNER_SECRET
    expect(isPassThrough(await proxy(request('/movie/550', token)))).toBe(false)
  })

  it('缺 OWNER_PASSCODE 時，連有效憑證也不放行', async () => {
    const token = await issueToken(SECRET)
    delete process.env.OWNER_PASSCODE
    expect(isPassThrough(await proxy(request('/movie/550', token)))).toBe(false)
  })

  it('兩個都缺時 API 回 401', async () => {
    delete process.env.OWNER_SECRET
    delete process.env.OWNER_PASSCODE
    expect((await proxy(request('/api/favorites'))).status).toBe(401)
  })
})

describe('每一條回傳路徑都帶 CSP', () => {
  // proxy.ts 有六條 return，CSP 靠每一條各自包 withCsp()。新增一條分支時漏包，
  // 那條路徑就完全沒有政策，而且不會有任何錯誤——所以六條逐一列出來釘住。
  // 每一列先驗「確實走到那條分支」，否則換了分支邏輯後這張表會默默測錯地方。
  type Case = {
    name: string
    path: string
    unlocked: boolean
    // 這條路徑會不會把 request 轉交下游（next／rewrite），轉交的才有 nonce 要對
    forwards: boolean
    branch: (res: Response) => void
  }

  const cases: Case[] = [
    {
      name: '解鎖 API 放行',
      path: '/api/unlock',
      unlocked: false,
      forwards: true,
      branch: (res) => expect(isPassThrough(res)).toBe(true),
    },
    {
      name: '解鎖頁：已解鎖轉回首頁',
      path: '/unlock',
      unlocked: true,
      forwards: false,
      branch: (res) => expect(res.status).toBe(307),
    },
    {
      name: '解鎖頁：鎖著時放行',
      path: '/unlock',
      unlocked: false,
      forwards: true,
      branch: (res) => expect(isPassThrough(res)).toBe(true),
    },
    {
      name: '已解鎖放行',
      path: '/movie/550',
      unlocked: true,
      forwards: true,
      branch: (res) => expect(isPassThrough(res)).toBe(true),
    },
    {
      name: '未解鎖 API 401',
      path: '/api/favorites',
      unlocked: false,
      forwards: false,
      branch: (res) => expect(res.status).toBe(401),
    },
    {
      name: '未解鎖頁面改寫',
      path: '/movie/550',
      unlocked: false,
      forwards: true,
      branch: (res) => expect(res.headers.get(REWRITE_HEADER)).not.toBeNull(),
    },
  ]

  it.each(cases)('$name', async ({ path, unlocked, forwards, branch }) => {
    const token = unlocked ? await issueToken(SECRET) : undefined
    const res = await proxy(request(path, token))
    branch(res)

    const csp = res.headers.get(CSP_RESPONSE_HEADER)
    expect(csp).toMatch(/script-src [^;]*'nonce-[^']+'/)

    if (forwards) {
      // Next 從轉交下游的 request 標頭解析 nonce 來蓋在框架 script 上。
      // 回應標頭與 request 標頭的政策不一致，瀏覽器就會擋掉那些 script。
      const forwardedCsp = res.headers.get(
        `x-middleware-request-${CSP_REQUEST_HEADER.toLowerCase()}`,
      )
      expect(forwardedCsp).toBe(csp)
      const nonce = res.headers.get(`x-middleware-request-${NONCE_HEADER}`)
      expect(csp).toContain(`'nonce-${nonce}'`)
    }
  })

  it('六條就是全部：proxy.ts 的 return 數沒變', async () => {
    // 有人新增分支時這條會紅，提醒回來把新分支加進上面那張表
    const { readFile } = await import('node:fs/promises')
    const source = await readFile(new URL('../proxy.ts', import.meta.url), 'utf8')
    const body = source.slice(source.indexOf('export async function proxy'), source.indexOf('export const config'))
    expect(body.match(/\breturn withCsp\(/g)).toHaveLength(cases.length)
    expect(body.match(/\breturn\b/g)).toHaveLength(cases.length + 1) // +1 是 withCsp 自己的 return
  })

  it('每個請求換一個 nonce', async () => {
    const a = (await proxy(request('/unlock'))).headers.get(CSP_RESPONSE_HEADER)
    const b = (await proxy(request('/unlock'))).headers.get(CSP_RESPONSE_HEADER)
    expect(a).not.toBe(b)
  })
})
