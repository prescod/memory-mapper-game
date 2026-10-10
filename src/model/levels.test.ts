import { describe, expect, it } from 'vitest'
import { execute } from '../run/execute'
import { joinProgram, PYTHON_CHECKPOINT } from '../run/protocol'
import { outcomeOf, type RunOutcome } from '../run/runCode'
import { snapshotJavaScript, snapshotToGraph } from '../run/snapshotJs'
import { loadNodePythonSnapshotter } from '../run/testRuntime'
import { buildRunRequest, gradeRun } from '../verify/grade'
import { verify } from '../verify/verify'
import { graph } from './builders'
import { findProblem, levels, nextProblem, previousProblem, problemHint, problems } from './levels'
import { snapshotPython } from './snapshot'
import {
  LANGUAGES,
  type Language,
  type Level,
  type MemoryGraph,
  type Problem,
  type WriteProblem,
} from './types'

const micropython = await loadNodePythonSnapshotter()

const writeProblems = problems.filter((problem): problem is WriteProblem => problem.kind === 'write')

/** The whole program for a problem: for a write problem, its starter code followed by the reference answer. */
function programOf(problem: Problem, language: Language): string {
  if (problem.kind === 'draw') return problem.code[language]
  return joinProgram(problem.given?.[language] ?? '', problem.solution[language]).source
}

const namesOf = (problem: Problem) => problem.expected.variables.map((variable) => variable.name)

const matches = (actual: MemoryGraph, expected: MemoryGraph) =>
  verify(actual, expected).errors.length === 0 && verify(expected, actual).errors.length === 0

const tutorialOf = (level: Level) => level.problems.filter((problem) => !problem.mystery)
const mysteriesOf = (level: Level) => level.problems.filter((problem) => problem.mystery)

describe('curriculum shape', () => {
  it('has 10 levels of 10 tutorial problems, half in each direction, then 5 mysteries', () => {
    expect(levels).toHaveLength(10)
    for (const level of levels) {
      const tutorial = tutorialOf(level)
      expect(tutorial).toHaveLength(10)
      expect(tutorial.filter((problem) => problem.kind === 'draw')).toHaveLength(5)
      expect(tutorial.filter((problem) => problem.kind === 'write')).toHaveLength(5)
      expect(mysteriesOf(level)).toHaveLength(5)
      expect(level.problems.slice(10)).toEqual(mysteriesOf(level))
    }
    expect(problems).toHaveLength(150)
  })

  it('has unique problem ids that count each tutorial kind separately', () => {
    expect(new Set(problems.map((problem) => problem.id)).size).toBe(problems.length)
    for (const level of levels) {
      const ids = (kind: Problem['kind']) =>
        tutorialOf(level).filter((problem) => problem.kind === kind).map((problem) => problem.id)
      expect(ids('draw')).toEqual([1, 2, 3, 4, 5].map((n) => `${level.id}-${n}`))
      expect(ids('write')).toEqual([6, 7, 8, 9, 10].map((n) => `${level.id}-${n}`))
      expect(mysteriesOf(level).map((problem) => problem.id)).toEqual(
        [11, 12, 13, 14, 15].map((n) => `${level.id}-${n}`),
      )
    }
  })

  it('mixes the two kinds in a hand-picked order', () => {
    const kinds = (list: Problem[]) =>
      list.map((problem) => (problem.kind === 'draw' ? 'D' : 'W')).join('')
    const order = levels.map((level) => `${kinds(tutorialOf(level))} ${kinds(mysteriesOf(level))}`)
    expect(order).toEqual([
      'DWWDDWDWDW DWDWD',
      'DDWWDWWDDW DWDDW',
      'DWDDWDWDWW WDWDD',
      'DWDWDWDDWW WDDWD',
      'DWDDWDWWDW WDWDD',
      'DWDDWDWWDW DWDDW',
      'DWDWDWDWWD WDWDD',
      'DDWWDDWDWW WDDWD',
      'DWDDWWWDDW WDWDD',
      'DWWDWDWDWD DWDDW',
    ])
  })

  it('offers every problem in every language mode', () => {
    for (const problem of problems) {
      for (const language of LANGUAGES) {
        expect(programOf(problem, language).trim(), `${problem.id} ${language}`).not.toBe('')
      }
    }
  })

  it('names the same variables in both languages', () => {
    const assigned = (code: string) =>
      new Set([...code.matchAll(/^(?:let )?(\w+) = /gm)].map((match) => match[1]))
    for (const problem of problems) {
      for (const language of LANGUAGES) {
        for (const name of namesOf(problem)) {
          expect(assigned(programOf(problem, language)), `${problem.id} ${language}`).toContain(name)
        }
      }
    }
  })
})

