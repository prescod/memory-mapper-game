import type { DragEvent } from 'react'
import { CONTAINER_NAMES, type Language } from '../model/types'
import type { MemNodeType } from './types'

export const DRAG_MIME = 'application/x-memory-node-type'

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

function palette(language: Language): { type: MemNodeType; label: string }[] {
  const names = CONTAINER_NAMES[language]
  return [
    { type: 'variable', label: 'Add Variable' },
    { type: 'scalar', label: 'Add Scalar' },
    { type: 'array', label: `Add ${capitalize(names.array)}` },
    { type: 'object', label: `Add ${capitalize(names.object)}` },
  ]
}

interface ToolbarProps {
  language: Language
  onAdd: (type: MemNodeType) => void
}

export function Toolbar({ language, onAdd }: ToolbarProps) {
  const onDragStart = (event: DragEvent<HTMLButtonElement>, type: MemNodeType) => {
    event.dataTransfer.setData(DRAG_MIME, type)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Memory building blocks">
      {palette(language).map(({ type, label }) => (
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
