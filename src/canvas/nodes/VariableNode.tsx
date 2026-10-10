import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { handleKey, useFeedback } from '../FeedbackContext'
import { useReadOnly } from '../ReadOnlyContext'
import {
  TARGET_HANDLE,
  VARIABLE_HANDLE,
  type MemFlowEdge,
  type MemFlowNode,
  type VariableFlowNode,
} from '../types'

export function VariableNode({ id, data, selected }: NodeProps<VariableFlowNode>) {
  const { updateNodeData } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const feedback = useFeedback()
  const flagged = feedback.nodeIds.has(id)
  const readOnly = useReadOnly()

  return (
    <div
      className={`mem-node variable-node${selected ? ' selected' : ''}${flagged ? ' flagged' : ''}`}
    >
      <Handle id={TARGET_HANDLE} type="target" position={Position.Left} />
      <input
        className="nodrag mem-input"
        value={data.name}
        placeholder="name"
        aria-label="Variable name"
        spellCheck={false}
        readOnly={readOnly}
        onChange={(event) => updateNodeData(id, { name: event.target.value })}
      />
      <Handle
        id={VARIABLE_HANDLE}
        type="source"
        position={Position.Right}
        className={feedback.handleKeys.has(handleKey(id, VARIABLE_HANDLE)) ? 'handle-error' : ''}
      />
    </div>
  )
}
