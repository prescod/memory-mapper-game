import type { MemoryGraph } from '../model/types'
import type { RunRequest, WorkerMessage } from './protocol'
import { snapshotToGraph, type Snapshot } from './snapshotJs'

/**
 * `graph` is what the learner's code built after the starter code shown to them,
 * and `brokenRules` the process rules that run broke. `alternates` are the graphs
 * built after each alternate starter, in order.
 */
export type RunOutcome =
  | { ok: true; graph: MemoryGraph; brokenRules: string[]; alternates: MemoryGraph[] }
  | { ok: false; message: string }

/** Reads the snapshots of a finished run: the one for the shown starter code, then one per alternate. */
export function outcomeOf([shown, ...alternates]: Snapshot[]): RunOutcome {
  return {
    ok: true,
    graph: snapshotToGraph(shown),
    brokenRules: shown.brokenRules ?? [],
    alternates: alternates.map(snapshotToGraph),
  }
}

/** What `runCode` needs from a Web Worker, so tests can stand in for one. */
export interface WorkerLike {
  postMessage(message: RunRequest): void
  terminate(): void
  onmessage: ((event: { data: WorkerMessage }) => void) | null
  onerror: ((event: { message?: string }) => void) | null
}

/** Time to fetch and start the engine; generous because the first Python run downloads it. */
export const LOAD_TIMEOUT_MS = 20_000
/** Time the learner's code gets once it starts, so an endless loop cannot hang the page. */
export const RUN_TIMEOUT_MS = 2_000

const createWorker = (): WorkerLike =>
  new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike

/**
 * Runs the learner's code in a fresh worker and reads back the variables it
 * left behind. A new worker per check means no state survives between runs,
 * and terminating it is the only reliable way to stop a runaway loop.
 */
export function runCode(request: RunRequest, makeWorker: () => WorkerLike = createWorker): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const worker = makeWorker()
    let timer: ReturnType<typeof setTimeout>

    const finish = (outcome: RunOutcome) => {
      clearTimeout(timer)
      worker.terminate()
      resolve(outcome)
    }
    const expireAfter = (ms: number, message: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => finish({ ok: false, message }), ms)
    }

    worker.onmessage = ({ data }) => {
      if (data.type === 'started') {
        expireAfter(RUN_TIMEOUT_MS, 'Your code took too long to finish. Does it have an endless loop?')
      } else if (data.type === 'done') {
        finish(outcomeOf(data.snapshots))
      } else {
        finish({ ok: false, message: data.message })
      }
    }
    worker.onerror = (event) =>
      finish({ ok: false, message: event.message ?? 'The code runner failed to start. Reload the page and try again.' })

    expireAfter(LOAD_TIMEOUT_MS, 'The code runner took too long to start. Check your connection and try again.')
    worker.postMessage(request)
  })
}
