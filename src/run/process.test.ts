import { describe, expect, it } from 'vitest'
import { snapshotPython } from '../model/snapshot'
import {
  after,
  before,
  call,
  differentObject,
  explainBrokenRules,
  preserve,
  runtime,
  sameObject,
  type RuntimeChecks,
} from '../model/process'
import { execute } from './execute'
import { joinProgram, PYTHON_CHECKPOINT } from './protocol'
import { perLanguage } from '../model/levels/common'
import type { Language } from '../model/types'
import { loadNodePythonSnapshotter } from './testRuntime'

const micropython = await loadNodePythonSnapshotter()

interface Scenario {
  name: string
  given: { js: string; py: string }
  code: { js: string; py: string }
  names: string[]
  checks: RuntimeChecks
  /** Ids of the rules the run must break. */
  broken: string[]
}

const FILL = {
  js: 'function fill(arr) {\n  arr.push(0);\n}',
  py: 'def fill(arr):\n    arr.append(0)',
}

const scenarios: Scenario[] = [
  {
    name: 'a list changed in place keeps its identity',
    given: { js: 'let a = [];', py: 'a = []' },
    code: { js: 'a.push(1);', py: 'a.append(1)' },
    names: ['a'],
    checks: runtime(preserve('a')),
    broken: [],
  },
  {
    name: 'a list replaced by an equal one loses its identity',
    given: { js: 'let a = [];', py: 'a = []' },
    code: { js: 'a = [1];', py: 'a = [1]' },
    names: ['a'],
    checks: runtime(preserve('a')),
    broken: ['identity:0'],
  },
  {
    name: 'a path follows keys and indexes into the starter objects',
    given: { js: 'let p = { tags: [["x"]] };', py: 'p = {"tags": [["x"]]}' },
    code: { js: 'p.tags[0].push("y");', py: 'p["tags"][0].append("y")' },
    names: ['p'],
    checks: runtime(preserve('p'), preserve('p', 'tags'), preserve('p', 'tags', 0)),
    broken: [],
  },
  {
    name: 'an inner list swapped for a look-alike is noticed through its path',
    given: { js: 'let p = { tags: [["x"]] };', py: 'p = {"tags": [["x"]]}' },
    code: { js: 'p.tags[0] = ["x", "y"];', py: 'p["tags"][0] = ["x", "y"]' },
    names: ['p'],
    checks: runtime(preserve('p'), preserve('p', 'tags'), preserve('p', 'tags', 0)),
    broken: ['identity:2'],
  },
  {
    name: 'a path that leads nowhere breaks its rule',
    given: { js: 'let p = { n: 1 };', py: 'p = {"n": 1}' },
    code: { js: 'p.n = 2;', py: 'p["n"] = 2' },
    names: ['p'],
    checks: runtime(preserve('p', 'missing'), preserve('p', 'n')),
    broken: ['identity:0', 'identity:1'],
  },
  {
    name: 'objects exchanged between slots are told from rebuilt ones',
    given: { js: 'let x = [1];\nlet y = [2];\nlet box = [x, y];', py: 'x = [1]\ny = [2]\nbox = [x, y]' },
    code: { js: 'let t = box[0];\nbox[0] = box[1];\nbox[1] = t;', py: 't = box[0]\nbox[0] = box[1]\nbox[1] = t' },
    names: ['box'],
    checks: runtime(
      sameObject(before('box', 0), after('box', 1)),
      sameObject(before('box', 1), after('box', 0)),
    ),
    broken: [],
  },
  {
    name: 'a swap rebuilt from literals is not an exchange',
    given: { js: 'let x = [1];\nlet y = [2];\nlet box = [x, y];', py: 'x = [1]\ny = [2]\nbox = [x, y]' },
    code: { js: 'box = [[2], [1]];', py: 'box = [[2], [1]]' },
    names: ['box'],
    checks: runtime(
      sameObject(before('box', 0), after('box', 1)),
      sameObject(before('box', 1), after('box', 0)),
    ),
    broken: ['identity:0', 'identity:1'],
  },
  {
    name: 'a rebound variable is a different object from before',
    given: { js: 'let a = [1];', py: 'a = [1]' },
    code: { js: 'a = [1];', py: 'a = [1]' },
    names: ['a'],
    checks: runtime(differentObject(before('a'), after('a'))),
    broken: [],
  },
  {
    name: 'a variable changed in place is not a different object',
    given: { js: 'let a = [1];', py: 'a = [1]' },
    code: { js: 'a.push(2);', py: 'a.append(2)' },
    names: ['a'],
    checks: runtime(differentObject(before('a'), after('a'))),
    broken: ['identity:0'],
  },
  {
    name: 'plain values have no identity to compare',
    given: { js: 'let a = 1;', py: 'a = 1' },
    code: { js: 'a = 1;', py: 'a = 1' },
    names: ['a'],
    checks: runtime(preserve('a')),
    broken: ['identity:0'],
  },
  {
    name: 'calls with the right objects satisfy the call rules',
    given: FILL,
    code: {
      js: 'let a = [];\nlet b = [];\nfill(a);\nfill(a);\nfill(b);',
      py: 'a = []\nb = []\nfill(a)\nfill(a)\nfill(b)',
    },
    names: ['a', 'b'],
    checks: runtime(call('fill', [after('a')], 2), call('fill', [after('b')], 1)),
    broken: [],
  },
  {
    name: 'doing the starter function’s work by hand is not a call',
    given: FILL,
    code: {
      js: 'let a = [];\nlet b = [];\na.push(0);\na.push(0);\nb.push(0);',
      py: 'a = []\nb = []\na.append(0)\na.append(0)\nb.append(0)',
    },
    names: ['a', 'b'],
    checks: runtime(call('fill', [after('a')], 2), call('fill', [after('b')], 1)),
    broken: ['call:0', 'call:1'],
  },
  {
    name: 'a call on the wrong object breaks the rule and counts as stray',
    given: FILL,
    code: {
      js: 'let a = [];\nlet b = [];\nfill(a);\nfill(b);\nfill(b);',
      py: 'a = []\nb = []\nfill(a)\nfill(b)\nfill(b)',
    },
    names: ['a', 'b'],
    checks: runtime(call('fill', [after('a')], 2), call('fill', [after('b')], 1)),
    broken: ['call:0', 'call:1'],
  },
  {
    name: 'a call that no rule asked for is stray',
    given: FILL,
    code: {
      js: 'let a = [];\nlet b = [];\nfill(a);\nfill(b);',
      py: 'a = []\nb = []\nfill(a)\nfill(b)',
    },
    names: ['a', 'b'],
    checks: runtime(call('fill', [after('a')], 1)),
    broken: ['stray:fill'],
  },
  {
    name: 'a call must use the object from the starter code, not a copy',
    given: { js: `${FILL.js}\nlet a = [];`, py: `${FILL.py}\na = []` },
    code: { js: 'fill([...a]);', py: 'fill(list(a))' },
    names: ['a'],
    checks: runtime(call('fill', [before('a')], 1)),
    broken: ['call:0', 'stray:fill'],
  },
]

