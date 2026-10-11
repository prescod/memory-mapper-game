import type { ProcessSpec } from './process'

export type NodeId = string

export type ScalarKind = 'number' | 'string' | 'boolean' | 'null'

/**
 * `value` is canonical text: numbers via `String(Number(x))`, booleans as
 * `true`/`false`, null as `null`, strings without surrounding quotes. This lets
 * `None`/`null` and `True`/`true` compare equal regardless of how the learner
 * typed them.
 */
export interface ScalarMem {
  type: 'scalar'
  kind: ScalarKind
  value: string
  /**
   * Only set on graphs extracted from the canvas, when the learner typed
   * another language's keyword (`null` in Python, `True` in JavaScript). Such
   * text is read as a string, and this records the value it spells elsewhere
   * so feedback can point out the spelling rather than just the wrong value.
   */
  otherLanguageValue?: { kind: ScalarKind; value: string }
}

/**
 * An outgoing reference. `handle` is the React Flow source-handle id the
 * reference originated from; it is only set on graphs extracted from the
 * canvas and lets feedback point at the exact edge.
 */
export interface Slot {
  target: NodeId | null
  handle?: string
}

export interface ArrayMem {
  type: 'array'
  slots: Slot[]
}

export interface ObjectMem {
  type: 'object'
  entries: { key: string; slot: Slot }[]
}

export type MemNode = ScalarMem | ArrayMem | ObjectMem

export interface VariableEntry {
  name: string
  /** Canvas node id; absent in hand-written expected graphs. */
  nodeId?: NodeId
  slot: Slot
}

/**
 * A topology-only description of memory: coordinates are deliberately absent so
 * two diagrams that look different but are wired identically compare equal.
 */
export interface MemoryGraph {
  variables: VariableEntry[]
  nodes: Record<NodeId, MemNode>
}

export type Language = 'javascript' | 'python'

export const LANGUAGES: Language[] = ['javascript', 'python']

export const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: 'JavaScript',
  python: 'Python',
}

/** What each language calls the two container types, in lower case. */
export const CONTAINER_NAMES: Record<Language, { array: string; object: string }> = {
  javascript: { array: 'array', object: 'object' },
  python: { array: 'list', object: 'dict' },
}

/** Targeted explanation shown when a learner draws or builds a known mistake. */
export interface DiagnosticHint {
  variable: string
  /**
   * The mistaken scalar value this hint explains. Absent on aliasing hints,
   * which explain sharing instead of a value.
   */
  value?: string | number | boolean | null | (string | number | boolean | null)[]
  /**
   * Which aliasing mistake this hint explains: `shared` when the learner
   * merged names onto one container that should be separate, `separate` when
   * they split names across containers that should be shared.
   */
  aliasing?: 'shared' | 'separate'
  message: string
}

export type Hint = string | Record<Language, string>

/**
 * Code is shown and the learner draws the memory it leaves behind. The two
 * snippets are different spellings of the same program, so both are graded
 * against the single `expected` graph.
 */
export interface DrawProblem {
  kind: 'draw'
  id: string
  title: string
  /** Title and level description stay hidden until solved, since they would give the answer away. */
  mystery: boolean
  code: Record<Language, string>
  expected: MemoryGraph
  hints?: DiagnosticHint[]
  hint?: Hint
}

/**
 * The picture `expected` is shown and the learner writes code that produces it.
 * `given` is read-only code that runs first, so a puzzle can require changing
 * objects that already exist instead of retyping the result as literals.
 * `solution` is a reference answer used only to prove the puzzle can be solved;
 * the interface never shows it.
 */
export interface WriteProblem {
  kind: 'write'
  id: string
  title: string
  /** See `DrawProblem.mystery`. */
  mystery: boolean
  expected: MemoryGraph
  given?: Record<Language, string>
  solution: Record<Language, string>
  /** What the picture alone cannot show: which objects were changed, what was called, how values were built. */
  process?: ProcessSpec
  hints?: DiagnosticHint[]
  hint?: Hint
}

export type Problem = DrawProblem | WriteProblem

export interface Level {
  id: string
  title: string
  description: string
  /** Tutorial problems first, then mystery problems that retest the same ideas. */
  problems: Problem[]
}

export interface VerifyError {
  message: string
  nodeId?: NodeId
  /** Source handle on `nodeId` whose outgoing edge is wrong. */
  handle?: string
}

export interface VerifyResult {
  ok: boolean
  errors: VerifyError[]
}
