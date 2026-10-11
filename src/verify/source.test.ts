import { describe, expect, it } from 'vitest'
import { callsMethod, combines, copiesFrom, copiesOrCombinesFrom, multiplies, type SourceRule } from '../model/process'
import type { Language } from '../model/types'
import { checkSource, findLiteralReusedHint } from './source'

interface Case {
  name: string
  rule: SourceRule
  accepted: { javascript: string[]; python: string[] }
  rejected: { javascript: string[]; python: string[] }
}

const cases: Case[] = [
  {
    name: 'multiplying',
    rule: multiplies('area', 'width', 'height'),
    accepted: {
      javascript: ['let area = width * height;', 'let area;\narea = (height * width) * 1;'],
      python: ['area = width * height', 'area = 1 * (height * width)'],
    },
    rejected: {
      javascript: [
        'let area = 12;',
        'let area = width + height;',
        'let area = width * 2;',
        'let area = 12;\nlet other = width * height;',
        'let area = width ** height;',
      ],
      python: ['area = 12', 'area = width + height', 'area = width * 2', 'area = 12\nother = width * height', 'area = width ** height'],
    },
  },
  {
    name: 'calling a method on a variable',
    rule: callsMethod('up', 's', { javascript: 'toUpperCase', python: 'upper' }),
    accepted: { javascript: ['let up = s.toUpperCase();'], python: ['up = s.upper()'] },
    rejected: {
      javascript: ['let up = "HI";', 'let up = s.toLowerCase();', 'let up = t.toUpperCase();', 'let up = s;'],
      python: ['up = "HI"', 'up = s.lower()', 'up = t.upper()', 'up = s'],
    },
  },
  {
    name: 'copying',
    rule: copiesFrom('q', 'p'),
    accepted: {
      javascript: [
        'let q = { ...p };',
        'let q = [...p];',
        'let q = { ...p, extra: 1 };',
        'let q = p.slice();',
        'let q = Array.from(p);',
        'let q = Object.assign({}, p);',
        'let q;\nq = { ...p };',
      ],
      python: [
        'q = dict(p)',
        'q = list(p)',
        'q = p.copy()',
        'q = p[:]',
        'q = {**p}',
        'q = [*p]',
      ],
    },
    rejected: {
      javascript: [
        'let q = { n: 1 };',
        'let q = p;',
        'let q = { tags: p.tags };',
        'let q = { ...other };',
        'let q = [[...p[0]], [...p[1]]];',
        'let q = [...p.tags];',
        'let q = p.tags.slice();',
        'let q = Array.from(p.tags);',
        'let q = { ...p };\nq = { n: 1 };',
        'let r = { ...p };\nlet q = {};',
      ],
      python: [
        'q = {"n": 1}',
        'q = p',
        'q = {"tags": p["tags"]}',
        'q = dict(other)',
        'q = [list(p[0]), list(p[1])]',
        'q = list(p["tags"])',
        'q = p["tags"].copy()',
        'q = dict(p)\nq = {"n": 1}',
        'q = p[0]',
      ],
    },
  },
  {
    name: 'copying or combining into a new list',
    rule: copiesOrCombinesFrom('b', 'a'),
    accepted: {
      javascript: ['let b = [...a];', 'let b = [...a, [3]];', 'let b = a.concat([[3]]);'],
      python: ['b = list(a)', 'b = [*a, [3]]', 'b = a + [[3]]'],
    },
    rejected: {
      javascript: ['let b = [a[0], a[1], [3]];', 'let b = [[...a[0]], [...a[1]]];', 'b = c.concat([[3]]);'],
      python: ['b = [a[0], a[1], [3]]', 'b = [list(a[0]), list(a[1])]', 'b = c + [[3]]'],
    },
  },
  {
    name: 'combining into a new list',
    rule: combines('b', 'b'),
    accepted: { javascript: ['b = b.concat([3, 4]);'], python: ['b = b + [3, 4]'] },
    rejected: {
      javascript: ['b = [1, 2, 3, 4];', 'b.push(3);', 'b = c.concat([3]);'],
      python: ['b = [1, 2, 3, 4]', 'b.append(3)', 'b = c + [3]', 'b += [3]'],
    },
  },
]

