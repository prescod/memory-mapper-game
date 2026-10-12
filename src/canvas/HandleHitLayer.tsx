import { useCallback } from 'react'
import { useStore, useStoreApi, ViewportPortal } from '@xyflow/react'
import { collectHandleRects } from './handleBounds'
import { handleHitClick, handleHitPointerDown } from './handleHitConnect'

export function HandleHitLayer() {
  const store = useStoreApi()
  const rects = useStore(useCallback((state) => collectHandleRects(state.nodeLookup), []))

  return (
    <ViewportPortal>
      {rects.map((rect) => (
        <div
          key={rect.key}
          className="nodrag nopan mem-handle-hit"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
          onPointerDown={(event) => {
            event.stopPropagation()
            handleHitPointerDown(
              event.nativeEvent,
              rect.nodeId,
              rect.handleId,
              rect.handleType,
              store,
            )
          }}
          onClick={(event) => {
            event.stopPropagation()
            handleHitClick(
              event.nativeEvent,
              rect.nodeId,
              rect.handleId,
              rect.handleType,
              store,
            )
          }}
        />
      ))}
    </ViewportPortal>
  )
}
