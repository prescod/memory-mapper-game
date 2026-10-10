import { nextProblem, previousProblem, problems } from '../model/levels'

interface ProblemNavigationProps {
  problemId: string
  onNavigate: (problemId: string | null) => void
}

export function ProblemNavigation({ problemId, onNavigate }: ProblemNavigationProps) {
  const previous = previousProblem(problemId)
  const next = nextProblem(problemId)
  const position = problems.findIndex((problem) => problem.id === problemId)

  return (
    <div className="problem-navigation">
      <button type="button" className="link-button" onClick={() => onNavigate(null)}>
        All problems
      </button>
      <nav className="problem-navigation-controls" aria-label="Problem navigation">
        <button
          type="button"
          className="problem-navigation-button"
          onClick={() => previous && onNavigate(previous.id)}
          disabled={!previous}
        >
          ← Previous
        </button>
        <span className="problem-navigation-position">
          {position + 1} of {problems.length}
        </span>
        <button
          type="button"
          className="problem-navigation-button"
          onClick={() => next && onNavigate(next.id)}
          disabled={!next}
        >
          Next →
        </button>
      </nav>
    </div>
  )
}
