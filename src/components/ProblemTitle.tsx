import { problemTitle } from '../model/levels'
import type { Language, Level, Problem } from '../model/types'

export function ProblemTitle({
  problem,
  level,
  visible,
  language,
}: {
  problem: Problem
  level?: Level
  visible: boolean
  language: Language
}) {
  return visible ? (
    <>{problemTitle(problem, language, level)}</>
  ) : (
    <span className="hidden-title">?</span>
  )
}
