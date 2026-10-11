import { useEffect, useId, useRef, useState } from 'react'
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
  const codeId = useId()
  const [codeVisible, setCodeVisible] = useState(true)
  const wide = useMediaQuery('(min-width: 900px)')

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
        {problem.kind === 'draw' && (
          <button
            type="button"
            className="text-button"
            aria-expanded={codeVisible}
            aria-controls={codeId}
            onClick={() => setCodeVisible((visible) => !visible)}
          >
            {codeVisible ? 'Hide code' : 'Show code'}
          </button>
        )}
      </div>
      {problem.kind === 'draw' && codeVisible && (
        <pre className="code-snippet" id={codeId}>
          <code>{problem.code[language]}</code>
        </pre>
      )}
      <details className="problem-about" open={wide}>
        <summary>About this problem</summary>
        <h3 className="level-heading">{level.title[language]}</h3>
        {revealed ? (
          <p className="level-description">{level.description[language]}</p>
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
      </details>
    </section>
  )
}
