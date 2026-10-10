import { useCallback, useEffect, useState } from 'react'

const PREFIX = '#/problem/'

function readProblemId(): string | null {
  return window.location.hash.startsWith(PREFIX)
    ? decodeURIComponent(window.location.hash.slice(PREFIX.length))
    : null
}

/** Tracks the open problem in the URL hash so a refresh returns to the same problem. */
export function useProblemRoute(): [string | null, (problemId: string | null) => void] {
  const [problemId, setProblemId] = useState(readProblemId)

  useEffect(() => {
    const onChange = () => setProblemId(readProblemId())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: string | null) => {
    window.location.hash = next === null ? '#/' : `${PREFIX}${encodeURIComponent(next)}`
  }, [])

  return [problemId, navigate]
}
