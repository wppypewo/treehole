import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// next/font 只能在 Next 的編譯流程裡跑，測試換成固定的 class 字串
vi.mock('../app/fonts', () => ({ fontVariables: 'font-vars' }))

import GlobalError from '../app/global-error'
import ErrorPage from '../app/error'
import { errorText } from '../app/error-copy'
import { htmlLang } from '../i18n/config'

const t = errorText['zh-TW']
const noop = () => {}

/**
 * 根 layout 的讀取都有 catch，執行期找不到能從外部弄壞它的路徑，
 * global-error 因此一直沒被真的觸發過。這裡直接渲染，確認它自己帶的
 * <html> 外殼、字體、樣式與文案都在，不會在真的出事時才發現是白頁。
 */
describe('global-error', () => {
  const render = (error: Error & { digest?: string }) =>
    renderToStaticMarkup(createElement(GlobalError, { error, retry: noop }))

  it('自己畫 <html>，掛上語系、字體變數與深色底', () => {
    const html = render(new Error('boom'))
    expect(html.startsWith(`<html lang="${htmlLang('zh-TW')}" class="font-vars dark antialiased">`)).toBe(true)
    expect(html).toContain('<body class="flex min-h-dvh flex-col bg-ink text-paper">')
    expect(html).toContain(`<title>${t.siteTitle}</title>`)
    expect(html).toContain('<main id="main"')
  })

  it('沒有 digest 時不出代碼行', () => {
    const html = render(new Error('boom'))
    expect(html).toContain(t.sub)
    expect(html).not.toContain(t.code)
  })

  it('有 digest 時附代碼，讓人能去對伺服器紀錄', () => {
    const html = render(Object.assign(new Error('boom'), { digest: 'abc123' }))
    expect(html).toContain(t.subWithCode)
    expect(html).toContain(`${t.code} abc123`)
  })

  it('重試鍵是 button，不是連結', () => {
    const html = render(new Error('boom'))
    expect(html).toContain(`<button type="button" class="btn-line">${t.retry}</button>`)
  })

  it('不帶導覽列：導覽列依賴的正是壞掉的那一層', () => {
    expect(render(new Error('boom'))).not.toContain('<nav')
  })
})

describe('error', () => {
  it('只畫內容區，不自己帶 <html>', () => {
    const html = renderToStaticMarkup(
      createElement(ErrorPage, { error: new Error('boom'), retry: noop }),
    )
    expect(html).not.toContain('<html')
    expect(html).toContain(t.title)
    expect(html).toContain(t.retry)
  })
})
