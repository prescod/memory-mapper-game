interface CurriculumHtmlProps {
  html: string
  className?: string
  /** Block wrapper for multi-sentence prose; default inline span. */
  block?: boolean
}

export function CurriculumHtml({ html, className = 'curriculum-html', block = false }: CurriculumHtmlProps) {
  if (block) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
