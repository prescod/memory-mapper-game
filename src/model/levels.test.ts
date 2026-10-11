import { describe, expect, it } from 'vitest'
import { execute } from '../run/execute'
import { joinProgram, PYTHON_CHECKPOINT } from '../run/protocol'
import { outcomeOf, type RunOutcome } from '../run/runCode'
import { snapshotJavaScript, snapshotToGraph } from '../run/snapshotJs'
import { loadNodePythonSnapshotter } from '../run/testRuntime'
import { buildRunRequest, gradeRun } from '../verify/grade'
import { verify } from '../verify/verify'
import { graph, pet, ref } from './builders'
import { findProblem, nextProblem, previousProblem, problems } from './levels'
import { withOpaquePrelude } from '../run/opaquePrelude'
import { snapshotPython } from './snapshot'
import {
  LANGUAGES,
  type Language,
  type MemoryGraph,
  type Problem,
  type WriteProblem,
} from './types'

const micropython = await loadNodePythonSnapshotter()

const writeProblems = problems.filter((problem): problem is WriteProblem => problem.kind === 'write')

/** Starter code plus the hidden prelude, when the puzzle calls the opaque helper. */
function hiddenBefore(problem: Problem, language: Language): string {
  const given = problem.kind === 'write' ? (problem.given?.[language] ?? '') : ''
  return problem.opaquePrelude === true ? withOpaquePrelude(language, given) : given
}

function hiddenAfter(problem: Problem, language: Language): string {
  return problem.kind === 'write' ? (problem.then?.[language] ?? '') : ''
}

/** The whole program for a problem: for a write problem, its starter code followed by the reference answer. */
function programOf(problem: Problem, language: Language): string {
  if (problem.kind === 'draw')
    return problem.opaquePrelude === true
      ? withOpaquePrelude(language, problem.code[language])
      : problem.code[language]
  return joinProgram(
    hiddenBefore(problem, language),
    problem.solution[language],
    undefined,
    hiddenAfter(problem, language),
  ).source
}

const namesOf = (problem: Problem) => problem.expected.variables.map((variable) => variable.name)

const constraintCasesOf = (problem: WriteProblem) =>
  (problem.constraints ?? []).flatMap((constraint) => constraint.cases)

const matches = (actual: MemoryGraph, expected: MemoryGraph) =>
  verify(actual, expected).errors.length === 0 && verify(expected, actual).errors.length === 0

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
  then: (language: Language) => string
  expected: MemoryGraph
}

const executions: Execution[] = problems.flatMap((problem) => {
  const shown: Execution = {
    key: problem.id,
    problem,
    given: (language) => (problem.kind === 'write' ? (problem.given?.[language] ?? '') : ''),
    then: (language) => (problem.kind === 'write' ? (problem.then?.[language] ?? '') : ''),
    expected: problem.expected,
  }
  const alternates = (
    label: string,
    cases: { given: Record<Language, string>; then?: Record<Language, string>; expected: MemoryGraph }[],
  ) =>
    cases.map(
      (alternate, index): Execution => ({
        key: `${problem.id}#${label}${index + 1}`,
        problem,
        given: (language) => alternate.given[language],
        then: (language) =>
          alternate.then?.[language] ?? (problem.kind === 'write' ? (problem.then?.[language] ?? '') : ''),
        expected: alternate.expected,
      }),
    )
  if (problem.kind !== 'write') return [shown]
  return [
    shown,
    ...alternates('hidden', problem.process?.hidden ?? []),
    ...alternates('constraint', constraintCasesOf(problem)),
  ]
})

