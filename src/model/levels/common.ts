import type { RuntimeChecks, SourceRule } from '../process'
import type {
  DebriefBlock,
  DiagnosticHint,
  Hint,
  Level,
  LocalizedText,
  MemoryGraph,
  Problem,
} from '../types'

export const lines = (...rows: string[]) => rows.join('\n')

/** The same text in each language mode: `L('array', 'list')`, for example. */
export const L = (javascript: string, python: string): LocalizedText => ({ javascript, python })

export type SpecHint = string | { js: string; py: string }

export type SpecDebriefBlock =
  | { html: SpecHint }
  | { diagram: MemoryGraph; caption: SpecHint; verdict?: 'correct' | 'incorrect' }

/** Problem titles that name language keywords are spelled per language. */
export type SpecTitle = string | { js: string; py: string }

export const toTitle = (title: SpecTitle): string | LocalizedText =>
  typeof title === 'string' ? title : { javascript: title.js, python: title.py }

export function localize(spec: SpecHint): Hint {
  return typeof spec === 'string' ? spec : { javascript: spec.js, python: spec.py }
}

export function toDebriefBlock(block: SpecDebriefBlock): DebriefBlock {
  if ('html' in block) {
    return { html: localize(block.html) }
  }
  return {
    diagram: block.diagram,
    caption: localize(block.caption),
    ...(block.verdict !== undefined && { verdict: block.verdict }),
  }
}

export const SHARING_LATER =
  '<p>Later, you will work with values that have identity and can be changed in place, and then it will matter a great deal whether two variables share a value or not. For now, it does not.</p>'

export const SHARING_REMINDER =
  '<p>As before, sharing a number or keeping separate copies makes no difference yet.</p>'

export interface DrawSpec {
  kind: 'draw'
  title: SpecTitle
  js: string
  py: string
  expected: MemoryGraph
  hints?: DiagnosticHint[]
  hint?: SpecHint
  about?: SpecHint
  debrief?: SpecDebriefBlock[]
  opaquePrelude?: boolean
}

export interface WriteSpec {
  kind: 'write'
  title: SpecTitle
  /** Read-only code that runs before the learner's. */
  given?: { js: string; py: string }
  /** Read-only code that runs after the learner's. */
  then?: { js: string; py: string }
  /** Reference answer, in the two languages. */
  js: string
  py: string
  expected: MemoryGraph
  process?: ProcessSpec
  constraints?: ConstraintSpec[]
  hints?: DiagnosticHint[]
  hint?: SpecHint
  about?: SpecHint
  debrief?: SpecDebriefBlock[]
  opaquePrelude?: boolean
}

/** See `Constraint`. */
export interface ConstraintSpec {
  rule: SpecHint
  cases: {
    change: string
    given: { js: string; py: string }
    then?: { js: string; py: string }
    expected: MemoryGraph
  }[]
}

/** Starter code that differs from `given`, with the picture the same answer must build from it. */
export interface HiddenSpec {
  given: { js: string; py: string }
  expected: MemoryGraph
}

/**
 * What the picture alone cannot enforce. `runtime` rules judge object identity
 * and calls to starter functions, `source` rules require an operation, and
 * `hidden` reruns the answer from other starting values.
 */
export interface ProcessSpec {
  runtime?: RuntimeChecks
  source?: SourceRule[]
  hidden?: HiddenSpec[]
}

export type Spec = DrawSpec | WriteSpec

export const draw = (spec: Omit<DrawSpec, 'kind'>): DrawSpec => ({ kind: 'draw', ...spec })
export const write = (spec: Omit<WriteSpec, 'kind'>): WriteSpec => ({ kind: 'write', ...spec })

export function toProblem(spec: Spec, id: string, mystery: boolean): Problem {
  const hint = spec.hint ? localize(spec.hint) : undefined
  const about = spec.about ? localize(spec.about) : undefined
  const debrief = spec.debrief?.map(toDebriefBlock)

  if (spec.kind === 'draw') {
    return {
      kind: 'draw',
      id,
      title: toTitle(spec.title),
      mystery,
      code: { javascript: spec.js, python: spec.py },
      expected: spec.expected,
      hints: spec.hints,
      hint,
      about,
      debrief,
      ...(spec.opaquePrelude !== undefined && { opaquePrelude: spec.opaquePrelude }),
    }
  }
  return {
    kind: 'write',
    id,
    title: toTitle(spec.title),
    mystery,
    expected: spec.expected,
    given: spec.given && { javascript: spec.given.js, python: spec.given.py },
    then: spec.then && { javascript: spec.then.js, python: spec.then.py },
    solution: { javascript: spec.js, python: spec.py },
    process: spec.process && {
      runtime: spec.process.runtime,
      source: spec.process.source,
      hidden: spec.process.hidden?.map(({ given, expected }) => ({
        given: { javascript: given.js, python: given.py },
        expected,
      })),
    },
    ...(spec.constraints && {
      constraints: spec.constraints.map(({ rule, cases }) => ({
        rule: localize(rule),
        cases: cases.map(({ change, given, then, expected }) => ({
          change,
          given: { javascript: given.js, python: given.py },
          ...(then && { then: { javascript: then.js, python: then.py } }),
          expected,
        })),
      })),
    }),
    hints: spec.hints,
    hint,
    about,
    debrief,
    ...(spec.opaquePrelude !== undefined && { opaquePrelude: spec.opaquePrelude }),
  }
}

/**
 * Specs are listed in the order learners meet them, which mixes both kinds so
 * the next problem's direction is not predictable. Tutorial ids count each kind
 * separately (draw 1-5, write 6-10) so they stay stable if the order changes;
 * mystery problems follow as 11-15.
 *
 * Mystery problems use only ideas the tutorial problems already taught, in
 * situations the learner has not seen, and hide their titles until solved.
 */
export function level(
  id: string,
  title: LocalizedText,
  description: LocalizedText,
  tutorial: Spec[],
  mysteries: Spec[],
): Level {
  let draws = 0
  let writes = 0
  const taught = tutorial.map((spec) =>
    spec.kind === 'draw'
      ? toProblem(spec, `${id}-${++draws}`, false)
      : toProblem(spec, `${id}-${5 + ++writes}`, false),
  )
  const tested = mysteries.map((spec, index) => toProblem(spec, `${id}-${11 + index}`, true))
  return { id, title, description, problems: [...taught, ...tested] }
}
