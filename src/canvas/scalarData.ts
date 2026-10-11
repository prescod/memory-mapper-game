import {
  canonicalNumber,
  formatScalar,
  hasSurroundingQuotes,
  parseScalar,
  stripSurroundingQuotes,
} from '../model/scalar'
import type { Language, ScalarMem } from '../model/types'
import type { ScalarData } from './types'

export function scalarFromData(data: ScalarData, language: Language): ScalarMem {
  switch (data.kind) {
    case 'auto':
      return parseScalar(data.text, language)
    case 'string':
      return { type: 'scalar', kind: 'string', value: stripSurroundingQuotes(data.text) }
    case 'number':
      return { type: 'scalar', kind: 'number', value: canonicalNumber(data.text) ?? data.text.trim() }
    case 'boolean':
      return { type: 'scalar', kind: 'boolean', value: data.text === 'false' ? 'false' : 'true' }
    case 'null':
      return { type: 'scalar', kind: 'null', value: 'null' }
  }
}

/** Switches a Scalar node's kind, keeping as much of the value already entered as the new kind can hold. */
export function changeKind(data: ScalarData, kind: ScalarData['kind'], language: Language): ScalarData {
  const current = scalarFromData(data, language)
  const meant = current.otherLanguageValue ?? current
  switch (kind) {
    case 'auto':
      return { kind, text: data.kind === 'auto' ? data.text : formatScalar(current, language) }
    case 'string':
      if (data.kind === 'string') return { kind, text: data.text }
      if (hasSurroundingQuotes(data.text)) return { kind, text: data.text.trim() }
      return { kind, text: current.kind === 'null' ? '' : formatScalar(current, language) }
    case 'number':
      return { kind, text: meant.kind === 'number' ? meant.value : (canonicalNumber(meant.value) ?? '') }
    case 'boolean':
      return { kind, text: meant.kind === 'boolean' ? meant.value : 'true' }
    case 'null':
      return { kind, text: '' }
  }
}
