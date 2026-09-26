import { describe, it, expect } from 'vitest'
import {
  todayInTaipei,
  shelfDateFormatter,
  diaryDateFormatter,
  groupReleaseSchedule,
  calendarDateFormatter,
} from '@/lib/dates'

describe('todayInTaipei', () => {
  it('UTC 16:00 已經是台北隔天', () => {
    expect(todayInTaipei(new Date('2026-09-25T16:30:00Z'))).toBe('2026-09-26')
  })
  it('UTC 15:59 還是台北當天', () => {
    expect(todayInTaipei(new Date('2026-09-25T15:59:00Z'))).toBe('2026-09-25')
  })
})

describe('shelfDateFormatter', () => {
  const zh = shelfDateFormatter('zh-TW', '2026')
  it('今年只寫月日，照台北換日', () => {
    expect(zh('2026-09-11T17:00:00Z')).toBe('9/12')
  })
  it('不是今年的補年份', () => {
    expect(zh('2025-09-12T04:00:00Z')).toBe('2025/9/12')
  })
  it('解析不了回 null', () => {
    expect(zh('not a date')).toBeNull()
  })
})

describe('diaryDateFormatter', () => {
  it('中文月份標題補空格，日為不補零的數字', () => {
    const d = diaryDateFormatter('zh-TW')('2026-09-04T20:00:00Z')
    expect(d).not.toBeNull()
    expect(d!.monthKey).toBe('2026-09')
    expect(d!.monthLabel).toBe('2026 年 9 月')
    expect(d!.day).toBe('5')
  })
  it('英文月份標題', () => {
    const d = diaryDateFormatter('en')('2026-09-04T20:00:00Z')
    expect(d!.monthLabel).toBe('September 2026')
    expect(d!.weekday).toBe('Sat')
  })
  it('跨月換日跟著台北走', () => {
    expect(diaryDateFormatter('en')('2026-08-31T18:00:00Z')!.monthKey).toBe('2026-09')
  })
})

describe('groupReleaseSchedule', () => {
  const films = [
    { id: 1, release_date: '2026-10-03' },
    { id: 2, release_date: '2026-09-30' },
    { id: 3, release_date: '2026-10-03' },
    { id: 4, release_date: '2026-09-25' },
    { id: 5, release_date: '' },
    { id: 6, release_date: '2026-13-40' },
  ]
  const days = groupReleaseSchedule(films, '2026-09-26', 'zh-TW')

  it('只留今天以後，由近到遠', () => {
    expect(days.map((d) => d.date)).toEqual(['2026-09-30', '2026-10-03'])
  })
  it('同一天併成一組，組內保留原本順序', () => {
    expect(days[1].movies.map((m) => m.id)).toEqual([1, 3])
  })
  it('今天上映的也算', () => {
    const d = groupReleaseSchedule([{ release_date: '2026-09-26' }], '2026-09-26', 'zh-TW')
    expect(d).toHaveLength(1)
  })
  it('日期照日曆日格式化，不受時區推移', () => {
    expect(days[1].md).toBe('10/3')
    expect(days[1].weekday).toBe('週六')
  })
  it('英文星期', () => {
    const en = groupReleaseSchedule(films, '2026-09-26', 'en')
    expect(en[0].md).toBe('9/30')
    expect(en[0].weekday).toBe('Wed')
  })
})

describe('calendarDateFormatter', () => {
  it('中文補空格，英文照 Intl', () => {
    expect(calendarDateFormatter('zh-TW')('1970-07-30')).toBe('1970 年 7 月 30 日')
    expect(calendarDateFormatter('en')('1970-07-30')).toBe('July 30, 1970')
  })

  it('釘在 UTC：月初不會退成上個月最後一天', () => {
    expect(calendarDateFormatter('zh-TW')('2026-10-01')).toBe('2026 年 10 月 1 日')
  })

  it('空值或格式不對回 null', () => {
    const f = calendarDateFormatter('zh-TW')
    expect(f(null)).toBeNull()
    expect(f('')).toBeNull()
    expect(f('1970')).toBeNull()
  })
})
