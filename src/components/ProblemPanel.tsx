import { useEffect, useRef, useState } from 'react'
import { hintIn, problemAbout } from '../model/levels'
import type { Language, Level, Problem } from '../model/types'
import { useMediaQuery } from '../useMediaQuery'
import { ProblemTitle } from './ProblemTitle'

interface ProblemPanelProps {
  level: Level
  levelNumber: number
  problem: Problem
  problemNumber: number
  /** False for an unsolved mystery problem, whose title and level description would give the answer away. */
  revealed: boolean
  language: Language
  focusHeading: boolean
}

export function ProblemPanel({
  level,
  levelNumber,
  problem,
  problemNumber,
  revealed,
  language,
  focusHeading,
}: ProblemPanelProps) {
  const mysteries = level.problems.filter((candidate) => candidate.mystery)
  const position = problem.mystery
    ? `Mystery ${mysteries.indexOf(problem) + 1} of ${mysteries.length}`
    : `Problem ${problemNumber} of ${level.problems.length - mysteries.length}`
  const heading = useRef<HTMLHeadingElement>(null)
  const summaryRef = useRef<HTMLElement>(null)
  const wide = useMediaQuery('(min-width: 900px)')
  const [aboutOpen, setAboutOpen] = useState(wide)

  useEffect(() => {
    setAboutOpen(wide)
  }, [wide])

  useEffect(() => {
    if (focusHeading) heading.current?.focus({ preventScroll: true })
  }, [focusHeading])

  return (
    <section className="problem-panel">
      <p className="problem-position">
        Level {levelNumber} · {position}
      </p>
      <div className="problem-title-row">
        <h2 className="problem-title" ref={heading} tabIndex={-1}>
          <ProblemTitle problem={problem} visible={revealed} language={language} />
        </h2>
      </div>
      {problem.kind === 'draw' && (
        <pre className="code-snippet">
          <code>{problem.code[language]}</code>
        </pre>
      )}
      {problem.kind === 'write' && problem.constraints && problem.constraints.length > 0 && (
        <aside className="problem-constraints">
          <h3 className="problem-constraints-heading">
            {problem.constraints.length === 1 ? 'Special constraint' : 'Special constraints'}
          </h3>
          <ul>
            {problem.constraints.map((constraint, index) => (
              <li key={index}>{hintIn(constraint.rule, language)}</li>
            ))}
          </ul>
        </aside>
      )}
      <details
        className="problem-about"
        open={aboutOpen}
        onToggle={(event) => setAboutOpen(event.currentTarget.open)}
      >
        <summary ref={summaryRef}>
          <span className="problem-about-chevron" aria-hidden="true">
            ▸
          </span>
          About this problem
          {aboutOpen && (
            <span className="problem-about-toggle" aria-hidden="true">
              Hide
            </span>
          )}
        </summary>
        <h3 className="level-heading">{level.title[language]}</h3>
        {revealed ? (
          <p className="level-description">{problemAbout(problem, language) ?? level.description[language]}</p>
        ) : (
          <p className="level-description">
            A mystery problem: it uses only ideas from this level, without naming them. The title
            and explanation appear once you solve it.
          </p>
        )}
        <p className="level-instructions">
          {problem.kind === 'draw'
            ? 'Draw the memory as it looks after this code has run. To add an arrow, tap the dot below a block, then tap what it points to, or drag from the dot. Select a block or arrow, then tap Delete (or press Backspace).'
            : 'Write code that leaves memory looking like the picture. Every variable in the picture must exist and point to the same things.'}
        </p>
        {!wide && (
          <button
            type="button"
            className="text-button problem-about-done"
            onClick={() => {
              setAboutOpen(false)
              summaryRef.current?.focus()
            }}
          >
            Got it
          </button>
        )}
      </details>
    </section>
  )
}
