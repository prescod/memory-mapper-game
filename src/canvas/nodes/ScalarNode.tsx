import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { formatScalar, scalarKindName, stringQuote } from '../../model/scalar'
import type { ScalarKind } from '../../model/types'
import { useFeedback } from '../FeedbackContext'
import { useLanguage } from '../LanguageContext'
import { useReadOnly } from '../ReadOnlyContext'
import { changeKind, scalarFromData } from '../scalarData'
import {
  TARGET_HANDLE,
  type MemFlowEdge,
  type MemFlowNode,
  type ScalarData,
  type ScalarFlowNode,
} from '../types'

const KINDS: ScalarKind[] = ['number', 'string', 'boolean', 'null']

export function ScalarNode({ id, data, selected }: NodeProps<ScalarFlowNode>) {
  const { updateNodeData } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const flagged = useFeedback().nodeIds.has(id)
  const readOnly = useReadOnly()
  const language = useLanguage()

  const scalar = scalarFromData(data, language)
  const kindName = scalarKindName(scalar.kind, language)
  const setText = (text: string) => updateNodeData(id, { text })
  const setKind = (kind: ScalarData['kind']) => updateNodeData(id, changeKind(data, kind, language))

  let editor
  switch (data.kind) {
    case 'auto':
    case 'number':
      editor = (
        <input
          className="nodrag mem-input"
          value={data.text}
          placeholder={data.kind === 'auto' ? 'value' : '0'}
          inputMode={data.kind === 'number' ? 'decimal' : undefined}
          aria-label="Scalar value"
          spellCheck={false}
          readOnly={readOnly}
          onChange={(event) => setText(event.target.value)}
        />
      )
      break
    case 'string':
      editor = (
        <span className="scalar-string">
          <span className="scalar-quote" aria-hidden="true">{stringQuote(language)}</span>
          <input
            className="nodrag mem-input"
            value={data.text}
            aria-label="String value"
            spellCheck={false}
            readOnly={readOnly}
            onChange={(event) => setText(event.target.value)}
          />
          <span className="scalar-quote" aria-hidden="true">{stringQuote(language)}</span>
        </span>
      )
      break
    case 'boolean':
      editor = readOnly ? (
        <span className="scalar-fixed">{formatScalar(scalar, language)}</span>
      ) : (
        <select
          className="nodrag mem-input"
          value={scalar.value}
          aria-label="Boolean value"
          onChange={(event) => setText(event.target.value)}
        >
          {['true', 'false'].map((value) => (
            <option key={value} value={value}>
              {formatScalar({ kind: 'boolean', value }, language)}
            </option>
          ))}
        </select>
      )
      break
    case 'null':
      editor = <span className="scalar-fixed">{formatScalar(scalar, language)}</span>
      break
  }

  return (
    <div
      className={`mem-node scalar-node${selected ? ' selected' : ''}${flagged ? ' flagged' : ''}`}
    >
      <Handle id={TARGET_HANDLE} type="target" position={Position.Left} />
      <div className="mem-node-title">
        {readOnly ? (
          kindName
        ) : (
          <select
            className="nodrag scalar-kind"
            value={data.kind}
            aria-label="Kind of value"
            onChange={(event) => setKind(event.target.value as ScalarData['kind'])}
          >
            <option value="auto">{data.text.trim() === '' ? 'auto' : `auto: ${kindName}`}</option>
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {scalarKindName(kind, language)}
              </option>
            ))}
          </select>
        )}
      </div>
      {editor}
    </div>
  )
}
