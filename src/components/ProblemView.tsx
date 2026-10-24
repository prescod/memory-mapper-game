import { useEdgesState, useNodesState, type OnEdgesChange, type OnNodesChange } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '../canvas/Canvas'
import { emptyFeedback, feedbackFromErrors } from '../canvas/FeedbackContext'
import { toFlow } from '../canvas/layout'
import type { MemFlowEdge, MemFlowNode } from '../canvas/types'
import { formatCurriculumMessages, nextProblem, problemHint, type ProblemLocation } from '../model/levels'
import type { DrawProblem, Language, VerifyResult } from '../model/types'
import { progressKey, useAppStore } from '../store/useAppStore'
import { quotedLiteralErrors } from '../canvas/quotedLiteral'
import { toGraph } from '../verify/toGraph'
import { verify } from '../verify/verify'
import { CheckBar } from './CheckBar'
import { CoachCard, useCoach } from './Coach'
import { DebriefView } from './DebriefView'
import { ProblemHeader } from './ProblemHeader'
import { ProblemPanel } from './ProblemPanel'
import { useDebrief } from './useDebrief'

const AUTOSAVE_DELAY_MS = 300
const START_MARGIN = 40
const START_ARROW_STRETCH = 80

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
  const { problem, level } = location
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
    useAppStore((state) => !problem.challenge || state.completed[key] === true) || isAnswerRevealed

  // A fresh copy each time, so Reset puts back the picture the puzzle started with.
  const startFlow = () => {
    if (!problem.start) return { nodes: [] as MemFlowNode[], edges: [] as MemFlowEdge[] }
    const flow = toFlow(problem.start)
    // Away from the toolbar, with values lower down so every arrow is long enough to tap.
    const nodes = flow.nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x + START_MARGIN,
        y: node.position.y + START_MARGIN + (node.type === 'variable' ? 0 : START_ARROW_STRETCH),
      },
    }))
    return { nodes, edges: flow.edges }
  }

  const [initial] = useState(() => draft ?? startFlow())
  const [nodes, setNodes, onNodesChange] = useNodesState<MemFlowNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<MemFlowEdge>(initial.edges)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [hintShown, setHintShown] = useState(false)
  // Bumped by Reset so the canvas remounts and its view returns to where it started.
  const [resetCount, setResetCount] = useState(0)

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
    setResetCount((count) => count + 1)
    userDraftRef.current = null
    setIsAnswerRevealed(false)
    const fresh = startFlow()
    setNodes(fresh.nodes)
    setEdges(fresh.edges)
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
  const {
    isOpen: isDebriefOpen,
    hasDebrief,
    toggle: toggleDebrief,
  } = useDebrief(problem, result, language)
  const formatProse = useMemo(() => formatCurriculumMessages(problem), [problem])
  const coach = useCoach(problem.coach, {
    nodes,
    edges,
    result,
    hint: hintShown,
    answer: isAnswerRevealed,
    code: '',
    language,
  })

  return (
    <div className="problem-screen">
      <ProblemHeader problemId={problem.id} onNavigate={onNavigate} />
      <ProblemPanel
        level={level}
        problem={problem}
        revealed={revealed}
        language={language}
        focusHeading={focusProblemHeading}
        coach={<CoachCard coach={coach} problem={problem} language={language} />}
      />
      <main className="workspace">
        {isDebriefOpen && problem.debrief ? (
          <DebriefView
            debrief={problem.debrief}
            language={language}
            formatCaption={formatProse}
          />
        ) : (
          <Canvas
            key={resetCount}
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            setNodes={setNodes}
            setEdges={setEdges}
            feedback={feedback}
            language={language}
          />
        )}
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
        onHintChange={setHintShown}
        formatProse={formatProse}
        onRevealAnswer={handleRevealAnswer}
        isAnswerRevealed={isAnswerRevealed}
        disableCheck={isAnswerRevealed}
        debrief={
          hasDebrief && result?.ok
            ? { open: isDebriefOpen, onToggle: toggleDebrief }
            : undefined
        }
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
