import { Position } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { bendableEdgePath } from './bendPath'

describe('bendableEdgePath', () => {
  const base = {
    sourceX: 0,
    sourceY: 0,
    targetX: 100,
    targetY: 0,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }

  it('uses a quadratic path when bend is set', () => {
    const { path, handleX, handleY } = bendableEdgePath({
      ...base,
      bend: { x: 50, y: 40 },
    })
    expect(path).toBe('M 0,0 Q 50,40 100,0')
    expect(handleX).toBe(50)
    expect(handleY).toBe(40)
  })

  it('uses default bezier when bend is missing', () => {
    const { path } = bendableEdgePath(base)
    expect(path.startsWith('M')).toBe(true)
    expect(path).toContain('C')
  })
})
