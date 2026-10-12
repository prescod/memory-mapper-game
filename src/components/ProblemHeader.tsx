import {
  findProblem,
  nextProblem,
  previousProblem,
  problemBatchPosition,
} from '../model/levels'
import { LanguageToggle } from './LanguageToggle'

interface ProblemHeaderProps {
  problemId: string
  onNavigate: (problemId: string | null) => void
}

export function ProblemHeader({ problemId, onNavigate }: ProblemHeaderProps) {
  const previous = previousProblem(problemId)
  const next = nextProblem(problemId)
  const location = findProblem(problemId)
  const batch = location
    ? problemBatchPosition(location.level, location.problem)
    : undefined
  const backLabel = location ? `‹ Level ${location.level.number}` : '‹ Levels'

  return (
    <header className="problem-header">
      <button type="button" className="text-button header-back" onClick={() => onNavigate(null)}>
        {backLabel}
      </button>
      <nav className="header-stepper" aria-label="Problem navigation">
        <button
          type="button"
          className="icon-button"
          aria-label="Previous problem"
          onClick={() => previous && onNavigate(previous.id)}
          disabled={!previous}
        >
          ‹
        </button>
        <span className="header-position">
          {batch ? `${batch.index} / ${batch.total}` : '—'}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Next problem"
          onClick={() => next && onNavigate(next.id)}
          disabled={!next}
        >
          ›
        </button>
      </nav>
      <LanguageToggle />
    </header>
  )
}
