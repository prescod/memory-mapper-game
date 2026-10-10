import { useEffect, useRef } from 'react'
import { Dashboard } from './components/Dashboard'
import { ProblemView } from './components/ProblemView'
import { WriteProblemView } from './components/WriteProblemView'
import { findProblem } from './model/levels'
import { useAppStore } from './store/useAppStore'
import { useProblemRoute } from './useHashRoute'

export function App() {
  const [problemId, navigate] = useProblemRoute()
  const language = useAppStore((state) => state.language)
  const previousProblemId = useRef(problemId)
  const focusProblemHeading = previousProblemId.current !== problemId

  useEffect(() => {
    previousProblemId.current = problemId
  }, [problemId])

  const location = problemId ? findProblem(problemId) : undefined

  if (!location) return <Dashboard onOpen={navigate} />
  const { problem } = location
  const key = `${problem.id}:${language}`
  if (problem.kind === 'write') {
    return (
      <WriteProblemView
        key={key}
        location={{ ...location, problem }}
        language={language}
        onNavigate={navigate}
        focusProblemHeading={focusProblemHeading}
      />
    )
  }
  return (
    <ProblemView
      key={key}
      location={{ ...location, problem }}
      language={language}
      onNavigate={navigate}
      focusProblemHeading={focusProblemHeading}
    />
  )
}
