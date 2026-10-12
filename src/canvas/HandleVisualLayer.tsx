import { useCallback } from 'react'
import { useStore, ViewportPortal } from '@xyflow/react'
import { handleKey, useFeedback } from './FeedbackContext'
import { collectHandleRects, handleRectCenter } from './handleBounds'

export function HandleVisualLayer() {
  const feedback = useFeedback()
  const clickStart = useStore((state) => state.connectionClickStartHandle)
  const fromHandle = useStore((state) => state.connection.fromHandle)

  const rects = useStore(useCallback((state) => collectHandleRects(state.nodeLookup), []))

  return (
    <ViewportPortal>
      {rects.map((rect) => {
        const center = handleRectCenter(rect)
        const isConnectingSource =
          (clickStart?.nodeId === rect.nodeId && (clickStart.id ?? '') === rect.handleId) ||
          (fromHandle?.nodeId === rect.nodeId && (fromHandle.id ?? '') === rect.handleId)
        const isError = feedback.handleKeys.has(handleKey(rect.nodeId, rect.handleId))
        return (
          <div
            key={rect.key}
            className={`mem-handle-visual${isConnectingSource ? ' clickconnecting' : ''}${isError ? ' handle-error' : ''}`}
            style={{ left: center.x, top: center.y }}
            aria-hidden="true"
          />
        )
      })}
    </ViewportPortal>
  )
}
