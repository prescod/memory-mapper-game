import { describeError, UserCodeError } from './errors'
import { joinProgram, PYTHON_CHECKPOINT, type RunRequest } from './protocol'
import { runJavaScript, type Snapshot } from './snapshotJs'
import type { PythonSnapshotter } from './snapshotPy'

/**
 * Runs the learner's code once after `given` and once after each alternate
 * starter, each in a fresh scope. Rules apply only to the first run. A failure
 * in an alternate run is reported as such, since the code worked for the
 * starter the learner can see.
 *
 * `started` is called when the learner's code is about to run, after any engine
 * has loaded, so callers can time the run alone.
 */
export async function execute(
  { language, given, code, names, checks, alternateGivens = [] }: RunRequest,
  loadPython: () => Promise<PythonSnapshotter> | PythonSnapshotter,
  started: () => void,
): Promise<Snapshot[]> {
  const starts = [given, ...alternateGivens]

  let runOne: (start: string, index: number) => Snapshot
  if (language === 'javascript') {
    runOne = (start, index) => runJavaScript(start, code, names, index === 0 ? checks : undefined)
  } else {
    // The engine is only fetched once someone checks Python code.
    const snapshotter = await loadPython()
    runOne = (start, index) => {
      const ruled = index === 0 ? checks : undefined
      const { source, skippedLines } = joinProgram(start, code, ruled && PYTHON_CHECKPOINT)
      return snapshotter(source, names, skippedLines, ruled)
    }
  }

  started()
  return starts.map((start, index) => {
    try {
      return runOne(start, index)
    } catch (error) {
      if (index === 0) throw error
      throw new UserCodeError(
        `Your code worked for the starting values shown, but failed when they changed: ${describeError(error)}`,
      )
    }
  })
}
