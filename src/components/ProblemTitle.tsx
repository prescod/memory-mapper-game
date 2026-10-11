import { problemTitle } from '../model/levels'
import type { Language, Problem } from '../model/types'

export function ProblemTitle({
  problem,
  visible,
  language,
}: {
  problem: Problem
  visible: boolean
  language: Language
}) {
  return visible ? <>{problemTitle(problem, language)}</> : <span className="hidden-title">?</span>
}
