import type { HandleType } from '@xyflow/react'
import { getHostForElement, XYHandle } from '@xyflow/system'

type FlowStore = {
  getState: () => Record<string, unknown>
  setState: (partial: Record<string, unknown>) => void
}

export function findHandleElement(nodeId: string, handleId: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(
    `.react-flow__handle[data-nodeid="${CSS.escape(nodeId)}"]`,
  )
  for (const element of candidates) {
    const id = element.getAttribute('data-handleid') ?? ''
    if (id === handleId) return element
  }
  return null
}

export function handleHitPointerDown(
  nativeEvent: PointerEvent,
  nodeId: string,
  handleId: string,
  handleType: HandleType,
  store: FlowStore,
) {
  if (handleType !== 'source') return
  if (nativeEvent.pointerType === 'mouse' && nativeEvent.button !== 0) return

  const handleDomNode = findHandleElement(nodeId, handleId)
  if (!handleDomNode) return

  const state = store.getState()
  // Cast store slices to XYHandle params; internal node lookup is wider than our MemFlowNode type.
  XYHandle.onPointerDown(nativeEvent, {
    handleDomNode,
    autoPanOnConnect: state.autoPanOnConnect,
    connectionMode: state.connectionMode,
    connectionRadius: state.connectionRadius,
    domNode: state.domNode,
    nodeLookup: state.nodeLookup,
    lib: state.lib,
    isTarget: false,
    handleId: handleId || null,
    nodeId,
    flowId: state.rfId,
    panBy: state.panBy,
    cancelConnection: state.cancelConnection,
    onConnectStart: state.onConnectStart,
    onConnectEnd: state.onConnectEnd,
    updateConnection: state.updateConnection,
    onConnect: (connection) => (state.onConnect as ((c: unknown) => void) | undefined)?.(connection),
    isValidConnection:
      (state.isValidConnection as ((c: unknown) => boolean) | undefined) ?? (() => true),
    // Read live state: the connection starts and the view may auto-pan after pointerdown.
    getTransform: () => store.getState().transform as [number, number, number],
    getFromHandle: () => (store.getState().connection as { fromHandle: unknown }).fromHandle,
    autoPanSpeed: state.autoPanSpeed,
    dragThreshold: state.connectionDragThreshold,
  } as Parameters<typeof XYHandle.onPointerDown>[1])
}

export function handleHitClick(
  nativeEvent: MouseEvent,
  nodeId: string,
  handleId: string,
  handleType: HandleType,
  store: FlowStore,
) {
  const state = store.getState()
  const pending = state.connectionClickStartHandle as {
    nodeId: string
    type: HandleType
    id: string | null
  } | null
  const canStart = handleType === 'source'

  if (!pending && !canStart) return

  if (!pending) {
    ;(state.onClickConnectStart as ((e: MouseEvent, p: unknown) => void) | undefined)?.(
      nativeEvent,
      { nodeId, handleId: handleId || null, handleType },
    )
    store.setState({
      connectionClickStartHandle: { nodeId, type: handleType, id: handleId || null },
    })
    return
  }

  const doc = getHostForElement(nativeEvent.target as Element)
  const { connection, isValid } = XYHandle.isValid(nativeEvent, {
    handle: { nodeId, id: handleId || null, type: handleType },
    connectionMode: state.connectionMode,
    fromNodeId: pending.nodeId,
    fromHandleId: pending.id || null,
    fromType: pending.type,
    isValidConnection:
      (state.isValidConnection as ((c: unknown) => boolean) | undefined) ?? (() => true),
    flowId: state.rfId,
    doc,
    lib: state.lib,
    nodeLookup: state.nodeLookup,
  } as Parameters<typeof XYHandle.isValid>[1])

  if (isValid && connection) {
    ;(state.onConnect as ((c: unknown) => void) | undefined)?.(connection)
  }

  const connectionClone = structuredClone(state.connection) as {
    inProgress?: boolean
    toPosition: unknown
    toHandle: { position: unknown } | null
  }
  delete connectionClone.inProgress
  connectionClone.toPosition = connectionClone.toHandle
    ? connectionClone.toHandle.position
    : null
  ;(state.onClickConnectEnd as ((e: MouseEvent, s: unknown) => void) | undefined)?.(
    nativeEvent,
    connectionClone,
  )
  store.setState({ connectionClickStartHandle: null })
}
