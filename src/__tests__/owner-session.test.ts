import { describe, it, expect } from 'vitest'
import {
  issueToken,
  verifyToken,
  passcodeMatches,
  ownerConfig,
  SESSION_MAX_AGE,
} from '@/lib/owner-session'

const SECRET = 'test-secret-not-used-anywhere-real'

describe('ownerConfig', () => {
  // 缺任何一個變數都要回 null，呼叫端才會把整站當成鎖住
  it('returns null when OWNER_PASSCODE is missing', () => {
    process.env.OWNER_PASSCODE = ''
    process.env.OWNER_SECRET = SECRET
    expect(ownerConfig()).toBeNull()
  })

  it('returns null when OWNER_SECRET is missing', () => {
    process.env.OWNER_PASSCODE = 'something'
    process.env.OWNER_SECRET = ''
    expect(ownerConfig()).toBeNull()
  })

  it('returns both values when set', () => {
    process.env.OWNER_PASSCODE = 'something'
    process.env.OWNER_SECRET = SECRET
    expect(ownerConfig()).toEqual({ passcode: 'something', secret: SECRET })
  })
})

describe('issueToken / verifyToken', () => {
  it('accepts a token it just issued', async () => {
    const token = await issueToken(SECRET)
    expect(await verifyToken(token, SECRET)).toBe(true)
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await issueToken(SECRET)
    expect(await verifyToken(token, 'another-secret')).toBe(false)
  })

  // 換掉 OWNER_SECRET 必須讓所有裝置上的解鎖狀態立即失效
  it('rejects a tampered signature', async () => {
    const token = await issueToken(SECRET)
    const [expiresAt] = token.split('.')
    expect(await verifyToken(`${expiresAt}.forged`, SECRET)).toBe(false)
  })

  // 把到期時間往後改，簽章就對不上了
  it('rejects an extended expiry', async () => {
    const token = await issueToken(SECRET)
    const signature = token.slice(token.indexOf('.') + 1)
    const far = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE * 10
    expect(await verifyToken(`${far}.${signature}`, SECRET)).toBe(false)
  })

  it('rejects an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 1
    // 用同一把金鑰替過去的時間簽名，簽章是對的，只有時間過了
    const forged = await issueToken(SECRET)
    const signature = forged.slice(forged.indexOf('.') + 1)
    expect(await verifyToken(`${past}.${signature}`, SECRET)).toBe(false)
  })

  it('rejects malformed tokens', async () => {
    for (const bad of ['', '.', 'abc', 'abc.def', '123', 'x.y.z']) {
      expect(await verifyToken(bad, SECRET)).toBe(false)
    }
  })
})

describe('passcodeMatches', () => {
  it('accepts the exact passcode', async () => {
    expect(await passcodeMatches('open-sesame', 'open-sesame')).toBe(true)
  })

  it('rejects a different passcode', async () => {
    expect(await passcodeMatches('open-sesam', 'open-sesame')).toBe(false)
  })

  it('rejects an empty input', async () => {
    expect(await passcodeMatches('', 'open-sesame')).toBe(false)
  })

  it('is case sensitive', async () => {
    expect(await passcodeMatches('Open-Sesame', 'open-sesame')).toBe(false)
  })
})
