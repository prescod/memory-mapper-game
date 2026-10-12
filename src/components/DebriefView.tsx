import { useEffect, useMemo, useRef, useState } from 'react'
import { useEdgesState, useNodesState } from '@xyflow/react'
import { Canvas } from '../canvas/Canvas'
import { emptyFeedback } from '../canvas/FeedbackContext'
import { toFlow } from '../canvas/layout'
import type { MemFlowEdge, MemFlowNode } from '../canvas/types'
import type { DebriefBlock, Hint, Language, MemoryGraph } from '../model/types'
import { textIn } from '../model/languages'
import { CurriculumHtml } from './CurriculumHtml'

const DEFAULT_HEIGHT = 240
const MIN_HEIGHT = 160
const MAX_HEIGHT = 800

function DebriefDiagram({
  diagram,
  caption,
  verdict,
  language,
  formatCaption,
}: {
  diagram: MemoryGraph
  caption: Hint
  verdict?: 'correct' | 'incorrect'
  language: Language
  formatCaption: (text: string) => string
}) {
  const flow = useMemo(() => toFlow(diagram), [diagram])
  const [nodes, setNodes, onNodesChange] = useNodesState<MemFlowNode>(flow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<MemFlowEdge>(flow.edges)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [isResizing, setIsResizing] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNodes(flow.nodes)
    setEdges(flow.edges)
  }, [flow, setNodes, setEdges])

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const currentActualHeight = wrapperRef.current
      ? wrapperRef.current.getBoundingClientRect().height
      : height
    const startY = e.clientY
    const startHeight = currentActualHeight
    setIsResizing(true)

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY
      const next = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight + delta))
      setHeight(next)
    }

    const onPointerUp = () => {
      setIsResizing(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHeight((h) => Math.min(MAX_HEIGHT, h + 20))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHeight((h) => Math.max(MIN_HEIGHT, h - 20))
    }
  }

  const captionText = textIn(caption, language)

  return (
    <figure className="debrief-figure">
      {verdict && (
        <span className={`debrief-badge debrief-badge-${verdict}`}>
          {verdict === 'correct' ? 'Correct' : 'Not correct'}
        </span>
      )}
      <div
        ref={wrapperRef}
        className="debrief-canvas-wrapper"
        style={{ height: `${height}px` }}
      >
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes}
          setEdges={setEdges}
          feedback={emptyFeedback}
          language={language}
          compact
        />
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize diagram"
        title="Drag or use up/down arrows to resize, double-click to reset"
        tabIndex={0}
        className={`debrief-resize-handle${isResizing ? ' resizing' : ''}`}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => setHeight(DEFAULT_HEIGHT)}
      >
        <span className="debrief-resize-grip" aria-hidden="true" />
      </div>
      <figcaption className="debrief-caption">
        <CurriculumHtml html={formatCaption(captionText)} />
      </figcaption>
    </figure>
  )
}

interface DebriefViewProps {
  debrief: DebriefBlock[]
  language: Language
  formatCaption: (text: string) => string
}

export function DebriefView({ debrief, language, formatCaption }: DebriefViewProps) {
  return (
    <div className="debrief" role="region" aria-label="Problem debrief">
      <div className="debrief-banner" role="status">
        <span className="success-burst" aria-hidden="true">
          ✓
        </span>
        <span className="debrief-banner-title">Correct!</span>
      </div>
      <h3 className="debrief-heading">What this problem shows</h3>
      <div className="debrief-body">
        {debrief.map((block, index) => {
          if ('html' in block) {
            const html = textIn(block.html, language)
            return (
              <div
                key={index}
                className="debrief-html"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )
          }
          return (
            <DebriefDiagram
              key={index}
              diagram={block.diagram}
              caption={block.caption}
              verdict={block.verdict}
              language={language}
              formatCaption={formatCaption}
            />
          )
        })}
      </div>
    </div>
  )
}
