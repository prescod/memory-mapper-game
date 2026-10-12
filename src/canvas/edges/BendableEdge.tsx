import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  useReactFlow,
} from '@xyflow/react'
import { memo, useMemo } from 'react'
import { useReadOnly } from '../ReadOnlyContext'
import type { MemFlowEdge } from '../types'
import { bendableEdgePath } from './bendPath'

function BendableEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  style,
  interactionWidth,
}: EdgeProps<MemFlowEdge>) {
  const readOnly = useReadOnly()
  const { screenToFlowPosition, setEdges } = useReactFlow()

  const { path, handleX, handleY } = useMemo(
    () =>
      bendableEdgePath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        bend: data?.bend,
      }),
    [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data?.bend],
  )

  const onBendPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly) return
    event.stopPropagation()
    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)

    const move = (ev: PointerEvent) => {
      if (!handle.hasPointerCapture(ev.pointerId)) return
      const bend = screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
      setEdges((edges) =>
        edges.map((edge) =>
          edge.id === id ? { ...edge, data: { ...edge.data, bend } } : edge,
        ),
      )
    }

    const end = (ev: PointerEvent) => {
      if (handle.hasPointerCapture(ev.pointerId)) {
        handle.releasePointerCapture(ev.pointerId)
      }
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
    }

    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
    move(event.nativeEvent)
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={interactionWidth}
      />
      {selected && !readOnly && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan mem-edge-bend-handle"
            style={{
              position: 'absolute',
              pointerEvents: 'all',
              transform: `translate(-50%, -50%) translate(${handleX}px, ${handleY}px)`,
            }}
            role="slider"
            aria-label="Drag to reshape arrow"
            aria-valuetext="curve control"
            onPointerDown={onBendPointerDown}
          />
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const BendableEdge = memo(BendableEdgeComponent)
