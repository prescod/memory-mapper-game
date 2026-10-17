import type { XYPosition } from '@xyflow/react'
import type { MemFlowNode, MemNodeType } from './types'

interface Box {
  type?: MemNodeType
  position: XYPosition
  measured?: { width?: number; height?: number }
}

/** Size assumed for a block that has not been measured yet, including a little breathing room. */
const BLOCK = { width: 150, height: 76 }
const GAP = 10

/**
 * Room reserved for a primitive. Its kind dropdown reads "AUTO: NUMBER" until a
 * value is typed, which makes a block about 167px wide and 77px tall (measured in
 * the browser), wider than the other empty blocks.
 */
const PRIMITIVE = { width: 170, height: 80 }

const slotFor = (type: MemNodeType | undefined) => (type === 'scalar' ? PRIMITIVE : BLOCK)

export interface PlacementRegion {
  x: number
  y: number
  width: number
  height: number
}

type Band = 'top' | 'middle' | 'bottom'

export function bandForType(type: MemNodeType): Band {
  switch (type) {
    case 'variable':
      return 'top'
    case 'scalar':
      return 'bottom'
    case 'array':
    case 'object':
    case 'pet':
      return 'middle'
    default: {
      const _unreachable: never = type
      return _unreachable
    }
  }
}

/** Whether a block of `type` at `position` would touch `box` once both have grown to their largest. */
const overlaps = (position: XYPosition, type: MemNodeType | undefined, box: Box) => {
  const slot = slotFor(type)
  const reserved = slotFor(box.type)
  const width = Math.max(box.measured?.width ?? 0, reserved.width)
  const height = Math.max(box.measured?.height ?? 0, reserved.height)
  return (
    position.x < box.position.x + width &&
    position.x + slot.width > box.position.x &&
    position.y < box.position.y + height &&
    position.y + slot.height > box.position.y
  )
}

function bandTop(band: Band, region: PlacementRegion): number {
  const { y, height } = region
  switch (band) {
    case 'top':
      return y + 8
    case 'middle':
      return y + height * 0.36
    case 'bottom':
      return y + height * 0.68
  }
}

/**
 * Where a new block of `type` should appear: variables along the top,
 * scalars along the bottom, arrays and objects in the middle, each band
 * a single row that keeps growing to the right.
 */
export function defaultPositionForType(
  type: MemNodeType,
  nodes: MemFlowNode[],
  region: PlacementRegion,
): XYPosition {
  const slot = slotFor(type)
  const y = bandTop(bandForType(type), region)
  for (let col = 0; ; col++) {
    const position = { x: region.x + 12 + col * (slot.width + GAP), y }
    if (!nodes.some((node) => overlaps(position, type, node))) return position
  }
}

/**
 * Nudge `preferred` to the nearest free cell when dropping a block by hand.
 */
export function freePosition(preferred: XYPosition, existing: Box[], type?: MemNodeType): XYPosition {
  const slot = slotFor(type)
  const COLUMN_STEPS = [0, 1, -1, 2, -2]
  const ROW_STEPS = [0, 1, 2, 3, 4, 5, -1, -2]
  for (const column of COLUMN_STEPS) {
    for (const row of ROW_STEPS) {
      const position = {
        x: preferred.x + column * (slot.width + GAP),
        y: preferred.y + row * (slot.height + GAP),
      }
      if (!existing.some((box) => overlaps(position, type, box))) return position
    }
  }
  return preferred
}

/** Breathing room left between a revealed block and the edge of the view. */
const REVEAL_MARGIN = 16

/**
 * The smallest shift, in flow units, that brings a new block of `type` at
 * `position` fully inside `region`. Zero on both axes when it is already visible.
 */
export function revealOffset(position: XYPosition, type: MemNodeType, region: PlacementRegion): XYPosition {
  const slot = slotFor(type)
  const axis = (start: number, size: number, viewStart: number, viewSize: number) => {
    if (start < viewStart) return start - viewStart - REVEAL_MARGIN
    const overflow = start + size - (viewStart + viewSize)
    return overflow > 0 ? overflow + REVEAL_MARGIN : 0
  }
  return {
    x: axis(position.x, slot.width, region.x, region.width),
    y: axis(position.y, slot.height, region.y, region.height),
  }
}
