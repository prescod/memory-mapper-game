import type { Language } from '../model/types'
import type { RuntimeChecks } from '../model/process'
import type { Snapshot } from './snapshotJs'

export interface RunRequest {
  language: Language
  /** Starter code shown to the learner; runs before `code`. */
  given: string
  code: string
  /** Trailing code that runs after `code`. */
  then?: string
  /** Variables to read once the program has finished. */
  names: string[]
  /** Identity and call rules judged inside the interpreter on the run that uses `given`. */
  checks?: RuntimeChecks
  /** Other starter code to run `code` after, each in a fresh scope, to catch answers typed out as literals. */
  alternateGivens?: string[]
  alternateThens?: string[]
}

export type WorkerMessage =
  /** The engine is loaded and the learner's code is about to run. */
  | { type: 'started' }
  /** One snapshot for `given`, then one for each of `alternateGivens`, in order. */
  | { type: 'done'; snapshots: Snapshot[] }
  | { type: 'failed'; message: string }

/** The Python statement that marks where starter code ends, so identity can be recorded there. */
export const PYTHON_CHECKPOINT = '__dt_checkpoint()'

/**
 * Starter code and learner code run as one program, with an optional
 * `checkpoint` statement between them and an optional `then` code afterward.
 * `skippedLines` is how many leading lines of that program the learner did
 * not write.
 */
export function joinProgram(
  given: string,
  code: string,
  checkpoint?: string,
  then?: string,
): { source: string; skippedLines: number } {
  const prefix = (given === '' ? '' : `${given}\n`) + (checkpoint === undefined ? '' : `${checkpoint}\n`)
  const suffix = then === undefined || then === '' ? '' : `\n${then}`
  return { source: prefix + code + suffix, skippedLines: prefix === '' ? 0 : prefix.split('\n').length - 1 }
}
