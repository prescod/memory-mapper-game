import { describe, expect, it } from 'vitest'
import { toFlow } from '../canvas/layout'
import type { MemFlowEdge, MemFlowNode } from '../canvas/types'
import { graph, withGarbage } from '../model/builders'
import { problems } from '../model/levels'
import { LANGUAGES, type CoachStep, type Language } from '../model/types'
import { verify } from '../verify/verify'
import { toGraph } from '../verify/toGraph'
import { coachConditionMet, nextCoachIndex, type CoachState } from './coachSteps'

function state(overrides: Partial<CoachState> = {}): CoachState {
  return {
    nodes: [],
    edges: [],
    result: null,
    hint: false,
    answer: false,
    code: '',
    language: 'javascript',
    ...overrides,
  }
}

const picture = (memory: Parameters<typeof toFlow>[0]) => toFlow(memory)

describe('coach conditions', () => {
  it('waits for a variable with the right name', () => {
    const { nodes } = picture(graph({ score: 3 }))
    expect(coachConditionMet({ variable: true }, state({ nodes }))).toBe(true)
    expect(coachConditionMet({ variable: true, name: 'score' }, state({ nodes }))).toBe(true)
    expect(coachConditionMet({ variable: true, name: 'lives' }, state({ nodes }))).toBe(false)
  })

  it('reads a typed primitive the way code would write it', () => {
    const typed = (text: string): MemFlowNode[] => [
      { id: 'a', type: 'scalar', position: { x: 0, y: 0 }, data: { kind: 'auto', text } },
    ]
    expect(coachConditionMet({ primitive: true, text: '3' }, state({ nodes: typed(' 3 ') }))).toBe(true)
    expect(coachConditionMet({ primitive: true, text: '3' }, state({ nodes: typed('"3"') }))).toBe(false)
    expect(coachConditionMet({ primitive: true, text: '"red"' }, state({ nodes: typed("'red'") }))).toBe(true)
  })

  it('follows an arrow from a named variable to a value', () => {
    const { nodes, edges } = picture(withGarbage(graph({ speed: 9 }), 6))
    const now = state({ nodes, edges })
    expect(coachConditionMet({ arrow: true, from: 'speed', to: '9' }, now)).toBe(true)
    expect(coachConditionMet({ arrow: true, from: 'speed', to: '6' }, now)).toBe(false)
    expect(coachConditionMet({ noArrowTo: '9' }, now)).toBe(false)
    expect(coachConditionMet({ noArrowTo: '9' }, state({ nodes, edges: [] }))).toBe(true)
  })

  it('notices a selected arrow', () => {
    const { nodes, edges } = picture(graph({ speed: 9 }))
    const selected: MemFlowEdge[] = edges.map((edge) => ({ ...edge, selected: true }))
    expect(coachConditionMet({ selected: true }, state({ nodes, edges }))).toBe(false)
    expect(coachConditionMet({ selected: true }, state({ nodes, edges: selected }))).toBe(true)
  })

  it('matches typed code whatever the spacing', () => {
    expect(coachConditionMet({ typed: true, text: 'lives = 5' }, state({ code: 'let lives=5;' }))).toBe(true)
    expect(coachConditionMet({ typed: true, text: 'lives = 5' }, state({ code: 'lives = 6' }))).toBe(false)
    expect(coachConditionMet({ typed: true }, state({ code: '  ' }))).toBe(false)
  })

  it('never finishes a step that waits to be read, or the last words', () => {
    expect(coachConditionMet({ read: true }, state())).toBe(false)
    expect(coachConditionMet({ end: true }, state({ result: { ok: true, errors: [] } }))).toBe(false)
  })
})

describe('coach progress', () => {
  const steps: CoachStep[] = [
    { text: 'add', done: { variable: true } },
    { text: 'name', done: { variable: true, name: 'score' } },
    { text: 'select', done: { selected: true } },
    { text: 'check', done: { passed: true } },
    { text: 'bye', done: { end: true } },
  ]
  const { nodes, edges } = picture(graph({ score: 3 }))

  it('moves past every step already done', () => {
    expect(nextCoachIndex(steps, 0, state({ nodes, edges }))).toBe(2)
  })

  it('never moves back when the learner undoes a step', () => {
    expect(nextCoachIndex(steps, 2, state())).toBe(2)
  })

  it('jumps past the check once the puzzle is solved, whatever step it was on', () => {
    expect(nextCoachIndex(steps, 0, state({ result: { ok: true, errors: [] } }))).toBe(4)
  })

  it('ignores the canvas while the answer is showing', () => {
    expect(nextCoachIndex(steps, 0, state({ nodes, edges, answer: true }))).toBe(0)
  })
})

/** Problems with a coach, in every language. */
const coached = problems
  .filter((problem) => problem.coach !== undefined)
  .flatMap((problem) => LANGUAGES.map((language) => [problem.id, language, problem] as const))

describe('every coach', () => {
  it('exists for every tutorial puzzle', () => {
    for (const problem of problems.filter((candidate) => candidate.id.startsWith('tutorial-'))) {
      expect(problem.coach, problem.id).toBeDefined()
    }
  })

  it.each(coached)('%s in %s can be followed to the end by solving it', (_id, language: Language, problem) => {
    const steps = problem.coach!
    expect(steps.at(-1)?.done).toEqual({ end: true })
    expect(steps.filter((step) => 'passed' in step.done)).toHaveLength(1)

    // Every step that waits on the canvas or the editor must be met by the answer itself,
    // which catches a misspelled name or value in a step.
    const solved = toFlow(problem.expected)
    const answer = state({
      nodes: solved.nodes,
      edges: solved.edges,
      code: problem.kind === 'write' ? problem.solution[language] : '',
      language,
    })
    for (const step of steps) {
      const done = step.done
      if ('variable' in done || 'primitive' in done || 'arrow' in done || 'typed' in done) {
        expect(coachConditionMet(done, answer), JSON.stringify(done)).toBe(true)
      }
    }
  })
})

describe('start pictures', () => {
  const started = problems.flatMap((problem) =>
    problem.kind === 'draw' && problem.start ? [[problem.id, problem.start, problem.expected] as const] : [],
  )

  it.each(started)('%s does not start already solved', (_id, start, expected) => {
    const { nodes, edges } = toFlow(start)
    expect(verify(toGraph(nodes, edges, 'javascript'), expected).ok).toBe(false)
  })
})
