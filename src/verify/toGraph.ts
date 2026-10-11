import {
  VARIABLE_HANDLE,
  entryHandle,
  slotHandle,
  type MemFlowEdge,
  type MemFlowNode,
} from '../canvas/types'
import { scalarFromData } from '../canvas/scalarData'
import { stripSurroundingQuotes } from '../model/scalar'
import type { Language, MemNode, MemoryGraph, Slot, VariableEntry } from '../model/types'

/**
 * Extracts the topology of the learner's diagram. Layout, node selection and
 * every other presentation detail is dropped on purpose. `language` decides how
 * typed keywords such as `None` or `null` are read.
 */
export function toGraph(nodes: MemFlowNode[], edges: MemFlowEdge[], language: Language): MemoryGraph {
  const nodeIds = new Set(nodes.map((node) => node.id))
  const targetBySource = new Map<string, string>()
  for (const edge of edges) {
    if (edge.sourceHandle && nodeIds.has(edge.target)) {
      targetBySource.set(`${edge.source}|${edge.sourceHandle}`, edge.target)
    }
  }

  const slotFor = (nodeId: string, handle: string): Slot => ({
    target: targetBySource.get(`${nodeId}|${handle}`) ?? null,
    handle,
  })

  const variables: VariableEntry[] = []
  const memory: Record<string, MemNode> = {}

  for (const node of nodes) {
    switch (node.type) {
      case 'variable':
        variables.push({
          name: stripSurroundingQuotes(node.data.name),
          nodeId: node.id,
          slot: slotFor(node.id, VARIABLE_HANDLE),
        })
        break
      case 'scalar':
        memory[node.id] = scalarFromData(node.data, language)
        break
      case 'array':
        memory[node.id] = {
          type: 'array',
          slots: node.data.slots.map((slot) => slotFor(node.id, slotHandle(slot.id))),
        }
        break
      case 'object':
        memory[node.id] = {
          type: 'object',
          entries: node.data.entries.map((entry) => ({
            key: entry.key.trim(),
            slot: slotFor(node.id, entryHandle(entry.id)),
          })),
        }
        break
      case 'pet':
        memory[node.id] = {
          type: 'instance',
          className: 'Pet',
          label: stripSurroundingQuotes(node.data.label),
        }
        break
    }
  }

  return { variables, nodes: memory }
}
