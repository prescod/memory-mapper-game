import { useEffect, useRef } from 'react'
import { Home } from './components/Home'
import { LevelView } from './components/LevelView'
import { ProblemView } from './components/ProblemView'
import { WriteProblemView } from './components/WriteProblemView'
import { findLevel, findProblem } from './model/levels'
import { useAppStore } from './store/useAppStore'
import { useRoute, type Route } from './useHashRoute'

function resumeRoute(): Route {
  const lastProblemId = useAppStore.getState().lastProblemId
  if (lastProblemId && findProblem(lastProblemId)) {
    return { screen: 'problem', problemId: lastProblemId }
  }
  return { screen: 'home' }
}

export function App() {
  const [route, navigate] = useRoute(resumeRoute)
  const language = useAppStore((state) => state.language)
  const setLastProblem = useAppStore((state) => state.setLastProblem)

  const currentProblemId = route.screen === 'problem' ? route.problemId : null
  const previousProblemId = useRef(currentProblemId)
  const focusProblemHeading = previousProblemId.current !== currentProblemId

  useEffect(() => {
    previousProblemId.current = currentProblemId
  }, [currentProblemId])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  useEffect(() => {
    if (route.screen === 'problem' && findProblem(route.problemId)) {
      setLastProblem(route.problemId)
    }
  }, [route, setLastProblem])

  if (route.screen === 'home') {
    return (
      <Home
        onOpenProblem={(problemId) => navigate({ screen: 'problem', problemId })}
        onOpenLevel={(levelId) => navigate({ screen: 'level', levelId })}
      />
    )
  }

  if (route.screen === 'level') {
    const level = findLevel(route.levelId)
    if (!level) {
      return (
        <Home
          onOpenProblem={(problemId) => navigate({ screen: 'problem', problemId })}
          onOpenLevel={(levelId) => navigate({ screen: 'level', levelId })}
        />
      )
    }
    return (
      <LevelView
        level={level}
        onOpenProblem={(problemId) => navigate({ screen: 'problem', problemId })}
        onOpenLevel={(levelId) => navigate({ screen: 'level', levelId })}
        onBackToLevels={() => navigate({ screen: 'home' })}
      />
    )
  }

  const location = findProblem(route.problemId)
  if (!location) {
    return (
      <Home
        onOpenProblem={(problemId) => navigate({ screen: 'problem', problemId })}
        onOpenLevel={(levelId) => navigate({ screen: 'level', levelId })}
      />
    )
  }

  const { problem } = location
  const key = `${problem.id}:${language}`
  const handleProblemNavigate = (nextProblemId: string | null) => {
    if (nextProblemId === null) {
      navigate({ screen: 'level', levelId: location.level.id })
    } else {
      navigate({ screen: 'problem', problemId: nextProblemId })
    }
  }

  if (problem.kind === 'write') {
    return (
      <WriteProblemView
        key={key}
        location={{ ...location, problem }}
        language={language}
        onNavigate={handleProblemNavigate}
        focusProblemHeading={focusProblemHeading}
      />
    )
  }
  return (
    <ProblemView
      key={key}
      location={{ ...location, problem }}
      language={language}
      onNavigate={handleProblemNavigate}
      focusProblemHeading={focusProblemHeading}
    />
  )
}
