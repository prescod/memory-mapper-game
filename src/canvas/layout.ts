import type { MemNode, MemoryGraph, NodeId } from '../model/types'
import {
  TARGET_HANDLE,
  VARIABLE_HANDLE,
  entryHandle,
  slotHandle,
  type MemFlowEdge,
  type MemFlowNode,
} from './types'

const TITLE_HEIGHT = 36
const ROW_HEIGHT = 34
const SIMPLE_HEIGHT = 48
const SCALAR_HEIGHT = TITLE_HEIGHT + ROW_HEIGHT

const NODE_WIDTH = 140
const ARRAY_WIDTH = 160
const OBJECT_WIDTH = 170
const COL_GAP = 28
const LAYER_GAP = 60

function heightOf(node: MemNode | undefined): number {
  if (!node) return SIMPLE_HEIGHT
  if (node.type === 'scalar' || node.type === 'instance') return SCALAR_HEIGHT
  const rows = node.type === 'array' ? node.slots.length : node.entries.length
  return TITLE_HEIGHT + Math.max(rows, 1) * ROW_HEIGHT
}

function widthOf(node: MemNode | undefined): number {
  if (!node) return NODE_WIDTH
  if (node.type === 'object') return OBJECT_WIDTH
  if (node.type === 'array') return ARRAY_WIDTH
  return NODE_WIDTH
}

const targetsOf = (node: MemNode): (NodeId | null)[] => {
  if (node.type === 'array') return node.slots.map((slot) => slot.target)
  if (node.type === 'object') return node.entries.map((entry) => entry.slot.target)
  return []
}

/**
 * Lays an expected graph out as a read-only diagram: variables in the top row
 * and every other node in rows below matching its distance from the nearest
 * variable or containing container, so references run from top to bottom.
 */
