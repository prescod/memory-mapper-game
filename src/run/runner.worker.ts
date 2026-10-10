import wasmUrl from '@micropython/micropython-webassembly-pyscript/micropython.wasm?url'
import snapshotSource from '../model/snapshot_python.py?raw'
import { describeError } from './errors'
import { execute } from './execute'
import type { RunRequest, WorkerMessage } from './protocol'
import { createPythonSnapshotter } from './snapshotPy'

const post = (message: WorkerMessage) => self.postMessage(message)
const ignoreOutput = () => {}

async function loadPython() {
  const { loadMicroPython } = await import('@micropython/micropython-webassembly-pyscript')
  const runtime = await loadMicroPython({ url: wasmUrl, stdout: ignoreOutput, stderr: ignoreOutput })
  return createPythonSnapshotter(runtime, snapshotSource)
}

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    const snapshots = await execute(event.data, loadPython, () => post({ type: 'started' }))
    post({ type: 'done', snapshots })
  } catch (error) {
    post({ type: 'failed', message: describeError(error) })
  }
}