/** The program for an execution: draw code, or starter code followed by the reference answer. */
function programFor(execution: Execution, language: Language): string {
  const { problem } = execution
  if (problem.kind === 'draw')
    return programOf(problem, language)
  const start =
    problem.opaquePrelude === true
      ? withOpaquePrelude(language, execution.given(language))
      : execution.given(language)
  return joinProgram(start, problem.solution[language], undefined, execution.then(language)).source
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
      return run(hiddenBefore(problem, language))
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

describe('code-to-picture problems', () => {
  it('include every declared variable in the expected graph', () => {
    const pattern = /^\s*(?:let|const|var)\s+([A-Za-z_$][\w$]*)/gm
    for (const problem of problems) {
      if (problem.kind !== 'draw') continue
      const names = problem.expected.variables.map((variable) => variable.name)
      const declared = [...problem.code.javascript.matchAll(pattern)].map((match) => match[1])
      for (const name of declared) {
        expect(names, problem.id).toContain(name)
      }
    }
  })
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

const processed = writeProblems.filter(
  (problem) => problem.process !== undefined || problem.constraints !== undefined,
)

describe('process rules', () => {
  it.each(processed.map((problem) => [problem.id, problem] as const))(
    '%s only names variables and starter code that exist',
    (_id, problem) => {
      const visible = new Set(namesOf(problem))
      const starter = problem.given?.javascript ?? ''
      for (const alternate of [...(problem.process?.hidden ?? []), ...constraintCasesOf(problem)]) {
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
      if (problem.process?.runtime || problem.process?.hidden || problem.constraints) {
        expect(problem.given, problem.id).toBeDefined()
      }
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
          hiddenBefore(problem, 'python'),
          problem.solution.python,
          problem.process?.runtime && PYTHON_CHECKPOINT,
          hiddenAfter(problem, 'python'),
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
    ['identity-9', 'let full = "Ada Lovelace";', 'full = "Ada Lovelace"', START_CHANGED],
    ['identity-10', 'let b = Pet("Duke");', 'b = Pet("Duke")', /share one Pet/],
    [
      'identity-12',
      'a = Pet("Rocky");\nb = Pet("Pepper");\nlet c = b;\nlet d = a;\nlet e = c;',
      'a = Pet("Rocky")\nb = Pet("Pepper")\nc = b\nd = a\ne = c',
      START_CHANGED,
    ],

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
      /"q" afterward should be the same container as "p" at the start/,
    ],
    ['mutating-objects-12', 'p = { a: 2, b: 1 };', 'p = {"a": 2, "b": 1}', KEEP('p')],
    [
      'mutating-objects-15',
      'b = { score: 0, done: true };\na = { score: 5 };',
      'b = {"score": 0, "done": True}\na = {"score": 5}',
      /"b" afterward should be the same container as "a" at the start/,
    ],

    ['copies-6', 'let q = { n: 1, m: 2 };', 'q = {"n": 1, "m": 2}', /by copying "p"/],
    ['copies-7', 'let b = [1, 2, 3];', 'b = [1, 2, 3]', /by copying "a"/],
    [
      'copies-8',
      'let q = { tags: p.tags };\nq.tags.push("y");',
      'q = {"tags": p["tags"]}\nq["tags"].append("y")',
      /by copying "p"/,
    ],
    ['copies-10', 'let b = [[1], [2]];', 'b = [[1], [2]]', START_CHANGED],
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
    ['rebinding-8', 'b = [1, 2, 3, 4];', 'b = [1, 2, 3, 4]', /Build "b" with "b(\.concat\(\[\.\.\.\]\)| \+ \[\.\.\.\])"/],
    ['rebinding-9', 'a = [9];\nb = [1, 2];', 'a = [9]\nb = [1, 2]', /"b" afterward should be the same container as "a" at the start/],
    [
      'rebinding-10',
      'name = "ADA";',
      'name = "ADA"',
      /by calling name\.(toUpperCase|upper)\(\)/,
    ],
    [
      'rebinding-15',
      'a.push(5);\nb = [4, 5, 6];',
      'a.append(5)\nb = [4, 5, 6]',
      /Build "b" with "b(\.concat\(\[\.\.\.\]\)| \+ \[\.\.\.\])"/,
    ],
    [
      'functions-6',
      'grow(a);\na.pop();\nb.push(0);',
      'grow(a)\na.pop()\nb.append(0)',
      /Call grow\(b\) once/,
    ],
    [
      'functions-8',
      'function withMilk(list) {\n  return ["tea", "milk"];\n}',
      'def withMilk(list):\n    return ["tea", "milk"]',
      /breaks the special constraint/,
    ],
    [
      'functions-10',
      'let a = [];\nlet b = [];\na.push(0);\na.push(0);\nb.push(0);',
      'a = []\nb = []\na.append(0)\na.append(0)\nb.append(0)',
      /Call fill\(a\) 2 times/,
    ],
    ['functions-12', 'b[0] = "new";', 'b[0] = "new"', /Call touch\(b\) once/],
    [
      'functions-13',
      'let a = { n: 1, tagged: true };\nlet b = { n: 2 };',
      'a = {"n": 1, "tagged": True}\nb = {"n": 2}',
      /Call tag\(a\) once/,
    ],
  ]

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

describe('copies-14 alternatives', () => {
  const alternatives: [code: string, language: Language][] = [
    ['let b = [...a, [3]];', 'javascript'],
    ['let b = a.concat([[3]]);', 'javascript'],
    ['b = a + [[3]]', 'python'],
  ]

  it.each(alternatives)('accepts %s in %s', async (code, language) => {
    const problem = writeProblems.find((candidate) => candidate.id === 'copies-14')!
    expect(await grade(problem, language, code)).toEqual({ ok: true, errors: [] })
  })
})

describe('diagnostic hints', () => {
  it('explains the static value rule when area is drawn as updated on Area after a change', () => {
    const problem = findProblem('scalars-4')!.problem
    const mistaken = graph({ width: 3, height: 5, area: 15 })
    const result = verify(mistaken, problem.expected, problem.hints)
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/Changing height later does not update area/)
  })

  it('explains the order of execution when area is drawn with the old height on Area before a change', () => {
    const problem = findProblem('scalars-15')!.problem
    const mistaken = graph({ width: 3, height: 5, area: 12 })
    const result = verify(mistaken, problem.expected, problem.hints)
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/height was changed to 5 before area was calculated/)
  })

  it('explains separate constructors when a and b are merged onto one Pet on Same label, separate objects', () => {
    const problem = findProblem('identity-5')!.problem
    const mistaken = graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Milo') })
    const result = verify(mistaken, problem.expected, problem.hints)
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/separate Pet calls/)
  })
})

describe('debrief diagrams', () => {
  const diagrams = problems.flatMap((problem) =>
    (problem.debrief ?? []).flatMap((block, index) =>
      'diagram' in block && block.verdict !== undefined
        ? [{ id: `${problem.id}#diagram${index + 1}`, problem, diagram: block.diagram, verdict: block.verdict }]
        : [],
    ),
  )

  it.each(diagrams.map((d) => [d.id, d] as const))('%s verdict matches verify()', (_id, { problem, diagram, verdict }) => {
    const result = verify(diagram, problem.expected)
    if (verdict === 'correct') {
      expect(result.errors).toEqual([])
    } else {
      expect(result.ok).toBe(false)
    }
  })
})

describe('debrief alternate answers', () => {
  const alternates: [id: string, code: string, language: Language][] = [
    ['scalars-8', '[a, b] = [b, a];', 'javascript'],
    ['scalars-8', 'a, b = b, a', 'python'],
  ]

  it.each(alternates)('%s accepts %j in %s', async (id, code, language) => {
    const problem = writeProblems.find((candidate) => candidate.id === id)!
    expect(await grade(problem, language, code)).toEqual({ ok: true, errors: [] })
  })
})

/**
 * Each answer builds the right picture but breaks the puzzle's special
 * constraint, and the feedback must say so in terms of the constraint.
 */
describe('special constraints', () => {
  const broken: [id: string, js: string, py: string, complaint: RegExp][] = [
    [
      'scalars-6',
      'let b = 8;',
      'b = 8',
      /special constraint\. If another programmer changes the code so that a starts at 3, b should become 3, but your code makes it 8\./,
    ],
    [
      'scalars-7',
      'let teams = players;',
      'teams = players',
      /special constraint\. If another programmer changes the code so that players starts at 6, teams should stay 2, but your code makes it 6\./,
    ],
    [
      'scalars-8',
      'a = 2;\nb = 1;',
      'a = 2\nb = 1',
      /special constraint\. .*a should become 9, but your code makes it 2, and b should become 5, but your code makes it 1\./,
    ],
  ]

  const cases = broken.flatMap(([id, js, py, complaint]) =>
    LANGUAGES.map((language) => [`${id} in ${language}`, id, language === 'javascript' ? js : py, language, complaint] as const),
  )

  it.each(cases)('%s rejects an answer that breaks it', async (_label, id, code, language, complaint) => {
    const problem = writeProblems.find((candidate) => candidate.id === id)!
    const verdict = await grade(problem, language, code)
    expect(verdict.ok).toBe(false)
    expect(verdict.errors.map((error) => error.message)).toEqual([expect.stringMatching(complaint)])
  })
})

describe('debrief rejected answers', () => {
  it('scalars-9 rejects re-declaring with let in JavaScript', async () => {
    const problem = writeProblems.find((candidate) => candidate.id === 'scalars-9')!
    const verdict = await grade(problem, 'javascript', 'let y = 9;')
    expect(verdict.ok).toBe(false)
    expect(verdict.errors.map((e) => e.message).join('\n')).toMatch(/already been declared/)
  })

  it('scalars-10 rejects leaving a variable undefined in JavaScript', async () => {
    const problem = writeProblems.find((candidate) => candidate.id === 'scalars-10')!
    const verdict = await grade(
      problem,
      'javascript',
      'let name = "Bo";\nlet age = 7;\nlet member = true;\nlet nickname;',
    )
    expect(verdict.ok).toBe(false)
    expect(verdict.errors.map((e) => e.message).join('\n')).toMatch(/has no value/)
  })
})
