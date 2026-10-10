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
const STORAGE_VERSION = 5

export const progressKey = (problemId: string, language: Language) => `${problemId}:${language}`

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
      migrate: (persisted, version) => {
        if (version < 2) return initialState
        const { hints: _hints, ...kept } = persisted as Partial<AppState> & { hints?: boolean }
        const drafts = version < 5 && kept.drafts ? withScalarKinds(kept.drafts) : kept.drafts
        return { ...initialState, ...kept, ...(drafts && { drafts }) }
      },
    },
  ),
)
