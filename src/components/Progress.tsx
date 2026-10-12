import { useCallback } from 'react'
import { progressKey, useAppStore } from '../store/useAppStore'

export function useIsSolved(): (problemId: string) => boolean {
  const language = useAppStore((state) => state.language)
  const completed = useAppStore((state) => state.completed)
  return useCallback(
    (problemId: string) => completed[progressKey(problemId, language)] === true,
    [completed, language],
  )
}

export function ProgressMeter({ done, total }: { done: number; total: number }) {
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div
      className="progress-meter"
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${done} of ${total} completed`}
    >
      <div className="progress-meter-fill" style={{ width: `${percentage}%` }} />
    </div>
  )
}