describe('curriculum navigation', () => {
  it('moves backward and forward through every problem, including level boundaries', () => {
    problems.forEach((problem, index) => {
      expect(previousProblem(problem.id)).toBe(problems[index - 1])
      expect(nextProblem(problem.id)).toBe(problems[index + 1])
    })
  })

  it('does not navigate from an unknown problem', () => {
    expect(previousProblem('unknown')).toBeUndefined()
    expect(nextProblem('unknown')).toBeUndefined()
  })
})

/** One run of a problem's reference answer: the shown starter code, or one of its hidden alternates. */
interface Execution {
  key: string
  problem: Problem
  given: (language: Language) => string
  expected: MemoryGraph
}

const executions: Execution[] = problems.flatMap((problem) => {
  const shown: Execution = {
    key: problem.id,
    problem,
    given: (language) => (problem.kind === 'write' ? (problem.given?.[language] ?? '') : ''),
    expected: problem.expected,
  }
  const hidden =
    problem.kind === 'write'
      ? (problem.process?.hidden ?? []).map(
          (alternate, index): Execution => ({
            key: `${problem.id}#hidden${index + 1}`,
            problem,
            given: (language) => alternate.given[language],
            expected: alternate.expected,
          }),
        )
      : []
  return [shown, ...hidden]
})

/** The program for an execution: draw code, or starter code followed by the reference answer. */
function programFor(execution: Execution, language: Language): string {
  const { problem } = execution
  if (problem.kind === 'draw') return problem.code[language]
  return joinProgram(execution.given(language), problem.solution[language]).source
}

/**
 * The expected graphs are checked against what the real interpreters build, in
 * both directions: nothing the program creates may be missing from the answer,
 * and nothing in the answer may be absent from the program. For picture-to-code
 * problems the program is the starter code plus the reference answer, and the
 * pictures that hidden cases expect are checked the same way.
 */
describe('expected graphs match real execution', () => {
  const all = executions.map((execution) => [execution.key, execution] as const)

  it.each(all)('%s in JavaScript', (_key, execution) => {
    const names = execution.expected.variables.map((variable) => variable.name)
    const actual = snapshotToGraph(snapshotJavaScript(programFor(execution, 'javascript'), names))
    expect(verify(actual, execution.expected).errors).toEqual([])
    expect(verify(execution.expected, actual).errors).toEqual([])
  })

  const python = snapshotPython(
    executions.map((execution) => ({
      id: execution.key,
      code: programFor(execution, 'python'),
      names: execution.expected.variables.map((variable) => variable.name),
    })),
  )

  it.skipIf(python === undefined).each(all)('%s in CPython', (key, execution) => {
    const actual = snapshotToGraph(python![key])
    expect(verify(actual, execution.expected).errors).toEqual([])
    expect(verify(execution.expected, actual).errors).toEqual([])
  })

  // The browser grades Python with MicroPython, so it must agree with CPython on every problem.
  it.each(all)('%s in MicroPython', (_key, execution) => {
    const names = execution.expected.variables.map((variable) => variable.name)
    const actual = snapshotToGraph(micropython(programFor(execution, 'python'), names))
    expect(verify(actual, execution.expected).errors).toEqual([])
    expect(verify(execution.expected, actual).errors).toEqual([])
  })

  const unsolved = writeProblems.filter((problem) => problem.given !== undefined)
  const unsolvedGraph = (problem: WriteProblem, language: Language, run: (code: string) => MemoryGraph) => {
    try {
      return run(problem.given![language])
    } catch {
      return undefined
    }
  }

  it.each(unsolved.map((problem) => [problem.id, problem] as const))(
    '%s is not already solved by its starter code',
    (_id, problem) => {
      const names = namesOf(problem)
      const js = unsolvedGraph(problem, 'javascript', (code) => snapshotToGraph(snapshotJavaScript(code, names)))
      const py = unsolvedGraph(problem, 'python', (code) => snapshotToGraph(micropython(code, names)))
      for (const graph of [js, py]) {
        if (graph) expect(matches(graph, problem.expected)).toBe(false)
      }
    },
  )
})

