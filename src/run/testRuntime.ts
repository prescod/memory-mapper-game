import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript'
import { createPythonSnapshotter, type PythonSnapshotter } from './snapshotPy'

const SNAPSHOT_SCRIPT = fileURLToPath(new URL('../model/snapshot_python.py', import.meta.url))

/** Test-only: the same MicroPython engine the browser worker uses, loaded in Node. */
export async function loadNodePythonSnapshotter(): Promise<PythonSnapshotter> {
  const ignore = () => {}
  const runtime = await loadMicroPython({ stdout: ignore, stderr: ignore })
  return createPythonSnapshotter(runtime, readFileSync(SNAPSHOT_SCRIPT, 'utf8'))
}
