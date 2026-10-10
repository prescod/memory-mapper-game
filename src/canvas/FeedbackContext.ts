import { createContext, useContext } from 'react'
import type { VerifyError } from '../model/types'

/**
 * Verification feedback kept outside node data so it is never persisted with
 * the learner's draft.
 */
export interface Feedback {
  nodeIds: ReadonlySet<string>
  handleKeys: ReadonlySet<string>
}

export const handleKey = (nodeId: string, handle: string) => `${nodeId}:${handle}`

export const emptyFeedback: Feedback = { nodeIds: new Set(), handleKeys: new Set() }

export function feedbackFromErrors(errors: VerifyError[]): Feedback {
  const nodeIds = new Set<string>()
  const handleKeys = new Set<string>()
  for (const error of errors) {
    if (!error.nodeId) continue
    nodeIds.add(error.nodeId)
    if (error.handle) handleKeys.add(handleKey(error.nodeId, error.handle))
  }
  return { nodeIds, handleKeys }
}

export const FeedbackContext = createContext<Feedback>(emptyFeedback)

export function useFeedback(): Feedback {
  return useContext(FeedbackContext)
}
