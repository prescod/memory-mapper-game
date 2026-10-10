import { useEffect } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
  type NodeProps,
} from '@xyflow/react'
import { CONTAINER_NAMES } from '../../model/types'
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
      <Handle id={TARGET_HANDLE} type="target" position={Position.Left} />
      <div className="mem-node-title">{CONTAINER_NAMES[language].object}</div>
      {data.entries.length === 0 && <div className="mem-empty">empty</div>}
      {data.entries.map((entry) => {
        const handle = entryHandle(entry.id)
        return (
          <div className="mem-row" key={entry.id}>
            <input
              className="nodrag mem-input mem-key-input"
              value={entry.key}
              placeholder="key"
              aria-label="Key"
              spellCheck={false}
              readOnly={readOnly}
              onChange={(event) => renameEntry(entry.id, event.target.value)}
            />
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
            <Handle
              id={handle}
              type="source"
              position={Position.Right}
              className={feedback.handleKeys.has(handleKey(id, handle)) ? 'handle-error' : ''}
            />
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
