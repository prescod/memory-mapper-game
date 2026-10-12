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
  entryHandle,
  newId,
  type MemFlowEdge,
  type MemFlowNode,
  type ObjectFlowNode,
} from '../types'
import { CONTAINER_NAMES } from '../../model/types'
import { NodeHeader } from './NodeHeader'

export function ObjectNode({ id, data, selected }: NodeProps<ObjectFlowNode>) {
  const { updateNodeData, setEdges } = useReactFlow<MemFlowNode, MemFlowEdge>()
  const updateNodeInternals = useUpdateNodeInternals()
  const feedback = useFeedback()
  const flagged = feedback.nodeIds.has(id)
  const readOnly = useReadOnly()
  const language = useLanguage()

  const entryKey = data.entries.map((entry) => entry.id).join(',')
  useEffect(() => {
    updateNodeInternals(id)
  }, [id, entryKey, updateNodeInternals])

  const addEntry = () =>
    updateNodeData(id, (node) => ({
      entries: [...(node.data as typeof data).entries, { id: newId(), key: '' }],
    }))

  const renameEntry = (entryId: string, key: string) =>
    updateNodeData(id, (node) => ({
      entries: (node.data as typeof data).entries.map((entry) =>
        entry.id === entryId ? { ...entry, key } : entry,
      ),
    }))

  const removeEntry = (entryId: string) => {
    updateNodeData(id, (node) => ({
      entries: (node.data as typeof data).entries.filter((entry) => entry.id !== entryId),
    }))
    setEdges((edges) => removeEdgesFromHandle(edges, id, entryHandle(entryId)))
  }

  return (
    <div
      className={`mem-node object-node${selected ? ' selected' : ''}${flagged ? ' flagged' : ''}`}
    >
      <Handle id={TARGET_HANDLE} type="target" position={Position.Top} />
      <NodeHeader>{CONTAINER_NAMES[language].object}</NodeHeader>
      {data.entries.length === 0 && <div className="mem-empty">empty</div>}
      {data.entries.map((entry) => {
        const handle = entryHandle(entry.id)
        return (
          <div className="mem-row mem-array-slot" key={entry.id}>
            {readOnly ? (
              <span className="mem-index mem-entry-key">{entry.key}</span>
            ) : (
              <input
                className="nodrag mem-input mem-entry-key"
                value={entry.key}
                placeholder="key"
                aria-label="Key"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                onChange={(event) => renameEntry(entry.id, event.target.value)}
              />
            )}
            <div className="mem-slot-cell">
              <Handle
                id={handle}
                type="source"
                position={Position.Bottom}
                className={feedback.handleKeys.has(handleKey(id, handle)) ? 'handle-error' : ''}
              />
            </div>
            {!readOnly && (
              <button
                type="button"
                className="nodrag mem-icon-button"
                aria-label="Remove entry"
                onClick={() => removeEntry(entry.id)}
              >
                ×
              </button>
            )}
          </div>
        )
      })}
      {!readOnly && (
        <button type="button" className="nodrag mem-add-button" onClick={addEntry}>
          + entry
        </button>
      )}
    </div>
  )
}
