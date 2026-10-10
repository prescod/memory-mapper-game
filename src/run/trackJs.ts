import {
  callId,
  identityId,
  strayCallId,
  type HeapLocation,
  type RuntimeChecks,
} from '../model/process'

/** Reads one variable of the running program. */
export type Reader = () => unknown

const MISSING = Symbol('missing')

const isContainer = (value: unknown): value is object => typeof value === 'object' && value !== null

function resolve(readers: Record<string, Reader>, { root, path }: HeapLocation): unknown {
  let value: unknown
  try {
    value = readers[root]()
  } catch (error) {
    if (error instanceof ReferenceError) return MISSING
    throw error
  }
  for (const step of path) {
    if (Array.isArray(value) && typeof step === 'number' && step >= 0 && step < value.length) {
      value = value[step]
    } else if (isContainer(value) && !Array.isArray(value) && typeof step === 'string' && Object.hasOwn(value, step)) {
      value = (value as Record<string, unknown>)[step]
    } else {
      return MISSING
    }
  }
  return value
}

const keyOf = ({ root, path }: HeapLocation) => JSON.stringify([root, path])

/** Every variable name a set of rules reads, so the program can expose them. */
export function rootsOf(checks: RuntimeChecks): string[] {
  const locations = [
    ...checks.identity.flatMap((rule) => [rule.a, rule.b]),
    ...checks.calls.flatMap((rule) => rule.args),
  ]
  return [...new Set(locations.map((location) => location.root))]
}

export function functionsOf(checks: RuntimeChecks): string[] {
  return [...new Set(checks.calls.map((rule) => rule.fn))]
}

/**
 * Records what the rules need while the program runs and judges them at the end.
 * The program receives it as `__dt`: `checkpoint` runs between the starter code
 * and the learner's, and `spy` replaces a starter function with a recording one.
 * Objects stay inside the tracker, so they are compared by identity and never
 * leave the worker.
 */
export function createTracker(checks: RuntimeChecks) {
  const atStart = new Map<string, unknown>()
  const recorded = new Map<string, unknown[][]>()

  const wanted = (location: HeapLocation, readers: Record<string, Reader>) =>
    location.phase === 'before' ? (atStart.get(keyOf(location)) ?? MISSING) : resolve(readers, location)

  return {
    checkpoint(readers: Record<string, Reader>) {
      const locations = [
        ...checks.identity.flatMap((rule) => [rule.a, rule.b]),
        ...checks.calls.flatMap((rule) => rule.args),
      ]
      for (const location of locations) {
        if (location.phase === 'before') atStart.set(keyOf(location), resolve(readers, location))
      }
    },

    spy(name: string, fn: (...args: unknown[]) => unknown) {
      recorded.set(name, [])
      return function (this: unknown, ...args: unknown[]) {
        recorded.get(name)!.push(args)
        return fn.apply(this, args)
      }
    },

    /** Ids of the rules the finished program broke. */
    broken(readers: Record<string, Reader>): string[] {
      const broken: string[] = []

      checks.identity.forEach((rule, index) => {
        const a = wanted(rule.a, readers)
        const b = wanted(rule.b, readers)
        const comparable = isContainer(a) && isContainer(b)
        const holds = comparable && (rule.relation === 'same' ? Object.is(a, b) : !Object.is(a, b))
        if (!holds) broken.push(identityId(index))
      })

      for (const fn of functionsOf(checks)) {
        const calls = recorded.get(fn) ?? []
        let accounted = 0
        checks.calls.forEach((rule, index) => {
          if (rule.fn !== fn) return
          const targets = rule.args.map((location) => wanted(location, readers))
          const matching = calls.filter(
            (args) =>
              args.length === targets.length &&
              targets.every((target, position) => isContainer(target) && Object.is(target, args[position])),
          ).length
          accounted += matching
          if (matching !== rule.times) broken.push(callId(index))
        })
        if (accounted !== calls.length) broken.push(strayCallId(fn))
      }

      return broken
    },
  }
}
