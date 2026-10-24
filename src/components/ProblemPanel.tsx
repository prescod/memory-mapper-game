import { useEffect, useRef, useState, type ReactNode } from 'react'
import { feedbackUrl } from '../feedback'
import { textIn } from '../model/languages'
import { curriculumProse, problemAbout, problemTip } from '../model/levels'
import { CurriculumHtml } from './CurriculumHtml'
import type { Language, Level, Problem } from '../model/types'
import { useMediaQuery } from '../useMediaQuery'
import { ProblemTitle } from './ProblemTitle'

interface ProblemPanelProps {
  level: Level
  problem: Problem
  /** False for an unsolved challenge problem, whose title and level description would give the answer away. */
  revealed: boolean
  language: Language
  focusHeading: boolean
  /** Tutorial coaching, shown right under the title. */
  coach?: ReactNode
}

export function ProblemPanel({
  level,
  problem,
  revealed,
  language,
  focusHeading,
  coach,
}: ProblemPanelProps) {
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
      <div className="problem-title-row">
        <h2 className="problem-title" ref={heading} tabIndex={-1}>
          <ProblemTitle problem={problem} level={level} visible={revealed} language={language} />
        </h2>
      </div>
      {coach}
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
              <li key={index}>
                <CurriculumHtml html={curriculumProse(constraint.rule, language, problem)} />
              </li>
            ))}
          </ul>
        </aside>
      )}
      {problemTip(problem, language) && (
        <aside className="problem-tip">
          <h3 className="problem-tip-heading">Good to know</h3>
          <CurriculumHtml
            block
            html={curriculumProse(problemTip(problem, language) as string, language, problem)}
          />
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
        <h3 className="level-heading">{textIn(level.title, language)}</h3>
        {revealed ? (
          <CurriculumHtml
            block
            className="level-description curriculum-html"
            html={curriculumProse(
              problemAbout(problem, language) ?? level.description,
              language,
              problem,
            )}
          />
        ) : (
          <p className="level-description">
            A challenge problem: it uses only ideas from this level, without naming them. The title
            and explanation appear once you solve it.
          </p>
        )}
        <p className="level-instructions">
          {problem.kind === 'draw'
            ? 'Draw the memory as it looks after this code has run. To add an arrow, tap the dot below a block, then tap what it points to, or drag from the dot. Select a block or arrow, then tap Delete (or press Backspace).'
            : 'Write code that leaves memory looking like the picture. Every variable in the picture must exist and point to the same things.'}
        </p>
        <p className="problem-feedback">
          Stuck, or think something is wrong?{' '}
          <a
            href={feedbackUrl({ problemId: problem.id, language })}
            target="_blank"
            rel="noopener"
          >
            Send feedback on this puzzle
          </a>
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
