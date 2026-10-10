import { useEffect, useState, type ReactNode } from 'react'
import type { VerifyResult } from '../model/types'

interface CheckBarProps {
  result: VerifyResult | null
  hasNext: boolean
  onCheck: () => void
  onReset: () => void
  onNext: () => void
  onBack: () => void
  /** True while the learner's code is running, which disables checking. */
  busy?: boolean
  successMessage?: string
  failureHeading?: string
  problemId?: string
  hint?: string
  onRevealAnswer?: () => void
  isAnswerRevealed?: boolean
  revealedAnswer?: ReactNode
  disableCheck?: boolean
}

export function CheckBar({
  result,
  hasNext,
  onCheck,
  onReset,
  onNext,
  onBack,
  busy = false,
  successMessage = 'Correct! Your diagram matches memory exactly.',
  failureHeading = 'Not quite. Fix the highlighted items:',
  problemId,
  hint,
  onRevealAnswer,
  isAnswerRevealed = false,
  revealedAnswer,
  disableCheck = false,
}: CheckBarProps) {
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    setShowHint(false)
  }, [problemId])

  const passed = result?.ok === true

  return (
    <div className={`check-bar${passed ? ' success' : ''}`}>
      <div className="check-actions">
        <button
          type="button"
          className="primary-button"
          onClick={onCheck}
          disabled={busy || disableCheck}
        >
          {busy ? 'Running…' : 'Check Answer'}
        </button>
        <button type="button" className="secondary-button" onClick={onReset} disabled={busy}>
          Reset
        </button>
        {hint && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowHint((prev) => !prev)}
            disabled={busy}
          >
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
        )}
        {onRevealAnswer && (
          <button
            type="button"
            className="secondary-button"
            onClick={onRevealAnswer}
            disabled={busy}
          >
            {isAnswerRevealed ? 'Hide Answer' : 'Reveal Answer'}
          </button>
        )}
      </div>

      {showHint && hint && (
        <div className="check-result hint-box" role="status">
          <span className="hint-tag">Hint</span>
          <span className="hint-text">{hint}</span>
        </div>
      )}

      {revealedAnswer}

      {passed && (
        <div className="check-result success-message" role="status">
          <span className="success-burst" aria-hidden="true">
            ✓
          </span>
          <span>{successMessage}</span>
          {hasNext ? (
            <button type="button" className="primary-button" onClick={onNext}>
              Next problem
            </button>
          ) : (
            <button type="button" className="primary-button" onClick={onBack}>
              Back to all problems
            </button>
          )}
        </div>
      )}

      {result && !result.ok && (
        <div className="check-result error-list" role="alert">
          <strong>{failureHeading}</strong>
          <ul>
            {result.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