/** Variable names are no part of what makes a picture new, so compare by position. */
const anonymous = (graph: MemoryGraph): MemoryGraph => ({
  ...graph,
  variables: graph.variables.map((variable, index) => ({ ...variable, name: `v${index}` })),
})

describe('mystery problems', () => {
  it('show pictures that no other problem shows', () => {
    for (const problem of problems.filter((candidate) => candidate.mystery)) {
      const twin = problems.find(
        (other) => other !== problem && matches(anonymous(other.expected), anonymous(problem.expected)),
      )
      expect(twin?.id, `${problem.id} repeats a picture`).toBeUndefined()
    }
  })
})

describe('picture-to-code problems', () => {
  it('show pictures that no code-to-picture problem already shows', () => {
    const drawn = problems.filter((problem) => problem.kind === 'draw')
    for (const problem of writeProblems) {
      const twin = drawn.find((other) => matches(anonymous(other.expected), anonymous(problem.expected)))
      expect(twin?.id, `${problem.id} repeats a picture`).toBeUndefined()
    }
  })

  it('never repeat a picture among themselves', () => {
    writeProblems.forEach((problem, index) => {
      const twin = writeProblems
        .slice(index + 1)
        .find((other) => matches(anonymous(other.expected), anonymous(problem.expected)))
      expect(twin?.id, `${problem.id} repeats a picture`).toBeUndefined()
    })
  })
})

/** What the app does for one check, minus the worker: run the request, then grade the outcome. */
async function grade(problem: WriteProblem, language: Language, code: string) {
  let outcome: RunOutcome
  try {
    outcome = outcomeOf(await execute(buildRunRequest(problem, language, code), () => micropython, () => {}))
  } catch (error) {
    outcome = { ok: false, message: error instanceof Error ? error.message : String(error) }
  }
  return gradeRun(problem, language, code, outcome)
}

const processed = writeProblems.filter((problem) => problem.process !== undefined)

