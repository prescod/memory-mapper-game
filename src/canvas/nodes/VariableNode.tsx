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
import { NodeHeader } from './NodeHeader'

export function VariableNode({ id, data, selected }: NodeProps<VariableFlowNode>) {
  const { updateNodeData } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const feedback = useFeedback()
  const flagged = feedback.nodeIds.has(id)
  const readOnly = useReadOnly()

  const nameField = readOnly ? (
    <span className="scalar-fixed">{data.name}</span>
  ) : (
    <input
      className="nodrag mem-input"
      value={data.name}
      placeholder="name"
      aria-label="Variable name"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      onChange={(event) => updateNodeData(id, { name: event.target.value })}
    />
  )

  return (
    <div
      className={`mem-node variable-node${readOnly ? ' read-only' : ''}${selected ? ' selected' : ''}${flagged ? ' flagged' : ''}`}
    >
      <Handle id={TARGET_HANDLE} type="target" position={Position.Top} />
      {/* The shared picture layout spaces variables for a block without a header, and a picture is never dragged. */}
      {!readOnly && <NodeHeader>variable</NodeHeader>}
      {nameField}
      <Handle
        id={VARIABLE_HANDLE}
        type="source"
        position={Position.Bottom}
        className={feedback.handleKeys.has(handleKey(id, VARIABLE_HANDLE)) ? 'handle-error' : ''}
      />
    </div>
  )
}
