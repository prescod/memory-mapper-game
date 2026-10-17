import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { joinProgram, type RunRequest, type WorkerMessage } from './protocol'
import {
  LOAD_TIMEOUT_MS,
  RUN_TIMEOUT_MS,
  runCode,
  type WorkerLike,
} from './runCode'
import { snapshotJavaScript, snapshotToGraph } from './snapshotJs'
import { UserCodeError } from './errors'
import { loadNodePythonSnapshotter } from './testRuntime'
import { verify } from '../verify/verify'
import { graph, list, pet, ref } from '../model/builders'
import { withOpaquePrelude } from './opaquePrelude'

const python = await loadNodePythonSnapshotter()

describe('joinProgram', () => {
  it('runs the starter code first and counts its lines', () => {
    expect(joinProgram('a = 1\nb = 2', 'c = 3')).toEqual({ source: 'a = 1\nb = 2\nc = 3', skippedLines: 2 })
  })

  it('leaves the learner code alone when there is no starter code', () => {
    expect(joinProgram('', 'c = 3')).toEqual({ source: 'c = 3', skippedLines: 0 })
  })

  it('appends trailing code after the learner code without changing skippedLines', () => {
    expect(joinProgram('a = 1', 'b = 2', undefined, 'c = 3')).toEqual({
      source: 'a = 1\nb = 2\nc = 3',
      skippedLines: 1,
    })
  })
})

describe('JavaScript snapshots', () => {
  it('reads variables by name and shares containers that are the same object', () => {
    const actual = snapshotToGraph(snapshotJavaScript('let a = [1]; let b = a;', ['a', 'b']))
    expect(verify(actual, graph({ a: ref('s'), b: ref('s') }, { s: list(1) })).errors).toEqual([])
  })

  it('reports a variable the code never created', () => {
    expect(() => snapshotJavaScript('let a = 1;', ['a', 'b'])).toThrow('never created a variable named "b"')
  })

  it('does not see variables declared inside a block', () => {
    expect(() => snapshotJavaScript('{ let a = 1; }', ['a'])).toThrow(UserCodeError)
  })

  it('reports a variable left undefined', () => {
    expect(() => snapshotJavaScript('let a;', ['a'])).toThrow('has no value')
  })

  it.each([
    ['a function', 'let a = () => 1;'],
    ['a Map', 'let a = new Map();'],
    ['undefined inside a list', 'let a = [undefined];'],
  ])('rejects %s, which has no picture', (_label, code) => {
    expect(() => snapshotJavaScript(code, ['a'])).toThrow(UserCodeError)
  })

  it('shows a renamed Pet by its new name, shared by every name for it', () => {
    const code = withOpaquePrelude('javascript', 'let a = Pet("Lucy");\nlet b = a;\nb.name = "Lola";')
    const actual = snapshotToGraph(snapshotJavaScript(code, ['a', 'b']))
    expect(verify(actual, graph({ a: ref('p'), b: ref('p') }, { p: pet('Lola') })).errors).toEqual([])
  })

  it('rejects a Pet whose name is not a string', () => {
    const code = withOpaquePrelude('javascript', 'let a = Pet("Lucy");\na.name = 3;')
    expect(() => snapshotJavaScript(code, ['a'])).toThrow("A Pet's name must be a string, but one Pet's name is a number.")
  })

  it('lets errors in the learner code through unchanged', () => {
    expect(() => snapshotJavaScript('let a = missing;', ['a'])).toThrow(ReferenceError)
    expect(() => snapshotJavaScript('let a = ;', ['a'])).toThrow(SyntaxError)
  })
})

