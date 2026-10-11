import { hasSurroundingQuotes, quotedLiteralMessage } from '../model/scalar'
import type { Language, VerifyError } from '../model/types'
import type { MemFlowNode } from './types'

export function quotedLiteralFieldError(raw: string, language: Language): string | undefined {
  if (raw.trim() === '' || hasSurroundingQuotes(raw)) return undefined
  return quotedLiteralMessage(language)
}

export function quotedLiteralErrors(nodes: MemFlowNode[], language: Language): VerifyError[] {
  const errors: VerifyError[] = []
  for (const node of nodes) {
    if (node.type === 'scalar' && node.data.kind === 'string') {
      const message = quotedLiteralFieldError(node.data.text, language)
      if (message) errors.push({ message, nodeId: node.id })
    }
    if (node.type === 'pet') {
      const message = quotedLiteralFieldError(node.data.label, language)
      if (message) errors.push({ message, nodeId: node.id })
    }
  }
  return errors
}
