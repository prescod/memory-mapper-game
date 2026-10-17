import {
  Background,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  useStore,
  useStoreApi,
  type Connection,
  type Edge,
  type NodeMouseHandler,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from 'react'
import { activeStrobingSource, idleConnectionState } from './connectMode'
import { connectReplacing, isValidConnection, removeEdgesFromHandle } from './connections'
import { duplicateElements } from './duplicate'
import { FeedbackContext, handleKey, type Feedback } from './FeedbackContext'
import { LanguageContext } from './LanguageContext'
import { CompactContext, ReadOnlyContext } from './ReadOnlyContext'
import {
  createNode,
  newId,
  type MemFlowEdge,
  type MemFlowNode,
  type MemNodeType,
} from './types'
import type { Language } from '../model/types'
import { edgeTypes } from './edges'
import { nodeTypes } from './nodes'
import { defaultPositionForType, freePosition } from './placement'
import { HandleHitLayer } from './HandleHitLayer'
import { HandleVisualLayer } from './HandleVisualLayer'
import { tapConnection } from './tapConnect'
import { DRAG_MIME, Toolbar } from './Toolbar'
import { useCoarsePointer } from './useCoarsePointer'

/** Invisible stroke width for selecting arrows; visible stroke stays thin. */
const EDGE_HIT_WIDTH_MOUSE = 22
const EDGE_HIT_WIDTH_TOUCH = 34

export interface CanvasProps {
  nodes: MemFlowNode[]
  edges: MemFlowEdge[]
  onNodesChange: OnNodesChange<MemFlowNode>
  onEdgesChange: OnEdgesChange<MemFlowEdge>
  setNodes: Dispatch<SetStateAction<MemFlowNode[]>>
  setEdges: Dispatch<SetStateAction<MemFlowEdge[]>>
  feedback: Feedback
  language: Language
  /** Shows the diagram as a fixed picture: no toolbar, connecting, editing or deleting. */
  readOnly?: boolean
  /** Compact diagram embedded in scrollable text: allows page scrolling without hijacking mouse wheel. */
  compact?: boolean
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

function DuplicateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input, textarea, select') !== null)
  )
}

function MultiSelectIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function CanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  feedback,
  language,
  readOnly = false,
  compact = false,
}: CanvasProps) {
  const isReadOnly = readOnly || compact
  const coarsePointer = useCoarsePointer()
  const edgeHitWidth = coarsePointer ? EDGE_HIT_WIDTH_TOUCH : EDGE_HIT_WIDTH_MOUSE
  const defaultEdgeOptions = useMemo(
    () => ({
      markerEnd: { type: MarkerType.ArrowClosed },
      interactionWidth: edgeHitWidth,
    }),
    [edgeHitWidth],
  )
  const wrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView, deleteElements } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const nodesMeasured = useNodesInitialized()
  const store = useStoreApi<MemFlowNode, MemFlowEdge>()
  const pending = useStore((state) => state.connectionClickStartHandle)
  const strobingSource = useStore((state) =>
    activeStrobingSource(state.connectionClickStartHandle, state.connection),
  )

  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const touchTimer = useRef<number | null>(null)
  const didLongPress = useRef(false)

  const cancelConnection = useCallback(() => {
    store.setState({
      connectionClickStartHandle: null,
      connection: { ...idleConnectionState },
    })
  }, [store])

  const triggerLongPress = useCallback(
    (nodeId: string) => {
      cancelConnection()
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(25)
        } catch {
          // Ignore unsupported environments
        }
      }
      setMultiSelectMode(true)
      setNodes((current) =>
        current.map((n) => (n.id === nodeId ? { ...n, selected: true } : n)),
      )
      didLongPress.current = true
    },
    [cancelConnection, setNodes],
  )

  const clearTouchTimer = useCallback(() => {
    if (touchTimer.current !== null) {
      window.clearTimeout(touchTimer.current)
      touchTimer.current = null
    }
    touchStartPos.current = null
  }, [])

  const onCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType !== 'touch') return
      // Pressing and holding in a text field places the cursor; it is not a request for multi-select.
      if (isTextField(event.target)) return
      const targetNodeEl = (event.target as HTMLElement).closest('.react-flow__node')
      const nodeId = targetNodeEl?.getAttribute('data-id')
      if (!nodeId) return

      clearTouchTimer()
      touchStartPos.current = { x: event.clientX, y: event.clientY }
      touchTimer.current = window.setTimeout(() => {
        triggerLongPress(nodeId)
        touchTimer.current = null
      }, 400)
    },
    [clearTouchTimer, triggerLongPress],
  )

  const onCanvasPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!touchStartPos.current) return
      const dist = Math.hypot(
        event.clientX - touchStartPos.current.x,
        event.clientY - touchStartPos.current.y,
      )
      if (dist > 10) {
        clearTouchTimer()
      }
    },
    [clearTouchTimer],
  )

  const onCanvasPointerUp = useCallback(() => {
    clearTouchTimer()
    if (didLongPress.current) {
      window.setTimeout(() => {
        didLongPress.current = false
      }, 50)
    }
  }, [clearTouchTimer])

  const onCanvasFocus = useCallback((event: React.FocusEvent) => {
    if (isTextField(event.target)) setMultiSelectMode(false)
  }, [])

  const onCanvasPointerCancel = useCallback(() => {
    clearTouchTimer()
    didLongPress.current = false
  }, [clearTouchTimer])

  useEffect(() => {
    return () => {
      if (touchTimer.current !== null) {
        window.clearTimeout(touchTimer.current)
      }
    }
  }, [])

  const onNodeContextMenu: NodeMouseHandler<MemFlowNode> = useCallback(
    (event, node) => {
      if (isTextField(event.target)) return
      event.preventDefault()
      if (isReadOnly) return
      triggerLongPress(node.id)
    },
    [isReadOnly, triggerLongPress],
  )

  useEffect(() => {
    if (isReadOnly || !strobingSource) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      const { nodeId, sourceHandle } = strobingSource
      setEdges((current) => removeEdgesFromHandle(current, nodeId, sourceHandle))
      cancelConnection()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [isReadOnly, strobingSource, setEdges, cancelConnection])

  // The picture is wider than the learner's own diagrams, so fit it again once every node has its real size.
  useEffect(() => {
    if (isReadOnly && nodesMeasured) void fitView({ maxZoom: 1 })
  }, [isReadOnly, nodesMeasured, fitView])

  const addNode = useCallback(
    (type: MemNodeType, position: { x: number; y: number }) => {
      setNodes((current) => [...current, createNode(type, position)])
    },
    [setNodes],
  )

  const addInView = useCallback(
    (type: MemNodeType) => {
      const bounds = wrapper.current?.getBoundingClientRect()
      if (!bounds) return
      const topLeft = screenToFlowPosition({ x: bounds.left + 8, y: bounds.top + 8 })
      const bottomRight = screenToFlowPosition({ x: bounds.right - 8, y: bounds.bottom - 8 })
      const region = {
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      }
      addNode(type, defaultPositionForType(type, nodes, region))
    },
    [addNode, screenToFlowPosition, nodes],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData(DRAG_MIME) as MemNodeType
      if (!type) return
      const point = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode(type, freePosition(point, nodes, type))
    },
    [addNode, screenToFlowPosition, nodes],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => connectReplacing(current, connection, newId()))
    },
    [setEdges],
  )

  const checkConnection = useCallback(
    (connection: Connection | Edge) =>
      isValidConnection(
        {
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle ?? null,
          targetHandle: connection.targetHandle ?? null,
        },
        nodes,
      ),
    [nodes],
  )

  const cancelTapConnection = useCallback(() => cancelConnection(), [cancelConnection])

  // React Flow only finishes a tap connection on a handle; tapping anywhere on the target block is easier on a phone.
  const onNodeClick: NodeMouseHandler<MemFlowNode> = useCallback(
    (event, node) => {
      if (didLongPress.current) {
        didLongPress.current = false
        return
      }
      if (multiSelectMode) {
        setNodes((current) =>
          current.map((n) => (n.id === node.id ? { ...n, selected: !n.selected } : n)),
        )
        return
      }
      const start = store.getState().connectionClickStartHandle
      if (!start) return
      // A tap on a handle is handled by React Flow itself and then bubbles up to the node.
      if ((event.target as Element).closest('.react-flow__handle')) return
      const connection = tapConnection(start, node.id, nodes)
      if (connection) onConnect(connection)
      cancelTapConnection()
    },
    [multiSelectMode, store, nodes, onConnect, cancelTapConnection, setNodes],
  )

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: MemFlowEdge) => {
      if (multiSelectMode) {
        setEdges((current) =>
          current.map((e) => (e.id === edge.id ? { ...e, selected: !e.selected } : e)),
        )
      }
    },
    [multiSelectMode, setEdges],
  )

  const onPaneClick = useCallback(() => {
    cancelTapConnection()
    if (!multiSelectMode) {
      setNodes((current) =>
        current.some((n) => n.selected) ? current.map((n) => ({ ...n, selected: false })) : current,
      )
      setEdges((current) =>
        current.some((e) => e.selected) ? current.map((e) => ({ ...e, selected: false })) : current,
      )
    }
  }, [cancelTapConnection, multiSelectMode, setNodes, setEdges])

  const selectedNodes = nodes.filter((node) => node.selected)
  const selectedEdges = edges.filter((edge) => edge.selected)
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0

  const clearSelection = useCallback(() => {
    setNodes((current) => current.map((n) => (n.selected ? { ...n, selected: false } : n)))
    setEdges((current) => current.map((e) => (e.selected ? { ...e, selected: false } : e)))
    setMultiSelectMode(false)
  }, [setNodes, setEdges])

  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false)
  }, [])

  const toggleMultiSelect = useCallback(() => {
    setMultiSelectMode((active) => {
      if (!active) {
        if (!hasSelection) return false
        cancelConnection()
        return true
      }
      return false
    })
  }, [cancelConnection, hasSelection])

  const handleDuplicate = useCallback(() => {
    if (isReadOnly || pending || !hasSelection) return
    const result = duplicateElements(nodes, edges)
    if (result.clonedNodes.length > 0) {
      setNodes(result.nodes)
      setEdges(result.edges)
    }
  }, [isReadOnly, pending, hasSelection, nodes, edges, setNodes, setEdges])

  useEffect(() => {
    if (isReadOnly) return

    const onKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey
      if (isMod && event.key.toLowerCase() === 'd') {
        const target = event.target
        if (
          target instanceof HTMLElement &&
          target.closest('input, textarea, select, [contenteditable="true"]')
        ) {
          return
        }
        event.preventDefault()
        handleDuplicate()
        return
      }

      if (event.key === 'Escape' && multiSelectMode) {
        event.preventDefault()
        setMultiSelectMode(false)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isReadOnly, handleDuplicate, multiSelectMode])

  const displayedNodes = useMemo(
    () =>
      pending
        ? nodes.map((node) =>
            tapConnection(pending, node.id, nodes) ? { ...node, className: 'connect-target' } : node,
          )
        : nodes,
    [nodes, pending],
  )

  const displayedEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        interactionWidth: edgeHitWidth,
        className: feedback.handleKeys.has(handleKey(edge.source, edge.sourceHandle ?? ''))
          ? 'edge-error'
          : undefined,
      })),
    [edges, feedback, edgeHitWidth],
  )

  return (
    <FeedbackContext.Provider value={feedback}>
      <LanguageContext.Provider value={language}>
        <ReadOnlyContext.Provider value={isReadOnly}>
          <CompactContext.Provider value={compact}>
            {!isReadOnly && (
              <div className="canvas-toolbar">
                <Toolbar language={language} onAdd={addInView} />
              </div>
            )}
            <div
              className={`canvas${compact ? ' compact' : ''}`}
              ref={wrapper}
              onPointerDown={isReadOnly ? undefined : onCanvasPointerDown}
              onPointerMove={isReadOnly ? undefined : onCanvasPointerMove}
              onPointerUp={isReadOnly ? undefined : onCanvasPointerUp}
              onPointerCancel={isReadOnly ? undefined : onCanvasPointerCancel}
              onFocus={isReadOnly ? undefined : onCanvasFocus}
            >
              <ReactFlow<MemFlowNode, MemFlowEdge>
                nodes={displayedNodes}
                edges={displayedEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={isReadOnly ? undefined : onNodeClick}
                onEdgeClick={isReadOnly ? undefined : onEdgeClick}
                onNodeContextMenu={isReadOnly ? undefined : onNodeContextMenu}
                onPaneClick={isReadOnly ? undefined : onPaneClick}
                isValidConnection={checkConnection}
                onDragOver={onDragOver}
                onDrop={onDrop}
                defaultEdgeOptions={defaultEdgeOptions}
                deleteKeyCode={isReadOnly ? null : ['Backspace', 'Delete']}
                nodesConnectable={!isReadOnly}
                nodesDraggable={true}
                elementsSelectable={!multiSelectMode}
                panOnDrag={true}
                zoomOnScroll={!compact}
                zoomOnPinch={true}
                preventScrolling={!compact}
                connectionRadius={40}
                zoomOnDoubleClick={false}
                minZoom={0.3}
                fitView={isReadOnly}
                fitViewOptions={isReadOnly ? { maxZoom: 1 } : undefined}
              >
              <Background />
              {!isReadOnly && <HandleHitLayer />}
              <HandleVisualLayer />
              <Panel position="bottom-right">
                <div className="canvas-actions">
                  {!isReadOnly && !pending && (hasSelection || multiSelectMode) && (
                    <button
                      type="button"
                      className={`canvas-multiselect${multiSelectMode ? ' active' : ''}`}
                      aria-label="Multi-select mode"
                      aria-pressed={multiSelectMode}
                      title={multiSelectMode ? 'Exit multi-select mode' : 'Enter multi-select mode'}
                      onClick={toggleMultiSelect}
                    >
                      <MultiSelectIcon />
                    </button>
                  )}
                  {!isReadOnly && !pending && hasSelection && (
                    <>
                      <button
                        type="button"
                        className="canvas-duplicate"
                        aria-label="Duplicate"
                        title="Duplicate selected (Cmd+D or Ctrl+D)"
                        onClick={handleDuplicate}
                      >
                        <DuplicateIcon />
                      </button>
                      <button
                        type="button"
                        className="canvas-delete"
                        aria-label="Delete"
                        title="Delete selected (Backspace or Delete)"
                        onClick={() => {
                          setMultiSelectMode(false)
                          void deleteElements({ nodes: selectedNodes, edges: selectedEdges })
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </>
                  )}
                  <Controls showInteractive={false} />
                </div>
              </Panel>
              {!isReadOnly && pending && (
                <Panel position="bottom-center">
                  <div className="connect-banner" role="status">
                    <span>Tap what this points to (Delete clears the arrow)</span>
                    <button type="button" className="text-button" onClick={cancelTapConnection}>
                      Cancel
                    </button>
                  </div>
                </Panel>
              )}
              {!isReadOnly && !pending && multiSelectMode && (
                <Panel position="bottom-center">
                  <div className="connect-banner multi-select-banner" role="status">
                    <span>
                      Multi-select mode ({selectedNodes.length + selectedEdges.length} selected)
                    </span>
                    {hasSelection && (
                      <button type="button" className="text-button" onClick={clearSelection}>
                        Clear
                      </button>
                    )}
                    <button type="button" className="text-button" onClick={exitMultiSelect}>
                      Done
                    </button>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
          </CompactContext.Provider>
        </ReadOnlyContext.Provider>
      </LanguageContext.Provider>
    </FeedbackContext.Provider>
  )
}

export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
