import { createContext, useContext } from 'react'

/** True when the diagram is a picture to read, so nodes must not offer editing controls. */
export const ReadOnlyContext = createContext(false)

export function useReadOnly(): boolean {
  return useContext(ReadOnlyContext)
}

/** True when embedded as a static figure in scrollable text (debriefs). */
export const CompactContext = createContext(false)

export function useCompact(): boolean {
  return useContext(CompactContext)
}