describe('process rules', () => {
  it('cover the puzzles whose picture alone can be faked', () => {
    expect(processed.map((problem) => problem.id).sort()).toEqual([
      'numbers-8', 'numbers-9', 'numbers-10', 'numbers-14',
      'simple-values-10', 'simple-values-15',
      'mutating-arrays-6', 'mutating-arrays-7', 'mutating-arrays-8', 'mutating-arrays-9',
      'mutating-arrays-10', 'mutating-arrays-11', 'mutating-arrays-13',
      'mutating-objects-6', 'mutating-objects-7', 'mutating-objects-8', 'mutating-objects-9',
      'mutating-objects-10', 'mutating-objects-12', 'mutating-objects-15',
      'copies-6', 'copies-7', 'copies-8', 'copies-10', 'copies-11', 'copies-14',
      'rebinding-6', 'rebinding-8', 'rebinding-9', 'rebinding-10', 'rebinding-11', 'rebinding-13',
      'cycles-15',
    ].sort())
  })

  it.each(processed.map((problem) => [problem.id, problem] as const))(
    '%s only names variables and starter code that exist',
    (_id, problem) => {
      const visible = new Set(namesOf(problem))
      const starter = problem.given?.javascript ?? ''
      for (const alternate of problem.process?.hidden ?? []) {
        expect(alternate.expected.variables.map((variable) => variable.name)).toEqual(namesOf(problem))
        expect(alternate.given.javascript, `${problem.id} alternate starter`).not.toBe(problem.given?.javascript)
      }
      const rules = problem.process?.runtime
      const locations = [
        ...(rules?.identity.flatMap((rule) => [rule.a, rule.b]) ?? []),
        ...(rules?.calls.flatMap((rule) => rule.args) ?? []),
      ]
      for (const location of locations) {
        expect(location.phase === 'before' ? starter : [...visible].join(' ')).toMatch(
          new RegExp(`\\b${location.root}\\b`),
        )
      }
      for (const rule of rules?.calls ?? []) expect(starter).toContain(`function ${rule.fn}(`)
      for (const rule of problem.process?.source ?? []) expect(visible.has(rule.target), rule.target).toBe(true)
    },
  )

  it('need starter code for any rule that looks at the start', () => {
    for (const problem of processed) {
      if (problem.process?.runtime || problem.process?.hidden) expect(problem.given, problem.id).toBeDefined()
    }
  })

  describe('accept every reference answer', () => {
    const answers = processed.flatMap((problem) =>
      LANGUAGES.map((language) => [`${problem.id} in ${language}`, problem, language] as const),
    )

    it.each(answers)('%s', async (_label, problem, language) => {
      expect(await grade(problem, language, problem.solution[language])).toEqual({ ok: true, errors: [] })
    })

    // CPython has no worker, but must agree with MicroPython that no rule is broken.
    const cpython = snapshotPython(
      processed.map((problem) => ({
        id: problem.id,
        code: joinProgram(
          problem.given?.python ?? '',
          problem.solution.python,
          problem.process?.runtime && PYTHON_CHECKPOINT,
        ).source,
        names: namesOf(problem),
        checks: problem.process?.runtime,
      })),
    )
    it.skipIf(cpython === undefined).each(processed.map((problem) => [problem.id] as const))(
      '%s in CPython',
      (id) => {
        expect(cpython![id].brokenRules ?? []).toEqual([])
      },
    )
  })
})

/**
 * Answers that build exactly the right picture but skip the point of the
 * puzzle. Each used to pass; each must now fail, and say why.
 */
