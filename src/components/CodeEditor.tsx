import type { KeyboardEvent } from 'react'
import { languageProfile, type Language } from '../model/languages'

interface CodeEditorProps {
  value: string
  language: Language
  onChange: (value: string) => void
}

/** A plain textarea that indents with Tab, which is all a few lines of code need. */
export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab' || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    const field = event.currentTarget
    const { selectionStart, selectionEnd } = field
    const indent = languageProfile(language).indent
    onChange(value.slice(0, selectionStart) + indent + value.slice(selectionEnd))
    const caret = selectionStart + indent.length
    requestAnimationFrame(() => field.setSelectionRange(caret, caret))
  }

  return (
    <textarea
      className="code-editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      aria-label="Your code"
      placeholder="Write your code here"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
    />
  )
}
