import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  const items = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (name: string) => items.get(name) ?? null,
    setItem: (name: string, value: string) => void items.set(name, value),
    removeItem: (name: string) => void items.delete(name),
  } as Storage
})

import { progressKey, useAppStore } from './useAppStore'

const draft = { nodes: [], edges: [] }
const js = progressKey('scalars-1', 'javascript')
const py = progressKey('scalars-1', 'python')

describe('progress resets', () => {
  beforeEach(() => useAppStore.setState({ completed: {}, drafts: {}, codeDrafts: {} }))

  it('resetProblem clears only that problem and language', () => {
    const { markCompleted, saveDraft, saveCodeDraft, resetProblem } = useAppStore.getState()
    markCompleted(js)
    markCompleted(py)
    saveDraft(js, draft)
    saveDraft(py, draft)
    saveCodeDraft(js, 'x = 1')
    saveCodeDraft(py, 'x = 1')

    resetProblem(js)

    const { completed, drafts, codeDrafts } = useAppStore.getState()
    expect(completed).toEqual({ [py]: true })
    expect(Object.keys(drafts)).toEqual([py])
    expect(Object.keys(codeDrafts)).toEqual([py])
  })

  it('resetAllProgress clears every solve and draft but keeps settings', () => {
    const { markCompleted, saveDraft, saveCodeDraft, setLanguage, resetAllProgress } =
      useAppStore.getState()
    setLanguage('python')
    markCompleted(js)
    saveDraft(py, draft)
    saveCodeDraft(py, 'x = 1')

    resetAllProgress()

    const { completed, drafts, codeDrafts, language } = useAppStore.getState()
    expect(completed).toEqual({})
    expect(drafts).toEqual({})
    expect(codeDrafts).toEqual({})
    expect(language).toBe('python')
  })
})
