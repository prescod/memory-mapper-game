import { explainBrokenRules } from '../model/process'
import { formatScalar } from '../model/scalar'
import type {
  ConstraintCase,
  Language,
  MemNode,
  MemoryGraph,
  VerifyError,
  VerifyResult,
  WriteProblem,
} from '../model/types'
import { withOpaquePrelude } from '../run/opaquePrelude'
import type { RunRequest } from '../run/protocol'
import type { RunOutcome } from '../run/runCode'
import { checkSource, findLiteralReusedHint } from './source'
import { verify } from './verify'

/**
 * What to run to grade `code` for `problem`: the starter code, the process rules
 * and any alternate starters. Alternates are the hidden cases followed by every
 * constraint case, in order.
 */
export function buildRunRequest(problem: WriteProblem, language: Language, code: string): RunRequest {
  const start = (source: string) =>
    problem.opaquePrelude === true ? withOpaquePrelude(language, source) : source
  const then = problem.then?.[language]
  return {
    language,
    given: start(problem.given?.[language] ?? ''),
    code,
    then,
    names: problem.expected.variables.map((variable) => variable.name),
    checks: problem.process?.runtime,
    alternateGivens: [
      ...(problem.process?.hidden ?? []).map((alternate) => start(alternate.given[language])),
      ...(problem.constraints ?? []).flatMap((constraint) =>
        constraint.cases.map((constraintCase) => start(constraintCase.given[language])),
      ),
    ],
    alternateThens: [
      ...(problem.process?.hidden ?? []).map(() => then ?? ''),
      ...(problem.constraints ?? []).flatMap((constraint) =>
        constraint.cases.map((constraintCase) => constraintCase.then?.[language] ?? then ?? ''),
      ),
    ],
  }
}

const NOT_GENERAL =
  'Your code builds the right picture here, but not when the starting values change. Build the result from what is already there instead of typing it out.'

/**
 * Judges a finished run in stages, so feedback is about one kind of mistake at
 * a time: the code must run, then build the right picture, then do it the way
 * the puzzle asks, then honour its constraints, and finally keep working from
 * other starting values.
 */
export function gradeRun(
  problem: WriteProblem,
  language: Language,
  code: string,
  outcome: RunOutcome,
): VerifyResult {
  const fail = (messages: string[]): VerifyResult => ({
    ok: false,
    errors: messages.map((message): VerifyError => ({ message })),
  })

  if (!outcome.ok) return fail([outcome.message])

  const picture = verify(outcome.graph, problem.expected, problem.hints, language)
  if (!picture.ok) return picture

  const process = problem.process
  const wrongWay = [
    ...(process?.runtime ? explainBrokenRules(process.runtime, outcome.brokenRules) : []),
    ...(process?.source ? checkSource(language, code, process.source) : []),
  ]
  if (wrongWay.length > 0) return fail(wrongWay)

  const hidden = process?.hidden ?? []
  const broken = brokenConstraints(problem, outcome.alternates.slice(hidden.length), language)
  if (broken.length > 0) return fail(broken)

  const general = hidden.every(
    (alternate, index) =>
      outcome.alternates[index] !== undefined &&
      verify(outcome.alternates[index], alternate.expected, problem.hints, language).ok,
  )
  if (!general) {
    const hint = findLiteralReusedHint(problem.given?.[language], language, code)
    return fail([hint ?? NOT_GENERAL])
  }
  return { ok: true, errors: [] }
}

/** One message per broken constraint, describing the first of its cases the learner's code got wrong. */
function brokenConstraints(problem: WriteProblem, graphs: MemoryGraph[], language: Language): string[] {
  let position = 0
  return (problem.constraints ?? []).flatMap((constraint) => {
    const runs = constraint.cases.map((constraintCase) => ({ constraintCase, graph: graphs[position++] }))
    const failed = runs.find(
      ({ constraintCase, graph }) =>
        graph === undefined || !verify(graph, constraintCase.expected, problem.hints, language).ok,
    )
    return failed ? [explainBrokenConstraint(problem, failed.constraintCase, failed.graph, language)] : []
  })
}

/**
 * Names the variables that came out wrong after the other programmer's edit.
 * Only plain values can be described this way; anything else falls back to
 * naming the edit alone.
 */
function explainBrokenConstraint(
  problem: WriteProblem,
  constraintCase: ConstraintCase,
  graph: MemoryGraph | undefined,
  language: Language,
): string {
  const differences = graph
    ? constraintCase.expected.variables.flatMap((variable) => {
        const wanted = valueOf(constraintCase.expected, variable.name)
        if (wanted?.type !== 'scalar') return []
        const actual = valueOf(graph, variable.name)
        if (actual?.type === 'scalar' && actual.kind === wanted.kind && actual.value === wanted.value) return []

        const original = valueOf(problem.expected, variable.name)
        const unchanged = original?.type === 'scalar' && original.kind === wanted.kind && original.value === wanted.value
        const should = `${variable.name} should ${unchanged ? 'stay' : 'become'} ${formatScalar(wanted, language)}`
        return actual?.type === 'scalar'
          ? [`${should}, but your code makes it ${formatScalar(actual, language)}`]
          : [`${should}, but your code does not do that`]
      })
    : []

  const scenario = `If another programmer changes the code so that ${constraintCase.change}`
  return differences.length > 0
    ? `This breaks the special constraint. ${scenario}, ${differences.join(', and ')}.`
    : `This breaks the special constraint. ${scenario}, your code no longer builds the right result.`
}

function valueOf(graph: MemoryGraph, name: string): MemNode | undefined {
  const target = graph.variables.find((variable) => variable.name === name)?.slot.target
  return target == null ? undefined : graph.nodes[target]
}
