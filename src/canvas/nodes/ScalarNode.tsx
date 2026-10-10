import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { useFeedback } from '../FeedbackContext'
import { useReadOnly } from '../ReadOnlyContext'
import {
  TARGET_HANDLE,
  type MemFlowEdge,
  type MemFlowNode,
  type ScalarFlowNode,
} from '../types'

export function ScalarNode({ id, data, selected }: NodeProps<ScalarFlowNode>) {
  const { updateNodeData } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const flagged = useFeedback().nodeIds.has(id)
  const readOnly = useReadOnly()

  return (
    <div
      className={`mem-node scalar-node${selected ? ' selected' : ''}${flagged ? ' flagged' : ''}`}
    >
      <Handle id={TARGET_HANDLE} type="target" position={Position.Left} />
      <input
        className="nodrag mem-input"
        value={data.text}
        placeholder="value"
        aria-label="Scalar value"
        spellCheck={false}
        readOnly={readOnly}
        onChange={(event) => updateNodeData(id, { text: event.target.value })}
      />
    </div>
  )
}
