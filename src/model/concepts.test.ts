import { describe, expect, it } from 'vitest'
import { checkConceptDependencies } from './concepts'
import type { DrawProblem, Problem, WriteProblem } from './types'
import { graph } from './builders'

function mockDraw(id: string, teaches?: string[], reliesOn?: string[]): DrawProblem {
  return {
    kind: 'draw',
    id,
    title: id,
    challenge: false,
    code: { javascript: '', typescript: '', python: '' },
    expected: graph({}),
    teaches,
    reliesOn,
  }
}

function mockWrite(id: string, teaches?: string[], reliesOn?: string[]): WriteProblem {
  return {
    kind: 'write',
    id,
    title: id,
    challenge: false,
    solution: { javascript: '', typescript: '', python: '' },
    expected: graph({}),
    teaches,
    reliesOn,
  }
}

describe('checkConceptDependencies', () => {
  it('returns no errors for an empty list of problems', () => {
    expect(checkConceptDependencies([])).toEqual([])
  })

  it('passes when a concept is taught in a draw problem before being relied upon in a write problem', () => {
    const problems: Problem[] = [
      mockDraw('problem-1', ['string.toUpperCase']),
      mockWrite('problem-2', undefined, ['string.toUpperCase']),
    ]
    expect(checkConceptDependencies(problems)).toEqual([])
  })

  it('fails when a concept is relied upon before it is taught (ordering violation)', () => {
    const problems: Problem[] = [
      mockWrite('problem-1', undefined, ['string.toUpperCase']),
      mockDraw('problem-2', ['string.toUpperCase']),
    ]
    const errors = checkConceptDependencies(problems)
    expect(errors).toEqual([
      {
        problemId: 'problem-1',
        concept: 'string.toUpperCase',
        reason: 'not_yet_taught',
        message:
          'Problem "problem-1" relies on concept "string.toUpperCase" before it has been taught. It is taught later in the curriculum.',
      },
    ])
  })

  it('fails when a concept is relied upon but never taught anywhere in the curriculum', () => {
    const problems: Problem[] = [
      mockDraw('problem-1', ['string.toUpperCase']),
      mockWrite('problem-2', undefined, ['string.toLowerCase']),
    ]
    const errors = checkConceptDependencies(problems)
    expect(errors).toEqual([
      {
        problemId: 'problem-2',
        concept: 'string.toLowerCase',
        reason: 'never_taught',
        message:
          'Problem "problem-2" relies on concept "string.toLowerCase", but that concept is never taught anywhere in the curriculum.',
      },
    ])
  })

  it('fails when a problem tries to rely on a concept it teaches itself without a prior lesson', () => {
    const problems: Problem[] = [mockWrite('problem-1', ['array.push'], ['array.push'])]
    const errors = checkConceptDependencies(problems)
    expect(errors).toEqual([
      {
        problemId: 'problem-1',
        concept: 'array.push',
        reason: 'not_yet_taught',
        message:
          'Problem "problem-1" relies on concept "array.push" before it has been taught. It is taught later in the curriculum.',
      },
    ])
  })

  it('fails on blank or empty concept names', () => {
    const problems: Problem[] = [
      mockDraw('problem-1', ['']),
      mockWrite('problem-2', undefined, ['   ']),
    ]
    const errors = checkConceptDependencies(problems)
    expect(errors).toEqual([
      {
        problemId: 'problem-1',
        concept: '',
        reason: 'empty_concept',
        message: 'Problem "problem-1" declares an empty concept in teaches.',
      },
      {
        problemId: 'problem-2',
        concept: '   ',
        reason: 'empty_concept',
        message: 'Problem "problem-2" declares an empty concept in reliesOn.',
      },
    ])
  })

  it('supports multi-concept dependencies and chains', () => {
    const problems: Problem[] = [
      mockDraw('p1', ['concept.a']),
      mockDraw('p2', ['concept.b']),
      mockWrite('p3', ['concept.c'], ['concept.a', 'concept.b']),
      mockWrite('p4', undefined, ['concept.c']),
    ]
    expect(checkConceptDependencies(problems)).toEqual([])
  })
})