describe('shortcuts that match the picture but miss the point', () => {
  const START_CHANGED = /not when the starting values change/
  const KEEP = (name: string) => new RegExp(`Change what "${name}" already refers to`)

  const shortcuts: [id: string, js: string, py: string, complaint: RegExp][] = [
    ['numbers-8', 'let b = 8;', 'b = 8', START_CHANGED],
    ['numbers-9', 'let z = 1;', 'z = 1', START_CHANGED],
    ['numbers-10', 'a = 2;\nb = 1;', 'a = 2\nb = 1', START_CHANGED],
    ['numbers-14', 'a = 2;\nb = 3;\nc = 1;', 'a = 2\nb = 3\nc = 1', START_CHANGED],
    ['simple-values-10', 'let full = "Ada Lovelace";', 'full = "Ada Lovelace"', START_CHANGED],
    ['simple-values-15', 'let greeting = "Hello, Bo!";', 'greeting = "Hello, Bo!"', START_CHANGED],

    ['mutating-arrays-6', 'a = [3, 6, 9];', 'a = [3, 6, 9]', KEEP('a')],
    ['mutating-arrays-7', 'a = [1, 5, 3];', 'a = [1, 5, 3]', KEEP('a')],
    ['mutating-arrays-8', 'a = [];\nb = a;', 'a = []\nb = a', KEEP('a')],
    ['mutating-arrays-9', 'a = ["x", "y"];\nb = a;', 'a = ["x", "y"]\nb = a', KEEP('a')],
    ['mutating-arrays-10', 'a = [1];\nb = [1, 2];', 'a = [1]\nb = [1, 2]', KEEP('a')],
    ['mutating-arrays-11', 'a = [1, 2];\nb = [];\nc = a;', 'a = [1, 2]\nb = []\nc = a', KEEP('a')],
    ['mutating-arrays-13', 'a = [7, 0, 8];', 'a = [7, 0, 8]', KEEP('a')],

    ['mutating-objects-6', 'p = { width: 4, height: 2 };', 'p = {"width": 4, "height": 2}', KEEP('p')],
    ['mutating-objects-7', 'a = { n: 1, done: true };\nb = a;', 'a = {"n": 1, "done": True}\nb = a', KEEP('a')],
    ['mutating-objects-8', 'p = { renamed: 1 };', 'p = {"renamed": 1}', KEEP('p')],
    ['mutating-objects-9', 'p = {};\nq = p;', 'p = {}\nq = p', KEEP('p')],
    [
      'mutating-objects-10',
      'q = { n: 1, m: 3 };\np = { n: 2 };',
      'q = {"n": 1, "m": 3}\np = {"n": 2}',
      /"q" afterward should be the same object as "p" at the start/,
    ],
    ['mutating-objects-12', 'p = { a: 2, b: 1 };', 'p = {"a": 2, "b": 1}', KEEP('p')],
    [
      'mutating-objects-15',
      'b = { score: 0, done: true };\na = { score: 5 };',
      'b = {"score": 0, "done": True}\na = {"score": 5}',
      /"b" afterward should be the same object as "a" at the start/,
    ],

    ['copies-6', 'let q = { n: 1, m: 2 };', 'q = {"n": 1, "m": 2}', /by copying "p"/],
    ['copies-7', 'let b = [1, 2, 3];', 'b = [1, 2, 3]', /by copying "a"/],
    [
      'copies-8',
      'let q = { tags: p.tags };\nq.tags.push("y");',
      'q = {"tags": p["tags"]}\nq["tags"].append("y")',
      /by copying "p"/,
    ],
    ['copies-10', 'let b = [[1], [2]];', 'b = [[1], [2]]', /by copying "a"/],
    [
      'copies-11',
      'let q = { tags: p.tags, extra: true };\nq.tags.push("b");',
      'q = {"tags": p["tags"], "extra": True}\nq["tags"].append("b")',
      /by copying "p"/,
    ],
    ['copies-14', 'let b = [a[0], a[1], [3]];', 'b = [a[0], a[1], [3]]', /by copying "a"/],

    [
      'rebinding-6',
      'let lo = "hi";\nlet up = "HI";',
      'lo = "hi"\nup = "HI"',
      /by calling s\.(toLowerCase|lower)\(\)/,
    ],
    ['rebinding-8', 'b = [1, 2, 3, 4];', 'b = [1, 2, 3, 4]', /Build "b" by (calling concat on|adding to) "b"/],
    ['rebinding-9', 'a = [9];\nb = [1, 2];', 'a = [9]\nb = [1, 2]', /"b" afterward should be the same object as "a" at the start/],
    [
      'rebinding-10',
      'let a = [];\nlet b = [];\na.push(0);\na.push(0);\nb.push(0);',
      'a = []\nb = []\na.append(0)\na.append(0)\nb.append(0)',
      /Call fill\(a\) 2 times/,
    ],
    ['rebinding-11', 'b[0] = "new";', 'b[0] = "new"', /Call touch\(b\) once/],
    [
      'rebinding-13',
      'let a = { n: 1, tagged: true };\nlet b = { n: 2 };',
      'a = {"n": 1, "tagged": True}\nb = {"n": 2}',
      /Call tag\(a\) once/,
    ],
    [
      'cycles-15',
      'a = { v: 1, next: null };\nb = { v: 2, next: null };\nc = { v: 3, next: null };\na.next = c;\nc.next = b;\nb.next = a;',
      'a = {"v": 1, "next": None}\nb = {"v": 2, "next": None}\nc = {"v": 3, "next": None}\na["next"] = c\nc["next"] = b\nb["next"] = a',
      KEEP('a'),
    ],
  ]

  it('cover every puzzle with process rules', () => {
    expect([...new Set(shortcuts.map(([id]) => id))].sort()).toEqual(processed.map((problem) => problem.id).sort())
  })

  const cases = shortcuts.flatMap(([id, js, py, complaint]) =>
    LANGUAGES.map((language) => [`${id} in ${language}`, id, language === 'javascript' ? js : py, language, complaint] as const),
  )

  it.each(cases)('%s is rejected', async (_label, id, code, language, complaint) => {
    const problem = writeProblems.find((candidate) => candidate.id === id)!
    const verdict = await grade(problem, language, code)
    expect(verdict.ok).toBe(false)
    expect(verdict.errors.map((error) => error.message).join('\n')).toMatch(complaint)
  })
})

