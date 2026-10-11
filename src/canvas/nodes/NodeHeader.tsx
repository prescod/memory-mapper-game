import type { ReactNode } from 'react'
import { useReadOnly } from '../ReadOnlyContext'

/**
 * The strip a finger drags a block by. The rest of a block is mostly inputs
 * and buttons, which never start a drag.
 */
export function NodeHeader({ children }: { children: ReactNode }) {
  const readOnly = useReadOnly()
  return (
    <div className="mem-node-header">
      <div className="mem-node-title">{children}</div>
      {!readOnly && (
        <span className="mem-grip" aria-hidden="true">
          ⠿
        </span>
      )}
    </div>
  )
}
