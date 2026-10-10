import type { ScalarMem } from './types'

const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

/**
 * Interprets text typed into a Scalar node. Quoted text is always a string;
 * unquoted text is read as a number, boolean or null where it looks like one,
 * and as a string otherwise.
 */
export function parseScalar(raw: string): ScalarMem {
  const text = raw.trim()

  const quoted = /^(['"`])(.*)\1$/s.exec(text)
  if (quoted) {
    return { type: 'scalar', kind: 'string', value: quoted[2] }
  }
  if (text === 'null' || text === 'None') {
    return { type: 'scalar', kind: 'null', value: 'null' }
  }
  if (text === 'true' || text === 'True') {
    return { type: 'scalar', kind: 'boolean', value: 'true' }
  }
  if (text === 'false' || text === 'False') {
    return { type: 'scalar', kind: 'boolean', value: 'false' }
  }
  if (NUMBER_PATTERN.test(text)) {
    return { type: 'scalar', kind: 'number', value: String(Number(text)) }
  }
  return { type: 'scalar', kind: 'string', value: text }
}

export function scalarFromJs(value: number | string | boolean | null): ScalarMem {
  if (value === null) return { type: 'scalar', kind: 'null', value: 'null' }
  if (typeof value === 'number') return { type: 'scalar', kind: 'number', value: String(value) }
  if (typeof value === 'boolean') return { type: 'scalar', kind: 'boolean', value: String(value) }
  return { type: 'scalar', kind: 'string', value }
}

export function describeScalar(scalar: ScalarMem): string {
  return scalar.kind === 'string' ? JSON.stringify(scalar.value) : scalar.value
}
