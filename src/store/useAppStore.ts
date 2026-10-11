import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Language } from '../model/types'
import { toPersistableDraft, withScalarKinds, type Draft } from './draft'

export interface AppState {
  language: Language
  /** Keyed by `progressKey`: solving a problem in one language does not solve it in the other. */
  completed: Record<string, boolean>
  drafts: Record<string, Draft>
  /** Learner-written code for picture-to-code problems, keyed like `drafts`. */
  codeDrafts: Record<string, string>
  setLanguage: (language: Language) => void
  markCompleted: (key: string) => void
  saveDraft: (key: string, draft: Draft) => void
  saveCodeDraft: (key: string, code: string) => void
  /** Clears the draft and the solved state, so a mystery problem's title is hidden again. */
  resetProblem: (key: string) => void
  resetAllProgress: () => void
}

export const STORAGE_KEY = 'memory-model-visualizer'
const STORAGE_VERSION = 6

export const progressKey = (problemId: string, language: Language) => `${problemId}:${language}`

/** Old problem id to its replacement after the scalars/identity reorg. Absent ids were dropped. */
const RENAMED_PROBLEMS: Record<string, string> = {
  'numbers-1': 'scalars-1',
  'numbers-2': 'scalars-2',
  'numbers-3': 'scalars-3',
  'numbers-4': 'scalars-4',
  'numbers-5': 'scalars-5',
  'numbers-8': 'scalars-6',
  'numbers-9': 'scalars-7',
  'numbers-10': 'scalars-8',
  'numbers-11': 'scalars-11',
  'numbers-12': 'scalars-9',
  'numbers-13': 'scalars-13',
  'numbers-14': 'scalars-14',
  'numbers-15': 'scalars-15',
  'simple-values-1': 'scalars-12',
  'simple-values-4': 'identity-4',
  'simple-values-5': 'identity-5',
  'simple-values-9': 'scalars-10',
  'simple-values-10': 'identity-9',
  'simple-values-12': 'identity-15',
}

/** `arrays` ids reused by a different puzzle after identity moved to its own level. */
const DROPPED_ARRAYS = new Set([
  'arrays-4',
  'arrays-5',
  'arrays-8',
  'arrays-9',
  'arrays-10',
  'arrays-12',
  'arrays-13',
  'arrays-14',
  'arrays-15',
])

/**
 * Moves stored progress to renamed problem ids. Keys for dropped puzzles, and
 * for `arrays` puzzles whose picture changed under a reused id, are left out.
 */
function remapProblemIds<T>(records: Record<string, T>): Record<string, T> {
  const next: Record<string, T> = {}
  for (const [key, value] of Object.entries(records)) {
    const separator = key.lastIndexOf(':')
    const problemId = separator === -1 ? key : key.slice(0, separator)
    const renamed = RENAMED_PROBLEMS[problemId]
    if (renamed !== undefined) {
      next[`${renamed}${key.slice(problemId.length)}`] ??= value
    } else if (
      !problemId.startsWith('numbers-') &&
      !problemId.startsWith('simple-values-') &&
      !DROPPED_ARRAYS.has(problemId)
    ) {
      next[key] ??= value
    }
  }
  return next
}

const initialState = { language: 'javascript' as Language, completed: {}, drafts: {}, codeDrafts: {} }

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setLanguage: (language) => set({ language }),
      markCompleted: (key) => set((state) => ({ completed: { ...state.completed, [key]: true } })),
      saveDraft: (key, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [key]: toPersistableDraft(draft) } })),
      saveCodeDraft: (key, code) =>
        set((state) => ({ codeDrafts: { ...state.codeDrafts, [key]: code } })),
      resetProblem: (key) =>
        set((state) => {
          const { [key]: _draft, ...drafts } = state.drafts
          const { [key]: _code, ...codeDrafts } = state.codeDrafts
          const { [key]: _completed, ...completed } = state.completed
          return { drafts, codeDrafts, completed }
        }),
      resetAllProgress: () => set({ completed: {}, drafts: {}, codeDrafts: {} }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ language, completed, drafts, codeDrafts }) => ({
        language,
        completed,
        drafts,
        codeDrafts,
      }),
      // Version 1 keyed progress by level id, and those levels no longer exist.
      // Version 2 predates written-code drafts but its progress is still valid.
      // Version 3 also stored a hints setting, which no longer exists.
      // Version 4 scalar nodes had no kind.
      // Version 6 merged the numbers and simple-values levels into scalars and
      // moved reference sharing into a new identity level, so renamed problems
      // carry their progress over and dropped ones lose it.
      migrate: (persisted, version) => {
        if (version < 2) return initialState
        const { hints: _hints, ...kept } = persisted as Partial<AppState> & { hints?: boolean }
        const drafts = version < 5 && kept.drafts ? withScalarKinds(kept.drafts) : kept.drafts
        const state = { ...initialState, ...kept, ...(drafts && { drafts }) }
        if (version < 6) {
          for (const key of ['completed', 'drafts', 'codeDrafts'] as const) {
            state[key] = remapProblemIds(state[key] as Record<string, unknown>) as never
          }
        }
        return state
      },
    },
  ),
)