export function toFlow(memory: MemoryGraph): { nodes: MemFlowNode[]; edges: MemFlowEdge[] } {
  const cycleEdges = new Set<string>()
  const visited = new Set<NodeId>()
  const inStack = new Set<NodeId>()

  const findCycles = (id: NodeId) => {
    visited.add(id)
    inStack.add(id)
    const node = memory.nodes[id]
    if (node) {
      for (const target of targetsOf(node)) {
        if (!target || !memory.nodes[target]) continue
        if (inStack.has(target)) {
          cycleEdges.add(`${id}->${target}`)
        } else if (!visited.has(target)) {
          findCycles(target)
        }
      }
    }
    inStack.delete(id)
  }

  memory.variables.forEach((variable) => {
    const target = variable.slot.target
    if (target && memory.nodes[target] && !visited.has(target)) {
      findCycles(target)
    }
  })
  for (const id of Object.keys(memory.nodes)) {
    if (!visited.has(id)) {
      findCycles(id)
    }
  }

  const layer = new Map<NodeId, number>()
  const queue: NodeId[] = []
  const initialOrder: NodeId[] = []

  memory.variables.forEach((variable) => {
    const target = variable.slot.target
    if (target && memory.nodes[target]) {
      if (!layer.has(target)) {
        layer.set(target, 1)
        queue.push(target)
        initialOrder.push(target)
      }
    }
  })

  while (queue.length > 0) {
    const id = queue.shift()!
    const depth = layer.get(id)!
    const node = memory.nodes[id]
    if (!node) continue
    for (const target of targetsOf(node)) {
      if (!target || !memory.nodes[target]) continue
      if (!initialOrder.includes(target)) initialOrder.push(target)
      if (cycleEdges.has(`${id}->${target}`)) continue
      const nextDepth = depth + 1
      if (!layer.has(target) || layer.get(target)! < nextDepth) {
        layer.set(target, nextDepth)
        queue.push(target)
      }
    }
  }

  const maxReachable = Math.max(0, ...layer.values())
  const garbageStartLayer = maxReachable > 0 ? maxReachable + 1 : 1
  for (const id of Object.keys(memory.nodes)) {
    if (!layer.has(id)) {
      layer.set(id, garbageStartLayer)
      if (!initialOrder.includes(id)) initialOrder.push(id)
      const q: NodeId[] = [id]
      while (q.length > 0) {
        const nextId = q.shift()!
        const depth = layer.get(nextId)!
        const node = memory.nodes[nextId]
        if (!node) continue
        for (const target of targetsOf(node)) {
          if (!target || !memory.nodes[target]) continue
          if (!initialOrder.includes(target)) initialOrder.push(target)
          if (cycleEdges.has(`${nextId}->${target}`)) continue
          const nextDepth = depth + 1
          if (!layer.has(target) || layer.get(target)! < nextDepth) {
            layer.set(target, nextDepth)
            q.push(target)
          }
        }
      }
    }
  }

  const layerHeights = new Map<number, number>()
  layerHeights.set(0, SIMPLE_HEIGHT)
  for (const id of Object.keys(memory.nodes)) {
    const l = layer.get(id)!
    const h = heightOf(memory.nodes[id])
    layerHeights.set(l, Math.max(layerHeights.get(l) ?? 0, h))
  }

  const layerY = new Map<number, number>()
  let curY = 0
  const maxLayer = Math.max(0, ...layer.values())
  for (let l = 0; l <= maxLayer; l++) {
    layerY.set(l, curY)
    const h = layerHeights.get(l) ?? SIMPLE_HEIGHT
    curY += h + LAYER_GAP
  }

  // Position variables along top (Layer 0)
  const variablePositions: { x: number; y: number }[] = []
  let varCurX = 0
  memory.variables.forEach(() => {
    variablePositions.push({ x: varCurX, y: 0 })
    varCurX += NODE_WIDTH + COL_GAP
  })

  // Position memory nodes layer by layer
  const nodePositions = new Map<NodeId, { x: number; y: number }>()

  for (let l = 1; l <= maxLayer; l++) {
    const inLayer = Object.keys(memory.nodes).filter((id) => layer.get(id) === l)
    const desiredCenterX = new Map<NodeId, number>()

    for (const id of inLayer) {
      const varCenters: number[] = []
      memory.variables.forEach((variable, idx) => {
        if (variable.slot.target === id) {
          const varPos = variablePositions[idx]
          varCenters.push(varPos.x + NODE_WIDTH / 2)
        }
      })

      if (varCenters.length > 0) {
        desiredCenterX.set(id, varCenters.reduce((sum, val) => sum + val, 0) / varCenters.length)
      } else {
        const parentCenters: number[] = []
        for (const predId of Object.keys(memory.nodes)) {
          const predLayer = layer.get(predId) ?? 0
          if (predLayer < l && nodePositions.has(predId)) {
            const predNode = memory.nodes[predId]
            if (predNode) {
              const predPos = nodePositions.get(predId)!
              const predWidth = widthOf(predNode)
              const targets = targetsOf(predNode)
              const targetIndices = targets
                .map((t, idx) => (t === id ? idx : -1))
                .filter((idx) => idx !== -1)

              if (targetIndices.length > 0) {
                const totalSlots = targets.length
                for (const idx of targetIndices) {
                  const offset = totalSlots > 1 ? ((idx - (totalSlots - 1) / 2) / totalSlots) * predWidth : 0
                  parentCenters.push(predPos.x + predWidth / 2 + offset)
                }
              }
            }
          }
        }

        if (parentCenters.length > 0) {
          const avg = parentCenters.reduce((sum, val) => sum + val, 0) / parentCenters.length
          desiredCenterX.set(id, avg)
        }
      }
    }

    inLayer.sort((a, b) => {
      const ca = desiredCenterX.get(a)
      const cb = desiredCenterX.get(b)
      if (ca !== undefined && cb !== undefined && ca !== cb) return ca - cb
      if (ca !== undefined) return -1
      if (cb !== undefined) return 1
      return initialOrder.indexOf(a) - initialOrder.indexOf(b)
    })

    let curX = 0
    for (const id of inLayer) {
      const w = widthOf(memory.nodes[id])
      const idealCenter = desiredCenterX.get(id) ?? (curX + w / 2)
      const idealLeft = idealCenter - w / 2
      const leftX = Math.max(curX, idealLeft)
      nodePositions.set(id, { x: leftX, y: layerY.get(l)! })
      curX = leftX + w + COL_GAP
    }
  }

  // Bottom-up pass to center parents over their children when possible
  for (let l = maxLayer - 1; l >= 1; l--) {
    const inLayer = Object.keys(memory.nodes).filter((id) => layer.get(id) === l)
    for (const id of inLayer) {
      const node = memory.nodes[id]
      if (!node) continue
      const children = targetsOf(node).filter(
        (t): t is NodeId =>
          Boolean(
            t &&
              memory.nodes[t] &&
              layer.get(t) === l + 1 &&
              nodePositions.has(t) &&
              !memory.variables.some((v) => v.slot.target === t),
          ),
      )
      if (children.length > 0) {
        const childXs = children.map((c) => nodePositions.get(c)!.x)
        const childMaxXs = children.map((c) => nodePositions.get(c)!.x + widthOf(memory.nodes[c]))
        const minChildX = Math.min(...childXs)
        const maxChildX = Math.max(...childMaxXs)
        const childrenCenter = (minChildX + maxChildX) / 2
        const idealLeft = childrenCenter - widthOf(node) / 2
        const currentPos = nodePositions.get(id)!
        if (idealLeft > currentPos.x) {
          nodePositions.set(id, { x: idealLeft, y: currentPos.y })
        }
      }
    }
  }

  // Center variables over their targets if they have one
  memory.variables.forEach((variable, idx) => {
    const target = variable.slot.target
    if (target && nodePositions.has(target)) {
      const targetPos = nodePositions.get(target)!
      const targetCenter = targetPos.x + widthOf(memory.nodes[target]) / 2
      const idealLeft = targetCenter - NODE_WIDTH / 2
      const currentPos = variablePositions[idx]
      const prevX = idx > 0 ? variablePositions[idx - 1].x + NODE_WIDTH + COL_GAP : 0
      variablePositions[idx] = { x: Math.max(prevX, idealLeft, currentPos.x), y: 0 }
    }
  })

  // Normalize so leftmost element is at x = 0
  const allX = [
    ...variablePositions.map((p) => p.x),
    ...Array.from(nodePositions.values()).map((p) => p.x),
  ]
  const minX = allX.length > 0 ? Math.min(...allX) : 0
  if (minX !== 0) {
    for (const pos of variablePositions) pos.x -= minX
    for (const pos of nodePositions.values()) pos.x -= minX
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
      position: variablePositions[index],
      data: { name: variable.name },
    })
    link(id, VARIABLE_HANDLE, variable.slot.target)
  })

  // Order nodes by Y, then X for predictable DOM ordering
  const order = Object.keys(memory.nodes).sort((a, b) => {
    const posA = nodePositions.get(a) ?? { x: 0, y: 0 }
    const posB = nodePositions.get(b) ?? { x: 0, y: 0 }
    if (posA.y !== posB.y) return posA.y - posB.y
    return posA.x - posB.x
  })

  for (const id of order) {
    const node = memory.nodes[id]
    const position = nodePositions.get(id) ?? { x: 0, y: 0 }
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
