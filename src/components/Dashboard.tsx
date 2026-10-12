import { levels, problems } from '../model/levels'
import { LANGUAGE_LABELS, textIn, type Problem } from '../model/types'
import { progressKey, useAppStore } from '../store/useAppStore'
import { LanguageToggle } from './LanguageToggle'
import { ProblemTitle } from './ProblemTitle'

export function Dashboard({ onOpen }: { onOpen: (problemId: string) => void }) {
  const language = useAppStore((state) => state.language)
  const completed = useAppStore((state) => state.completed)
  const hasProgress = useAppStore(
    (state) => Object.keys(state.completed).length > 0 || Object.keys(state.drafts).length > 0,
  )
  const resetAllProgress = useAppStore((state) => state.resetAllProgress)

  const isDone = (problemId: string) => completed[progressKey(problemId, language)] === true
  const doneCount = problems.filter((problem) => isDone(problem.id)).length

  const confirmReset = () => {
    if (window.confirm('Clear all solved problems and diagrams in both languages?')) {
      resetAllProgress()
    }
  }

  const chips = (list: Problem[]) => (
    <ol className="problem-list">
      {list.map((problem, problemIndex) => {
        const done = isDone(problem.id)
        return (
          <li key={problem.id}>
            <button
              type="button"
              className={`problem-chip${done ? ' done' : ''}`}
              onClick={() => onOpen(problem.id)}
            >
              <span className="problem-chip-number">{problemIndex + 1}</span>
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
    <div className="dashboard">
      <h1>Memory Mapper</h1>
      <p className="dashboard-intro">
        Read a snippet, then build the diagram of variables, values, lists or arrays, and objects
        or dictionaries that exists in memory once it has run. Some problems go the other way: you
        see the diagram and write the code that produces it. Every problem is available in both
        languages, and progress is tracked separately for each.
      </p>
      <p className="dashboard-intro">
        Each level ends with challenge problems that test its ideas on new examples without naming
        them. Their titles appear once you solve them.
      </p>
      <div className="dashboard-controls">
        <LanguageToggle />
        <p className="dashboard-progress">
          {doneCount} of {problems.length} completed in {LANGUAGE_LABELS[language]}
        </p>
        <button
          type="button"
          className="text-button dashboard-reset"
          onClick={confirmReset}
          disabled={!hasProgress}
        >
          Reset all progress
        </button>
      </div>
      <ol className="level-list">
        {levels.map((level, levelIndex) => {
          const levelDone = level.problems.filter((problem) => isDone(problem.id)).length
          return (
            <li key={level.id} className="level-section">
              <div className="level-header">
                <span className="level-number">{levelIndex + 1}</span>
                <h2 className="level-title">{textIn(level.title, language)}</h2>
                <span className="level-count">
                  {levelDone}/{level.problems.length}
                </span>
              </div>
              {chips(level.problems.filter((problem) => !problem.challenge))}
              <h3 className="challenge-heading">Challenge problems</h3>
              {chips(level.problems.filter((problem) => problem.challenge))}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
