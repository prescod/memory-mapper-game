import { findProblem, levels, nextUnsolved, problems } from '../model/levels'
import { LANGUAGE_LABELS, textIn } from '../model/types'
import { useAppStore } from '../store/useAppStore'
import { LanguageToggle } from './LanguageToggle'
import { ProblemTitle } from './ProblemTitle'
import { ProgressMeter, useIsSolved } from './Progress'

interface HomeProps {
  onOpenProblem: (problemId: string) => void
  onOpenLevel: (levelId: string) => void
}

export function Home({ onOpenProblem, onOpenLevel }: HomeProps) {
  const language = useAppStore((state) => state.language)
  const completed = useAppStore((state) => state.completed)
  const drafts = useAppStore((state) => state.drafts)
  const lastProblemId = useAppStore((state) => state.lastProblemId)
  const resetAllProgress = useAppStore((state) => state.resetAllProgress)
  const isSolved = useIsSolved()

  const totalSolved = problems.filter((problem) => isSolved(problem.id)).length
  const allSolved = totalSolved === problems.length
  const hasProgress = Object.keys(completed).length > 0 || Object.keys(drafts).length > 0

  const continueTarget = nextUnsolved(problems, isSolved, lastProblemId ?? undefined)
  const targetLocation = continueTarget ? findProblem(continueTarget.id) : undefined
  const targetLevelIndex = targetLocation ? levels.indexOf(targetLocation.level) : -1

  const confirmReset = () => {
    if (window.confirm('Clear all solved problems and diagrams in both languages?')) {
      resetAllProgress()
    }
  }

  return (
    <div className="home-screen">
      <header className="hero-card">
        <div className="hero-content">
          <h1 className="hero-title">Memory Mapper</h1>
          <p className="hero-tagline">
            Every variable is an arrow. Can you draw where they all point?
          </p>
        </div>

        <div className="hero-diagram-wrap">
          <svg
            className="hero-diagram"
            viewBox="0 0 330 130"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="hero-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 1 2 L 8 5 L 1 8 z" fill="#a9c2ff" />
              </marker>
            </defs>

            {/* Variable a */}
            <g className="hero-node hero-var-a">
              <rect
                x="8"
                y="14"
                width="48"
                height="32"
                rx="6"
                fill="var(--variable)"
                stroke="#555b6b"
                strokeWidth="1.5"
              />
              <text
                x="32"
                y="35"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#1f2430"
                fontFamily="system-ui, sans-serif"
              >
                a
              </text>
              <circle cx="56" cy="30" r="3.5" fill="#555b6b" />
            </g>

            {/* Variable b */}
            <g className="hero-node hero-var-b">
              <rect
                x="8"
                y="74"
                width="48"
                height="32"
                rx="6"
                fill="var(--variable)"
                stroke="#555b6b"
                strokeWidth="1.5"
              />
              <text
                x="32"
                y="95"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#1f2430"
                fontFamily="system-ui, sans-serif"
              >
                b
              </text>
              <circle cx="56" cy="90" r="3.5" fill="#555b6b" />
            </g>

            {/* Array [0, 1] */}
            <g className="hero-node hero-array">
              <rect
                x="116"
                y="32"
                width="84"
                height="56"
                rx="8"
                fill="var(--array)"
                stroke="#555b6b"
                strokeWidth="1.5"
              />
              {/* Slot 0 */}
              <rect
                x="124"
                y="48"
                width="30"
                height="28"
                rx="4"
                fill="rgba(255,255,255,0.85)"
                stroke="#555b6b"
                strokeWidth="1"
              />
              <text
                x="139"
                y="43"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#555b6b"
                fontFamily="ui-monospace, monospace"
              >
                0
              </text>
              <circle cx="139" cy="62" r="3" fill="#555b6b" />

              {/* Slot 1 */}
              <rect
                x="162"
                y="48"
                width="30"
                height="28"
                rx="4"
                fill="rgba(255,255,255,0.85)"
                stroke="#555b6b"
                strokeWidth="1"
              />
              <text
                x="177"
                y="43"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="#555b6b"
                fontFamily="ui-monospace, monospace"
              >
                1
              </text>
              <circle cx="177" cy="62" r="3" fill="#555b6b" />
            </g>

            {/* Scalar 1 */}
            <g className="hero-node hero-scalar-1">
              <rect
                x="248"
                y="14"
                width="64"
                height="32"
                rx="6"
                fill="var(--scalar)"
                stroke="#555b6b"
                strokeWidth="1.5"
              />
              <text
                x="280"
                y="35"
                textAnchor="middle"
                fontSize="13"
                fontWeight="600"
                fill="#1f2430"
                fontFamily="ui-monospace, monospace"
              >
                &apos;cat&apos;
              </text>
            </g>

            {/* Scalar 2 */}
            <g className="hero-node hero-scalar-2">
              <rect
                x="248"
                y="74"
                width="64"
                height="32"
                rx="6"
                fill="var(--scalar)"
                stroke="#555b6b"
                strokeWidth="1.5"
              />
              <text
                x="280"
                y="95"
                textAnchor="middle"
                fontSize="13"
                fontWeight="600"
                fill="#1f2430"
                fontFamily="ui-monospace, monospace"
              >
                42
              </text>
            </g>

            {/* Connecting arrows */}
            <path
              className="hero-arrow hero-arrow-1"
              d="M 56 30 C 86 30, 86 50, 114 50"
              stroke="#a9c2ff"
              strokeWidth="2"
              markerEnd="url(#hero-arrow)"
            />
            <path
              className="hero-arrow hero-arrow-2"
              d="M 56 90 C 86 90, 86 70, 114 70"
              stroke="#a9c2ff"
              strokeWidth="2"
              markerEnd="url(#hero-arrow)"
            />
            <path
              className="hero-arrow hero-arrow-3"
              d="M 139 62 C 160 62, 215 30, 246 30"
              stroke="#a9c2ff"
              strokeWidth="2"
              markerEnd="url(#hero-arrow)"
            />
            <path
              className="hero-arrow hero-arrow-4"
              d="M 177 62 C 200 62, 218 90, 246 90"
              stroke="#a9c2ff"
              strokeWidth="2"
              markerEnd="url(#hero-arrow)"
            />
          </svg>
        </div>
      </header>

      <section className="home-action-bar">
        <div className="home-primary-action">
          {allSolved ? (
            <div className="all-solved-banner">
              <span className="all-solved-icon">★</span>
              <span>All puzzles solved in {LANGUAGE_LABELS[language]}!</span>
            </div>
          ) : continueTarget ? (
            <button
              type="button"
              className="primary-button home-continue-button"
              onClick={() => onOpenProblem(continueTarget.id)}
            >
              <span className="home-continue-label">
                {totalSolved === 0 ? 'Start' : 'Continue ›'}
              </span>
              {totalSolved > 0 && targetLocation && (
                <span className="home-continue-subtext">
                  Level {targetLevelIndex + 1}:{' '}
                  <ProblemTitle
                    problem={continueTarget}
                    visible={!continueTarget.challenge || isSolved(continueTarget.id)}
                    language={language}
                  />
                </span>
              )}
            </button>
          ) : null}
        </div>
        <LanguageToggle />
      </section>

      <main className="home-levels">
        <div className="home-levels-header">
          <h2 className="home-levels-title">Levels</h2>
          <span className="home-levels-progress">
            {totalSolved} of {problems.length} solved in {LANGUAGE_LABELS[language]}
          </span>
        </div>

        <ol className="level-cards-list">
          {levels.map((level, levelIndex) => {
            const levelSolved = level.problems.filter((problem) =>
              isSolved(problem.id),
            ).length
            const isLevelComplete = levelSolved === level.problems.length
            const isCurrentLevel = targetLocation?.level.id === level.id

            return (
              <li key={level.id}>
                <button
                  type="button"
                  className={`level-card${isCurrentLevel ? ' current' : ''}${
                    isLevelComplete ? ' complete' : ''
                  }`}
                  onClick={() => onOpenLevel(level.id)}
                >
                  <div className="level-card-main">
                    <span className="level-card-badge">
                      {isLevelComplete ? '✓' : levelIndex + 1}
                    </span>
                    <div className="level-card-info">
                      <h3 className="level-card-title">{textIn(level.title, language)}</h3>
                      <span className="level-card-count">
                        {levelSolved} of {level.problems.length} solved
                      </span>
                    </div>
                  </div>
                  <ProgressMeter done={levelSolved} total={level.problems.length} />
                </button>
              </li>
            )
          })}
        </ol>
      </main>

      <footer className="home-footer">
        <button
          type="button"
          className="text-button home-reset"
          onClick={confirmReset}
          disabled={!hasProgress}
        >
          Reset all progress
        </button>
      </footer>
    </div>
  )
}
