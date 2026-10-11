import type { MemNode, MemoryGraph, NodeId } from '../model/types'
import {
  TARGET_HANDLE,
  VARIABLE_HANDLE,
  entryHandle,
  slotHandle,
  type MemFlowEdge,
  type MemFlowNode,
} from './types'

const COLUMN_WIDTH = 280
const ROW_GAP = 28
const TITLE_HEIGHT = 36
const ROW_HEIGHT = 34
const SIMPLE_HEIGHT = 48
const SCALAR_HEIGHT = TITLE_HEIGHT + ROW_HEIGHT

function heightOf(node: MemNode | undefined): number {
  if (!node) return SIMPLE_HEIGHT
  if (node.type === 'scalar' || node.type === 'instance') return SCALAR_HEIGHT
  const rows = node.type === 'array' ? node.slots.length : node.entries.length
  return TITLE_HEIGHT + Math.max(rows, 1) * ROW_HEIGHT
}

const targetsOf = (node: MemNode): (NodeId | null)[] => {
  if (node.type === 'array') return node.slots.map((slot) => slot.target)
  if (node.type === 'object') return node.entries.map((entry) => entry.slot.target)
  return []
}

/**
 * Lays an expected graph out as a read-only diagram: variables in the first
 * column and every other node in the column matching its distance from the
 * nearest variable, so references mostly run left to right. Nodes are visited
 * once, which also keeps cyclic graphs finite.
 */
export function toFlow(memory: MemoryGraph): { nodes: MemFlowNode[]; edges: MemFlowEdge[] } {
  const column = new Map<NodeId, number>()
  const order: NodeId[] = []
  const queue: NodeId[] = []

  const reach = (target: NodeId | null, depth: number) => {
    if (target === null || column.has(target) || !memory.nodes[target]) return
    column.set(target, depth)
    order.push(target)
    queue.push(target)
  }

  memory.variables.forEach((variable) => reach(variable.slot.target, 1))
  while (queue.length > 0) {
    const id = queue.shift()!
    const depth = column.get(id)!
    targetsOf(memory.nodes[id]).forEach((target) => reach(target, depth + 1))
  }

  const maxCol = Math.max(0, ...column.values())
  const finalCol = maxCol > 0 ? maxCol + 1 : 1
  for (const id of Object.keys(memory.nodes)) {
    if (!column.has(id)) {
      reach(id, finalCol)
      while (queue.length > 0) {
        const nextId = queue.shift()!
        const depth = column.get(nextId)!
        targetsOf(memory.nodes[nextId]).forEach((target) => reach(target, depth + 1))
      }
    }
  }

  const nextY = new Map<number, number>()
  const place = (col: number, height: number) => {
    const y = nextY.get(col) ?? 0
    nextY.set(col, y + height + ROW_GAP)
    return { x: col * COLUMN_WIDTH, y }
  }

  const nodes: MemFlowNode[] = []
  const edges: MemFlowEdge[] = []
  const link = (source: string, sourceHandle: string, target: NodeId | null) => {
    if (target === null || !memory.nodes[target]) return
    edges.push({
      id: `${source}:${sourceHandle}`,
      source,
      sourceHandle,
      target,
      targetHandle: TARGET_HANDLE,
    })
  }

  memory.variables.forEach((variable, index) => {
    const id = `variable:${index}`
    nodes.push({
      id,
      type: 'variable',
      position: place(0, SIMPLE_HEIGHT),
      data: { name: variable.name },
    })
    link(id, VARIABLE_HANDLE, variable.slot.target)
  })

  for (const id of order) {
    const node = memory.nodes[id]
    const position = place(column.get(id)!, heightOf(node))
    if (node.type === 'scalar') {
      const text = node.kind === 'null' ? '' : node.value
      nodes.push({ id, type: 'scalar', position, data: { kind: node.kind, text } })
    } else if (node.type === 'array') {
      const slots = node.slots.map((_, index) => ({ id: `${id}:s${index}` }))
      nodes.push({ id, type: 'array', position, data: { slots } })
      node.slots.forEach((slot, index) => link(id, slotHandle(slots[index].id), slot.target))
    } else if (node.type === 'instance') {
      nodes.push({ id, type: 'pet', position, data: { label: node.label } })
    } else {
      const entries = node.entries.map((entry, index) => ({ id: `${id}:e${index}`, key: entry.key }))
      nodes.push({ id, type: 'object', position, data: { entries } })
      node.entries.forEach((entry, index) => link(id, entryHandle(entries[index].id), entry.slot.target))
    }
  }

  return { nodes, edges }
}
