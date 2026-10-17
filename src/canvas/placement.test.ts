import { describe, expect, it } from 'vitest'
import type { MemFlowNode } from '../canvas/types'
import { bandForType, defaultPositionForType, freePosition, revealOffset } from './placement'

const region = { x: 0, y: 0, width: 400, height: 500 }

const node = (type: MemFlowNode['type'], x: number, y: number): MemFlowNode =>
  ({
    id: `${type}-${x}-${y}`,
    type,
    position: { x, y },
    data:
      type === 'variable'
        ? { name: '' }
        : type === 'scalar'
          ? { kind: 'auto', text: '' }
          : type === 'array'
            ? { slots: [] }
            : { entries: [] },
  }) as MemFlowNode

describe('bandForType', () => {
  it('maps block kinds to vertical bands', () => {
    expect(bandForType('variable')).toBe('top')
    expect(bandForType('scalar')).toBe('bottom')
    expect(bandForType('array')).toBe('middle')
    expect(bandForType('object')).toBe('middle')
  })
})

describe('defaultPositionForType', () => {
  it('puts variables higher than scalars', () => {
    const nodes: MemFlowNode[] = []
    const variable = defaultPositionForType('variable', nodes, region)
    nodes.push(node('variable', variable.x, variable.y))
    const scalar = defaultPositionForType('scalar', nodes, region)
    expect(variable.y).toBeLessThan(scalar.y)
  })

  it('fills variables left to right on the top band', () => {
    const nodes: MemFlowNode[] = []
    const first = defaultPositionForType('variable', nodes, region)
    nodes.push(node('variable', first.x, first.y))
    const second = defaultPositionForType('variable', nodes, region)
    expect(second.x).toBeGreaterThan(first.x)
    expect(second.y).toBe(first.y)
  })

  it('places compounds between variables and scalars', () => {
    const nodes: MemFlowNode[] = []
    const variable = defaultPositionForType('variable', nodes, region)
    const array = defaultPositionForType('array', nodes, region)
    const scalar = defaultPositionForType('scalar', nodes, region)
    expect(variable.y).toBeLessThan(array.y)
    expect(array.y).toBeLessThan(scalar.y)
  })
})

describe('primitive placement', () => {
  it('leaves room for the wide "AUTO: NUMBER" kind dropdown', () => {
    const first = defaultPositionForType('scalar', [], region)
    const second = defaultPositionForType('scalar', [node('scalar', first.x, first.y)], region)
    expect(second.x >= first.x + 167 || second.y >= first.y + 77).toBe(true)
  })
})

describe('freePosition', () => {
  it('uses the preferred spot on an empty canvas', () => {
    expect(freePosition({ x: 10, y: 20 }, [])).toEqual({ x: 10, y: 20 })
  })

  it('shifts when the preferred spot is taken', () => {
    const existing = [{ position: { x: 10, y: 20 }, measured: { width: 140, height: 60 } }]
    const placed = freePosition({ x: 10, y: 20 }, existing)
    expect(placed).not.toEqual({ x: 10, y: 20 })
  })
})

describe('revealOffset', () => {
  it('does not move the view when the block is already visible', () => {
    expect(revealOffset({ x: 12, y: 12 }, 'variable', region)).toEqual({ x: 0, y: 0 })
  })

  it('shifts only far enough to show a block below the view', () => {
    // A primitive reserves 80px of height, so its bottom sits at 520: 20 past the view, plus the margin.
    expect(revealOffset({ x: 12, y: 440 }, 'scalar', region)).toEqual({ x: 0, y: 36 })
  })

  it('shifts up and left for a block above and before the view', () => {
    expect(revealOffset({ x: -30, y: -10 }, 'variable', region)).toEqual({ x: -46, y: -26 })
  })
})
