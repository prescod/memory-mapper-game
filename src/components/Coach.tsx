import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { curriculumProse } from '../model/levels'
import type { CoachStep, CoachTarget, Language, Problem } from '../model/types'
import { COACH_TARGETS, nextCoachIndex, type CoachState } from './coachSteps'
import { CurriculumHtml } from './CurriculumHtml'

/** The coach's place in a problem's steps, moving forward as the learner works. */
export function useCoach(steps: CoachStep[] | undefined, state: CoachState) {
  const [index, setIndex] = useState(0)
  const [closed, setClosed] = useState(false)
  const current = steps ? nextCoachIndex(steps, index, state) : 0

  useEffect(() => {
    if (current !== index) setIndex(current)
  }, [current, index])

  const step = steps && !closed ? steps[current] : undefined
  return {
    step,
    position: current + 1,
    total: steps?.length ?? 0,
    read: () => setIndex(current + 1),
    close: () => setClosed(true),
  }
}

interface CoachCardProps {
  coach: ReturnType<typeof useCoach>
  problem: Problem
  language: Language
}

/** The current coach step, shown above the puzzle, with a ring around what it talks about. */
export function CoachCard({ coach, problem, language }: CoachCardProps) {
  const { step } = coach
  if (!step) return null
  const html = curriculumProse(step.text, language, problem)
  return (
    <aside className="coach-card" aria-live="polite">
      <div className="coach-card-header">
        <span className="coach-card-tag">
          Step {coach.position} of {coach.total}
        </span>
        <button
          type="button"
          className="icon-button coach-card-close"
          aria-label="Hide the coach"
          onClick={coach.close}
        >
          ×
        </button>
      </div>
      <CurriculumHtml block html={html} />
      {'read' in step.done && (
        <button type="button" className="secondary-button coach-card-read" onClick={coach.read}>
          Got it
        </button>
      )}
      {step.target && <CoachRing key={coach.position} target={step.target} />}
    </aside>
  )
}

interface Box {
  left: number
  top: number
  width: number
  height: number
}

const sameBox = (a: Box | null, b: Box | null) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height)

/** The first element on screen matching `target`, measured each frame so the ring follows it. */
function useTargetBox(target: CoachTarget): Box | null {
  const [box, setBox] = useState<Box | null>(null)

  useEffect(() => {
    let frame = 0
    let last: Box | null = null
    const measure = () => {
      let found: Box | null = null
      for (const element of document.querySelectorAll(COACH_TARGETS[target])) {
        const rect = element.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          found = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
          break
        }
      }
      if (!sameBox(found, last)) {
        last = found
        setBox(found)
      }
      frame = requestAnimationFrame(measure)
    }
    measure()
    return () => cancelAnimationFrame(frame)
  }, [target])

  return box
}

const RING_GAP = 4

function CoachRing({ target }: { target: CoachTarget }) {
  const box = useTargetBox(target)
  if (!box) return null
  // Kept on screen, so a ring around something as big as the canvas is not cut off.
  const left = Math.max(0, box.left - RING_GAP)
  const top = Math.max(0, box.top - RING_GAP)
  const right = Math.min(window.innerWidth, box.left + box.width + RING_GAP)
  const bottom = Math.min(window.innerHeight, box.top + box.height + RING_GAP)
  return createPortal(
    <div
      className="coach-ring"
      aria-hidden="true"
      style={{ left, top, width: right - left, height: bottom - top }}
    />,
    document.body,
  )
}
