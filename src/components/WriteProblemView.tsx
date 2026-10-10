import { useEdgesState, useNodesState } from '@xyflow/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '../canvas/Canvas'
import { emptyFeedback } from '../canvas/FeedbackContext'
import { toFlow } from '../canvas/layout'
import type { MemFlowEdge, MemFlowNode } from '../canvas/types'
import { levels, nextProblem, problemHint, type ProblemLocation } from '../model/levels'
import { LANGUAGE_LABELS, type Language, type VerifyResult, type WriteProblem } from '../model/types'
import { runCode } from '../run/runCode'
import { progressKey, useAppStore } from '../store/useAppStore'
import { buildRunRequest, gradeRun } from '../verify/grade'
import { CheckBar } from './CheckBar'
import { CodeEditor } from './CodeEditor'
import { CodePanel } from './CodePanel'
import { ProblemNavigation } from './ProblemNavigation'

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

  const code = useAppStore((state) => state.codeDrafts[key] ?? '')
  const saveCodeDraft = useAppStore((state) => state.saveCodeDraft)
  const resetProblem = useAppStore((state) => state.resetProblem)
  const markCompleted = useAppStore((state) => state.markCompleted)

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const revealed =
    useAppStore((state) => !problem.mystery || state.completed[key] === true) || isAnswerRevealed

  const picture = useMemo(() => toFlow(problem.expected), [problem])
  const [nodes, , onNodesChange] = useNodesState<MemFlowNode>(picture.nodes)
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

  const edit = (value: string) => {
    saveCodeDraft(key, value)
    setResult(null)
  }

  const check = async () => {
    setBusy(true)
    setResult(null)
    const outcome = await runCode(buildRunRequest(problem, language, code))
    if (!mounted.current) return
    setBusy(false)
    const verdict = gradeRun(problem, language, code, outcome)
    setResult(verdict)
    if (verdict.ok) markCompleted(key)
  }

  const reset = () => {
    setIsAnswerRevealed(false)
    setResult(null)
    resetProblem(key)
  }

  const handleRevealAnswer = () => {
    setIsAnswerRevealed((prev) => !prev)
  }

  const next = nextProblem(problem.id)

  return (
    <div className="level-view">
      <aside className="sidebar">
        <ProblemNavigation problemId={problem.id} onNavigate={onNavigate} />
        <CodePanel
          level={level}
          levelNumber={levels.indexOf(level) + 1}
          problem={problem}
          problemNumber={index + 1}
          revealed={revealed}
          language={language}
          focusHeading={focusProblemHeading}
        />
      </aside>
      <main className="workspace">
        <Canvas
          readOnly
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={() => {}}
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
              <p className="editor-caption">
                Your code runs after it <span className="editor-hint">(refer to existing variables by name — do not re-type their values)</span>:
              </p>
            </>
          )}
          <CodeEditor value={code} language={language} onChange={edit} />
        </div>
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
          onRevealAnswer={handleRevealAnswer}
          isAnswerRevealed={isAnswerRevealed}
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
                    Copy to Editor
                  </button>
                </div>
                <pre className="code-snippet solution-code">
                  <code>{problem.solution[language]}</code>
                </pre>
                <p className="answer-note">
                  Actual answer revealed (not marked as complete).
                </p>
              </div>
            ) : undefined
          }
        />
      </main>
    </div>
  )
}
