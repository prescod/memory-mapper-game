import { nextProblem, previousProblem, problems } from '../model/levels'
import { LanguageToggle } from './LanguageToggle'

interface ProblemHeaderProps {
  problemId: string
  onNavigate: (problemId: string | null) => void
}

export function ProblemHeader({ problemId, onNavigate }: ProblemHeaderProps) {
  const previous = previousProblem(problemId)
  const next = nextProblem(problemId)
  const position = problems.findIndex((problem) => problem.id === problemId)

  return (
    <header className="problem-header">
      <button type="button" className="text-button header-back" onClick={() => onNavigate(null)}>
        ‹ All
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
          {position + 1} / {problems.length}
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
