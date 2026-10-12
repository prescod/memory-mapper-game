import {
  textIn,
  type Hint,
  type Language,
  type Level,
  type Problem,
} from './types'
import { scalarsLevel } from './levels/scalars'
import { identityLevel } from './levels/identity'
import { arraysLevel } from './levels/arrays'
import { objectsLevel } from './levels/objects'
import { mutatingArraysLevel } from './levels/mutating-arrays'
import { mutatingObjectsLevel } from './levels/mutating-objects'
import { nestingLevel } from './levels/nesting'
import { copiesLevel } from './levels/copies'
import { rebindingLevel } from './levels/rebinding'
import { functionsLevel } from './levels/functions'

export {
  localize,
  SHARING_LATER,
  SHARING_REMINDER,
  type ConstraintSpec,
  type DrawSpec,
  type HiddenSpec,
  type ProcessSpec,
  type Spec,
  type SpecDebriefBlock,
  type SpecHint,
  type SpecTitle,
  type WriteSpec,
} from './levels/common'

export const levels: Level[] = [
  scalarsLevel,
  identityLevel,
  arraysLevel,
  objectsLevel,
  mutatingArraysLevel,
  mutatingObjectsLevel,
  nestingLevel,
  copiesLevel,
  rebindingLevel,
  functionsLevel,
]

export const problems: Problem[] = levels.flatMap((entry) => entry.problems)

export interface ProblemLocation<P extends Problem = Problem> {
  problem: P
  level: Level
  /** Position of the problem within its level, starting at 0. */
  index: number
}

export function findLevel(id: string): Level | undefined {
  return levels.find((level) => level.id === id)
}

export function findProblem(id: string): ProblemLocation | undefined {
  for (const entry of levels) {
    const index = entry.problems.findIndex((problem) => problem.id === id)
    if (index !== -1) return { problem: entry.problems[index], level: entry, index }
  }
  return undefined
}

export function nextUnsolved(
  list: Problem[],
  isSolved: (id: string) => boolean,
  fromId?: string,
): Problem | undefined {
  if (list.length === 0) return undefined
  const startIndex = fromId ? list.findIndex((problem) => problem.id === fromId) : -1
  const start = startIndex === -1 ? 0 : startIndex
  for (let offset = 0; offset < list.length; offset++) {
    const candidate = list[(start + offset) % list.length]
    if (!isSolved(candidate.id)) {
      return candidate
    }
  }
  return undefined
}

export function previousProblem(id: string): Problem | undefined {
  const position = problems.findIndex((problem) => problem.id === id)
  return position <= 0 ? undefined : problems[position - 1]
}

export function nextProblem(id: string): Problem | undefined {
  const position = problems.findIndex((problem) => problem.id === id)
  return position === -1 ? undefined : problems[position + 1]
}

export function hintIn(hint: Hint, language: Language): string {
  return textIn(hint, language)
}

export function problemHint(problem: Problem, language: Language): string | undefined {
  return problem.hint ? textIn(problem.hint, language) : undefined
}

export function problemAbout(problem: Problem, language: Language): string | undefined {
  return problem.about ? textIn(problem.about, language) : undefined
}

export function problemTitle(problem: Problem, language: Language): string {
  return textIn(problem.title, language)
}
