import type { Connection, HandleType } from '@xyflow/react'
import { isValidConnection } from './connections'
import { TARGET_HANDLE, type MemFlowNode } from './types'

/** The handle tapped first in a tap-to-connect gesture, as React Flow records it. */
export interface PendingHandle {
  nodeId: string | null
  id?: string | null
  type: HandleType
}

/**
 * The reference made by tapping the body of `targetNodeId` after tapping
 * `pending`, or null when that tap cannot finish a reference. Only a reference
 * started from an outgoing handle can finish on a node body, since a node has
 * a single incoming handle but may have many outgoing ones.
 */
export function tapConnection(
  pending: PendingHandle,
  targetNodeId: string,
  nodes: MemFlowNode[],
): Connection | null {
  if (pending.type !== 'source' || !pending.nodeId) return null
  const connection = {
    source: pending.nodeId,
    sourceHandle: pending.id ?? null,
    target: targetNodeId,
    targetHandle: TARGET_HANDLE,
  }
  return isValidConnection(connection, nodes) ? connection : null
}

/** How a drag from a handle ended, as React Flow reports it. */
export interface DragEnd {
  isValid: boolean | null
  fromHandle: PendingHandle | null
}

/**
 * The reference made by dropping a drag on the body of `targetNodeId`, or null
 * when React Flow already made one (the drop was near a handle) or the drop
 * cannot finish one. Dropping back on the starting block is ignored, so a
 * short wobble off a handle does not make a self-reference.
 */
export function dropConnection(
  end: DragEnd,
  targetNodeId: string | null,
  nodes: MemFlowNode[],
): Connection | null {
  if (end.isValid || !end.fromHandle || !targetNodeId) return null
  if (targetNodeId === end.fromHandle.nodeId) return null
  return tapConnection(end.fromHandle, targetNodeId, nodes)
}
