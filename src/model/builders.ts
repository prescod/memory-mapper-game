import { scalarFromJs } from './scalar'
import type { MemNode, MemoryGraph, NodeId } from './types'

/** A reference to a container declared in the same `graph()` call. */
export interface Ref {
  ref: string
}

/** A primitive (becomes its own scalar node) or a reference to a container. */
export type Value = number | string | boolean | null | Ref

export type ContainerSpec =
  | { kind: 'array'; items: Value[] }
  | { kind: 'object'; entries: Record<string, Value> }

export const ref = (id: string): Ref => ({ ref: id })
export const list = (...items: Value[]): ContainerSpec => ({ kind: 'array', items })
export const dict = (entries: Record<string, Value>): ContainerSpec => ({ kind: 'object', entries })

const isRef = (value: Value): value is Ref => typeof value === 'object' && value !== null

/**
 * Builds an expected graph. Variables and container members hold either a
 * primitive, which gets its own scalar node, or a `ref()` to a named container.
 * Naming containers is what lets two references share one array or object, and
 * lets containers point at each other.
 */
export function graph(
  variables: Record<string, Value>,
  containers: Record<string, ContainerSpec> = {},
): MemoryGraph {
  const nodes: Record<NodeId, MemNode> = {}
  let scalarCount = 0

  const target = (value: Value): NodeId => {
    if (isRef(value)) {
      if (!(value.ref in containers)) {
        throw new Error(`Reference to undeclared container "${value.ref}"`)
      }
      return `container:${value.ref}`
    }
    const id = `scalar:${scalarCount++}`
    nodes[id] = scalarFromJs(value)
    return id
  }

  for (const [name, spec] of Object.entries(containers)) {
    nodes[`container:${name}`] =
      spec.kind === 'array'
        ? { type: 'array', slots: spec.items.map((item) => ({ target: target(item) })) }
        : {
            type: 'object',
            entries: Object.entries(spec.entries).map(([key, item]) => ({
              key,
              slot: { target: target(item) },
            })),
          }
  }

  return {
    variables: Object.entries(variables).map(([name, value]) => ({
      name,
      slot: { target: target(value) },
    })),
    nodes,
  }
}