describe('Python snapshots under MicroPython', () => {
  it('shares containers that are the same object and survives a cycle', () => {
    const actual = snapshotToGraph(python('a = []\na.append(a)\nb = a', ['a', 'b']))
    expect(verify(actual, graph({ a: ref('a'), b: ref('a') }, { a: list(ref('a')) })).errors).toEqual([])
  })

  it('reports a variable the code never created', () => {
    expect(() => python('a = 1', ['b'])).toThrow('Your code never created a variable named "b".')
  })

  it('reports values with no picture', () => {
    expect(() => python('a = (1, 2)', ['a'])).toThrow("A variable holds (1, 2), which can't be shown here")
    expect(() => python('a = {1: 2}', ['a'])).toThrow('Use only strings as keys')
  })

  it('rejects a Pet whose name is not a string', () => {
    const code = withOpaquePrelude('python', 'a = Pet("Lucy")\na.name = 3')
    expect(() => python(code, ['a'])).toThrow("A Pet's name must be a string, but one Pet's name is a number.")
  })

  it('points at the learner line, not counting starter code', () => {
    expect(() => python('x = 1\ny = 2\nz = missing', ['z'], 2)).toThrow(/^Line 1: NameError/)
  })

  it('points at the learner line that called into a failing function', () => {
    const code = 'def f():\n    return missing\nx = 1\ny = f()'
    expect(() => python(code, ['y'], 2)).toThrow(/^Line 2: NameError/)
  })

  it('reports syntax errors with a line', () => {
    expect(() => python('x = 1\n  y = 2', ['x'])).toThrow(/^Line 2: IndentationError/)
  })

  it('keeps working after an earlier run failed', () => {
    expect(() => python('x = missing', ['x'])).toThrow()
    expect(snapshotToGraph(python('x = 3', ['x'])).variables).toHaveLength(1)
  })
})

/** A worker that replies from a script instead of running code. */
function fakeWorker(script: (reply: (message: WorkerMessage) => void) => void) {
  const worker: WorkerLike & { terminated: boolean } = {
    terminated: false,
    onmessage: null,
    onerror: null,
    postMessage() {
      script((data) => worker.onmessage?.({ data }))
    },
    terminate() {
      worker.terminated = true
    },
  }
  return worker
}

const request: RunRequest = { language: 'javascript', given: '', code: '', names: ['a'] }

describe('runCode', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('turns a finished snapshot into a graph and stops the worker', async () => {
    const worker = fakeWorker((reply) => {
      reply({ type: 'started' })
      reply({ type: 'done', snapshots: [{ variables: { a: 5 }, containers: {} }] })
    })
    const outcome = await runCode(request, () => worker)
    expect(outcome).toEqual({ ok: true, graph: graph({ a: 5 }), brokenRules: [], alternates: [] })
    expect(worker.terminated).toBe(true)
  })

  it('keeps the broken rules and the graph from every alternate starter', async () => {
    const worker = fakeWorker((reply) => {
      reply({ type: 'started' })
      reply({
        type: 'done',
        snapshots: [
          { variables: { a: 5 }, containers: {}, brokenRules: ['identity:0'] },
          { variables: { a: 6 }, containers: {} },
        ],
      })
    })
    expect(await runCode(request, () => worker)).toEqual({
      ok: true,
      graph: graph({ a: 5 }),
      brokenRules: ['identity:0'],
      alternates: [graph({ a: 6 })],
    })
  })

  it('passes the request through to the worker', async () => {
    const received: RunRequest[] = []
    const worker = fakeWorker((reply) => reply({ type: 'failed', message: 'x' }))
    const post = worker.postMessage.bind(worker)
    worker.postMessage = (message) => {
      received.push(message)
      post(message)
    }
    await runCode(request, () => worker)
    expect(received).toEqual([request])
  })

  it('relays an error from the learner code', async () => {
    const worker = fakeWorker((reply) => reply({ type: 'failed', message: 'Line 1: NameError' }))
    expect(await runCode(request, () => worker)).toEqual({ ok: false, message: 'Line 1: NameError' })
    expect(worker.terminated).toBe(true)
  })

  it('stops code that runs too long after it has started', async () => {
    const worker = fakeWorker((reply) => reply({ type: 'started' }))
    const pending = runCode(request, () => worker)
    await vi.advanceTimersByTimeAsync(RUN_TIMEOUT_MS)
    const outcome = await pending
    expect(outcome.ok).toBe(false)
    expect(outcome).toMatchObject({ message: expect.stringContaining('took too long') })
    expect(worker.terminated).toBe(true)
  })

  it('allows a slow engine download before the learner code starts counting', async () => {
    const worker = fakeWorker(() => {})
    const pending = runCode(request, () => worker)
    await vi.advanceTimersByTimeAsync(RUN_TIMEOUT_MS + 1)
    expect(worker.terminated).toBe(false)
    await vi.advanceTimersByTimeAsync(LOAD_TIMEOUT_MS)
    expect(await pending).toMatchObject({ ok: false, message: expect.stringContaining('took too long to start') })
    expect(worker.terminated).toBe(true)
  })

  it('reports a worker that crashes', async () => {
    const worker = fakeWorker(() => worker.onerror?.({ message: 'boom' }))
    expect(await runCode(request, () => worker)).toEqual({ ok: false, message: 'boom' })
  })
})
