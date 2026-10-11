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
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from 'react'
import { connectReplacing, isValidConnection } from './connections'
import { FeedbackContext, handleKey, type Feedback } from './FeedbackContext'
import { LanguageContext } from './LanguageContext'
import { ReadOnlyContext } from './ReadOnlyContext'
import {
  createNode,
  newId,
  type MemFlowEdge,
  type MemFlowNode,
  type MemNodeType,
} from './types'
import type { Language } from '../model/types'
import { nodeTypes } from './nodes'
import { defaultPositionForType, freePosition } from './placement'
import { tapConnection } from './tapConnect'
import { DRAG_MIME, Toolbar } from './Toolbar'

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
  /** Compact diagram embedded in text: no controls, no panning/zooming, permits page scrolling. */
  compact?: boolean
}

const defaultEdgeOptions = { markerEnd: { type: MarkerType.ArrowClosed } }
/** Width of the invisible stroke around each arrow that a finger can hit. */
const EDGE_TAP_WIDTH = 32

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
  const wrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView, deleteElements } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const nodesMeasured = useNodesInitialized()
  const store = useStoreApi<MemFlowNode, MemFlowEdge>()
  const pending = useStore((state) => state.connectionClickStartHandle)

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
      addNode(type, freePosition(point, nodes))
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

  const cancelTapConnection = useCallback(
    () => store.setState({ connectionClickStartHandle: null }),
    [store],
  )

  // React Flow only finishes a tap connection on a handle; tapping anywhere on the target block is easier on a phone.
  const onNodeClick: NodeMouseHandler<MemFlowNode> = useCallback(
    (event, node) => {
      const start = store.getState().connectionClickStartHandle
      if (!start) return
      // A tap on a handle is handled by React Flow itself and then bubbles up to the node.
      if ((event.target as Element).closest('.react-flow__handle')) return
      const connection = tapConnection(start, node.id, nodes)
      if (connection) onConnect(connection)
      cancelTapConnection()
    },
    [store, nodes, onConnect, cancelTapConnection],
  )

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
        interactionWidth: EDGE_TAP_WIDTH,
        className: feedback.handleKeys.has(handleKey(edge.source, edge.sourceHandle ?? ''))
          ? 'edge-error'
          : undefined,
      })),
    [edges, feedback],
  )

  const selectedNodes = nodes.filter((node) => node.selected)
  const selectedEdges = edges.filter((edge) => edge.selected)
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0

  return (
    <FeedbackContext.Provider value={feedback}>
      <LanguageContext.Provider value={language}>
        <ReadOnlyContext.Provider value={isReadOnly}>
          {!isReadOnly && (
            <div className="canvas-toolbar">
              <Toolbar language={language} onAdd={addInView} />
            </div>
          )}
          <div className="canvas" ref={wrapper}>
            <ReactFlow<MemFlowNode, MemFlowEdge>
              nodes={displayedNodes}
              edges={displayedEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={isReadOnly ? undefined : onNodeClick}
              onPaneClick={isReadOnly ? undefined : cancelTapConnection}
              isValidConnection={checkConnection}
              onDragOver={onDragOver}
              onDrop={onDrop}
              defaultEdgeOptions={defaultEdgeOptions}
              deleteKeyCode={isReadOnly ? null : ['Backspace', 'Delete']}
              nodesConnectable={!isReadOnly}
              nodesDraggable={!isReadOnly}
              elementsSelectable={!isReadOnly}
              panOnDrag={!compact}
              zoomOnScroll={!compact}
              zoomOnPinch={!compact}
              preventScrolling={!compact}
              connectionRadius={40}
              zoomOnDoubleClick={false}
              minZoom={0.3}
              fitView={isReadOnly}
              fitViewOptions={isReadOnly ? { maxZoom: 1 } : undefined}
            >
              <Background />
              {!compact && (
                <Panel position="bottom-right">
                  <div className="canvas-actions">
                    {!isReadOnly && !pending && hasSelection && (
                      <button
                        type="button"
                        className="canvas-delete"
                        onClick={() =>
                          void deleteElements({ nodes: selectedNodes, edges: selectedEdges })
                        }
                      >
                        Delete
                      </button>
                    )}
                    <Controls showInteractive={false} />
                  </div>
                </Panel>
              )}
              {!isReadOnly && pending && (
                <Panel position="bottom-center">
                  <div className="connect-banner" role="status">
                    <span>Tap what this points to</span>
                    <button type="button" className="text-button" onClick={cancelTapConnection}>
                      Cancel
                    </button>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
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
