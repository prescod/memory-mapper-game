import { useMemo } from 'react'
import { Canvas } from '../canvas/Canvas'
import { emptyFeedback } from '../canvas/FeedbackContext'
import { toFlow } from '../canvas/layout'
import type { DebriefBlock, Hint, Language, MemoryGraph } from '../model/types'

function DebriefDiagram({
  diagram,
  caption,
  verdict,
  language,
}: {
  diagram: MemoryGraph
  caption: Hint
  verdict?: 'correct' | 'incorrect'
  language: Language
}) {
  const { nodes, edges } = useMemo(() => toFlow(diagram), [diagram])
  const captionText = typeof caption === 'string' ? caption : caption[language]

  return (
    <figure className="debrief-figure">
      {verdict && (
        <span className={`debrief-badge debrief-badge-${verdict}`}>
          {verdict === 'correct' ? 'Correct' : 'Not correct'}
        </span>
      )}
      <div className="debrief-canvas-wrapper">
        <Canvas
          nodes={nodes}
          edges={edges}
          onNodesChange={() => {}}
          onEdgesChange={() => {}}
          setNodes={() => {}}
          setEdges={() => {}}
          feedback={emptyFeedback}
          language={language}
          compact
        />
      </div>
      <figcaption className="debrief-caption">{captionText}</figcaption>
    </figure>
  )
}

interface DebriefViewProps {
  debrief: DebriefBlock[]
  language: Language
}

export function DebriefView({ debrief, language }: DebriefViewProps) {
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
            const html = typeof block.html === 'string' ? block.html : block.html[language]
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
            />
          )
        })}
      </div>
    </div>
  )
}
