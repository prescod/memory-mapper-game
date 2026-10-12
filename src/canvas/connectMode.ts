export interface ActiveSourceHandle {
  nodeId: string
  sourceHandle: string
}

type ConnectHandleRef = {
  nodeId: string
  id?: string | null
  type: string
}

type ConnectionLike = {
  inProgress: boolean
  fromHandle: ConnectHandleRef | null
}

/** Source handle currently highlighted (tap-waiting or drag-connect). */
export function activeStrobingSource(
  connectionClickStartHandle: ConnectHandleRef | null,
  connection: ConnectionLike,
): ActiveSourceHandle | null {
  if (connectionClickStartHandle) {
    return {
      nodeId: connectionClickStartHandle.nodeId,
      sourceHandle: connectionClickStartHandle.id ?? '',
    }
  }
  const from = connection.fromHandle
  if (connection.inProgress && from?.type === 'source') {
    return {
      nodeId: from.nodeId,
      sourceHandle: from.id ?? '',
    }
  }
  return null
}

/** Resets React Flow connection state when canceling tap- or drag-connect. */
export const idleConnectionState = {
  inProgress: false as const,
  isValid: null,
  from: null,
  fromHandle: null,
  fromPosition: null,
  fromNode: null,
  to: null,
  toHandle: null,
  toPosition: null,
  toNode: null,
  pointer: null,
}
