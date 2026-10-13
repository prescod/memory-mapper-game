import type { DragEvent } from 'react'
import type { MemNodeType } from './types'
import { CONTAINER_NAMES, type Language } from '../model/types'

export const DRAG_MIME = 'application/x-memory-node-type'

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

function palette(language: Language): { type: MemNodeType; label: string }[] {
  const names = CONTAINER_NAMES[language]
  return [
    { type: 'variable', label: 'Variable' },
    { type: 'scalar', label: 'Primitive' },
    { type: 'array', label: capitalize(names.array) },
    { type: 'object', label: capitalize(names.object) },
    { type: 'pet', label: 'Pet' },
  ]
}

interface ToolbarProps {
  language: Language
  onAdd: (type: MemNodeType) => void
}

/** Tapping adds a block in view; on desktop a block can also be dragged into place. */
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
          aria-label={`Add ${label}`}
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