const sources = (language: Language, scenario: Scenario) => ({
  given: perLanguage(scenario.given)[language],
  code: perLanguage(scenario.code)[language],
})

describe('identity and call rules', () => {
  it.each(scenarios.map((scenario) => [scenario.name, scenario] as const))(
    '%s, in JavaScript',
    async (_name, scenario) => {
      const [snapshot] = await execute(
        { language: 'javascript', ...sources('javascript', scenario), names: scenario.names, checks: scenario.checks },
        () => micropython,
        () => {},
      )
      expect(snapshot.brokenRules).toEqual(scenario.broken)
    },
  )

  it.each(scenarios.map((scenario) => [scenario.name, scenario] as const))(
    '%s, in TypeScript',
    async (_name, scenario) => {
      const [snapshot] = await execute(
        { language: 'typescript', ...sources('typescript', scenario), names: scenario.names, checks: scenario.checks },
        () => micropython,
        () => {},
      )
      expect(snapshot.brokenRules).toEqual(scenario.broken)
    },
  )

  it.each(scenarios.map((scenario) => [scenario.name, scenario] as const))(
    '%s, in MicroPython',
    async (_name, scenario) => {
      const [snapshot] = await execute(
        { language: 'python', ...sources('python', scenario), names: scenario.names, checks: scenario.checks },
        () => micropython,
        () => {},
      )
      expect(snapshot.brokenRules).toEqual(scenario.broken)
    },
  )

  const cpython = snapshotPython(
    scenarios.map((scenario, index) => {
      const { given, code } = sources('python', scenario)
      return {
        id: String(index),
        code: joinProgram(given, code, PYTHON_CHECKPOINT).source,
        names: scenario.names,
        checks: scenario.checks,
      }
    }),
  )

  it.skipIf(cpython === undefined).each(scenarios.map((scenario, index) => [scenario.name, index] as const))(
    '%s, in CPython',
    (_name, index) => {
      expect(cpython![String(index)].brokenRules).toEqual(scenarios[index].broken)
    },
  )

  it('reports no rules at all for a run without rules', async () => {
    const [snapshot] = await execute(
      { language: 'javascript', given: '', code: 'let a = 1;', names: ['a'] },
      () => micropython,
      () => {},
    )
    expect(snapshot.brokenRules).toBeUndefined()
  })

  it('turns broken rule ids into the learner-facing messages', () => {
    const checks = runtime(preserve('a'), call('fill', [after('a')], 2), call('fill', [after('b')], 1))
    expect(explainBrokenRules(checks, ['identity:0', 'call:0', 'stray:fill'])).toEqual([
      'Change what "a" already refers to instead of creating a new one.',
      'Call fill(a) 2 times.',
      'Only call fill the way this puzzle asks.',
    ])
    expect(explainBrokenRules(checks, [])).toEqual([])
  })
})

