import {
  entryHandle,
  newId,
  slotHandle,
  type MemFlowEdge,
  type MemFlowNode,
} from './types'

export interface DuplicateOffset {
  x: number
  y: number
}

export interface DuplicateResult {
  nodes: MemFlowNode[]
  edges: MemFlowEdge[]
  clonedNodes: MemFlowNode[]
  clonedEdges: MemFlowEdge[]
}

const DEFAULT_OFFSET: DuplicateOffset = { x: 30, y: 30 }

/**
 * Duplicates all currently selected nodes and any outgoing edges from them.
 *
 * Array slots and Object entries receive fresh internal identifiers with their
 * corresponding source handles remapped. References between duplicated nodes
 * point to the new copies; references pointing to nodes outside the selection
 * remain as aliases to the original targets.
 */
export function duplicateElements(
  nodes: MemFlowNode[],
  edges: MemFlowEdge[],
  offset: DuplicateOffset = DEFAULT_OFFSET,
): DuplicateResult {
  const selectedNodes = nodes.filter((node) => node.selected)
  if (selectedNodes.length === 0) {
    return {
      nodes,
      edges,
      clonedNodes: [],
      clonedEdges: [],
    }
  }

  const nodeIdMap = new Map<string, string>()
  const handleMap = new Map<string, string>()

  const clonedNodes: MemFlowNode[] = selectedNodes.map((node) => {
    const nextId = newId()
    nodeIdMap.set(node.id, nextId)

    let nextData = node.data
    switch (node.type) {
      case 'array': {
        const slots = node.data.slots.map((slot) => {
          const nextSlotId = newId()
          handleMap.set(slotHandle(slot.id), slotHandle(nextSlotId))
          return { id: nextSlotId }
        })
        nextData = { slots }
        break
      }
      case 'object': {
        const entries = node.data.entries.map((entry) => {
          const nextEntryId = newId()
          handleMap.set(entryHandle(entry.id), entryHandle(nextEntryId))
          return { id: nextEntryId, key: entry.key }
        })
        nextData = { entries }
        break
      }
      case 'variable':
        nextData = { name: node.data.name }
        break
      case 'scalar':
        nextData = { kind: node.data.kind, text: node.data.text }
        break
      case 'pet':
        nextData = { label: node.data.label }
        break
    }

    return {
      ...node,
      id: nextId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      data: nextData,
      selected: true,
    } as MemFlowNode
  })

  const clonedEdges: MemFlowEdge[] = edges
    .filter((edge) => nodeIdMap.has(edge.source))
    .map((edge) => {
      const remappedSource = nodeIdMap.get(edge.source)!
      const remappedTarget = nodeIdMap.get(edge.target) ?? edge.target
      const remappedSourceHandle = edge.sourceHandle
        ? (handleMap.get(edge.sourceHandle) ?? edge.sourceHandle)
        : undefined

      const edgeData = edge.data?.bend
        ? {
            ...edge.data,
            bend: {
              x: edge.data.bend.x + offset.x,
              y: edge.data.bend.y + offset.y,
            },
          }
        : edge.data

      return {
        ...edge,
        id: newId(),
        source: remappedSource,
        target: remappedTarget,
        sourceHandle: remappedSourceHandle,
        data: edgeData,
        selected: true,
      }
    })

  const nextNodes = nodes.map((node) => (node.selected ? { ...node, selected: false } : node))
  const nextEdges = edges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge))

  return {
    nodes: [...nextNodes, ...clonedNodes],
    edges: [...nextEdges, ...clonedEdges],
    clonedNodes,
    clonedEdges,
  }
}
