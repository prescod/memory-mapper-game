import { LANGUAGE_LABELS, type Language } from './model/types'

const FEEDBACK_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSdOIlCHzTyVSuRPHR_SUsj4FMseUMRUFtHE-womcOpYeDipQw/viewform'

/**
 * Field ID of the form's "Do you have feedback on a specific puzzle?" question,
 * from the form's "Get pre-filled link" URL. Recreating that question in the form
 * assigns it a new ID.
 */
const PUZZLE_FIELD = 'entry.158960498'

interface PuzzleContext {
  problemId: string
  language: Language
}

/** Opens the feedback form, with the puzzle question pre-filled when a puzzle is given. */
export function feedbackUrl(puzzle?: PuzzleContext): string {
  const params = new URLSearchParams({ usp: 'pp_url' })
  if (puzzle) {
    params.set(PUZZLE_FIELD, `${puzzle.problemId} (${LANGUAGE_LABELS[puzzle.language]}): `)
  }
  return `${FEEDBACK_FORM}?${params}`
}
