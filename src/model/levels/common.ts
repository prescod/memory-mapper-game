import type { RuntimeChecks, SourceRule } from '../process'
import type {
  DebriefBlock,
  DiagnosticHint,
  Hint,
  Language,
  UnnumberedLevel,
  LocalizedText,
  MemoryGraph,
  Problem,
} from '../types'

export const lines = (...rows: string[]) => rows.join('\n')

export interface CodeSnippet {
  js: string
  py: string
  ts?: string
}

export function perLanguage(snippet: CodeSnippet): Record<Language, string> {
  if (snippet.ts !== undefined && snippet.ts === snippet.js) {
    throw new Error('TypeScript override is identical to JavaScript; omit ts to fall back automatically.')
  }
  return {
    javascript: snippet.js,
    typescript: snippet.ts ?? snippet.js,
    python: snippet.py,
  }
}

/** The same text in each language mode: `L('array', 'list')`, with optional TypeScript override. */
export const L = (javascript: string, python: string, typescript?: string): LocalizedText => ({
  javascript,
  typescript: typescript ?? javascript,
  python,
})

export type SpecHint = string | { js: string; py: string; ts?: string }

/** See `DiagnosticHint`; the message may be spelled per language. */
export type SpecDiagnosticHint = Omit<DiagnosticHint, 'message'> & { message: SpecHint }

export type SpecDebriefBlock =
  | { html: SpecHint }
  | { diagram: MemoryGraph; caption: SpecHint; verdict?: 'correct' | 'incorrect' }

/** Problem titles that name language keywords are spelled per language. */
export type SpecTitle = string | { js: string; py: string; ts?: string }

export const toTitle = (title: SpecTitle): string | LocalizedText =>
  typeof title === 'string' ? title : perLanguage(title)

export function localize(spec: SpecHint): Hint {
  return typeof spec === 'string' ? spec : perLanguage(spec)
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
  ts?: string
  expected: MemoryGraph
  hints?: SpecDiagnosticHint[]
  hint?: SpecHint
  about?: SpecHint
  debrief?: SpecDebriefBlock[]
  opaquePrelude?: boolean
  teaches?: string[]
  reliesOn?: string[]
}

export interface WriteSpec {
  kind: 'write'
  title: SpecTitle
  /** Read-only code that runs before the learner's. */
  given?: { js: string; py: string; ts?: string }
  /** Read-only code that runs after the learner's. */
  then?: { js: string; py: string; ts?: string }
  /** Reference answer, in the languages. */
  js: string
  py: string
  ts?: string
  expected: MemoryGraph
  process?: ProcessSpec
  constraints?: ConstraintSpec[]
  hints?: SpecDiagnosticHint[]
  hint?: SpecHint
  about?: SpecHint
  debrief?: SpecDebriefBlock[]
  opaquePrelude?: boolean
  teaches?: string[]
  reliesOn?: string[]
}

/** See `Constraint`. */
export interface ConstraintSpec {
  rule: SpecHint
  cases: {
    change: string
    given: { js: string; py: string; ts?: string }
    then?: { js: string; py: string; ts?: string }
    expected: MemoryGraph
  }[]
}

/**
 * Starter code that differs from `given`, with the picture the same answer must
 * build from it. See `HiddenCase` for `then` and `message`.
 */
export interface HiddenSpec {
  given: { js: string; py: string; ts?: string }
  then?: { js: string; py: string; ts?: string }
  expected: MemoryGraph
  message?: SpecHint
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

export function toProblem(spec: Spec, id: string, challenge: boolean): Problem {
  const hints = spec.hints?.map((entry) => ({ ...entry, message: localize(entry.message) }))
  const hint = spec.hint ? localize(spec.hint) : undefined
  const about = spec.about ? localize(spec.about) : undefined
  const debrief = spec.debrief?.map(toDebriefBlock)

  if (spec.kind === 'draw') {
    return {
      kind: 'draw',
      id,
      title: toTitle(spec.title),
      challenge,
      code: perLanguage(spec),
      expected: spec.expected,
      hints,
      hint,
      about,
      debrief,
      ...(spec.opaquePrelude !== undefined && { opaquePrelude: spec.opaquePrelude }),
      ...(spec.teaches && { teaches: spec.teaches }),
      ...(spec.reliesOn && { reliesOn: spec.reliesOn }),
    }
  }
  return {
    kind: 'write',
    id,
    title: toTitle(spec.title),
    challenge,
    expected: spec.expected,
    given: spec.given && perLanguage(spec.given),
    then: spec.then && perLanguage(spec.then),
    solution: perLanguage(spec),
    process: spec.process && {
      runtime: spec.process.runtime,
      source: spec.process.source,
      hidden: spec.process.hidden?.map(({ given, then, expected, message }) => ({
        given: perLanguage(given),
        ...(then && { then: perLanguage(then) }),
        expected,
        ...(message !== undefined && { message: localize(message) }),
      })),
    },
    ...(spec.constraints && {
      constraints: spec.constraints.map(({ rule, cases }) => ({
        rule: localize(rule),
        cases: cases.map(({ change, given, then, expected }) => ({
          change,
          given: perLanguage(given),
          ...(then && { then: perLanguage(then) }),
          expected,
        })),
      })),
    }),
    hints,
    hint,
    about,
    debrief,
    ...(spec.opaquePrelude !== undefined && { opaquePrelude: spec.opaquePrelude }),
    ...(spec.teaches && { teaches: spec.teaches }),
    ...(spec.reliesOn && { reliesOn: spec.reliesOn }),
  }
}

/**
 * Specs are listed in the order learners meet them, which mixes both kinds so
 * the next problem's direction is not predictable. Tutorial ids count each kind
 * separately (draw 1-5, write 6-10) so they stay stable if the order changes;
 * challenge problems follow as 11-15.
 *
 * Challenge problems use only ideas the tutorial problems already taught, in
 * situations the learner has not seen, and hide their titles until solved.
 */
export function level(
  id: string,
  title: LocalizedText,
  description: LocalizedText,
  tutorial: Spec[],
  challenges: Spec[],
): UnnumberedLevel {
  let draws = 0
  let writes = 0
  const taught = tutorial.map((spec) =>
    spec.kind === 'draw'
      ? toProblem(spec, `${id}-${++draws}`, false)
      : toProblem(spec, `${id}-${5 + ++writes}`, false),
  )
  const tested = challenges.map((spec, index) => toProblem(spec, `${id}-${11 + index}`, true))
  return { id, title, description, problems: [...taught, ...tested] }
}
