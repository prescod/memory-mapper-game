import type { DragEvent } from 'react'
import type { MemNodeType } from './types'

export const DRAG_MIME = 'application/x-memory-node-type'

const palette: { type: MemNodeType; label: string }[] = [
  { type: 'variable', label: 'Add Variable' },
  { type: 'scalar', label: 'Add Scalar' },
  { type: 'array', label: 'Add Array' },
  { type: 'object', label: 'Add Object' },
]

interface ToolbarProps {
  onAdd: (type: MemNodeType) => void
}

export function Toolbar({ onAdd }: ToolbarProps) {
  const onDragStart = (event: DragEvent<HTMLButtonElement>, type: MemNodeType) => {
    event.dataTransfer.setData(DRAG_MIME, type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Memory building blocks">
      {palette.map(({ type, label }) => (
        <button
          key={type}
          type="button"
          className={`toolbar-button toolbar-${type}`}
          draggable
          onDragStart={(event) => onDragStart(event, type)}
          onClick={() => onAdd(type)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
