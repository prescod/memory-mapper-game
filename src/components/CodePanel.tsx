import { useEffect, useRef } from 'react'
import type { Language, Level, Problem } from '../model/types'
import { LanguageToggle } from './LanguageToggle'
import { ProblemTitle } from './ProblemTitle'

interface CodePanelProps {
  level: Level
  levelNumber: number
  problem: Problem
  problemNumber: number
  /** False for an unsolved mystery problem, whose title and level description would give the answer away. */
  revealed: boolean
  language: Language
  focusHeading: boolean
}

export function CodePanel({
  level,
  levelNumber,
  problem,
  problemNumber,
  revealed,
  language,
  focusHeading,
}: CodePanelProps) {
  const mysteries = level.problems.filter((candidate) => candidate.mystery)
  const position = problem.mystery
    ? `Mystery ${mysteries.indexOf(problem) + 1} of ${mysteries.length}`
    : `Problem ${problemNumber} of ${level.problems.length - mysteries.length}`
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusHeading) heading.current?.focus()
  }, [focusHeading])

  return (
    <section className="code-panel">
      <p className="problem-position">
        Level {levelNumber} · {position}
      </p>
      <h2 ref={heading} tabIndex={-1}>
        <ProblemTitle problem={problem} visible={revealed} language={language} />
      </h2>
      <LanguageToggle />
      {problem.kind === 'draw' && (
        <pre className="code-snippet">
          <code>{problem.code[language]}</code>
        </pre>
      )}
      <h3 className="level-heading">{level.title[language]}</h3>
      {revealed ? (
        <p className="level-description">{level.description[language]}</p>
      ) : (
        <p className="level-description">
          A mystery problem: it uses only ideas from this level, without naming them. The title and
          explanation appear once you solve it.
        </p>
      )}
      <p className="level-instructions">
        {problem.kind === 'draw'
          ? 'Draw the memory as it looks after this code has run. Backspace deletes the selected node or arrow.'
          : 'Write code that leaves memory looking like the picture. Every variable in the picture must exist and point to the same things. When a value already belongs to an existing variable, refer to it by name instead of typing it again.'}
      </p>
    </section>
  )
}
