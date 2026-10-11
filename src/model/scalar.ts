import { LANGUAGES, type Language, type ScalarKind, type ScalarMem } from './types'

const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

const KEYWORDS: Record<Language, { true: string; false: string; null: string }> = {
  javascript: { true: 'true', false: 'false', null: 'null' },
  python: { true: 'True', false: 'False', null: 'None' },
}

const KIND_NAMES: Record<Language, Record<ScalarKind, string>> = {
  javascript: { number: 'number', string: 'string', boolean: 'boolean', null: 'null' },
  python: { number: 'number', string: 'str', boolean: 'bool', null: 'NoneType' },
}

/** The canonical text of a number, or `undefined` when `text` is not one. */
export function canonicalNumber(text: string): string | undefined {
  const trimmed = text.trim()
  return NUMBER_PATTERN.test(trimmed) ? String(Number(trimmed)) : undefined
}

function keywordValue(text: string, language: Language): ScalarMem | undefined {
  const words = KEYWORDS[language]
  if (text === words.null) return { type: 'scalar', kind: 'null', value: 'null' }
  if (text === words.true) return { type: 'scalar', kind: 'boolean', value: 'true' }
  if (text === words.false) return { type: 'scalar', kind: 'boolean', value: 'false' }
  return undefined
}

/**
 * Interprets free text typed into a Scalar node. Quoted text is always a
 * string; unquoted text is read as a number, or as `language`'s spelling of a
 * boolean or null, and as a string otherwise.
 */
export function parseScalar(raw: string, language: Language): ScalarMem {
  const text = raw.trim()

  const quoted = /^(['"`])(.*)\1$/s.exec(text)
  if (quoted) {
    return { type: 'scalar', kind: 'string', value: quoted[2] }
  }
  const keyword = keywordValue(text, language)
  if (keyword) return keyword

  const number = canonicalNumber(text)
  if (number !== undefined) return { type: 'scalar', kind: 'number', value: number }

  const foreign = LANGUAGES.filter((other) => other !== language)
    .map((other) => keywordValue(text, other))
    .find((value) => value !== undefined)
  return foreign
    ? { type: 'scalar', kind: 'string', value: text, otherLanguageValue: { kind: foreign.kind, value: foreign.value } }
    : { type: 'scalar', kind: 'string', value: text }
}

export function scalarFromJs(value: number | string | boolean | null): ScalarMem {
  if (value === null) return { type: 'scalar', kind: 'null', value: 'null' }
  if (typeof value === 'number') return { type: 'scalar', kind: 'number', value: String(value) }
  if (typeof value === 'boolean') return { type: 'scalar', kind: 'boolean', value: String(value) }
  return { type: 'scalar', kind: 'string', value }
}

/** Writes a scalar the way `language` would display it, e.g. `None` in Python and `null` in JS. */
export function formatScalar(scalar: { kind: ScalarKind; value: string }, language: Language): string {
  switch (scalar.kind) {
    case 'null':
      return KEYWORDS[language].null
    case 'boolean':
      return scalar.value === 'true' ? KEYWORDS[language].true : KEYWORDS[language].false
    case 'number':
      return scalar.value
    case 'string':
      return JSON.stringify(scalar.value)
  }
}

export function scalarKindName(kind: ScalarKind, language: Language): string {
  return KIND_NAMES[language][kind]
}

export function stringQuote(_language?: Language): string {
  return '"'
}

/** Inner text when `raw` is wrapped in matching quotes; otherwise `raw` trimmed. */
export function stripSurroundingQuotes(raw: string): string {
  const text = raw.trim()
  const quoted = /^(['"`])(.*)\1$/s.exec(text)
  return quoted ? quoted[2] : text
}

/** True when `raw` is empty or wrapped in a matching pair of `'`, `"`, or `` ` ``. */
export function hasSurroundingQuotes(raw: string): boolean {
  const text = raw.trim()
  if (text === '') return true
  return /^(['"`])(.*)\1$/s.test(text)
}

export function quotedLiteralMessage(language: Language): string {
  const q = stringQuote(language)
  return `Surround the value with ${q} quotes, like ${q}text${q}.`
}
