import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { VerifyResult } from '../model/types'
import { useMediaQuery } from '../useMediaQuery'

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

/**
 * The buttons pinned to the bottom of a problem, with a sheet above them for
 * the hint, the revealed answer and the result of the last check.
 */
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
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setShowHint(false)
  }, [problemId])

  // Anything new to show reopens a sheet the learner closed.
  useEffect(() => {
    setDismissed(false)
  }, [result, showHint, isAnswerRevealed])

  const passed = result?.ok === true
  const hintVisible = showHint && hint !== undefined
  const hasFeedback = hintVisible || revealedAnswer !== undefined || result !== null
  const sheetOpen = hasFeedback && !dismissed

  const bar = useRef<HTMLDivElement>(null)
  const inline = useMediaQuery('(min-width: 900px)')

  const closeSheet = useCallback(() => {
    setShowHint(false)
    setDismissed(true)
  }, [])

  // On a phone the sheet covers the bottom of the workspace, so touching anything else puts it away.
  // On a wide screen it sits below the workspace and stays while the learner fixes things.
  useEffect(() => {
    if (!sheetOpen || inline) return
    const onPointerDown = (event: PointerEvent) => {
      if (!bar.current?.contains(event.target as Node)) closeSheet()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [sheetOpen, inline, closeSheet])

  return (
    <div className="action-bar" ref={bar}>
      {sheetOpen && (
        <div className="feedback-sheet">
          <button
            type="button"
            className="icon-button feedback-close"
            aria-label="Close"
            onClick={closeSheet}
          >
            ×
          </button>

          {hintVisible && (
            <div className="check-result hint-box" role="status">
              <span className="hint-tag">Hint</span>
              <span>{hint}</span>
            </div>
          )}

          {revealedAnswer}

          {passed && (
            <div className="check-result success-message" role="status">
              <span className="success-burst" aria-hidden="true">
                ✓
              </span>
              <span className="success-text">{successMessage}</span>
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
      )}

      <div className="action-row">
        <button type="button" className="secondary-button" onClick={onReset} disabled={busy}>
          Reset
        </button>
        {hint && (
          <button
            type="button"
            className="secondary-button"
            aria-pressed={showHint}
            onClick={() => setShowHint((prev) => !prev)}
            disabled={busy}
          >
            Hint
          </button>
        )}
        {onRevealAnswer && (
          <button
            type="button"
            className="secondary-button"
            aria-pressed={isAnswerRevealed}
            onClick={onRevealAnswer}
            disabled={busy}
          >
            Answer
          </button>
        )}
        {passed ? (
          <button
            type="button"
            className="primary-button action-primary"
            onClick={hasNext ? onNext : onBack}
          >
            {hasNext ? 'Next problem ›' : 'All problems'}
          </button>
        ) : (
          <button
            type="button"
            className="primary-button action-primary"
            onClick={onCheck}
            disabled={busy || disableCheck}
          >
            {busy ? 'Running…' : 'Check'}
          </button>
        )}
      </div>
    </div>
  )
}
