import { levels, nextUnsolved } from '../model/levels'
import { textIn, type Level, type Problem } from '../model/types'
import { useAppStore } from '../store/useAppStore'
import { LanguageToggle } from './LanguageToggle'
import { ProblemTitle } from './ProblemTitle'
import { ProgressMeter, useIsSolved } from './Progress'

interface LevelViewProps {
  level: Level
  onOpenProblem: (problemId: string) => void
  onOpenLevel: (levelId: string) => void
  onBackToLevels: () => void
}

export function LevelView({
  level,
  onOpenProblem,
  onOpenLevel,
  onBackToLevels,
}: LevelViewProps) {
  const language = useAppStore((state) => state.language)
  const lastProblemId = useAppStore((state) => state.lastProblemId)
  const isSolved = useIsSolved()

  const levelIndex = levels.findIndex((candidate) => candidate.id === level.id)
  const prevLevel = levelIndex > 0 ? levels[levelIndex - 1] : undefined
  const nextLevel = levelIndex < levels.length - 1 ? levels[levelIndex + 1] : undefined

  const tutorialProblems = level.problems.filter((problem) => !problem.challenge)
  const challengeProblems = level.problems.filter((problem) => problem.challenge)

  const solvedCount = level.problems.filter((problem) => isSolved(problem.id)).length
  const isComplete = solvedCount === level.problems.length

  const continueTarget = nextUnsolved(
    level.problems,
    isSolved,
    lastProblemId ?? undefined,
  )

  const renderChips = (list: Problem[], startIndex: number) => (
    <ol className="problem-list">
      {list.map((problem, idx) => {
        const done = isSolved(problem.id)
        return (
          <li key={problem.id}>
            <button
              type="button"
              className={`problem-chip${done ? ' done' : ''}`}
              onClick={() => onOpenProblem(problem.id)}
            >
              <span className="problem-chip-number">{startIndex + idx + 1}</span>
              <span className="problem-chip-title">
                <ProblemTitle
                  problem={problem}
                  visible={!problem.challenge || done}
                  language={language}
                />
              </span>
              {done && (
                <span className="problem-chip-check" aria-label="Completed">
                  ✓
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )

  return (
    <div className="level-screen">
      <header className="level-screen-header">
        <button
          type="button"
          className="text-button level-screen-back"
          onClick={onBackToLevels}
        >
          ‹ Levels
        </button>
        <LanguageToggle />
      </header>

      <main className="level-screen-body">
        <div className="level-hero">
          <div className="level-hero-badge">{level.number}</div>
          <div className="level-hero-info">
            <h1 className="level-hero-title">{textIn(level.title, language)}</h1>
            <p className="level-hero-count">
              {solvedCount} of {level.problems.length} solved
            </p>
          </div>
        </div>

        <ProgressMeter done={solvedCount} total={level.problems.length} />

        {!isComplete && continueTarget && (
          <button
            type="button"
            className="primary-button level-continue-button"
            onClick={() => onOpenProblem(continueTarget.id)}
          >
            Continue puzzle ›
          </button>
        )}

        <section className="level-problem-section">
          <h2 className="level-section-heading">Tutorial problems</h2>
          {renderChips(tutorialProblems, 0)}
        </section>

        {challengeProblems.length > 0 && (
          <section className="level-problem-section">
            <div className="challenge-heading-row">
              <h2 className="challenge-heading">Challenge problems</h2>
              <span className="challenge-heading-note">Titles appear once solved</span>
            </div>
            {renderChips(challengeProblems, tutorialProblems.length)}
          </section>
        )}

        <nav className="level-footer-nav" aria-label="Level navigation">
          {prevLevel ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => onOpenLevel(prevLevel.id)}
            >
              ‹ Level {prevLevel.number}
            </button>
          ) : (
            <span />
          )}
          {nextLevel && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => onOpenLevel(nextLevel.id)}
            >
              Level {nextLevel.number} ›
            </button>
          )}
        </nav>
      </main>
    </div>
  )
}
