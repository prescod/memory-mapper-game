import type { Language } from '../model/types'

/**
 * Defines the `makeObject` / `make_object` helper used by the identity level.
 * It builds a plain object holding one curriculum-only tag entry, so the
 * existing snapshot encoders accept it with no new node type. The definition
 * is prepended at run time only; learners just see calls to it.
 */
export const OPAQUE_PRELUDE: Record<Language, string> = {
  javascript: 'function makeObject(label) { return { $: label }; }',
  python: 'def make_object(label):\n    return {"$": label}',
}

/** `source` with the hidden prelude prepended, for execution but never display. */
export function withOpaquePrelude(language: Language, source: string): string {
  return `${OPAQUE_PRELUDE[language]}\n${source}`
}

/** How many hidden lines `withOpaquePrelude` adds, for error line attribution. */
export function opaquePreludeLineCount(language: Language): number {
  return OPAQUE_PRELUDE[language].split('\n').length
}
