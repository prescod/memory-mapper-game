import type { RuntimeChecks } from '../model/process'
import { UserCodeError } from './errors'
import type { Snapshot } from './snapshotJs'

/** The slice of the MicroPython WebAssembly API used here. */
export interface MicroPythonRuntime {
  runPython(code: string): unknown
  globals: { get(name: string): unknown; set(name: string, value: unknown): void }
}

/**
 * `code` is the whole program. With `checks` it must contain `PYTHON_CHECKPOINT`
 * between the starter code and the learner's, and `skippedLines` must count it.
 */
export type PythonSnapshotter = (
  code: string,
  names: string[],
  skippedLines?: number,
  checks?: RuntimeChecks,
) => Snapshot

/**
 * `snapshotSource` is the contents of `snapshot_python.py`, the same script the
 * tests run under CPython, so grading and test expectations share one encoder.
 * It is executed under a name other than `__main__` so its stdin entry point
 * does not run.
 */
export function createPythonSnapshotter(
  runtime: MicroPythonRuntime,
  snapshotSource: string,
): PythonSnapshotter {
  runtime.globals.set('_snapshot_source', snapshotSource)
  runtime.runPython(
    ["_snapshot_ns = {'__name__': 'snapshot_runner'}", 'exec(_snapshot_source, _snapshot_ns)'].join('\n'),
  )

  return (code, names, skippedLines = 0, checks) => {
    runtime.globals.set('_user_code', code)
    runtime.globals.set('_user_names', JSON.stringify(names))
    runtime.globals.set('_user_checks', JSON.stringify(checks ?? null))
    try {
      runtime.runPython(
        [
          'import json',
          "_snapshot_json = json.dumps(_snapshot_ns['snapshot'](_user_code, json.loads(_user_names), json.loads(_user_checks)))",
        ].join('\n'),
      )
    } catch (error) {
      throw new UserCodeError(describePythonError(String((error as Error).message ?? error), skippedLines))
    }
    return JSON.parse(String(runtime.globals.get('_snapshot_json'))) as Snapshot
  }
}

interface Frame {
  line: number
  func: string | undefined
}

/** Learner-facing names for the Python types a Pet's name might wrongly hold. */
const PYTHON_KINDS: Record<string, string> = {
  int: 'a number',
  float: 'a number',
  bool: 'a boolean',
  NoneType: 'None',
  list: 'a list',
  dict: 'a dict',
}

/**
 * Turns a MicroPython traceback into one sentence for the learner. Frames
 * after the first `snapshot` frame belong to the learner's code; the first
 * `skippedLines` lines of that code are starter code the learner did not write,
 * so errors there are reported without a line number.
 */
export function describePythonError(traceback: string, skippedLines = 0): string {
  const rows = traceback.trim().split('\n')
  const last = rows[rows.length - 1].trim()
  const frames: Frame[] = [...traceback.matchAll(/File "<string>", line (\d+)(?:, in (\S+))?/g)].map(
    (match) => ({ line: Number(match[1]), func: match[2] }),
  )

  const unsupported = /^TypeError: Unsupported value in snapshot: (.*)$/.exec(last)
  if (unsupported) {
    return `A variable holds ${unsupported[1]}, which can't be shown here. Use only numbers, strings, booleans, None, lists and dicts.`
  }
  const badPetName = /^TypeError: Pet name is not a string: (.*)$/.exec(last)
  if (badPetName) {
    const kind = PYTHON_KINDS[badPetName[1]] ?? `a ${badPetName[1]}`
    return `A Pet's name must be a string, but one Pet's name is ${kind}.`
  }
  const badKey = /^TypeError: Non-string key in snapshot: (.*)$/.exec(last)
  if (badKey) return `A dict has the key ${badKey[1]}. Use only strings as keys.`

  if (frames[frames.length - 1]?.func === '<dictcomp>') {
    const missing = /^KeyError: ['"]?(.*?)['"]?$/.exec(last)
    if (missing) return `Your code never created a variable named "${missing[1]}".`
  }

  const entry = frames.findIndex((frame) => frame.func === 'snapshot')
  const learnerFrame =
    entry === -1
      ? undefined
      : frames
          .slice(entry + 1)
          .filter((frame) => frame.line > skippedLines && !frame.func?.startsWith('__dt_'))
          .pop()
  return learnerFrame ? `Line ${learnerFrame.line - skippedLines}: ${last}` : last
}
