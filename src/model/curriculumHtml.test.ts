import { describe, expect, it } from 'vitest'
import { containsCurriculumHtml, wrapCurriculumIdentifiers } from './curriculumHtml'

describe('wrapCurriculumIdentifiers', () => {
  it('wraps known identifiers in plain prose', () => {
    expect(
      wrapCurriculumIdentifiers(
        'The boss says that lo and up must be built using string methods on s.',
        ['lo', 'up', 's'],
      ),
    ).toBe(
      'The boss says that <code>lo</code> and <code>up</code> must be built using string methods on <code>s</code>.',
    )
  })

  it('leaves text that already contains HTML unchanged', () => {
    const html = 'Already has <code>lo</code> marked.'
    expect(wrapCurriculumIdentifiers(html, ['lo', 'up'])).toBe(html)
  })

  it('prefers longer identifiers first', () => {
    expect(wrapCurriculumIdentifiers('players and player', ['player', 'players'])).toBe(
      '<code>players</code> and <code>player</code>',
    )
  })

  it('does not nest code tags when the same identifier appears many times', () => {
    const rule =
      'The boss says that name must be converted using string methods, so if another programmer updates what name starts with, name will still become uppercase and backup will stay untouched.'
    expect(wrapCurriculumIdentifiers(rule, ['name', 'backup'])).toBe(
      'The boss says that <code>name</code> must be converted using string methods, so if another programmer updates what <code>name</code> starts with, <code>name</code> will still become uppercase and <code>backup</code> will stay untouched.',
    )
  })
})

describe('containsCurriculumHtml', () => {
  it('detects inline tags', () => {
    expect(containsCurriculumHtml('<code>x</code>')).toBe(true)
    expect(containsCurriculumHtml('plain x')).toBe(false)
  })
})
