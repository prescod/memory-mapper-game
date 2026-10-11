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
  | { kind: 'pet'; label: string }
  | { kind: 'scalar'; value: number | string | boolean | null }

export const ref = (id: string): Ref => ({ ref: id })
export const list = (...items: Value[]): ContainerSpec => ({ kind: 'array', items })
export const dict = (entries: Record<string, Value>): ContainerSpec => ({ kind: 'object', entries })
/** An opaque `Pet` instance named `label` (e.g. a pet's name), for the identity level. */
export const pet = (label: string): ContainerSpec => ({ kind: 'pet', label })
export const scalar = (value: number | string | boolean | null): ContainerSpec => ({ kind: 'scalar', value })

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
    if (spec.kind === 'pet') {
      nodes[`container:${name}`] = { type: 'instance', className: 'Pet', label: spec.label }
    } else if (spec.kind === 'scalar') {
      nodes[`container:${name}`] = scalarFromJs(spec.value)
    } else if (spec.kind === 'array') {
      nodes[`container:${name}`] = {
        type: 'array',
        slots: spec.items.map((item) => ({ target: target(item) })),
      }
    } else {
      nodes[`container:${name}`] = {
        type: 'object',
        entries: Object.entries(spec.entries).map(([key, item]) => ({
          key,
          slot: { target: target(item) },
        })),
      }
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

export function withGarbage(
  base: MemoryGraph,
  ...values: (number | string | boolean | null)[]
): MemoryGraph {
  const nodes = { ...base.nodes }
  let index = 0
  for (const value of values) {
    while (`garbage:${index}` in nodes) index++
    nodes[`garbage:${index}`] = scalarFromJs(value)
  }
  return { ...base, nodes }
}
