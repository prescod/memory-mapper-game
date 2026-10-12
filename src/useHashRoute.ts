import { useCallback, useEffect, useState } from 'react'

export type Route =
  | { screen: 'home' }
  | { screen: 'level'; levelId: string }
  | { screen: 'problem'; problemId: string }

const PROBLEM_PREFIX = '#/problem/'
const LEVEL_PREFIX = '#/level/'

export function hashForRoute(route: Route): string {
  switch (route.screen) {
    case 'home':
      return '#/'
    case 'level':
      return `${LEVEL_PREFIX}${encodeURIComponent(route.levelId)}`
    case 'problem':
      return `${PROBLEM_PREFIX}${encodeURIComponent(route.problemId)}`
  }
}

export function readRoute(): Route | null {
  const hash = window.location.hash
  if (hash === '' || hash === '#') {
    return null
  }
  if (hash.startsWith(PROBLEM_PREFIX)) {
    const raw = hash.slice(PROBLEM_PREFIX.length)
    return { screen: 'problem', problemId: decodeURIComponent(raw) }
  }
  if (hash.startsWith(LEVEL_PREFIX)) {
    const raw = hash.slice(LEVEL_PREFIX.length)
    return { screen: 'level', levelId: decodeURIComponent(raw) }
  }
  return { screen: 'home' }
}

export function useRoute(resume: () => Route): [Route, (next: Route) => void] {
  const [route, setRoute] = useState<Route>(() => {
    const current = readRoute()
    if (current) return current
    const fallback = resume()
    window.history.replaceState(null, '', hashForRoute(fallback))
    return fallback
  })

  useEffect(() => {
    const onChange = () => setRoute(readRoute() ?? { screen: 'home' })
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    window.location.hash = hashForRoute(next)
  }, [])

  return [route, navigate]
}
