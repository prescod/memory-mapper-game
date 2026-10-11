import { explainBrokenRules } from '../model/process'
import type { Language, VerifyError, VerifyResult, WriteProblem } from '../model/types'
import { OPAQUE_PRELUDE } from '../run/opaquePrelude'
import type { RunRequest } from '../run/protocol'
import type { RunOutcome } from '../run/runCode'
import { checkSource, findLiteralReusedHint } from './source'
import { verify } from './verify'

/** What to run to grade `code` for `problem`: the starter code, the process rules and any alternate starters. */
export function buildRunRequest(problem: WriteProblem, language: Language, code: string): RunRequest {
  const hidden = problem.opaquePrelude ? `${OPAQUE_PRELUDE[language]}\n` : ''
  return {
    language,
    given: `${hidden}${problem.given?.[language] ?? ''}`,
    code,
    names: problem.expected.variables.map((variable) => variable.name),
    checks: problem.process?.runtime,
    alternateGivens: problem.process?.hidden?.map(
      (alternate) => `${hidden}${alternate.given[language]}`,
    ),
  }
}

const NOT_GENERAL =
  'Your code builds the right picture here, but not when the starting values change. Build the result from what is already there instead of typing it out.'

/**
 * Judges a finished run in stages, so feedback is about one kind of mistake at
 * a time: the code must run, then build the right picture, then do it the way
 * the puzzle asks, and finally keep working from other starting values.
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

  const general = (process?.hidden ?? []).every(
    (hidden, index) => outcome.alternates[index] !== undefined && verify(outcome.alternates[index], hidden.expected, problem.hints, language).ok,
  )
  if (!general) {
    const hint = findLiteralReusedHint(problem.given?.[language], language, code)
    return fail([hint ?? NOT_GENERAL])
  }
  return { ok: true, errors: [] }
}
