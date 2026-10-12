import { languageProfile, pythonName, type Language, type Runtime } from './languages'
import type { Hint, MemoryGraph } from './types'

export { pythonName }

/**
 * A final memory graph cannot tell whether the learner changed the objects the
 * puzzle set up or quietly built look-alikes, nor whether a function was really
 * called. Process rules cover that gap. They come in three layers, checked
 * after the picture itself is right:
 *
 * - runtime rules, judged inside the interpreter by object identity and
 *   recorded calls to functions from the starter code;
 * - source rules, which require a particular operation to build a variable;
 * - hidden cases, which rerun the learner's code from other starting values so
 *   an answer typed out as literals stops matching.
 */

/** One step into a container: an object key or an array index. */
export type PathStep = string | number

/**
 * A place in memory named by a variable and a path of steps from it. `before`
 * is read once the starter code has run, `after` once the learner's code has.
 */
export interface HeapLocation {
  phase: 'before' | 'after'
  root: string
  path: PathStep[]
}

export const before = (root: string, ...path: PathStep[]): HeapLocation => ({ phase: 'before', root, path })
export const after = (root: string, ...path: PathStep[]): HeapLocation => ({ phase: 'after', root, path })

function describeLocation({ root, path }: HeapLocation): string {
  return path.reduce<string>(
    (text, step) => (typeof step === 'number' ? `${text}[${step}]` : `${text}.${step}`),
    root,
  )
}

const quoted = (location: HeapLocation) => `"${describeLocation(location)}"`

const when = (location: HeapLocation) =>
  location.phase === 'before' ? `${quoted(location)} at the start` : `${quoted(location)} afterward`

/**
 * Two locations must hold the same array or object (`same`) or different ones
 * (`different`). Only arrays and objects have identity, so a location that is
 * missing or holds a plain value always breaks the rule.
 */
export interface IdentityRule {
  kind: 'identity'
  relation: 'same' | 'different'
  a: HeapLocation
  b: HeapLocation
  message: string
}

export function sameObject(a: HeapLocation, b: HeapLocation, message?: string): IdentityRule {
  const [first, second] = [when(a), when(b)]
  return {
    kind: 'identity',
    relation: 'same',
    a,
    b,
    message: message ?? `${capitalize(second)} should be the same container as ${first}.`,
  }
}

export function differentObject(a: HeapLocation, b: HeapLocation, message?: string): IdentityRule {
  return {
    kind: 'identity',
    relation: 'different',
    a,
    b,
    message: message ?? `${capitalize(when(b))} should be a different container from ${when(a)}.`,
  }
}

/** The object a variable referred to when the learner's code began must still be the one it refers to. */
export function preserve(root: string, ...path: PathStep[]): IdentityRule {
  return sameObject(
    before(root, ...path),
    after(root, ...path),
    `Change what ${quoted(before(root, ...path))} already refers to instead of creating a new one.`,
  )
}

/**
 * A function defined by the starter code must be called exactly `times` times
 * with arguments that are, by identity, the objects at `args`. Calls made any
 * other way count against the rule too.
 *
 * `fn` is the JavaScript name. Python starter code spells the same function in
 * snake_case, so `checksFor` renames it before a Python run.
 */
export interface CallRule {
  kind: 'call'
  fn: string
  args: HeapLocation[]
  times: number
  message: string
}

function callMessage(fn: string, args: HeapLocation[], times: number): string {
  const argList = args.map(describeLocation).join(', ')
  const count = times === 1 ? 'once' : `${times} times`
  return `Call ${fn}(${argList}) ${count}.`
}

export function call(fn: string, args: HeapLocation[], times: number): CallRule {
  return { kind: 'call', fn, args, times, message: callMessage(fn, args, times) }
}

export interface RuntimeChecks {
  identity: IdentityRule[]
  calls: CallRule[]
}

export function runtime(...rules: (IdentityRule | CallRule)[]): RuntimeChecks {
  return {
    identity: rules.filter((rule): rule is IdentityRule => rule.kind === 'identity'),
    calls: rules.filter((rule): rule is CallRule => rule.kind === 'call'),
  }
}

/** The checks with each starter function named the way `language` spells it. */
export function checksFor(checks: RuntimeChecks, language: Language): RuntimeChecks {
  const profile = languageProfile(language)
  return {
    identity: checks.identity,
    calls: checks.calls.map((rule) => {
      const fn = profile.functionName(rule.fn)
      return { ...rule, fn, message: callMessage(fn, rule.args, rule.times) }
    }),
  }
}

/**
 * The interpreters report the rules a run broke by id, so the wording lives in
 * one place instead of in both runtimes.
 */
export const identityId = (index: number) => `identity:${index}`
export const callId = (index: number) => `call:${index}`
export const strayCallId = (fn: string) => `stray:${fn}`

export function explainBrokenRules(checks: RuntimeChecks, broken: readonly string[]): string[] {
  const messages: string[] = []
  checks.identity.forEach((rule, index) => {
    if (broken.includes(identityId(index))) messages.push(rule.message)
  })
  checks.calls.forEach((rule, index) => {
    if (broken.includes(callId(index))) messages.push(rule.message)
  })
  for (const fn of new Set(checks.calls.map((rule) => rule.fn))) {
    if (broken.includes(strayCallId(fn))) messages.push(`Only call ${fn} the way this puzzle asks.`)
  }
  return messages
}

/**
 * Requires that a variable is built by a particular operation. Each rule looks
 * only at the assignments to `target`, so the operation appearing elsewhere in
 * the program does not count.
 */
export type SourceRule =
  /** `target` is computed with `*` from every one of `operands`. */
  | { kind: 'multiply'; target: string; operands: string[] }
  /** `target` is the result of calling a method of the learner's language on `receiver`. */
  | { kind: 'method'; target: string; receiver: string; method: Record<Runtime, string> }
  /** `target` is a shallow copy of `source`, at any depth of the expression. */
  | { kind: 'copy'; target: string; source: string }
  /** `target` is built from `source` by `concat` (JavaScript) or `+` (Python). */
  | { kind: 'combine'; target: string; source: string }
  /** `target` is built from `source` either by copying it or by combining it into a new list. */
  | { kind: 'copyOrCombine'; target: string; source: string }

export const multiplies = (target: string, ...operands: string[]): SourceRule => ({
  kind: 'multiply',
  target,
  operands,
})
export const callsMethod = (
  target: string,
  receiver: string,
  method: Record<Runtime, string>,
): SourceRule => ({ kind: 'method', target, receiver, method })
export const copiesFrom = (target: string, source: string): SourceRule => ({ kind: 'copy', target, source })
export const combines = (target: string, source: string): SourceRule => ({ kind: 'combine', target, source })
export const copiesOrCombinesFrom = (target: string, source: string): SourceRule => ({
  kind: 'copyOrCombine',
  target,
  source,
})

/**
 * The learner's code is run again after other starter code. Its result must
 * match `expected`, which names the same variables as the puzzle's own picture.
 *
 * `then` replaces the puzzle's trailing code for this run; an empty string
 * leaves it out, which shows what the learner's code does on its own. A case
 * with a `message` explains its own failure instead of the generic one.
 */
export interface HiddenCase {
  given: Record<Language, string>
  then?: Record<Language, string>
  expected: MemoryGraph
  message?: Hint
}

export interface ProcessSpec {
  runtime?: RuntimeChecks
  source?: SourceRule[]
  hidden?: HiddenCase[]
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