const flat = (language: Language, picked: Case['accepted']) => picked[language]

describe.each(cases)('source rule: $name', ({ rule, accepted, rejected }) => {
  for (const language of ['javascript', 'python'] as const) {
    it.each(flat(language, accepted))(`accepts in ${language}: %s`, (code) => {
      expect(checkSource(language, code, [rule])).toEqual([])
    })
    it.each(flat(language, rejected))(`rejects in ${language}: %s`, (code) => {
      expect(checkSource(language, code, [rule])).toHaveLength(1)
    })
  }
})

describe('source feedback', () => {
  it('names the variable and the operation in the learner’s language', () => {
    expect(checkSource('javascript', 'let area = 12;', [multiplies('area', 'width', 'height')])).toEqual([
      'Build "area" by multiplying "width" and "height".',
    ])
    const upper = callsMethod('up', 's', { javascript: 'toUpperCase', python: 'upper' })
    expect(checkSource('python', 'up = "HI"', [upper])).toEqual(['Build "up" by calling s.upper().'])
    expect(checkSource('javascript', 'let up = "HI";', [upper])).toEqual(['Build "up" by calling s.toUpperCase().'])
    expect(checkSource('python', 'b = [1]', [combines('b', 'b')])).toEqual(['Build "b" with "b + [...]".'])
    expect(checkSource('javascript', 'b = [1];', [combines('b', 'b')])).toEqual([
      'Build "b" with "b.concat([...])".',
    ])
  })

  it('reports each rule that is not met and no others', () => {
    const rules = [callsMethod('lo', 's', { javascript: 'toLowerCase', python: 'lower' }), callsMethod('up', 's', { javascript: 'toUpperCase', python: 'upper' })]
    expect(checkSource('python', 'lo = s.lower()\nup = "HI"', rules)).toEqual(['Build "up" by calling s.upper().'])
  })

  it('accepts a chained assignment and a declaration with several names', () => {
    expect(checkSource('python', 'x = area = width * height', [multiplies('area', 'width', 'height')])).toEqual([])
    expect(checkSource('javascript', 'let n = 1, area = width * height;', [multiplies('area', 'width', 'height')])).toEqual([])
  })
})

describe('findLiteralReusedHint', () => {
  it('identifies when a learner hardcodes a single starter variable value', () => {
    const hintJs = findLiteralReusedHint('let a = 8;', 'javascript', 'let b = 8;')
    expect(hintJs).toBe(
      'You assigned 8 directly instead of referencing "a". Build the result from "a" (e.g. b = a) — your code builds the right picture here, but not when the starting values change.',
    )

    const hintPy = findLiteralReusedHint('a = 8', 'python', 'b = 8')
    expect(hintPy).toBe(
      'You assigned 8 directly instead of referencing "a". Build the result from "a" (e.g. b = a) — your code builds the right picture here, but not when the starting values change.',
    )
  })

  it('identifies when several literal values are re-typed', () => {
    const hint = findLiteralReusedHint('let a = 1;\nlet b = 2;', 'javascript', 'a = 2;\nb = 1;')
    expect(hint).toBe(
      'You assigned literal values instead of referencing the existing variables. Build the result from what is already there — your code builds the right picture here, but not when the starting values change.',
    )
  })

  it('returns undefined when no starter literal matches', () => {
    expect(findLiteralReusedHint('let a = 8;', 'javascript', 'let b = a;')).toBeUndefined()
    expect(findLiteralReusedHint('let a = 8;', 'javascript', 'let b = 99;')).toBeUndefined()
    expect(findLiteralReusedHint(undefined, 'javascript', 'let b = 8;')).toBeUndefined()
  })
})
