import { getBezierPath, type Position } from '@xyflow/react'

export interface BendPoint {
  x: number
  y: number
}

export function bendableEdgePath(params: {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  bend?: BendPoint
}): { path: string; handleX: number; handleY: number } {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, bend } = params
  if (!bend) {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    })
    return { path, handleX: labelX, handleY: labelY }
  }
  const path = `M ${sourceX},${sourceY} Q ${bend.x},${bend.y} ${targetX},${targetY}`
  return { path, handleX: bend.x, handleY: bend.y }
}
