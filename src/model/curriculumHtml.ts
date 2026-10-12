import type { Language, MemoryGraph, Problem } from './types'
import { textIn } from './languages'

const HTML_TAG = /<\/?[a-z][^>]*>/i

/** True when the author already used inline HTML (debrief blocks, hand-marked constraints). */
export function containsCurriculumHtml(text: string): boolean {
  return HTML_TAG.test(text)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Wraps puzzle identifier tokens in <code> for plain curriculum prose.
 * Skips text that already contains HTML tags.
 */
export function wrapCurriculumIdentifiers(text: string, identifiers: readonly string[]): string {
  if (!text || identifiers.length === 0 || containsCurriculumHtml(text)) return text

  const unique = [...new Set(identifiers)]
    .filter((id) => /^[A-Za-z_$][\w$]*$/.test(id))
    .sort((a, b) => b.length - a.length)

  if (unique.length === 0) return text

  const pattern = new RegExp(`\\b(${unique.map(escapeRegex).join('|')})\\b`, 'g')
  return text.replace(pattern, (match) => `<code>${match}</code>`)
}

function addFromCode(names: Set<string>, code: string): void {
  for (const match of code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(match[1])
  }
  for (const match of code.matchAll(/\bdef\s+([A-Za-z_$][\w$]*)/g)) {
    names.add(match[1])
  }
  for (const match of code.matchAll(/\bfunction\s+\w+\s*\(\s*([^)]*)\)/g)) {
    for (const piece of match[1].split(',')) {
      const param = piece.trim().split(':')[0]?.trim()
      if (param && /^[A-Za-z_$][\w$]*$/.test(param)) names.add(param)
    }
  }
  for (const match of code.matchAll(/\bdef\s+\w+\s*\(\s*([^)]*)\)/g)) {
    for (const piece of match[1].split(',')) {
      const param = piece.trim().split(':')[0]?.trim()
      if (param && /^[A-Za-z_$][\w$]*$/.test(param)) names.add(param)
    }
  }
}

function addGraphIdentifiers(names: Set<string>, graph: MemoryGraph): void {
  for (const variable of graph.variables) {
    names.add(variable.name)
  }
  for (const node of Object.values(graph.nodes)) {
    if (node.type === 'object') {
      for (const entry of node.entries) {
        names.add(entry.key)
      }
    }
  }
}

/** Names that may appear in learner-facing prose for this puzzle. */
export function identifiersForProblem(problem: Problem): string[] {
  const names = new Set<string>()
  addGraphIdentifiers(names, problem.expected)

  if (problem.kind === 'write') {
    for (const constraint of problem.constraints ?? []) {
      for (const constraintCase of constraint.cases) {
        addGraphIdentifiers(names, constraintCase.expected)
      }
    }
    for (const hidden of problem.process?.hidden ?? []) {
      addGraphIdentifiers(names, hidden.expected)
    }
    const snippets = [
      problem.given?.javascript,
      problem.given?.typescript,
      problem.given?.python,
      problem.then?.javascript,
      problem.then?.typescript,
      problem.then?.python,
      problem.solution.javascript,
      problem.solution.typescript,
      problem.solution.python,
    ]
    for (const snippet of snippets) {
      if (snippet) addFromCode(names, snippet)
    }
  } else {
    addFromCode(names, problem.code.javascript)
    addFromCode(names, problem.code.python)
    addFromCode(names, problem.code.typescript)
  }

  return [...names]
}

export function curriculumProse(
  text: string | Record<Language, string>,
  language: Language,
  problem: Problem,
): string {
  const raw = typeof text === 'string' ? text : textIn(text, language)
  return wrapCurriculumIdentifiers(raw, identifiersForProblem(problem))
}
