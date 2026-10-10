import type { Problem } from '../model/types'

export function ProblemTitle({ problem, visible }: { problem: Problem; visible: boolean }) {
  return visible ? (
    <>{problem.title}</>
  ) : (
    <span className="hidden-title">?</span>
  )
}