describe('python line numbers with rules', () => {
  const checks = runtime(preserve('a'))

  it('counts only the learner’s lines even though a checkpoint line was added', async () => {
    const run = execute(
      { language: 'python', given: 'a = []\nb = 1', code: 'a.append(1)\nz = missing', names: ['a'], checks },
      () => micropython,
      () => {},
    )
    await expect(run).rejects.toThrow(/^Line 2: NameError/)
  })

  it('points at the learner’s call, not at the recording wrapper around a starter function', async () => {
    const run = execute(
      {
        language: 'python',
        given: 'def boom(x):\n    return missing',
        code: 'a = []\nboom(a)',
        names: ['a'],
        checks: runtime(call('boom', [after('a')], 1)),
      },
      () => micropython,
      () => {},
    )
    await expect(run).rejects.toThrow(/^Line 2: NameError/)
  })
})

describe('alternate starting values', () => {
  const request = {
    language: 'javascript' as const,
    given: 'let w = 3;',
    code: 'let area = w * 4;',
    names: ['area'],
    alternateGivens: ['let w = 5;', 'let w = 10;'],
  }

  it('runs the same code after each starter in its own scope', async () => {
    const snapshots = await execute(request, () => micropython, () => {})
    expect(snapshots.map((snapshot) => snapshot.variables.area)).toEqual([12, 20, 40])
  })

  it('applies rules only to the starter the learner can see', async () => {
    const snapshots = await execute(
      { ...request, code: 'let area = w * 4;', checks: runtime(preserve('area')) },
      () => micropython,
      () => {},
    )
    expect(snapshots[0].brokenRules).toEqual(['identity:0'])
    expect(snapshots[1].brokenRules).toBeUndefined()
  })

  it('says so when the code only fails for another starter', async () => {
    const run = execute(
      { ...request, code: 'let area = w * 4;\nif (w > 3) { area = missing; }' },
      () => micropython,
      () => {},
    )
    await expect(run).rejects.toThrow(/worked for the starting values shown, but failed when they changed: ReferenceError/)
  })

  it('runs Python the same way', async () => {
    const snapshots = await execute(
      { language: 'python', given: 'w = 3', code: 'area = w * 4', names: ['area'], alternateGivens: ['w = 5'] },
      () => micropython,
      () => {},
    )
    expect(snapshots.map((snapshot) => snapshot.variables.area)).toEqual([12, 20])
  })
})

describe('trailing starter code (then)', () => {
  it('runs trailing code after the learner code in JavaScript', async () => {
    const snapshots = await execute(
      {
        language: 'javascript',
        given: 'let cart = ["tea"];',
        code: 'function withMilk(list) { return list.concat(["milk"]); }',
        then: 'let order = withMilk(cart);',
        names: ['cart', 'order'],
      },
      () => micropython,
      () => {},
    )
    expect(snapshots[0].containers[(snapshots[0].variables.order as { ref: string }).ref]).toEqual({
      kind: 'array',
      items: ['tea', 'milk'],
    })
  })

  it('runs trailing code after the learner code in Python', async () => {
    const snapshots = await execute(
      {
        language: 'python',
        given: 'cart = ["tea"]',
        code: 'def withMilk(list): return list + ["milk"]',
        then: 'order = withMilk(cart)',
        names: ['cart', 'order'],
      },
      () => micropython,
      () => {},
    )
    expect(snapshots[0].containers[(snapshots[0].variables.order as { ref: string }).ref]).toEqual({
      kind: 'array',
      items: ['tea', 'milk'],
    })
  })
})
