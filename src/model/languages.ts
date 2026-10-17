import type { ScalarKind } from './types'

export type Runtime = 'javascript' | 'python'
export type Language = 'javascript' | 'typescript' | 'python'

export const RUNTIMES: Runtime[] = ['javascript', 'python']
export const LANGUAGES: Language[] = ['javascript', 'typescript', 'python']

/** `addMilk` becomes `add_milk`. */
export const pythonName = (fn: string) => fn.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

/**
 * Marks a JavaScript `Pet` from the hidden prelude: a symbol key, so it never
 * shows up among the Pet's own fields. Python marks the class with `_dt_pet`.
 */
export const PET_MARKER = 'memory-mapper.pet'
const JSON_PET = JSON.stringify(PET_MARKER)

export interface RuntimeTraits {
  keywords: { true: string; false: string; null: string }
  kindNames: Record<ScalarKind, string>
  containers: { array: string; object: string }
  indent: string
  opaquePrelude: string
  functionName: (camelCase: string) => string
}

const RUNTIME_TRAITS: Record<Runtime, RuntimeTraits> = {
  javascript: {
    keywords: { true: 'true', false: 'false', null: 'null' },
    kindNames: { number: 'number', string: 'string', boolean: 'boolean', null: 'null' },
    containers: { array: 'array', object: 'object' },
    indent: '  ',
    opaquePrelude: `const Pet = (name) => ({ [Symbol.for(${JSON_PET})]: true, name });`,
    functionName: (name) => name,
  },
  python: {
    keywords: { true: 'True', false: 'False', null: 'None' },
    kindNames: { number: 'number', string: 'str', boolean: 'bool', null: 'NoneType' },
    containers: { array: 'list', object: 'dict' },
    indent: '    ',
    opaquePrelude: 'class Pet:\n    _dt_pet = True\n    def __init__(self, name):\n        self.name = name',
    functionName: pythonName,
  },
}

export interface LanguageProfile extends RuntimeTraits {
  language: Language
  label: string
  runtime: Runtime
  /** Source carries type annotations: strip before running, parse with the TS dialect. */
  typed: boolean
}

const PROFILES: Record<Language, LanguageProfile> = {
  javascript: {
    language: 'javascript',
    label: 'JavaScript',
    runtime: 'javascript',
    typed: false,
    ...RUNTIME_TRAITS.javascript,
  },
  typescript: {
    language: 'typescript',
    label: 'TypeScript',
    runtime: 'javascript',
    typed: true,
    ...RUNTIME_TRAITS.javascript,
  },
  python: {
    language: 'python',
    label: 'Python',
    runtime: 'python',
    typed: false,
    ...RUNTIME_TRAITS.python,
  },
}

export function languageProfile(language: Language): LanguageProfile {
  return PROFILES[language]
}

export function runtimeTraits(runtime: Runtime): RuntimeTraits {
  return RUNTIME_TRAITS[runtime]
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}

/** Replaces hintIn and the scattered `typeof … === 'string'` checks. */
export function textIn(text: string | Record<Language, string>, language: Language): string {
  if (typeof text === 'string') return text
  return text[language] ?? (text as Record<string, string>)['javascript'] ?? ''
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: PROFILES.javascript.label,
  typescript: PROFILES.typescript.label,
  python: PROFILES.python.label,
}

export const CONTAINER_NAMES: Record<Language, { array: string; object: string }> = {
  javascript: PROFILES.javascript.containers,
  typescript: PROFILES.typescript.containers,
  python: PROFILES.python.containers,
}
