import { beforeEach, describe, expect, it } from 'vitest'
import { hashForRoute, readRoute, type Route } from './useHashRoute'

describe('useHashRoute routing', () => {
  beforeEach(() => {
    // Provide a minimal window.location stub in the node test environment.
    const location = { hash: '' }
    // @ts-expect-error Mocking global window for node test environment
    globalThis.window = { location }
  })

  it('hashForRoute formats each screen', () => {
    expect(hashForRoute({ screen: 'home' })).toBe('#/')
    expect(hashForRoute({ screen: 'level', levelId: 'scalars' })).toBe('#/level/scalars')
    expect(hashForRoute({ screen: 'problem', problemId: 'scalars-1' })).toBe('#/problem/scalars-1')
  })

  it('readRoute parses hash paths', () => {
    window.location.hash = ''
    expect(readRoute()).toBeNull()

    window.location.hash = '#'
    expect(readRoute()).toBeNull()

    window.location.hash = '#/'
    expect(readRoute()).toEqual<Route>({ screen: 'home' })

    window.location.hash = '#/level/scalars'
    expect(readRoute()).toEqual<Route>({ screen: 'level', levelId: 'scalars' })

    window.location.hash = '#/problem/scalars-1'
    expect(readRoute()).toEqual<Route>({ screen: 'problem', problemId: 'scalars-1' })

    window.location.hash = '#/unrecognized'
    expect(readRoute()).toEqual<Route>({ screen: 'home' })
  })
})
