import { describe, it, expect } from 'vitest'
import {
  mergeCredits,
  groupByYear,
  actingRoleText,
  crewRoleText,
  isLeadRole,
  isSelfRole,
  type RoleLabels,
} from '@/lib/filmography'

const film = (id: number, release_date: string) => ({
  id,
  title: `片${id}`,
  original_title: `Film ${id}`,
  poster_path: null,
  release_date,
})

const zh: RoleLabels = {
  as: '飾 {role}',
  self: '本人',
  voice: '（配音）',
  uncredited: '（未掛名）',
  jobs: { Director: '導演', Screenplay: '編劇', Writer: '編劇', Producer: '製片' },
}

describe('mergeCredits', () => {
  it('同一部片的多個職務併成一列，導演排第一', () => {
    const { crew } = mergeCredits([], [
      { ...film(1, '2010-07-16'), job: 'Producer' },
      { ...film(1, '2010-07-16'), job: 'Writer' },
      { ...film(1, '2010-07-16'), job: 'Director' },
    ])
    expect(crew).toHaveLength(1)
    expect(crew[0].roles).toEqual(['Director', 'Writer', 'Producer'])
  })

  it('片尾致謝（Thanks）不算作品；只有致謝的片整部不出現', () => {
    const { crew } = mergeCredits([], [
      { ...film(1, '2010-01-01'), job: 'Thanks' },
      { ...film(2, '2011-01-01'), job: 'Director' },
      { ...film(2, '2011-01-01'), job: 'Thanks' },
    ])
    expect(crew.map((c) => c.film.id)).toEqual([2])
    expect(crew[0].roles).toEqual(['Director'])
  })

  it('一人分飾兩角：角色都留下，billing 取較前的順位', () => {
    const { acting } = mergeCredits(
      [
        { ...film(1, '2000-01-01'), character: 'A', order: 5 },
        { ...film(1, '2000-01-01'), character: 'B', order: 1 },
      ],
      [],
    )
    expect(acting[0].roles).toEqual(['A', 'B'])
    expect(acting[0].billing).toBe(1)
  })

  it('演出與幕後分開；同一部片可以兩邊都有', () => {
    const f = mergeCredits(
      [{ ...film(1, '2000-01-01'), character: 'X', order: 0 }],
      [{ ...film(1, '2000-01-01'), job: 'Director' }],
    )
    expect(f.acting).toHaveLength(1)
    expect(f.crew).toHaveLength(1)
  })

  it('依上映日新到舊，沒有日期的排最後', () => {
    const { acting } = mergeCredits(
      [
        { ...film(1, ''), character: 'a' },
        { ...film(2, '1999-05-01'), character: 'b' },
        { ...film(3, '2024-02-01'), character: 'c' },
      ],
      [],
    )
    expect(acting.map((c) => c.film.id)).toEqual([3, 2, 1])
  })

  it('送進瀏覽器的片子資料不帶 overview', () => {
    const { acting } = mergeCredits(
      [{ ...film(1, '2000-01-01'), overview: '很長的簡介', character: 'a' } as never],
      [],
    )
    expect(acting[0].film).not.toHaveProperty('overview')
  })
})

describe('groupByYear', () => {
  it('同年併一組，新到舊，沒有日期的收成最後一組', () => {
    const { acting } = mergeCredits(
      [
        { ...film(1, '2020-03-01'), character: 'a' },
        { ...film(2, ''), character: 'b' },
        { ...film(3, '2020-11-01'), character: 'c' },
        { ...film(4, '2018-01-01'), character: 'd' },
      ],
      [],
    )
    const groups = groupByYear(acting)
    expect(groups.map((g) => g.year)).toEqual(['2020', '2018', null])
    expect(groups[0].credits.map((c) => c.film.id)).toEqual([3, 1])
  })

  it('空清單回空陣列', () => {
    expect(groupByYear([])).toEqual([])
  })
})

describe('actingRoleText', () => {
  it('一般角色加「飾」', () => {
    expect(actingRoleText(['Bruce Wayne'], zh)).toBe('飾 Bruce Wayne')
  })

  it('Self／Himself 換成「本人」', () => {
    expect(actingRoleText(['Self'], zh)).toBe('本人')
    expect(actingRoleText(['Himself - Director'], zh)).toBe('本人')
  })

  it('配音與未掛名的英文括號換成當前語言', () => {
    expect(actingRoleText(['Woody (voice)'], zh)).toBe('飾 Woody（配音）')
    expect(actingRoleText(['Self (uncredited)'], zh)).toBe('本人（未掛名）')
  })

  it('分飾多角用斜線隔開；沒有角色名回空字串', () => {
    expect(actingRoleText(['A', 'B'], zh)).toBe('飾 A / 飾 B')
    expect(actingRoleText([], zh)).toBe('')
  })
})

describe('crewRoleText', () => {
  it('翻譯職務，Screenplay 與 Writer 都是編劇時只留一個', () => {
    expect(crewRoleText(['Director', 'Screenplay', 'Writer', 'Producer'], zh)).toBe(
      '導演 · 編劇 · 製片',
    )
  })

  it('沒有對應的職務照原文顯示', () => {
    expect(crewRoleText(['Gaffer'], zh)).toBe('Gaffer')
  })
})

describe('isLeadRole', () => {
  const credit = (roles: string[], billing: number | null) => ({
    film: film(1, '2000-01-01'),
    roles,
    billing,
  })

  it('卡司排序前三位算主演', () => {
    expect(isLeadRole(credit(['A'], 0))).toBe(true)
    expect(isLeadRole(credit(['A'], 2))).toBe(true)
    expect(isLeadRole(credit(['A'], 3))).toBe(false)
  })

  it('紀錄片裡以本人入鏡、排第一位，不算主演', () => {
    expect(isLeadRole(credit(['Self'], 0))).toBe(false)
  })

  it('沒有排序資料不算', () => {
    expect(isLeadRole(credit(['A'], null))).toBe(false)
  })
})

describe('isSelfRole', () => {
  it('只認開頭是 Self／Himself／Herself 的角色名', () => {
    expect(isSelfRole('Herself')).toBe(true)
    expect(isSelfRole('Selfridge')).toBe(false)
  })
})
