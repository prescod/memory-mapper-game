import type { MemNode } from '../model/types'
import type { MemFlowNode } from './types'

const TITLE_HEIGHT = 36
const ROW_HEIGHT = 34
const SIMPLE_HEIGHT = 48
const SCALAR_HEIGHT = TITLE_HEIGHT + ROW_HEIGHT

export const FLOW_NODE_WIDTH = 140
export const FLOW_ARRAY_WIDTH = 160
export const FLOW_OBJECT_WIDTH = 170

/** Minimum empty space between node bounding boxes after layout. */
export const FLOW_NODE_GAP = 28

export interface FlowNodeBox {
  x: number
  y: number
  width: number
  height: number
}

export function memNodeSize(node: MemNode | undefined): { width: number; height: number } {
  if (!node) return { width: FLOW_NODE_WIDTH, height: SIMPLE_HEIGHT }
  if (node.type === 'scalar' || node.type === 'instance') {
    return { width: FLOW_NODE_WIDTH, height: SCALAR_HEIGHT }
  }
  if (node.type === 'object') {
    const rows = node.entries.length
    return { width: FLOW_OBJECT_WIDTH, height: TITLE_HEIGHT + Math.max(rows, 1) * ROW_HEIGHT }
  }
  if (node.type === 'array') {
    const rows = node.slots.length
    return { width: FLOW_ARRAY_WIDTH, height: TITLE_HEIGHT + Math.max(rows, 1) * ROW_HEIGHT }
  }
  return { width: FLOW_NODE_WIDTH, height: SIMPLE_HEIGHT }
}

export function flowNodeSize(node: MemFlowNode): { width: number; height: number } {
  switch (node.type) {
    case 'variable':
    case 'pet':
      return { width: FLOW_NODE_WIDTH, height: SIMPLE_HEIGHT }
    case 'scalar':
      return { width: FLOW_NODE_WIDTH, height: SCALAR_HEIGHT }
    case 'array': {
      const rows = node.data.slots.length
      return { width: FLOW_ARRAY_WIDTH, height: TITLE_HEIGHT + Math.max(rows, 1) * ROW_HEIGHT }
    }
    case 'object': {
      const rows = node.data.entries.length
      return { width: FLOW_OBJECT_WIDTH, height: TITLE_HEIGHT + Math.max(rows, 1) * ROW_HEIGHT }
    }
  }
}

export function flowNodeBox(node: MemFlowNode): FlowNodeBox {
  const { width, height } = flowNodeSize(node)
  return { x: node.position.x, y: node.position.y, width, height }
}

const separatedOnAxis = (aMin: number, aMax: number, bMin: number, bMax: number, gap: number) =>
  aMax + gap <= bMin || bMax + gap <= aMin

/** True when the two boxes intersect or are closer than `gap` on either axis. */
export function flowNodeBoxesOverlap(a: FlowNodeBox, b: FlowNodeBox, gap = FLOW_NODE_GAP): boolean {
  return (
    !separatedOnAxis(a.x, a.x + a.width, b.x, b.x + b.width, gap) &&
    !separatedOnAxis(a.y, a.y + a.height, b.y, b.y + b.height, gap)
  )
}

export function flowNodesOverlap(a: MemFlowNode, b: MemFlowNode, gap = FLOW_NODE_GAP): boolean {
  return flowNodeBoxesOverlap(flowNodeBox(a), flowNodeBox(b), gap)
}

export function findOverlappingFlowNodePairs(
  nodes: MemFlowNode[],
  gap = FLOW_NODE_GAP,
): [MemFlowNode, MemFlowNode][] {
  const pairs: [MemFlowNode, MemFlowNode][] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (flowNodesOverlap(nodes[i], nodes[j], gap)) {
        pairs.push([nodes[i], nodes[j]])
      }
    }
  }
  return pairs
}

/**
 * Nudge node positions so no bounding boxes violate {@link FLOW_NODE_GAP}.
 * Only moves nodes right or down so edge routing order stays stable.
 */
export function separateFlowNodes(nodes: MemFlowNode[], maxPasses = 64): void {
  if (nodes.length === 0) return

  const size = (node: MemFlowNode) => flowNodeSize(node)

  for (let pass = 0; pass < maxPasses; pass++) {
    const byY = new Map<number, MemFlowNode[]>()
    for (const node of nodes) {
      const row = byY.get(node.position.y) ?? []
      row.push(node)
      byY.set(node.position.y, row)
    }
    for (const row of byY.values()) {
      row.sort((a, b) => a.position.x - b.position.x)
      let curX = 0
      for (const node of row) {
        const { width } = size(node)
        node.position.x = Math.max(node.position.x, curX)
        curX = node.position.x + width + FLOW_NODE_GAP
      }
    }

    let moved = false
    const ordered = [...nodes].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const upper = ordered[i]
        const lower = ordered[j]
        if (!flowNodesOverlap(upper, lower, FLOW_NODE_GAP)) continue

        if (upper.position.y === lower.position.y) {
          const left = upper.position.x <= lower.position.x ? upper : lower
          const right = left === upper ? lower : upper
          const { width } = size(left)
          const nextX = left.position.x + width + FLOW_NODE_GAP
          if (right.position.x < nextX) {
            right.position.x = nextX
            moved = true
          }
        } else {
          const { height } = size(upper)
          const nextY = upper.position.y + height + FLOW_NODE_GAP
          if (lower.position.y < nextY) {
            lower.position.y = nextY
            moved = true
          }
        }
      }
    }

    if (!moved && findOverlappingFlowNodePairs(nodes, FLOW_NODE_GAP).length === 0) return
  }
}
