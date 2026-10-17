import {
  findProblem,
  nextProblem,
  previousProblem,
  problemBatchPosition,
} from '../model/levels'
import { useFullscreen } from '../useFullscreen'
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
  const fullscreen = useFullscreen()

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
      {fullscreen.available && (
        <button
          type="button"
          className="icon-button header-fullscreen"
          aria-label={fullscreen.active ? 'Exit full screen' : 'Full screen'}
          aria-pressed={fullscreen.active}
          onClick={fullscreen.toggle}
        >
          <FullscreenIcon exit={fullscreen.active} />
        </button>
      )}
    </header>
  )
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {exit ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </svg>
  )
}
