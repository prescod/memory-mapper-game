import type { Language } from '../model/types'

/**
 * Defines the `Pet` helper used by the identity level. In JavaScript it is an
 * alias for `Symbol`, so every call builds a genuinely unique value whose
 * description is its label, with identical call syntax to Python and no `new`.
 * In Python it is a minimal class holding the label privately. Either way the
 * snapshot encoders read only the label: a Pet is never shown as a transparent
 * object or dict, and learners only ever see calls to it, never this definition.
 */
export const OPAQUE_PRELUDE: Record<Language, string> = {
  javascript: 'const Pet = Symbol;',
  python: 'class Pet:\n    def __init__(self, name):\n        self._pet_label = name',
}

/** `source` with the hidden prelude prepended, for execution but never display. */
export function withOpaquePrelude(language: Language, source: string): string {
  return `${OPAQUE_PRELUDE[language]}\n${source}`
}
