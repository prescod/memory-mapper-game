import type { Problem } from './types'

export interface ConceptDependencyError {
  problemId: string
  concept: string
  reason: 'not_yet_taught' | 'never_taught' | 'empty_concept'
  message: string
}

/**
 * Validates that every concept declared in `reliesOn` on any problem has
 * already been introduced by `teaches` on a strictly earlier problem in the curriculum.
 *
 * Catches:
 * - Empty concept strings.
 * - Concepts relied upon that are never taught anywhere in the curriculum (e.g. typos or missing tutorial problems).
 * - Concepts relied upon before the problem that teaches them (ordering violations).
 */
export function checkConceptDependencies(problems: Problem[]): ConceptDependencyError[] {
  const allTaught = new Set<string>()
  const errors: ConceptDependencyError[] = []

  for (const problem of problems) {
    for (const concept of problem.teaches ?? []) {
      if (!concept.trim()) {
        errors.push({
          problemId: problem.id,
          concept,
          reason: 'empty_concept',
          message: `Problem "${problem.id}" declares an empty concept in teaches.`,
        })
      } else {
        allTaught.add(concept)
      }
    }
  }

  const taughtSoFar = new Set<string>()

  for (const problem of problems) {
    for (const concept of problem.reliesOn ?? []) {
      if (!concept.trim()) {
        errors.push({
          problemId: problem.id,
          concept,
          reason: 'empty_concept',
          message: `Problem "${problem.id}" declares an empty concept in reliesOn.`,
        })
      } else if (!allTaught.has(concept)) {
        errors.push({
          problemId: problem.id,
          concept,
          reason: 'never_taught',
          message: `Problem "${problem.id}" relies on concept "${concept}", but that concept is never taught anywhere in the curriculum.`,
        })
      } else if (!taughtSoFar.has(concept)) {
        errors.push({
          problemId: problem.id,
          concept,
          reason: 'not_yet_taught',
          message: `Problem "${problem.id}" relies on concept "${concept}" before it has been taught. It is taught later in the curriculum.`,
        })
      }
    }

    for (const concept of problem.teaches ?? []) {
      if (concept.trim()) {
        taughtSoFar.add(concept)
      }
    }
  }

  return errors
}
