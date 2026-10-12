import { useEdgesState, useNodesState } from '@xyflow/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Canvas } from '../canvas/Canvas'
import { emptyFeedback } from '../canvas/FeedbackContext'
import { toFlow } from '../canvas/layout'
import type { MemFlowEdge, MemFlowNode } from '../canvas/types'
import { formatCurriculumMessages, nextProblem, problemHint, type ProblemLocation } from '../model/levels'
import { LANGUAGE_LABELS, type Language, type VerifyResult, type WriteProblem } from '../model/types'
import { runCode } from '../run/runCode'
import { progressKey, useAppStore } from '../store/useAppStore'
import { buildRunRequest, gradeRun } from '../verify/grade'
import { CheckBar } from './CheckBar'
import { CodeEditor } from './CodeEditor'
import { DebriefView } from './DebriefView'
import { ProblemHeader } from './ProblemHeader'
import { ProblemPanel } from './ProblemPanel'
import { useDebrief } from './useDebrief'

interface WriteProblemViewProps {
  location: ProblemLocation<WriteProblem>
  language: Language
  onNavigate: (problemId: string | null) => void
  focusProblemHeading: boolean
}

export function WriteProblemView({
  location,
  language,
  onNavigate,
  focusProblemHeading,
}: WriteProblemViewProps) {
  const { problem, level, index } = location
  const key = progressKey(problem.id, language)
  const given = problem.given?.[language] ?? ''
  const then = problem.then?.[language] ?? ''

  const code = useAppStore((state) => state.codeDrafts[key] ?? '')
  const saveCodeDraft = useAppStore((state) => state.saveCodeDraft)
  const resetProblem = useAppStore((state) => state.resetProblem)
  const markCompleted = useAppStore((state) => state.markCompleted)

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const revealed =
    useAppStore((state) => !problem.challenge || state.completed[key] === true) || isAnswerRevealed

  const picture = useMemo(() => toFlow(problem.expected), [problem])
  const [nodes, setNodes, onNodesChange] = useNodesState<MemFlowNode>(picture.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<MemFlowEdge>(picture.edges)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [busy, setBusy] = useState(false)

  // A check that finishes after the learner has left must not touch state or mark progress.
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    setIsAnswerRevealed(false)
  }, [problem.id, language])

  useEffect(() => {
    setNodes(picture.nodes)
    setEdges(picture.edges)
  }, [picture, setNodes, setEdges])

  const edit = (value: string) => {
    saveCodeDraft(key, value)
    setResult(null)
  }

  const check = async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setBusy(true)
    setResult(null)
    const outcome = await runCode(buildRunRequest(problem, language, code))
    if (!mounted.current) return
    const verdict = gradeRun(problem, language, code, outcome)
    flushSync(() => {
      setBusy(false)
      setResult(verdict)
      if (verdict.ok) markCompleted(key)
    })
  }

  const reset = () => {
    setIsAnswerRevealed(false)
    setResult(null)
    resetProblem(key)
    const fresh = toFlow(problem.expected)
    setNodes(fresh.nodes)
    setEdges(fresh.edges)
  }

  const next = nextProblem(problem.id)
  const {
    isOpen: isDebriefOpen,
    hasDebrief,
    toggle: toggleDebrief,
  } = useDebrief(problem, result, language)
  const formatProse = useMemo(() => formatCurriculumMessages(problem), [problem])

  return (
    <div className="problem-screen">
      <ProblemHeader problemId={problem.id} onNavigate={onNavigate} />
      <ProblemPanel
        level={level}
        problem={problem}
        problemNumber={index + 1}
        revealed={revealed}
        language={language}
        focusHeading={focusProblemHeading}
      />
      <main className="workspace">
        {isDebriefOpen && problem.debrief ? (
          <DebriefView
            debrief={problem.debrief}
            language={language}
            formatCaption={formatProse}
          />
        ) : (
          <>
            <Canvas
              readOnly
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              setNodes={setNodes}
              setEdges={setEdges}
              feedback={emptyFeedback}
              language={language}
            />
            <div className="editor-panel">
              {given !== '' && (
                <>
                  <p className="editor-caption">Already in place:</p>
                  <pre className="code-snippet given-code">
                    <code>{given}</code>
                  </pre>
                  <p className="editor-caption">Your code runs after it:</p>
                </>
              )}
              <CodeEditor value={code} language={language} onChange={edit} />
              {then !== '' && (
                <>
                  <p className="editor-caption then-caption">Then this runs:</p>
                  <pre className="code-snippet then-code">
                    <code>{then}</code>
                  </pre>
                </>
              )}
            </div>
          </>
        )}
      </main>
      <CheckBar
        problemId={problem.id}
        result={result}
        hasNext={next !== undefined}
        busy={busy}
        onCheck={check}
        onReset={reset}
        onNext={() => next && onNavigate(next.id)}
        onBack={() => onNavigate(null)}
        successMessage="Correct! Your code builds exactly this picture."
        failureHeading="Not quite:"
        hint={problemHint(problem, language)}
        formatProse={formatProse}
        onRevealAnswer={() => setIsAnswerRevealed((prev) => !prev)}
        isAnswerRevealed={isAnswerRevealed}
        debrief={
          hasDebrief && result?.ok
            ? { open: isDebriefOpen, onToggle: toggleDebrief }
            : undefined
        }
        revealedAnswer={
          isAnswerRevealed ? (
            <div className="check-result answer-box" role="status">
              <div className="answer-box-header">
                <span className="answer-tag">Solution ({LANGUAGE_LABELS[language]}):</span>
                <button
                  type="button"
                  className="secondary-button copy-solution-button"
                  onClick={() => edit(problem.solution[language])}
                >
                  Copy to editor
                </button>
              </div>
              <pre className="code-snippet">
                <code>{problem.solution[language]}</code>
              </pre>
              <p className="answer-note">Answer revealed (not marked as complete).</p>
            </div>
          ) : undefined
        }
      />
    </div>
  )
}
