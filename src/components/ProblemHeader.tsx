import { findProblem, levels, nextProblem, previousProblem, problems } from '../model/levels'
import { LanguageToggle } from './LanguageToggle'

interface ProblemHeaderProps {
  problemId: string
  onNavigate: (problemId: string | null) => void
}

export function ProblemHeader({ problemId, onNavigate }: ProblemHeaderProps) {
  const previous = previousProblem(problemId)
  const next = nextProblem(problemId)
  const position = problems.findIndex((problem) => problem.id === problemId)
  const location = findProblem(problemId)
  const levelIndex = location ? levels.indexOf(location.level) : -1
  const backLabel = levelIndex !== -1 ? `‹ Level ${levelIndex + 1}` : '‹ Levels'

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
