import { useEdgesState, useNodesState, type OnEdgesChange, type OnNodesChange } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '../canvas/Canvas'
import { emptyFeedback, feedbackFromErrors } from '../canvas/FeedbackContext'
import { toFlow } from '../canvas/layout'
import type { MemFlowEdge, MemFlowNode } from '../canvas/types'
import { levels, nextProblem, problemHint, type ProblemLocation } from '../model/levels'
import type { DrawProblem, Language, VerifyResult } from '../model/types'
import { progressKey, useAppStore } from '../store/useAppStore'
import { quotedLiteralErrors } from '../canvas/quotedLiteral'
import { toGraph } from '../verify/toGraph'
import { verify } from '../verify/verify'
import { CheckBar } from './CheckBar'
import { ProblemHeader } from './ProblemHeader'
import { ProblemPanel } from './ProblemPanel'

const AUTOSAVE_DELAY_MS = 300

interface ProblemViewProps {
  location: ProblemLocation<DrawProblem>
  language: Language
  onNavigate: (problemId: string | null) => void
  focusProblemHeading: boolean
}

export function ProblemView({
  location,
  language,
  onNavigate,
  focusProblemHeading,
}: ProblemViewProps) {
  const { problem, level, index } = location
  const key = progressKey(problem.id, language)

  const draft = useAppStore((state) => state.drafts[key])
  const saveDraft = useAppStore((state) => state.saveDraft)
  const resetProblem = useAppStore((state) => state.resetProblem)
  const markCompleted = useAppStore((state) => state.markCompleted)

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const userDraftRef = useRef<{ nodes: MemFlowNode[]; edges: MemFlowEdge[] } | null>(null)
  const isAnswerRevealedRef = useRef(false)
  isAnswerRevealedRef.current = isAnswerRevealed

  const revealed =
    useAppStore((state) => !problem.mystery || state.completed[key] === true) || isAnswerRevealed

  const [nodes, setNodes, onNodesChange] = useNodesState<MemFlowNode>(draft?.nodes ?? [])
  const [edges, setEdges, onEdgesChange] = useEdgesState<MemFlowEdge>(draft?.edges ?? [])
  const [result, setResult] = useState<VerifyResult | null>(null)

  const latest = useRef({ nodes, edges })
  latest.current = { nodes, edges }

  useEffect(() => {
    setIsAnswerRevealed(false)
    userDraftRef.current = null
  }, [problem.id, language])

  useEffect(() => {
    if (isAnswerRevealed) return
    const timer = window.setTimeout(() => saveDraft(key, { nodes, edges }), AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [nodes, edges, key, saveDraft, isAnswerRevealed])

  // Flush on leaving so an edit made within the debounce window is not lost.
  useEffect(() => () => {
    if (!isAnswerRevealedRef.current) {
      saveDraft(key, latest.current)
    }
  }, [key, saveDraft])

  const handleNodesChange: OnNodesChange<MemFlowNode> = useCallback(
    (changes) => {
      if (
        changes.some(
          (change) => change.type === 'add' || change.type === 'remove' || change.type === 'replace',
        )
      ) {
        setResult(null)
      }
      onNodesChange(changes)
    },
    [onNodesChange],
  )

  const handleEdgesChange: OnEdgesChange<MemFlowEdge> = useCallback(
    (changes) => {
      if (changes.some((change) => change.type !== 'select')) setResult(null)
      onEdgesChange(changes)
    },
    [onEdgesChange],
  )

  const feedback = useMemo(
    () => (result && !result.ok ? feedbackFromErrors(result.errors) : emptyFeedback),
    [result],
  )

  const check = () => {
    if (isAnswerRevealed) return
    const formatErrors = quotedLiteralErrors(nodes, language)
    const outcome =
      formatErrors.length > 0
        ? { ok: false, errors: formatErrors }
        : verify(toGraph(nodes, edges, language), problem.expected, problem.hints, language)
    setResult(outcome)
    if (outcome.ok) markCompleted(key)
  }

  const reset = () => {
    userDraftRef.current = null
    setIsAnswerRevealed(false)
    setNodes([])
    setEdges([])
    setResult(null)
    resetProblem(key)
  }

  const handleRevealAnswer = () => {
    if (isAnswerRevealed) {
      if (userDraftRef.current) {
        setNodes(userDraftRef.current.nodes)
        setEdges(userDraftRef.current.edges)
      } else {
        setNodes(draft?.nodes ?? [])
        setEdges(draft?.edges ?? [])
      }
      setIsAnswerRevealed(false)
      setResult(null)
    } else {
      userDraftRef.current = { nodes, edges }
      const expectedFlow = toFlow(problem.expected)
      setNodes(expectedFlow.nodes)
      setEdges(expectedFlow.edges)
      setIsAnswerRevealed(true)
      setResult(null)
    }
  }

  const next = nextProblem(problem.id)

  return (
    <div className="problem-screen">
      <ProblemHeader problemId={problem.id} onNavigate={onNavigate} />
      <ProblemPanel
        level={level}
        levelNumber={levels.indexOf(level) + 1}
        problem={problem}
        problemNumber={index + 1}
        revealed={revealed}
        language={language}
        focusHeading={focusProblemHeading}
      />
      <main className="workspace">
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          setNodes={setNodes}
          setEdges={setEdges}
          feedback={feedback}
          language={language}
        />
      </main>
      <CheckBar
        problemId={problem.id}
        result={result}
        hasNext={next !== undefined}
        onCheck={check}
        onReset={reset}
        onNext={() => next && onNavigate(next.id)}
        onBack={() => onNavigate(null)}
        hint={problemHint(problem, language)}
        onRevealAnswer={handleRevealAnswer}
        isAnswerRevealed={isAnswerRevealed}
        disableCheck={isAnswerRevealed}
        revealedAnswer={
          isAnswerRevealed ? (
            <div className="check-result answer-box" role="status">
              <span className="answer-tag">Answer revealed</span>
              <p className="answer-note">
                The canvas shows the expected diagram. This problem is not marked as complete. Tap
                &ldquo;Answer&rdquo; again to return to your work.
              </p>
            </div>
          ) : undefined
        }
      />
    </div>
  )
}
