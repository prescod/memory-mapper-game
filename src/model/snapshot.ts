import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { RuntimeChecks } from './process'
import type { Snapshot } from '../run/snapshotJs'

/**
 * Test-only: runs Python under CPython and captures the memory graph it
 * actually builds, so the hand-written expected graphs can be checked against
 * the language itself rather than against our own understanding of it.
 */
export interface PythonJob {
  id: string
  code: string
  names: string[]
  checks?: RuntimeChecks
}

const PYTHON_SCRIPT = fileURLToPath(new URL('./snapshot_python.py', import.meta.url))

/** Returns `undefined` when `uv` is not installed so callers can skip. */
export function snapshotPython(jobs: PythonJob[]): Record<string, Snapshot> | undefined {
  const outcome = spawnSync('uv', ['run', 'python', PYTHON_SCRIPT], {
    input: JSON.stringify(jobs),
    encoding: 'utf8',
  })
  if (outcome.error) return undefined
  if (outcome.status !== 0) {
    throw new Error(`Python snapshot failed:\n${outcome.stderr}`)
  }
  return JSON.parse(outcome.stdout) as Record<string, Snapshot>
}
