import type { Connection } from '@xyflow/react'
import type { MemFlowEdge, MemFlowNode } from './types'
import { TARGET_HANDLE } from './types'

type ConnectionLike = Pick<Connection, 'source' | 'target' | 'sourceHandle' | 'targetHandle'>

/**
 * A reference may start from a Variable, an Array slot or an Object entry, and
 * must end on a Variable, Scalar, Array, Object or Pet. Pets and Scalars never
 * originate references: a Pet shows nothing of its insides. Containers may
 * point at themselves: `a.append(a)` is legal and produces a cycle.
 */
export function isValidConnection(connection: ConnectionLike, nodes: MemFlowNode[]): boolean {
  const source = nodes.find((node) => node.id === connection.source)
  const target = nodes.find((node) => node.id === connection.target)
  if (!source || !target) return false

  if (source.type === 'scalar' || source.type === 'pet') return false
  if (!connection.sourceHandle || connection.sourceHandle === TARGET_HANDLE) return false
  if (connection.targetHandle !== TARGET_HANDLE) return false

  return true
}

/**
 * Adds the connection as an edge. Every source handle holds exactly one
 * reference, so any edge already leaving that handle is replaced.
 */
export function connectReplacing(
  edges: MemFlowEdge[],
  connection: ConnectionLike,
  edgeId: string,
): MemFlowEdge[] {
  const remaining = edges.filter(
    (edge) =>
      !(edge.source === connection.source && edge.sourceHandle === connection.sourceHandle),
  )
  return [
    ...remaining,
    {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    },
  ]
}

/** Drops the reference leaving one handle, used when a slot or entry is removed. */
export function removeEdgesFromHandle(
  edges: MemFlowEdge[],
  nodeId: string,
  handleId: string,
): MemFlowEdge[] {
  return edges.filter((edge) => !(edge.source === nodeId && edge.sourceHandle === handleId))
}
