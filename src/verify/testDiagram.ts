import {
  TARGET_HANDLE,
  VARIABLE_HANDLE,
  entryHandle,
  slotHandle,
  type MemFlowEdge,
  type MemFlowNode,
  type ScalarData,
} from '../canvas/types'

/** Small builder for canvas diagrams used by tests, with caller-chosen ids. */
export class Diagram {
  nodes: MemFlowNode[] = []
  edges: MemFlowEdge[] = []

  private place() {
    return { x: this.nodes.length * 10, y: this.nodes.length * 10 }
  }

  variable(id: string, name: string, target?: string): this {
    this.nodes.push({ id, type: 'variable', position: this.place(), data: { name } })
    if (target) this.link(id, VARIABLE_HANDLE, target)
    return this
  }

  scalar(id: string, text: string, kind: ScalarData['kind'] = 'auto'): this {
    this.nodes.push({ id, type: 'scalar', position: this.place(), data: { kind, text } })
    return this
  }

  /** `targets` may contain `null` for a slot with no outgoing reference. */
  array(id: string, targets: (string | null)[]): this {
    const slots = targets.map((_, index) => ({ id: `${id}-s${index}` }))
    this.nodes.push({ id, type: 'array', position: this.place(), data: { slots } })
    targets.forEach((target, index) => {
      if (target) this.link(id, slotHandle(slots[index].id), target)
    })
    return this
  }

  object(id: string, entries: Record<string, string | null>): this {
    const rows = Object.keys(entries).map((key, index) => ({ id: `${id}-e${index}`, key }))
    this.nodes.push({ id, type: 'object', position: this.place(), data: { entries: rows } })
    rows.forEach((row) => {
      const target = entries[row.key]
      if (target) this.link(id, entryHandle(row.id), target)
    })
    return this
  }

  pet(id: string, label: string): this {
    this.nodes.push({ id, type: 'pet', position: this.place(), data: { label } })
    return this
  }

  link(source: string, sourceHandle: string, target: string): this {
    this.edges.push({
      id: `${source}:${sourceHandle}->${target}`,
      source,
      sourceHandle,
      target,
      targetHandle: TARGET_HANDLE,
    })
    return this
  }
}
