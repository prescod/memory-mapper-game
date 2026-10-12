export interface HandleRect {
  key: string
  nodeId: string
  handleId: string
  handleType: 'source' | 'target'
  x: number
  y: number
  width: number
  height: number
}

type NodeLookup = Map<
  string,
  {
    id: string
    internals: {
      positionAbsolute: { x: number; y: number }
      handleBounds?: {
        source: Array<{
          id?: string | null
          x: number
          y: number
          width: number
          height: number
        }> | null
        target: Array<{
          id?: string | null
          x: number
          y: number
          width: number
          height: number
        }> | null
      }
    }
  }
>

export function collectHandleRects(nodeLookup: NodeLookup): HandleRect[] {
  const rects: HandleRect[] = []
  for (const node of nodeLookup.values()) {
    const bounds = node.internals.handleBounds
    if (!bounds) continue
    const baseX = node.internals.positionAbsolute.x
    const baseY = node.internals.positionAbsolute.y
    const add = (
      handleId: string | null | undefined,
      handleType: 'source' | 'target',
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      const id = handleId ?? ''
      rects.push({
        key: `${node.id}:${id}:${handleType}`,
        nodeId: node.id,
        handleId: id,
        handleType,
        x: baseX + x,
        y: baseY + y,
        width,
        height,
      })
    }
    for (const handle of bounds.source ?? []) {
      add(handle.id, 'source', handle.x, handle.y, handle.width, handle.height)
    }
    for (const handle of bounds.target ?? []) {
      add(handle.id, 'target', handle.x, handle.y, handle.width, handle.height)
    }
  }
  return rects
}

export function handleRectCenter(rect: HandleRect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}
