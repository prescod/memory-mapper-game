import { languageProfile, type Language } from '../model/languages'

/** `source` with the hidden prelude prepended, for execution but never display. */
export function withOpaquePrelude(language: Language, source: string): string {
  return `${languageProfile(language).opaquePrelude}\n${source}`
}