describe('diagnostic hints', () => {
  it('explains the static value rule when area is drawn as updated on Area after a change', () => {
    const problem = findProblem('numbers-4')!.problem
    const mistaken = graph({ width: 3, height: 5, area: 15 })
    const result = verify(mistaken, problem.expected, problem.hints)
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/Changing height later does not update area/)
  })

  it('explains the order of execution when area is drawn with the old height on Area before a change', () => {
    const problem = findProblem('numbers-15')!.problem
    const mistaken = graph({ width: 3, height: 5, area: 12 })
    const result = verify(mistaken, problem.expected, problem.hints)
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/height was changed to 5 before area was calculated/)
  })
})

describe('on-demand hints', () => {
  it('provides hints for all problems in the first two levels for both languages', () => {
    const firstTwoLevels = levels.slice(0, 2)
    for (const lvl of firstTwoLevels) {
      for (const problem of lvl.problems) {
        for (const language of LANGUAGES) {
          const hint = problemHint(problem, language)
          expect(typeof hint).toBe('string')
          expect(hint!.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('does not have hints for levels past the first two', () => {
    const remainingLevels = levels.slice(2)
    for (const lvl of remainingLevels) {
      for (const problem of lvl.problems) {
        expect(problem.hint).toBeUndefined()
        for (const language of LANGUAGES) {
          expect(problemHint(problem, language)).toBeUndefined()
        }
      }
    }
  })

  it('gives the expected hint for swap', () => {
    const swappedProblem = findProblem('numbers-10')!.problem
    expect(problemHint(swappedProblem, 'javascript')).toBe('It is okay for you to add a third variable.')
    expect(problemHint(swappedProblem, 'python')).toBe('It is okay for you to add a third variable.')
  })

  it('gives the expected hint for multiplication in wrong order (Area after a change)', () => {
    const areaProblem = findProblem('numbers-4')!.problem
    expect(problemHint(areaProblem, 'javascript')).toBe('Pay careful attention to the order of your work.')
    expect(problemHint(areaProblem, 'python')).toBe('Pay careful attention to the order of your work.')
  })

  it('gives the expected hint for multiplication in wrong order (Area before a change)', () => {
    const areaProblem = findProblem('numbers-15')!.problem
    expect(problemHint(areaProblem, 'javascript')).toBe('Pay careful attention to the order of your work.')
    expect(problemHint(areaProblem, 'python')).toBe('Pay careful attention to the order of your work.')
  })

  it('provides language-appropriate boolean and null keywords in hints', () => {
    const falseProblem = findProblem('simple-values-6')!.problem
    expect(problemHint(falseProblem, 'python')).toBe('Assign False to a variable named done.')
    expect(problemHint(falseProblem, 'javascript')).toBe('Declare a variable named done and assign it false.')

    const oneOfEach = findProblem('simple-values-9')!.problem
    expect(problemHint(oneOfEach, 'python')).toContain('True')
    expect(problemHint(oneOfEach, 'python')).toContain('None')
    expect(problemHint(oneOfEach, 'javascript')).toContain('true')
    expect(problemHint(oneOfEach, 'javascript')).toContain('null')

    const clearOne = findProblem('simple-values-12')!.problem
    expect(problemHint(clearOne, 'python')).toContain('None')
    expect(problemHint(clearOne, 'javascript')).toContain('null')
  })
})
