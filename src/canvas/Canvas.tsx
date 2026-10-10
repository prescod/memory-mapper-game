import {
  Background,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  type Connection,
  type Edge,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useRef, type Dispatch, type DragEvent, type SetStateAction } from 'react'
import { connectReplacing, isValidConnection } from './connections'
import { FeedbackContext, handleKey, type Feedback } from './FeedbackContext'
import type { Language } from '../model/types'
import { LanguageContext } from './LanguageContext'
import { nodeTypes } from './nodes'
import { ReadOnlyContext } from './ReadOnlyContext'
import { Toolbar, DRAG_MIME } from './Toolbar'
import { createNode, newId, type MemFlowEdge, type MemFlowNode, type MemNodeType } from './types'

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
}

const defaultEdgeOptions = { markerEnd: { type: MarkerType.ArrowClosed } }

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
}: CanvasProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const nodesMeasured = useNodesInitialized()

  // The picture is wider than the learner's own diagrams, so fit it again once every node has its real size.
  useEffect(() => {
    if (readOnly && nodesMeasured) void fitView({ maxZoom: 1 })
  }, [readOnly, nodesMeasured, fitView])

  const addNode = useCallback(
    (type: MemNodeType, position: { x: number; y: number }) => {
      setNodes((current) => [...current, createNode(type, position)])
    },
    [setNodes],
  )

  const addAtCenter = useCallback(
    (type: MemNodeType) => {
      const bounds = wrapper.current?.getBoundingClientRect()
      if (!bounds) return
      const jitter = () => (Math.random() - 0.5) * 80
      const position = screenToFlowPosition({
        x: bounds.left + bounds.width / 2 + jitter(),
        y: bounds.top + bounds.height / 2 + jitter(),
      })
      addNode(type, position)
    },
    [addNode, screenToFlowPosition],
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
      addNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
    },
    [addNode, screenToFlowPosition],
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

  const displayedEdges = useMemo(
    () =>
      edges.map((edge) =>
        feedback.handleKeys.has(handleKey(edge.source, edge.sourceHandle ?? ''))
          ? { ...edge, className: 'edge-error' }
          : edge,
      ),
    [edges, feedback],
  )

  return (
    <FeedbackContext.Provider value={feedback}>
      <LanguageContext.Provider value={language}>
        <ReadOnlyContext.Provider value={readOnly}>
          <div className="canvas" ref={wrapper}>
            <ReactFlow<MemFlowNode, MemFlowEdge>
              nodes={nodes}
              edges={displayedEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={checkConnection}
              onDragOver={onDragOver}
              onDrop={onDrop}
              defaultEdgeOptions={defaultEdgeOptions}
              deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
              nodesConnectable={!readOnly}
              minZoom={0.3}
              fitView
              fitViewOptions={{ maxZoom: 1 }}
            >
              <Background />
              <Controls showInteractive={false} />
              {!readOnly && (
                <Panel position="top-left">
                  <Toolbar language={language} onAdd={addAtCenter} />
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
