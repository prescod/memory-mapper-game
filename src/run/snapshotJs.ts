import { graph, type ContainerSpec, type Value } from '../model/builders'
import type { RuntimeChecks } from '../model/process'
import type { MemoryGraph } from '../model/types'
import { UserCodeError } from './errors'
import { joinProgram } from './protocol'
import { createTracker, functionsOf, rootsOf, type Reader } from './trackJs'

/**
 * Runs JavaScript and captures the memory graph it builds. Used both for
 * grading learner code in the browser and, in tests, for checking the
 * hand-written expected graphs against the language itself.
 */
export interface Snapshot {
  variables: Record<string, Value>
  containers: Record<string, ContainerSpec>
  /** Ids of the process rules the run broke, when it was run with rules; see `explainBrokenRules`. */
  brokenRules?: string[]
}

export function snapshotToGraph(snapshot: Snapshot): MemoryGraph {
  return graph(snapshot.variables, snapshot.containers)
}

const SUPPORTED_NOTE = 'Use only numbers, strings, booleans, null, arrays and objects.'

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Evaluates `code` with no starter code and no process rules. */
export function snapshotJavaScript(code: string, names: string[]): Snapshot {
  return runJavaScript('', code, names)
}

/**
 * Evaluates the starter code and then `code` as one program, then reads each of
 * `names` from the scope it left behind. With `checks`, the program is paused
 * between the two parts so the objects the starter code made can be told apart
 * from look-alikes the learner builds. Throws `UserCodeError` for anything the
 * learner can fix; other errors from the code itself propagate unchanged.
 */
export function runJavaScript(
  given: string,
  code: string,
  names: string[],
  checks?: RuntimeChecks,
  then?: string,
): Snapshot {
  const readable = [...new Set([...names, ...(checks ? rootsOf(checks) : [])])]
  const readers = `{ ${readable.map((name) => `${JSON.stringify(name)}: () => ${name}`).join(', ')} }`

  const tracker = checks && createTracker(checks)
  const checkpoint =
    checks &&
    [
      `__dt.checkpoint(${readers});`,
      ...functionsOf(checks).map((fn) => `${fn} = __dt.spy(${JSON.stringify(fn)}, ${fn});`),
    ].join(' ')

  const { source } = joinProgram(given, code, checkpoint, then)
  const run = new Function('__dt', `${source}\nreturn ${readers};`)
  const read = run(tracker) as Record<string, Reader>

  const brokenRules = tracker?.broken(read)

  const ids = new Map<object | symbol, string>()
  const containers: Record<string, ContainerSpec> = {}

  const encode = (value: unknown): Value => {
    if (value === null || ['number', 'string', 'boolean'].includes(typeof value)) {
      return value as Value
    }
    if (typeof value === 'symbol') {
      // A `Pet` from the hidden prelude (an alias for `Symbol`): opaque, unique
      // by construction, labelled by its description. Never shown as an object.
      const existing = ids.get(value)
      if (existing) return { ref: existing }
      const id = `c${ids.size}`
      ids.set(value, id)
      containers[id] = { kind: 'pet', label: value.description ?? '' }
      return { ref: id }
    }
    if (typeof value !== 'object' || (!Array.isArray(value) && !isPlainObject(value))) {
      throw new UserCodeError(`A value of this kind can't be shown: ${describeUnsupported(value)}. ${SUPPORTED_NOTE}`)
    }

    const existing = ids.get(value)
    if (existing) return { ref: existing }

    const id = `c${ids.size}`
    ids.set(value, id)
    if (Array.isArray(value)) {
      const spec: ContainerSpec = { kind: 'array', items: [] }
      containers[id] = spec
      spec.items = Array.from(value, encode)
    } else {
      const spec: ContainerSpec = { kind: 'object', entries: {} }
      containers[id] = spec
      for (const [key, item] of Object.entries(value)) spec.entries[key] = encode(item)
    }
    return { ref: id }
  }

  const variables: Record<string, Value> = {}
  for (const name of names) {
    let value: unknown
    try {
      value = read[name]()
    } catch (error) {
      if (error instanceof ReferenceError) {
        throw new UserCodeError(`Your code never created a variable named "${name}".`)
      }
      throw error
    }
    if (value === undefined) {
      throw new UserCodeError(`The variable "${name}" has no value. Give it one.`)
    }
    variables[name] = encode(value)
  }
  return brokenRules === undefined ? { variables, containers } : { variables, containers, brokenRules }
}

function describeUnsupported(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (typeof value === 'function') return 'a function'
  if (typeof value === 'object' && value !== null) return `a ${value.constructor?.name ?? 'custom'} object`
  return `a ${typeof value}`
}
