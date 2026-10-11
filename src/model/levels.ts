import type {
  Hint,
  Language,
  Level,
  Problem,
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

export function findProblem(id: string): ProblemLocation | undefined {
  for (const entry of levels) {
    const index = entry.problems.findIndex((problem) => problem.id === id)
    if (index !== -1) return { problem: entry.problems[index], level: entry, index }
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
  return typeof hint === 'string' ? hint : hint[language]
}

export function problemHint(problem: Problem, language: Language): string | undefined {
  return problem.hint && hintIn(problem.hint, language)
}

export function problemAbout(problem: Problem, language: Language): string | undefined {
  return problem.about && hintIn(problem.about, language)
}

export function problemTitle(problem: Problem, language: Language): string {
  return typeof problem.title === 'string' ? problem.title : problem.title[language]
}
