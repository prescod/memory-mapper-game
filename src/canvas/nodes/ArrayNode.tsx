import { useEffect } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
  type NodeProps,
} from '@xyflow/react'
import { removeEdgesFromHandle } from '../connections'
import { handleKey, useFeedback } from '../FeedbackContext'
import { useLanguage } from '../LanguageContext'
import { useReadOnly } from '../ReadOnlyContext'
import {
  TARGET_HANDLE,
  newId,
  slotHandle,
  type ArrayFlowNode,
  type MemFlowEdge,
  type MemFlowNode,
} from '../types'
import { CONTAINER_NAMES } from '../../model/types'
import { NodeHeader } from './NodeHeader'

export function ArrayNode({ id, data, selected }: NodeProps<ArrayFlowNode>) {
  const { updateNodeData, setEdges } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const updateNodeInternals = useUpdateNodeInternals()
  const feedback = useFeedback()
  const flagged = feedback.nodeIds.has(id)
  const readOnly = useReadOnly()
  const language = useLanguage()

  const slotKey = data.slots.map((slot) => slot.id).join(',')
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, slotKey, updateNodeInternals])

  const addSlot = () =>
    updateNodeData(id, (node) => ({
      slots: [...(node.data as typeof data).slots, { id: newId() }],
    }))

  const removeSlot = (slotId: string) => {
    updateNodeData(id, (node) => ({
      slots: (node.data as typeof data).slots.filter((slot) => slot.id !== slotId),
    }))
    setEdges((edges) => removeEdgesFromHandle(edges, id, slotHandle(slotId)))
  }

  return (
    <div
      className={`mem-node array-node${selected ? ' selected' : ''}${flagged ? ' flagged' : ''}`}
    >
      <Handle id={TARGET_HANDLE} type="target" position={Position.Top} />
      <NodeHeader>{CONTAINER_NAMES[language].array}</NodeHeader>
      {data.slots.length === 0 && <div className="mem-empty">empty</div>}
      {data.slots.map((slot, index) => {
        const handle = slotHandle(slot.id)
        return (
          <div className="mem-row mem-row-slot" key={slot.id}>
            <div className="mem-row-main">
              <span className="mem-index">{index}</span>
              <span className="mem-spacer" />
              {!readOnly && (
                <button
                  type="button"
                  className="nodrag mem-icon-button"
                  aria-label={`Remove slot ${index}`}
                  onClick={() => removeSlot(slot.id)}
                >
                  ×
                </button>
              )}
            </div>
            <Handle
              id={handle}
              type="source"
              position={Position.Bottom}
              className={feedback.handleKeys.has(handleKey(id, handle)) ? 'handle-error' : ''}
            />
          </div>
        )
      })}
      {!readOnly && (
        <button type="button" className="nodrag mem-add-button" onClick={addSlot}>
          + slot
        </button>
      )}
    </div>
  )
}
