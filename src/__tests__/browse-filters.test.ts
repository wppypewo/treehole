import { describe, it, expect } from 'vitest'
import { parseBrowseFilters } from '@/lib/browse-filters'

describe('parseBrowseFilters', () => {
  const Y = 2026

  it('沒有參數就是預設條件', () => {
    expect(parseBrowseFilters({}, Y)).toEqual({
      genre: '',
      year: '',
      sort: 'popularity.desc',
      rating: '',
    })
  })

  it('合法的條件照單全收', () => {
    expect(
      parseBrowseFilters(
        { genre: '18', year: '1994', sort: 'vote_average.desc', rating: '7' },
        Y,
      ),
    ).toEqual({ genre: '18', year: '1994', sort: 'vote_average.desc', rating: '7' })
  })

  it('不認得的類型退回不限', () => {
    expect(parseBrowseFilters({ genre: 'abc' }, Y).genre).toBe('')
    expect(parseBrowseFilters({ genre: '999999' }, Y).genre).toBe('')
  })

  it('年份超出選單範圍或格式不對就不限', () => {
    expect(parseBrowseFilters({ year: '1979' }, Y).year).toBe('')
    expect(parseBrowseFilters({ year: '2027' }, Y).year).toBe('')
    expect(parseBrowseFilters({ year: '94' }, Y).year).toBe('')
    expect(parseBrowseFilters({ year: '1980' }, Y).year).toBe('1980')
    expect(parseBrowseFilters({ year: '2026' }, Y).year).toBe('2026')
  })

  it('排序只接受三種，其餘退回人氣', () => {
    expect(parseBrowseFilters({ sort: 'revenue.desc' }, Y).sort).toBe('popularity.desc')
  })

  it('評分門檻只接受 6／7／8', () => {
    expect(parseBrowseFilters({ rating: '9' }, Y).rating).toBe('')
    expect(parseBrowseFilters({ rating: '6.5' }, Y).rating).toBe('')
  })

  it('同一個 key 重複出現（陣列）一律不認', () => {
    expect(parseBrowseFilters({ genre: ['18', '28'] }, Y).genre).toBe('')
  })
})
