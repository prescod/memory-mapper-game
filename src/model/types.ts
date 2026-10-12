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

/**
 * An opaque instance of a built-in class (`Pet` in the identity level).
 * Learners can tell instances apart by `label` but never see inside: no
 * entries, slots, or attributes are shown or compared.
 */
export interface InstanceMem {
  type: 'instance'
  className: string
  label: string
}

export type MemNode = ScalarMem | ArrayMem | ObjectMem | InstanceMem

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

export {
  CONTAINER_NAMES,
  isLanguage,
  LANGUAGE_LABELS,
  LANGUAGES,
  languageProfile,
  textIn,
  type Language,
  type LanguageProfile,
  type Runtime,
  type RuntimeTraits,
} from './languages'

import type { Language } from './languages'

/** The same text in each language mode, e.g. level titles that name arrays or lists. */
export type LocalizedText = Record<Language, string>

/** Targeted explanation shown when a learner draws or builds a known mistake. */
export interface DiagnosticHint {
  variable: string
  /**
   * The mistaken scalar value this hint explains. Absent on aliasing hints,
   * which explain sharing instead of a value.
   */
  value?: string | number | boolean | null | (string | number | boolean | null)[]
  /**
   * The mistaken number of slots this hint explains, when the variable refers
   * to an array or list of the wrong length.
   */
  length?: number
  /** The key an object is missing, when the learner's object left it out. */
  missingKey?: string
  /**
   * Which aliasing mistake this hint explains: `shared` when the learner
   * merged names onto one container that should be separate, `separate` when
   * they split names across containers that should be shared.
   */
  aliasing?: 'shared' | 'separate'
  message: Hint
}

export type Hint = string | Record<Language, string>

export type DebriefBlock =
  | { html: Hint }
  | { diagram: MemoryGraph; caption: Hint; verdict?: 'correct' | 'incorrect' }

/**
 * Code is shown and the learner draws the memory it leaves behind. The two
 * snippets are different spellings of the same program, so both are graded
 * against the single `expected` graph.
 */
export interface DrawProblem {
  kind: 'draw'
  id: string
  title: string | LocalizedText
  /** Title and level description stay hidden until solved, since they would give the answer away. */
  challenge: boolean
  code: Record<Language, string>
  expected: MemoryGraph
  hints?: DiagnosticHint[]
  hint?: Hint
  about?: Hint
  debrief?: DebriefBlock[]
  /**
   * Whether checking this puzzle runs the reference code with the hidden
   * `makeObject` / `make_object` helper defined. Learners only ever see calls
   * to it, never its definition.
   */
  opaquePrelude?: boolean
  teaches?: string[]
  reliesOn?: string[]
}

/**
 * A requirement on how the code is written that the picture cannot show,
 * stated as an instruction from the learner's boss. Two variables holding the
 * same number look identical whether one was assigned from the other or both
 * were typed out, and only the purpose of the code decides which is right. A
 * constraint states that purpose, so the choice reads as the learner's own
 * design decision rather than a hidden rule of the checker.
 *
 * Each case reruns the learner's code after other starter code, standing in
 * for another programmer editing the starting values.
 */
export interface Constraint {
  /** Boss instruction; identifiers are monospace in the UI (see curriculum prose formatting). */
  rule: Hint
  cases: ConstraintCase[]
}

export interface ConstraintCase {
  /** The edit, worded to complete "If another programmer changes the code so that …", e.g. `a starts at 3`. */
  change: string
  given: Record<Language, string>
  then?: Record<Language, string>
  /** Names the same variables as the puzzle's own picture. */
  expected: MemoryGraph
}

/**
 * The picture `expected` is shown and the learner writes code that produces it.
 * `given` is read-only code that runs first, so a puzzle can require changing
 * objects that already exist instead of retyping the result as literals.
 * `then` is read-only code that runs afterward, so a puzzle can call a function
 * the learner defined.
 * `solution` is a reference answer used only to prove the puzzle can be solved;
 * the interface never shows it.
 */
export interface WriteProblem {
  kind: 'write'
  id: string
  title: string | LocalizedText
  /** See `DrawProblem.challenge`. */
  challenge: boolean
  expected: MemoryGraph
  given?: Record<Language, string>
  then?: Record<Language, string>
  solution: Record<Language, string>
  /** What the picture alone cannot show: which objects were changed, what was called, how values were built. */
  process?: ProcessSpec
  constraints?: Constraint[]
  hints?: DiagnosticHint[]
  hint?: Hint
  about?: Hint
  debrief?: DebriefBlock[]
  /** See `DrawProblem.opaquePrelude`. */
  opaquePrelude?: boolean
  teaches?: string[]
  reliesOn?: string[]
}

export type Problem = DrawProblem | WriteProblem

export interface Level {
  /** Curriculum level number (1-based), shown in problem labels such as 9.7. */
  number: number
  id: string
  title: LocalizedText
  description: LocalizedText
  /** Tutorial problems first, then challenge problems that retest the same ideas. */
  problems: Problem[]
}

/** Level content before `number` is assigned in `levels.ts`. */
export type UnnumberedLevel = Omit<Level, 'number'>

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
