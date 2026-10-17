import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { formatScalar, stringQuote, stripSurroundingQuotes } from '../../model/scalar'
import { useLanguage } from '../LanguageContext'
import { QuotedLiteralInput } from '../QuotedLiteralInput'
import { useFeedback } from '../FeedbackContext'
import { useReadOnly } from '../ReadOnlyContext'
import {
  TARGET_HANDLE,
  type MemFlowEdge,
  type MemFlowNode,
  type PetFlowNode,
} from '../types'
import { NodeHeader } from './NodeHeader'

export function PetNode({ id, data, selected }: NodeProps<PetFlowNode>) {
  const { updateNodeData } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const flagged = useFeedback().nodeIds.has(id)
  const readOnly = useReadOnly()
  const language = useLanguage()
  const q = stringQuote(language)

  return (
    <div
      className={`mem-node pet-node${readOnly ? ' read-only' : ''}${selected ? ' selected' : ''}${flagged ? ' flagged' : ''}`}
    >
      <Handle id={TARGET_HANDLE} type="target" position={Position.Top} />
      <NodeHeader>Pet</NodeHeader>
      <div className="pet-field">
        <span className="pet-field-label">name =</span>
        {readOnly ? (
          <span className="scalar-fixed">
            {data.label === ''
              ? ''
              : formatScalar({ kind: 'string', value: stripSurroundingQuotes(data.label) }, language)}
          </span>
        ) : (
          <QuotedLiteralInput
            value={data.label}
            onChange={(label) => updateNodeData(id, { label })}
            language={language}
            ariaLabel="Pet name"
            placeholder={`${q}name${q}`}
          />
        )}
      </div>
    </div>
  )
}
