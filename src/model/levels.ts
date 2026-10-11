import { dict, graph, list, pet, ref, scalar, withGarbage } from './builders'
import {
  after,
  before,
  call,
  callsMethod,
  combines,
  copiesFrom,
  copiesOrCombinesFrom,
  preserve,
  runtime,
  sameObject,
  type RuntimeChecks,
  type SourceRule,
} from './process'
import type {
  DebriefBlock,
  DiagnosticHint,
  Hint,
  Language,
  Level,
  LocalizedText,
  MemoryGraph,
  Problem,
} from './types'

const lines = (...rows: string[]) => rows.join('\n')

/** The same text in each language mode: `L('array', 'list')`, for example. */
const L = (javascript: string, python: string): LocalizedText => ({ javascript, python })

export type SpecHint = string | { js: string; py: string }

export type SpecDebriefBlock =
  | { html: SpecHint }
  | { diagram: MemoryGraph; caption: SpecHint; verdict?: 'correct' | 'incorrect' }

/** Problem titles that name language keywords are spelled per language. */
export type SpecTitle = string | { js: string; py: string }

const toTitle = (title: SpecTitle): string | LocalizedText =>
  typeof title === 'string' ? title : { javascript: title.js, python: title.py }

export function localize(spec: SpecHint): Hint {
  return typeof spec === 'string' ? spec : { javascript: spec.js, python: spec.py }
}

function toDebriefBlock(block: SpecDebriefBlock): DebriefBlock {
  if ('html' in block) {
    return { html: localize(block.html) }
  }
  return {
    diagram: block.diagram,
    caption: localize(block.caption),
    ...(block.verdict !== undefined && { verdict: block.verdict }),
  }
}

export const SHARING_LATER =
  '<p>Later, you will work with values that have identity and can be changed in place, and then it will matter a great deal whether two variables share a value or not. For now, it does not.</p>'

export const SHARING_REMINDER =
  '<p>As before, sharing a number or keeping separate copies makes no difference yet.</p>'

interface DrawSpec {
  kind: 'draw'
  title: SpecTitle
  js: string
  py: string
  expected: MemoryGraph
  hints?: DiagnosticHint[]
  hint?: SpecHint
  about?: SpecHint
  debrief?: SpecDebriefBlock[]
  opaquePrelude?: boolean
}

interface WriteSpec {
  kind: 'write'
  title: SpecTitle
  /** Read-only code that runs before the learner's. */
  given?: { js: string; py: string }
  /** Read-only code that runs after the learner's. */
  then?: { js: string; py: string }
  /** Reference answer, in the two languages. */
  js: string
  py: string
  expected: MemoryGraph
  process?: ProcessSpec
  constraints?: ConstraintSpec[]
  hints?: DiagnosticHint[]
  hint?: SpecHint
  about?: SpecHint
  debrief?: SpecDebriefBlock[]
  opaquePrelude?: boolean
}

/** See `Constraint`. */
interface ConstraintSpec {
  rule: SpecHint
  cases: {
    change: string
    given: { js: string; py: string }
    then?: { js: string; py: string }
    expected: MemoryGraph
  }[]
}

/** Starter code that differs from `given`, with the picture the same answer must build from it. */
interface HiddenSpec {
  given: { js: string; py: string }
  expected: MemoryGraph
}

/**
 * What the picture alone cannot enforce. `runtime` rules judge object identity
 * and calls to starter functions, `source` rules require an operation, and
 * `hidden` reruns the answer from other starting values.
 */
interface ProcessSpec {
  runtime?: RuntimeChecks
  source?: SourceRule[]
  hidden?: HiddenSpec[]
}

type Spec = DrawSpec | WriteSpec

const draw = (spec: Omit<DrawSpec, 'kind'>): DrawSpec => ({ kind: 'draw', ...spec })
const write = (spec: Omit<WriteSpec, 'kind'>): WriteSpec => ({ kind: 'write', ...spec })

function toProblem(spec: Spec, id: string, mystery: boolean): Problem {
  const hint = spec.hint ? localize(spec.hint) : undefined
  const about = spec.about ? localize(spec.about) : undefined
  const debrief = spec.debrief?.map(toDebriefBlock)

  if (spec.kind === 'draw') {
    return {
      kind: 'draw',
      id,
      title: toTitle(spec.title),
      mystery,
      code: { javascript: spec.js, python: spec.py },
      expected: spec.expected,
      hints: spec.hints,
      hint,
      about,
      debrief,
      ...(spec.opaquePrelude !== undefined && { opaquePrelude: spec.opaquePrelude }),
    }
  }
  return {
    kind: 'write',
    id,
    title: toTitle(spec.title),
    mystery,
    expected: spec.expected,
    given: spec.given && { javascript: spec.given.js, python: spec.given.py },
    then: spec.then && { javascript: spec.then.js, python: spec.then.py },
    solution: { javascript: spec.js, python: spec.py },
    process: spec.process && {
      runtime: spec.process.runtime,
      source: spec.process.source,
      hidden: spec.process.hidden?.map(({ given, expected }) => ({
        given: { javascript: given.js, python: given.py },
        expected,
      })),
    },
    ...(spec.constraints && {
      constraints: spec.constraints.map(({ rule, cases }) => ({
        rule: localize(rule),
        cases: cases.map(({ change, given, then, expected }) => ({
          change,
          given: { javascript: given.js, python: given.py },
          ...(then && { then: { javascript: then.js, python: then.py } }),
          expected,
        })),
      })),
    }),
    hints: spec.hints,
    hint,
    about,
    debrief,
    ...(spec.opaquePrelude !== undefined && { opaquePrelude: spec.opaquePrelude }),
  }
}

/**
 * Specs are listed in the order learners meet them, which mixes both kinds so
 * the next problem's direction is not predictable. Tutorial ids count each kind
 * separately (draw 1-5, write 6-10) so they stay stable if the order changes;
 * mystery problems follow as 11-15.
 *
 * Mystery problems use only ideas the tutorial problems already taught, in
 * situations the learner has not seen, and hide their titles until solved.
 */
function level(
  id: string,
  title: LocalizedText,
  description: LocalizedText,
  tutorial: Spec[],
  mysteries: Spec[],
): Level {
  let draws = 0
  let writes = 0
  const taught = tutorial.map((spec) =>
    spec.kind === 'draw'
      ? toProblem(spec, `${id}-${++draws}`, false)
      : toProblem(spec, `${id}-${5 + ++writes}`, false),
  )
  const tested = mysteries.map((spec, index) => toProblem(spec, `${id}-${11 + index}`, true))
  return { id, title, description, problems: [...taught, ...tested] }
}

export const levels: Level[] = [
  level(
    'scalars',
    L('Variables and Primitives', 'Variables and Scalars'),
    L(
      'A variable holds a value at the moment you assign it, not a live formula or spreadsheet cell. Reassigning replaces what it holds. Assigning from another variable gives it the same value at that moment. Reassigning one later repoints only that variable, leaving the other unchanged.',
      'A variable holds a value at the moment you assign it, not a live formula or spreadsheet cell. Reassigning replaces what it holds. Assigning from another variable gives it the same value at that moment. Reassigning one later repoints only that variable, leaving the other unchanged.',
    ),
    [
      draw({
        title: 'One variable',
        js: 'let x = 10;',
        py: 'x = 10',
        expected: graph({ x: 10 }),
        hint: 'Create a variable named x and a scalar number node with value 10, then connect x to 10.',
        about:
          'A variable and its value are two separate things. Assigning creates the name x and points it at the value 10.',
        debrief: [
          {
            html: {
              js: '<p><code>let x = 10;</code> creates two things: a <strong>variable</strong> named <code>x</code> and a <strong>value</strong>, the number 10. The arrow means "x currently refers to 10."</p>',
              py: '<p><code>x = 10</code> creates two things: a <strong>variable</strong> named <code>x</code> and a <strong>value</strong>, the number 10. The arrow means "x currently refers to 10."</p>',
            },
          },
          {
            html: '<p>Every diagram in this game is built from these pieces: names, values, and arrows from names to values. Where the boxes sit on the canvas does not matter, only what points to what.</p>',
          },
          {
            diagram: graph({ x: 10 }),
            caption: 'One name, one value, one arrow.',
            verdict: 'correct',
          },
        ],
      }),
      draw({
        title: 'Reassignment',
        js: lines('let x = 5;', 'x = 7;'),
        py: lines('x = 5', 'x = 7'),
        expected: graph({ x: 7 }),
        hint: 'Reassigning a variable replaces its previous value. In the final memory, x holds 7.',
        about:
          'Assigning to a variable that already exists moves its arrow to a new value. The variable keeps no memory of what it held before.',
        debrief: [
          {
            html: "<p>The second line does not turn the 5 into a 7. It moves x's arrow to a new value, 7. After the code runs, x refers to 7 and nothing refers to 5.</p>",
          },
          {
            diagram: graph({ x: 7 }),
            caption: 'x after both lines.',
            verdict: 'correct',
          },
          {
            html: '<p><strong>Also correct:</strong> leaving the old 5 on the canvas with nothing pointing to it. A value that nothing refers to can never be used again, so the checker ignores it. The language reclaims that memory on its own, which is called garbage collection.</p>',
          },
          {
            diagram: withGarbage(graph({ x: 7 }), 5),
            caption: 'Also correct: the old 5 left behind with nothing pointing to it.',
            verdict: 'correct',
          },
        ],
      }),
      draw({
        title: 'Assigning from a variable',
        js: lines('let x = 10;', 'let y = x;'),
        py: lines('x = 10', 'y = x'),
        expected: graph({ x: 10, y: 10 }),
        hint:
          'Assigning y from x gives y the value 10. Numbers cannot change in place, so one shared scalar number node or two separate nodes with 10 are both correct.',
        about:
          'Assigning one variable from another gives the new variable the value the first one holds at that moment.',
        debrief: [
          {
            html: {
              js: '<p><code>let y = x;</code> does not point y at x. Variables never point to variables. It looks up the value x holds right now, 10, and points y at that value.</p>',
              py: '<p><code>y = x</code> does not point y at x. Variables never point to variables. It looks up the value x holds right now, 10, and points y at that value.</p>',
            },
          },
          {
            html: '<p>There are two equally correct ways to draw this:</p>',
          },
          {
            diagram: graph({ x: 10, y: 10 }),
            caption: 'Two separate 10s.',
            verdict: 'correct',
          },
          {
            diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: scalar(10) }),
            caption: 'One 10 shared by both.',
            verdict: 'correct',
          },
          {
            html: {
              js: '<p>JavaScript describes <code>y = x</code> as copying the number into y, which matches the first picture.</p>',
              py: '<p>In Python, y now refers to the very same 10 object as x, which matches the second picture.</p>',
            },
          },
          {
            html: '<p>Either way, a number can never be changed in place, so no program can tell the two pictures apart, and the checker accepts both.</p>',
          },
          {
            html: SHARING_LATER,
          },
        ],
      }),
      write({
        title: 'Two equal values',
        given: { js: 'let a = 8;', py: 'a = 8' },
        js: 'let b = a;',
        py: 'b = a',
        expected: graph({ a: 8, b: 8 }),
        constraints: [
          {
            rule: 'Your boss said that if another programmer updates the code so that a starts at a different number, b must also use that different number.',
            cases: [
              {
                change: 'a starts at 3',
                given: { js: 'let a = 3;', py: 'a = 3' },
                expected: graph({ a: 3, b: 3 }),
              },
            ],
          },
        ],
        hint: {
          js: 'Declare b and assign it from a instead of typing 8 again.',
          py: 'Set b from a instead of typing 8 again.',
        },
        about:
          'Give b the value that a already holds. The special constraint says b must follow whatever number a starts at, so assign from a instead of typing the number again.',
        debrief: [
          {
            html: {
              js: '<p><code>let b = a;</code> gives b whatever value a holds at that moment: 8.</p>',
              py: '<p><code>b = a</code> gives b whatever value a holds at that moment: 8.</p>',
            },
          },
          {
            html: {
              js: '<p><strong>Not accepted:</strong> <code>let b = 8;</code> builds exactly the same picture, so the picture alone cannot tell the two apart. The special constraint can. If another programmer changes the first line to <code>let a = 3;</code>, then <code>let b = a;</code> gives b 3 as well, as your boss asked, but <code>let b = 8;</code> leaves b at 8.</p>',
              py: '<p><strong>Not accepted:</strong> <code>b = 8</code> builds exactly the same picture, so the picture alone cannot tell the two apart. The special constraint can. If another programmer changes the first line to <code>a = 3</code>, then <code>b = a</code> gives b 3 as well, as your boss asked, but <code>b = 8</code> leaves b at 8.</p>',
            },
          },
          {
            diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: scalar(8) }),
            caption: 'This picture, with one shared 8, shows the same memory as the one you matched.',
            verdict: 'correct',
          },
          {
            html: SHARING_LATER,
          },
        ],
      }),
      draw({
        title: 'Area after a change',
        js: lines('let width = 3;', 'let height = 4;', 'let area = width * height;', 'height = 5;'),
        py: lines('width = 3', 'height = 4', 'area = width * height', 'height = 5'),
        expected: graph({ width: 3, height: 5, area: 12 }),
        hint: 'Pay careful attention to the order of assignments.',
        hints: [
          {
            variable: 'area',
            value: 15,
            message:
              'The value 15 is not correct here. Changing height later does not update area — variables hold static values, not live formulas.',
          },
        ],
        about:
          'An assignment calculates its value once, when that line runs. A variable is not a spreadsheet cell, so changing height later does not change area.',
        debrief: [
          {
            html: '<p><code>width * height</code> multiplied 3 by 4 when that line ran, and area was pointed at the result, 12. The formula is not saved anywhere: area holds only the number.</p>',
          },
          {
            html: "<p>When height is reassigned to 5 afterward, only height's arrow moves. area still refers to 12.</p>",
          },
          {
            diagram: graph({ width: 3, height: 5, area: 12 }),
            caption: 'Correct: area keeps 12.',
            verdict: 'correct',
          },
          {
            diagram: graph({ width: 3, height: 5, area: 15 }),
            caption: 'Not correct: this is what a spreadsheet would show.',
            verdict: 'incorrect',
          },
          {
            html: '<p>Leaving the old 4 on the canvas with nothing pointing to it is fine too.</p>',
          },
        ],
      }),
      write({
        title: 'Two teams',
        given: { js: 'let players = 2;', py: 'players = 2' },
        js: 'let teams = 2;',
        py: 'teams = 2',
        expected: graph({ players: 2, teams: 2 }),
        constraints: [
          {
            rule: 'Your boss said the game always has exactly 2 teams, no matter how many players there are. If another programmer updates the code so that players starts at a different number, teams must stay 2.',
            cases: [
              {
                change: 'players starts at 6',
                given: { js: 'let players = 6;', py: 'players = 6' },
                expected: graph({ players: 6, teams: 2 }),
              },
            ],
          },
        ],
        hint: {
          js: 'Declare teams with the number 2 itself, not from players.',
          py: 'Set teams to the number 2 itself, not from players.',
        },
        about:
          'Two variables can hold the same number for different reasons. Here teams is 2 on its own account, not because players happens to be 2, so the special constraint says it must not follow players.',
        debrief: [
          {
            html: {
              js: '<p><code>let teams = 2;</code> gives teams its own 2. If another programmer changes the first line to <code>let players = 6;</code>, teams is still 2, as your boss asked.</p>',
              py: '<p><code>teams = 2</code> gives teams its own 2. If another programmer changes the first line to <code>players = 6</code>, teams is still 2, as your boss asked.</p>',
            },
          },
          {
            html: {
              js: '<p><strong>Not accepted:</strong> <code>let teams = players;</code> builds the same picture today, but if players started at 6, teams would be 6 too.</p>',
              py: '<p><strong>Not accepted:</strong> <code>teams = players</code> builds the same picture today, but if players started at 6, teams would be 6 too.</p>',
            },
          },
          {
            html: '<p>Compare this with Two equal values, where your boss asked for the opposite. Both pictures have the same shape: two variables holding the same number. The picture cannot tell you whether one value should follow the other. That depends on what the numbers mean, and deciding it is part of your job as the programmer.</p>',
          },
        ],
      }),
      draw({
        title: 'Reassigning the second variable',
        js: lines('let a = 1;', 'let b = a;', 'b = 2;'),
        py: lines('a = 1', 'b = a', 'b = 2'),
        expected: graph({ a: 1, b: 2 }),
        hint: 'Changing b leaves a unchanged: a stays 1 while b becomes 2.',
        about:
          'Once two variables hold the same value, reassigning one of them moves only its own arrow. The other variable keeps its value.',
        debrief: [
          {
            html: {
              js: "<p>After <code>let b = a;</code> both variables refer to 1. Then <code>b = 2;</code> moves only b's arrow. Nothing happened to a, so a still refers to 1.</p>",
              py: "<p>After <code>b = a</code> both variables refer to 1. Then <code>b = 2</code> moves only b's arrow. Nothing happened to a, so a still refers to 1.</p>",
            },
          },
          {
            diagram: graph({ a: 1, b: 2 }),
            caption: 'a keeps 1. b now refers to 2.',
            verdict: 'correct',
          },
          {
            html: "<p>If you pictured a and b sharing one 1 after the second line, moving b's arrow leaves a pointing at that same 1. If you pictured two separate 1s, b's old 1 is left with nothing pointing to it. Both ways end at the same picture.</p>",
          },
          {
            html: '<p>Reassigning a variable never changes any other variable. That stays true for every kind of value you will meet in this game.</p>',
          },
        ],
      }),
      write({
        title: 'Swapped',
        given: { js: lines('let a = 1;', 'let b = 2;'), py: lines('a = 1', 'b = 2') },
        js: lines('let t = a;', 'a = b;', 'b = t;'),
        py: lines('t = a', 'a = b', 'b = t'),
        expected: graph({ a: 2, b: 1 }),
        constraints: [
          {
            rule: 'Your boss said that if another programmer updates the code so that a and b start at different numbers, your code must still swap them.',
            cases: [
              {
                change: 'a starts at 5 and b starts at 9',
                given: { js: lines('let a = 5;', 'let b = 9;'), py: lines('a = 5', 'b = 9') },
                expected: graph({ a: 9, b: 5 }),
              },
            ],
          },
        ],
        hint: 'It is okay for you to add a third variable.',
        about:
          'Exchange the values of two variables. Each assignment replaces a value, so one value has to be saved somewhere first.',
        debrief: [
          {
            html: {
              js: "<p><code>a = b; b = a;</code> does not work: after the first line both variables refer to 2, and the 1 is lost. Saving a's value in a third variable first keeps it reachable:</p><pre><code>let t = a;\na = b;\nb = t;</code></pre>",
              py: "<p><code>a = b; b = a</code> does not work: after the first line both variables refer to 2, and the 1 is lost. Saving a's value in a third variable first keeps it reachable:</p><pre><code>t = a\na = b\nb = t</code></pre>",
            },
          },
          {
            html: {
              js: '<p><strong>Also correct:</strong> JavaScript can swap in one line: <code>[a, b] = [b, a];</code>. The right side is calculated first and holds both old values before either variable is reassigned.</p>',
              py: '<p><strong>Also correct:</strong> Python can swap in one line: <code>a, b = b, a</code>. The right side is calculated first and holds both old values before either name is reassigned.</p>',
            },
          },
          {
            html: {
              js: '<p><strong>Not accepted:</strong> <code>a = 2; b = 1;</code> builds the same picture because you can see the numbers, but the special constraint asks for a real swap, one that works whatever the starting values are.</p>',
              py: '<p><strong>Not accepted:</strong> <code>a = 2</code> and <code>b = 1</code> build the same picture because you can see the numbers, but the special constraint asks for a real swap, one that works whatever the starting values are.</p>',
            },
          },
          {
            diagram: graph({ a: 2, b: 1, t: 1 }),
            caption:
              'Memory after the swap with a temporary variable. t still refers to 1; the picture you matched shows only a and b.',
          },
        ],
      }),
      write({
        title: 'Only one changes',
        given: { js: lines('let x = 4;', 'let y = x;'), py: lines('x = 4', 'y = x') },
        js: 'y = 9;',
        py: 'y = 9',
        expected: graph({ x: 4, y: 9 }),
        hint: 'Reassign only y to 9. The variable x will remain unchanged.',
        about:
          'Two variables can start out holding the same value. Reassign just one of them, and the other is left alone.',
        debrief: [
          {
            html: {
              js: "<p><code>y = 9;</code> moves only y's arrow. x still refers to 4, even though y first got its value from x.</p>",
              py: "<p><code>y = 9</code> moves only y's arrow. x still refers to 4, even though y first got its value from x.</p>",
            },
          },
          {
            diagram: graph({ x: 4, y: 4 }),
            caption: 'Before your line runs.',
          },
          {
            diagram: graph({ x: 4, y: 9 }),
            caption: 'After your line runs.',
            verdict: 'correct',
          },
          {
            html: {
              js: '<p>There is no <code>let</code> here: <code>let</code> declares a new variable, and y already exists. <code>let y = 9;</code> stops with an error saying y has already been declared.</p>',
              py: '<p>Python has no separate declaration step: <code>y = 9</code> is spelled the same whether y is new or already exists.</p>',
            },
          },
        ],
      }),
      write({
        title: 'One of each',
        js: lines('let name = "Bo";', 'let age = 7;', 'let member = true;', 'let nickname = null;'),
        py: lines('name = "Bo"', 'age = 7', 'member = True', 'nickname = None'),
        expected: graph({ name: 'Bo', age: 7, member: true, nickname: null }),
        hint: {
          js: 'Declare four variables: name with "Bo", age with 7, member with true, and nickname with null.',
          py: 'Assign four variables: name with "Bo", age with 7, member with True, and nickname with None.',
        },
        about: {
          js: 'Numbers are not the only simple values. A string, a boolean, and null are values too, and a variable refers to each one with an arrow.',
          py: 'Numbers are not the only simple values. A string, a boolean, and None are values too, and a variable refers to each one with an arrow.',
        },
        debrief: [
          {
            html: {
              js: '<p>Each line points a new variable at a different kind of value: a string, a number, a boolean, and <code>null</code>. Like numbers, none of these can be changed in place.</p>',
              py: '<p>Each line points a new variable at a different kind of value: a string, a number, a boolean, and <code>None</code>. Like numbers, none of these can be changed in place.</p>',
            },
          },
          {
            html: {
              js: '<p><code>null</code> means "deliberately nothing," but it is still a value, so nickname gets a real arrow to it.</p>',
              py: '<p><code>None</code> means "deliberately nothing," but it is still a value, so nickname gets a real arrow to it.</p>',
            },
          },
          {
            html: {
              js: "<p><strong>Also correct:</strong> <code>'Bo'</code> in single quotes is the same string as <code>\"Bo\"</code>, and the four lines can come in any order. Leaving the value out, as in <code>let nickname;</code>, would not work: nickname would hold <code>undefined</code>, a different value from <code>null</code>.</p>",
              py: "<p><strong>Also correct:</strong> <code>'Bo'</code> in single quotes is the same string as <code>\"Bo\"</code>, and the four lines can come in any order. Lower-case <code>true</code> or <code>none</code> would not work: Python spells them <code>True</code> and <code>None</code>.</p>",
            },
          },
        ],
      }),
    ],
    [
      draw({
        title: 'Reassigning the original leaves the other unchanged',
        js: lines('let a = 3;', 'let b = a;', 'a = 8;'),
        py: lines('a = 3', 'b = a', 'a = 8'),
        expected: graph({ a: 8, b: 3 }),
        hint: 'Assigning b from a gives b the value 3 at that moment. When a is reassigned to 8, b keeps 3.',
        about:
          'Reassigning the variable a value came from does not affect the variable that was assigned from it. b keeps the value it got.',
        debrief: [
          {
            html: {
              js: "<p><code>let b = a;</code> gave b the value 3. It did not link b to a. When a is reassigned to 8, only a's arrow moves, so b still refers to 3.</p>",
              py: "<p><code>b = a</code> gave b the value 3. It did not link b to a. When a is reassigned to 8, only a's arrow moves, so b still refers to 3.</p>",
            },
          },
          {
            diagram: graph({ a: 8, b: 3 }),
            caption: 'Correct: b keeps 3.',
            verdict: 'correct',
          },
          {
            diagram: graph({ a: 8, b: 8 }),
            caption: 'Not correct: b does not follow a.',
            verdict: 'incorrect',
          },
          {
            html: "<p>If you pictured a and b sharing one 3, moving a's arrow to 8 leaves b pointing at that 3. If you pictured two separate 3s, a's old 3 is left with nothing pointing to it. Either way you end at the correct picture.</p>",
          },
          {
            html: SHARING_REMINDER,
          },
        ],
      }),
      draw({
        title: 'A string',
        js: 'let name = "Ada";',
        py: 'name = "Ada"',
        expected: graph({ name: 'Ada' }),
        hint: 'Create a variable named name and connect it to a string scalar node with "Ada".',
        about: 'A string is a value just like a number: the variable refers to it with an arrow.',
        debrief: [
          {
            html: '<p><code>"Ada"</code> is a single value, drawn as one block. The quotation marks tell the language where the text starts and ends; they are not part of the string\'s three letters.</p>',
          },
          {
            diagram: graph({ name: 'Ada' }),
            caption: 'One name, one string value.',
            verdict: 'correct',
          },
          {
            html: "<p><strong>Also correct:</strong> typing <code>'Ada'</code> with single quotes in the block. Both spell the same string.</p>",
          },
        ],
      }),
      draw({
        title: 'A chain of assignments',
        js: lines('let a = 6;', 'let b = a;', 'let c = b;', 'a = 0;'),
        py: lines('a = 6', 'b = a', 'c = b', 'a = 0'),
        expected: graph({ a: 0, b: 6, c: 6 }),
        hint: 'Reassigning a to 0 does not change b or c — they still hold 6.',
        about:
          'Each assignment from a variable takes the value it holds at that moment. A chain of such assignments does not link the variables together.',
        debrief: [
          {
            html: "<p>c got its value from b, and b got its value from a, but neither assignment linked the variables. Each one looked up a value, 6. Reassigning a to 0 moves only a's arrow, so b and c still refer to 6.</p>",
          },
          {
            diagram: graph({ a: 0, b: 6, c: 6 }),
            caption: 'Correct: b and c each refer to 6.',
            verdict: 'correct',
          },
          {
            diagram: graph({ a: 0, b: ref('shared'), c: ref('shared') }, { shared: scalar(6) }),
            caption: 'Also correct: b and c sharing one 6.',
            verdict: 'correct',
          },
          {
            html: SHARING_REMINDER,
          },
        ],
      }),
      draw({
        title: 'Rotate left',
        js: lines(
          'let a = 1;',
          'let b = 2;',
          'let c = 3;',
          'let t = a;',
          'a = b;',
          'b = c;',
          'c = t;',
        ),
        py: lines('a = 1', 'b = 2', 'c = 3', 't = a', 'a = b', 'b = c', 'c = t'),
        expected: graph({ a: 2, b: 3, c: 1, t: 1 }),
        hint:
          'Use a temporary variable to hold a, then set a = b, b = c, and c to that saved value.',
        about:
          'Moving three values around needs one saved value, as a swap does, and the order of the assignments decides where each value ends up.',
        debrief: [
          {
            html: "<p>Follow it one line at a time:</p><ol><li>t saves a's value: t is 1.</li><li>a takes b's value: a is 2.</li><li>b takes c's value: b is 3.</li><li>c takes the saved value: c is 1.</li></ol><p>Each value moves one place to the left, and the first one wraps around to the end.</p>",
          },
          {
            diagram: graph({ a: 2, b: 3, c: 1, t: 1 }),
            caption: 'After the rotation.',
            verdict: 'correct',
          },
          {
            html: '<p>t still exists and refers to 1, so it is part of the final memory too.</p>',
          },
        ],
      }),
      draw({
        title: 'Area before a change',
        js: lines('let width = 3;', 'let height = 4;', 'height = 5;', 'let area = width * height;'),
        py: lines('width = 3', 'height = 4', 'height = 5', 'area = width * height'),
        expected: graph({ width: 3, height: 5, area: 15 }),
        hint: 'Pay careful attention to the order of your work.',
        hints: [
          {
            variable: 'area',
            value: 12,
            message:
              'The value 12 is not correct here. Notice that height was changed to 5 before area was calculated, so area uses 5, not 4.',
          },
        ],
        about:
          'A calculation uses the values its variables hold when its line runs. This is the same rule as Area after a change, with the lines in a different order.',
        debrief: [
          {
            html: '<p>This time height becomes 5 <strong>before</strong> area is calculated, so the multiplication uses 5 and area refers to 15.</p>',
          },
          {
            diagram: graph({ width: 3, height: 5, area: 15 }),
            caption: 'Correct: area uses the new height.',
            verdict: 'correct',
          },
          {
            diagram: graph({ width: 3, height: 5, area: 12 }),
            caption: 'Not correct: the 4 was gone before area was calculated.',
            verdict: 'incorrect',
          },
        ],
      }),
    ],
  ),

  level(
    'identity',
    L(
      'Objects with Identity and Multiple References',
      'Objects with Identity and Multiple References',
    ),
    L(
      'Unlike numbers and strings, a Pet is a separate thing in memory, and a variable only holds a reference to it. Two variables can refer to the same Pet, while two Pet("Milo") calls always build two separate Pets, even with the same name. Pet is built in for this level: call Pet("name") with no new. On the canvas, Add Pet draws one Pet: name it and connect variables to it.',
      'Unlike numbers and strings, a Pet is a separate thing in memory, and a variable only holds a reference to it. Two variables can refer to the same Pet, while two Pet("Milo") calls always build two separate Pets, even with the same name. Pet is built in for this level: call Pet("name"). On the canvas, Add Pet draws one Pet: name it and connect variables to it.',
    ),
    [
      draw({
        title: 'One labeled object',
        js: 'let item = Pet("Ada");',
        py: 'item = Pet("Ada")',
        expected: graph({ item: ref('o') }, { o: pet('Ada') }),
        hint: 'Add a variable named item and a Pet node named "Ada", then connect item to the Pet.',
        opaquePrelude: true,
      }),
      draw({
        title: 'Two names, one object',
        js: lines('let a = Pet("Max");', 'let b = a;'),
        py: lines('a = Pet("Max")', 'b = a'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Max') }),
        hint: 'Assigning b = a makes both names refer to the same Pet, not a second copy.',
        opaquePrelude: true,
      }),
      write({
        title: 'Three names, one object',
        js: lines('let a = Pet("Rex");', 'let b = a;', 'let c = a;'),
        py: lines('a = Pet("Rex")', 'b = a', 'c = a'),
        expected: graph(
          { a: ref('shared'), b: ref('shared'), c: ref('shared') },
          { shared: pet('Rex') },
        ),
        hint: 'Each assignment from a adds another name for the same Pet.',
        opaquePrelude: true,
      }),
      write({
        title: 'Two fresh objects',
        js: lines('let p = Pet("Luna");', 'let q = Pet("Coco");'),
        py: lines('p = Pet("Luna")', 'q = Pet("Coco")'),
        expected: graph({ p: ref('p'), q: ref('q') }, { p: pet('Luna'), q: pet('Coco') }),
        hint: {
          js: 'Declare two variables, each with its own Pet call.',
          py: 'Create two variables, each with its own Pet call.',
        },
        opaquePrelude: true,
      }),
      draw({
        title: 'Assigning from a string',
        js: lines('let s = "hi";', 'let t = s;'),
        py: lines('s = "hi"', 't = s'),
        expected: graph({ s: 'hi', t: 'hi' }),
        hint:
          'Assigning t from s gives t the value "hi". Strings cannot change in place, so one shared string scalar node or two separate nodes are both correct.',
      }),
      write({
        title: "Two share, one doesn't",
        js: lines('let a = Pet("Bella");', 'let b = a;', 'let c = Pet("Daisy");'),
        py: lines('a = Pet("Bella")', 'b = a', 'c = Pet("Daisy")'),
        expected: graph(
          { a: ref('shared'), b: ref('shared'), c: ref('alone') },
          { shared: pet('Bella'), alone: pet('Daisy') },
        ),
        hint: 'b = a shares one Pet; c = Pet("Daisy") creates a second, separate Pet.',
        opaquePrelude: true,
      }),
      write({
        title: 'A full name',
        given: {
          js: lines('let first = "Ada";', 'let last = "Lovelace";'),
          py: lines('first = "Ada"', 'last = "Lovelace"'),
        },
        js: 'let full = first + " " + last;',
        py: 'full = first + " " + last',
        expected: graph({ first: 'Ada', last: 'Lovelace', full: 'Ada Lovelace' }),
        hint: {
          js: 'Declare full by joining first, a space " ", and last.',
          py: 'Assign full by joining first, a space " ", and last.',
        },
        process: {
          hidden: [
            {
              given: {
                js: lines('let first = "Grace";', 'let last = "Hopper";'),
                py: lines('first = "Grace"', 'last = "Hopper"'),
              },
              expected: graph({ first: 'Grace', last: 'Hopper', full: 'Grace Hopper' }),
            },
          ],
        },
      }),
      draw({
        title: 'Building a new string',
        js: lines('let s = "hi";', 's = s + "!";'),
        py: lines('s = "hi"', 's = s + "!"'),
        expected: graph({ s: 'hi!' }),
        hint: 'Adding to a string builds a new string. In the end, s points to "hi!".',
      }),
      draw({
        title: 'Same label, separate objects',
        js: lines('let a = Pet("Milo");', 'let b = Pet("Milo");'),
        py: lines('a = Pet("Milo")', 'b = Pet("Milo")'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: pet('Milo'), b: pet('Milo') }),
        hint: 'Two Pet calls with the same name still build two separate Pets in memory.',
        hints: [
          {
            variable: 'b',
            aliasing: 'shared',
            message:
              'a and b are built from separate Pet calls, so they refer to two separate Pets even though both are named Milo.',
          },
        ],
        opaquePrelude: true,
      }),
      write({
        title: 'Same pet as a',
        given: { js: 'let a = Pet("Duke");', py: 'a = Pet("Duke")' },
        js: 'let b = a;',
        py: 'b = a',
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Duke') }),
        process: {
          hidden: [
            {
              given: { js: 'let a = Pet("Rex");', py: 'a = Pet("Rex")' },
              expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Rex') }),
            },
          ],
        },
        hint: {
          js: 'Declare b and assign it from a instead of calling Pet again.',
          py: 'Set b from a instead of calling Pet again.',
        },
        opaquePrelude: true,
      }),
    ],
    [
      draw({
        title: 'Another name for the same Pet',
        js: lines('let a = Pet("Olive");', 'let b = a;', 'let c = b;'),
        py: lines('a = Pet("Olive")', 'b = a', 'c = b'),
        expected: graph(
          { a: ref('shared'), b: ref('shared'), c: ref('shared') },
          { shared: pet('Olive') },
        ),
        hint: 'Chaining assignments still leaves every name pointing at one shared Pet.',
        opaquePrelude: true,
      }),
      write({
        title: 'Join the right Pet',
        given: {
          js: lines('let a = Pet("Rocky");', 'let b = Pet("Pepper");'),
          py: lines('a = Pet("Rocky")', 'b = Pet("Pepper")'),
        },
        js: lines('let c = b;', 'let d = a;', 'let e = c;'),
        py: lines('c = b', 'd = a', 'e = c'),
        expected: graph(
          { a: ref('rocky'), b: ref('pepper'), c: ref('pepper'), d: ref('rocky'), e: ref('pepper') },
          { rocky: pet('Rocky'), pepper: pet('Pepper') },
        ),
        process: {
          hidden: [
            {
              given: {
                js: lines('let a = Pet("Max");', 'let b = Pet("Nala");'),
                py: lines('a = Pet("Max")', 'b = Pet("Nala")'),
              },
              expected: graph(
                { a: ref('max'), b: ref('nala'), c: ref('nala'), d: ref('max'), e: ref('nala') },
                { max: pet('Max'), nala: pet('Nala') },
              ),
            },
          ],
        },
        hint: {
          js: 'Declare each new variable from an existing one that already refers to the Pet it should share.',
          py: 'Set each new variable from an existing one that already refers to the Pet it should share.',
        },
        opaquePrelude: true,
      }),
      draw({
        title: 'Two pairs',
        js: lines(
          'let a = Pet("Scout");',
          'let b = a;',
          'let c = Pet("Rosie");',
          'let d = c;',
        ),
        py: lines(
          'a = Pet("Scout")',
          'b = a',
          'c = Pet("Rosie")',
          'd = c',
        ),
        expected: graph(
          { a: ref('first'), b: ref('first'), c: ref('second'), d: ref('second') },
          { first: pet('Scout'), second: pet('Rosie') },
        ),
        hint: 'a and b share Scout; c and d share a different Pet, Rosie.',
        opaquePrelude: true,
      }),
      draw({
        title: 'Which names share?',
        js: lines('let a = Pet("Charlie");', 'let b = Pet("Charlie");', 'let c = a;'),
        py: lines('a = Pet("Charlie")', 'b = Pet("Charlie")', 'c = a'),
        expected: graph(
          { a: ref('shared'), b: ref('alone'), c: ref('shared') },
          { shared: pet('Charlie'), alone: pet('Charlie') },
        ),
        hint: "c = a joins c with a's Pet; b keeps its own Pet, also named Charlie.",
        opaquePrelude: true,
      }),
      write({
        title: 'Clear one, keep the backup',
        given: {
          js: lines('let name = "Ada";', 'let backup = name;'),
          py: lines('name = "Ada"', 'backup = name'),
        },
        js: 'name = null;',
        py: 'name = None',
        expected: graph({ name: null, backup: 'Ada' }),
        hint: {
          js: 'Reassign name to null. The backup variable will keep its value.',
          py: 'Reassign name to None. The backup variable will keep its value.',
        },
      }),
    ],
  ),

  level(
    'arrays',
    L('Arrays', 'Lists'),
    L(
      'An array is a separate object in memory with numbered slots. A variable holds only a reference to it. An array literal like [1, 2] builds an array. You already know from the previous level when two variables share one array and when two arrays stay separate, so here focus on building and reading slot structure.',
      'A list is a separate object in memory with numbered slots. A variable holds only a reference to it. A list literal like [1, 2] builds a list. You already know from the previous level when two variables share one list and when two lists stay separate, so here focus on building and reading slot structure.',
    ),
    [
      draw({
        title: 'A list of numbers',
        js: 'let nums = [1, 2, 3];',
        py: 'nums = [1, 2, 3]',
        expected: graph({ nums: ref('nums') }, { nums: list(1, 2, 3) }),
        hint: 'Create variable nums and a list with slots 1, 2, and 3, then connect nums to that list.',
      }),
      write({
        title: 'A list of strings',
        js: 'let colors = ["red", "green"];',
        py: 'colors = ["red", "green"]',
        expected: graph({ colors: ref('colors') }, { colors: list('red', 'green') }),
        hint: {
          js: 'Declare colors and assign it a list literal containing "red" and "green".',
          py: 'Assign colors a list literal containing "red" and "green".',
        },
      }),
      draw({
        title: 'An empty list',
        js: 'let items = [];',
        py: 'items = []',
        expected: graph({ items: ref('items') }, { items: list() }),
        hint: 'Create variable items and an empty list node with no slots, then connect them.',
      }),
      draw({
        title: 'Mixed values',
        js: 'let mixed = [1, "two", true];',
        py: 'mixed = [1, "two", True]',
        expected: graph({ mixed: ref('mixed') }, { mixed: list(1, 'two', true) }),
        hint: {
          js: 'One list holds a number, the string "two", and true in three slots.',
          py: 'One list holds a number, the string "two", and True in three slots.',
        },
      }),
      write({
        title: { js: 'Null in a list', py: 'None in a list' },
        js: 'let cells = [null, 0, null];',
        py: 'cells = [None, 0, None]',
        expected: graph({ cells: ref('cells') }, { cells: list(null, 0, null) }),
        hint: {
          js: 'Declare cells as a three-slot list: null, 0, null.',
          py: 'Assign cells a three-slot list: None, 0, None.',
        },
      }),
      draw({
        title: 'One slot',
        js: 'let cell = [7];',
        py: 'cell = [7]',
        expected: graph({ cell: ref('cell') }, { cell: list(7) }),
        hint: 'Create variable cell and a list with one slot holding 7, then connect them.',
      }),
      write({
        title: 'Two of the same number',
        js: 'let pair = [3, 3];',
        py: 'pair = [3, 3]',
        expected: graph({ pair: ref('pair') }, { pair: list(3, 3) }),
        hint: {
          js: 'Declare pair and assign it a list literal containing 3 and 3.',
          py: 'Assign pair a list literal containing 3 and 3.',
        },
      }),
      draw({
        title: 'A longer list',
        js: 'let nums = [1, 2, 3, 4];',
        py: 'nums = [1, 2, 3, 4]',
        expected: graph({ nums: ref('nums') }, { nums: list(1, 2, 3, 4) }),
        hint: 'Create variable nums and a list with slots 1, 2, 3, and 4, then connect nums to that list.',
      }),
      write({
        title: 'A list from a variable',
        given: { js: 'let n = 5;', py: 'n = 5' },
        js: 'let row = [n];',
        py: 'row = [n]',
        expected: graph({ n: 5, row: ref('row') }, { row: list(5) }),
        hint: {
          js: 'Declare row as a one-slot list built from the existing variable n.',
          py: 'Assign row a one-slot list built from the existing variable n.',
        },
      }),
      write({
        title: 'A three-string list',
        js: 'let tags = ["a", "b", "c"];',
        py: 'tags = ["a", "b", "c"]',
        expected: graph({ tags: ref('tags') }, { tags: list('a', 'b', 'c') }),
        hint: {
          js: 'Declare tags as ["a", "b", "c"].',
          py: 'Assign tags ["a", "b", "c"].',
        },
      }),
    ],
    [
      write({
        title: 'Every kind of value',
        js: lines('let empty = [];', 'let full = [1, "1", true, null];'),
        py: lines('empty = []', 'full = [1, "1", True, None]'),
        expected: graph(
          { empty: ref('empty'), full: ref('full') },
          { empty: list(), full: list(1, '1', true, null) },
        ),
        hint: {
          js: 'Declare empty as [] and full with one slot each for 1, "1", true, and null.',
          py: 'Assign empty as [] and full with one slot each for 1, "1", True, and None.',
        },
      }),
      draw({
        title: 'Same contents, separate lists',
        js: lines('let a = [1];', 'let b = [1];'),
        py: lines('a = [1]', 'b = [1]'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1) }),
        hint: 'Two list literals with the same contents are still two separate lists in memory.',
        hints: [
          {
            variable: 'b',
            aliasing: 'shared',
            message:
              'a and b are built from separate list literals, so they refer to two separate lists even though the slots match.',
          },
        ],
      }),
      draw({
        title: 'Three words',
        js: 'let words = ["I", "see", "you"];',
        py: 'words = ["I", "see", "you"]',
        expected: graph({ words: ref('words') }, { words: list('I', 'see', 'you') }),
        hint: 'Create variable words and a three-slot list holding "I", "see", and "you", then connect them.',
      }),
      draw({
        title: 'Booleans in a list',
        js: 'let flags = [true, false, true];',
        py: 'flags = [True, False, True]',
        expected: graph({ flags: ref('flags') }, { flags: list(true, false, true) }),
        hint: {
          js: 'One list holds true, false, and true in three slots.',
          py: 'One list holds True, False, and True in three slots.',
        },
      }),
      write({
        title: 'Two lists from literals',
        js: lines('let p = [0];', 'let q = [0];'),
        py: lines('p = [0]', 'q = [0]'),
        expected: graph({ p: ref('p'), q: ref('q') }, { p: list(0), q: list(0) }),
        hint: {
          js: 'Declare two variables, each with its own single-slot list literal holding 0.',
          py: 'Create two variables, each with its own single-slot list literal holding 0.',
        },
      }),
    ],
  ),

  level(
    'objects',
    L('Objects', 'Dictionaries'),
    L(
      'An object stores values under named keys. Like an array, it is a separate object in memory, and variables hold references to it.',
      'A dictionary stores values under named keys. Like a list, it is a separate object in memory, and variables hold references to it.',
    ),
    [
      draw({
        title: 'One key',
        js: 'let user = { name: "Ada" };',
        py: 'user = {"name": "Ada"}',
        expected: graph({ user: ref('user') }, { user: dict({ name: 'Ada' }) }),
        hint: 'Create variable user and an object with key name holding "Ada", then connect user to that object.',
      }),
      write({
        title: 'A key holding nothing',
        js: 'let cell = { value: null };',
        py: 'cell = {"value": None}',
        expected: graph({ cell: ref('cell') }, { cell: dict({ value: null }) }),
        hint: {
          js: 'Declare cell as an object with key value holding null.',
          py: 'Assign cell a dict with key value holding None.',
        },
      }),
      draw({
        title: 'Two keys',
        js: 'let point = { x: 1, y: 2 };',
        py: 'point = {"x": 1, "y": 2}',
        expected: graph({ point: ref('point') }, { point: dict({ x: 1, y: 2 }) }),
        hint: 'Create variable point and an object with keys x holding 1 and y holding 2.',
      }),
      write({
        title: 'Settings',
        js: 'let settings = { dark: true, size: 12 };',
        py: 'settings = {"dark": True, "size": 12}',
        expected: graph({ settings: ref('settings') }, { settings: dict({ dark: true, size: 12 }) }),
        hint: {
          js: 'Declare settings as an object with dark holding true and size holding 12.',
          py: 'Assign settings a dict with dark holding True and size holding 12.',
        },
      }),
      draw({
        title: 'An empty object',
        js: 'let empty = {};',
        py: 'empty = {}',
        expected: graph({ empty: ref('empty') }, { empty: dict({}) }),
        hint: 'Create variable empty and an empty object with no keys, then connect them.',
      }),
      write({
        title: 'A book',
        js: 'let book = { title: "Dune", year: 1965, read: false };',
        py: 'book = {"title": "Dune", "year": 1965, "read": False}',
        expected: graph(
          { book: ref('book') },
          { book: dict({ title: 'Dune', year: 1965, read: false }) },
        ),
        hint: {
          js: 'Declare book as an object with title "Dune", year 1965, and read holding false.',
          py: 'Assign book a dict with title "Dune", year 1965, and read holding False.',
        },
      }),
      draw({
        title: 'Two names, one object',
        js: lines('let a = { k: 1 };', 'let b = a;'),
        py: lines('a = {"k": 1}', 'b = a'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ k: 1 }) }),
        hint: 'Assigning b = a makes both names refer to the same object, not a second copy.',
      }),
      draw({
        title: 'Equal but separate',
        js: lines('let a = { k: 1 };', 'let b = { k: 1 };'),
        py: lines('a = {"k": 1}', 'b = {"k": 1}'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: dict({ k: 1 }), b: dict({ k: 1 }) }),
        hint: 'Two object literals with the same keys and values are still two separate objects in memory.',
      }),
      write({
        title: 'Three names, one object',
        js: lines('let x = { n: 0 };', 'let y = x;', 'let z = x;'),
        py: lines('x = {"n": 0}', 'y = x', 'z = x'),
        expected: graph(
          { x: ref('shared'), y: ref('shared'), z: ref('shared') },
          { shared: dict({ n: 0 }) },
        ),
        hint: 'Each assignment from x adds another name for the same object.',
      }),
      write({
        title: 'One alone, two together',
        js: lines('let a = { id: 1 };', 'let b = { id: 2 };', 'let c = b;'),
        py: lines('a = {"id": 1}', 'b = {"id": 2}', 'c = b'),
        expected: graph(
          { a: ref('alone'), b: ref('pair'), c: ref('pair') },
          { alone: dict({ id: 1 }), pair: dict({ id: 2 }) },
        ),
        hint: 'c = b shares one object; a holds a separate object with its own id value.',
      }),
    ],
    [
      write({
        title: 'Same keys, different objects',
        js: lines('let ann = { name: "Ann" };', 'let bob = { name: "Bob" };'),
        py: lines('ann = {"name": "Ann"}', 'bob = {"name": "Bob"}'),
        expected: graph(
          { ann: ref('ann'), bob: ref('bob') },
          { ann: dict({ name: 'Ann' }), bob: dict({ name: 'Bob' }) },
        ),
        hint: 'Create ann and bob as two separate objects, each with its own name key.',
      }),
      draw({
        title: 'Two pairs of names',
        js: lines('let a = { on: true };', 'let b = { on: true };', 'let c = a;', 'let d = b;'),
        py: lines('a = {"on": True}', 'b = {"on": True}', 'c = a', 'd = b'),
        expected: graph(
          { a: ref('first'), b: ref('second'), c: ref('first'), d: ref('second') },
          { first: dict({ on: true }), second: dict({ on: true }) },
        ),
        hint: {
          js: 'a and b start as separate objects; c joins the first object and d joins the second, even though both hold true.',
          py: 'a and b start as separate objects; c joins the first object and d joins the second, even though both hold True.',
        },
      }),
      draw({
        title: 'Three kinds of value',
        js: 'let pet = { name: "Rex", owner: null, age: 3 };',
        py: 'pet = {"name": "Rex", "owner": None, "age": 3}',
        expected: graph({ pet: ref('pet') }, { pet: dict({ name: 'Rex', owner: null, age: 3 }) }),
        hint: {
          js: 'Create pet as an object with name "Rex", owner holding null, and age 3.',
          py: 'Create pet as a dict with name "Rex", owner holding None, and age 3.',
        },
      }),
      write({
        title: 'Settings under another name',
        js: lines('let config = { debug: false, name: "app", retries: 0 };', 'let settings = config;'),
        py: lines('config = {"debug": False, "name": "app", "retries": 0}', 'settings = config'),
        expected: graph(
          { config: ref('shared'), settings: ref('shared') },
          { shared: dict({ debug: false, name: 'app', retries: 0 }) },
        ),
        hint: {
          js: 'Declare config as an object, then assign settings from config so both name the same object.',
          py: 'Assign config a dict, then set settings from config so both name the same dict.',
        },
      }),
      draw({
        title: 'Two keys, same value',
        js: 'let p = { a: 0, b: 0 };',
        py: 'p = {"a": 0, "b": 0}',
        expected: graph({ p: ref('p') }, { p: dict({ a: 0, b: 0 }) }),
        hint:
          'Keys a and b both hold 0. Numbers cannot change in place, so one shared scalar number node or two separate nodes with 0 are both correct.',
      }),
    ],
  ),

  level(
    'mutating-arrays',
    L('Changing Arrays', 'Changing Lists'),
    L(
      'Adding, removing or overwriting an item changes the array itself, so every variable that refers to it sees the change. Assigning a new array to a variable is different: it repoints only that variable and leaves the previous one as it was.',
      'Adding, removing or overwriting an item changes the list itself, so every variable that refers to it sees the change. Assigning a new list to a variable is different: it repoints only that variable and leaves the previous one as it was.',
    ),
    [
      draw({
        title: 'Appending',
        js: lines('let a = [1];', 'a.push(2);'),
        py: lines('a = [1]', 'a.append(2)'),
        expected: graph({ a: ref('a') }, { a: list(1, 2) }),
        hint: 'Adding to the end changes the same list in place: a ends holding [1, 2].',
      }),
      write({
        title: 'Grow a list',
        given: { js: 'let a = [];', py: 'a = []' },
        js: lines('a.push(3);', 'a.push(6);', 'a.push(9);'),
        py: lines('a.append(3)', 'a.append(6)', 'a.append(9)'),
        expected: graph({ a: ref('a') }, { a: list(3, 6, 9) }),
        hint: 'Add 3, then 6, then 9 to the end of a, changing the same list in place.',
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Overwriting a slot',
        js: lines('let a = [1, 2, 3];', 'a[0] = 9;'),
        py: lines('a = [1, 2, 3]', 'a[0] = 9'),
        expected: graph({ a: ref('a') }, { a: list(9, 2, 3) }),
        hint: 'Overwriting slot 0 changes the same list in place: a ends holding [9, 2, 3].',
      }),
      draw({
        title: 'Removing the last item',
        js: lines('let a = [1, 2, 3];', 'a.pop();'),
        py: lines('a = [1, 2, 3]', 'a.pop()'),
        expected: graph({ a: ref('a') }, { a: list(1, 2) }),
        hint: 'Removing the last item changes the same list in place: a ends holding [1, 2].',
      }),
      write({
        title: 'Change the middle',
        given: { js: 'let a = [1, 2, 3];', py: 'a = [1, 2, 3]' },
        js: 'a[1] = 5;',
        py: 'a[1] = 5',
        expected: graph({ a: ref('a') }, { a: list(1, 5, 3) }),
        hint: 'Change slot 1 of a to 5 in place, leaving slots 0 and 2 alone.',
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Mutating through an alias',
        js: lines('let a = [1];', 'let b = a;', 'b.push(2);'),
        py: lines('a = [1]', 'b = a', 'b.append(2)'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2) }),
        hint: 'b = a shares one list, so growing through b changes the list a sees too: both end holding [1, 2].',
      }),
      write({
        title: 'Empty it for both',
        given: { js: lines('let a = [4, 5];', 'let b = a;'), py: lines('a = [4, 5]', 'b = a') },
        js: lines('a.pop();', 'a.pop();'),
        py: lines('a.pop()', 'a.pop()'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list() }),
        hint: 'Remove both items from a in place so a and b end sharing one empty list.',
        process: { runtime: runtime(preserve('a')) },
      }),
      write({
        title: 'Add for both',
        given: { js: lines('let a = ["x"];', 'let b = a;'), py: lines('a = ["x"]', 'b = a') },
        js: 'b.push("y");',
        py: 'b.append("y")',
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('x', 'y') }),
        hint: 'Add "y" to the end of b in place; a shares the same list so both end holding ["x", "y"].',
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Pointing a name elsewhere',
        js: lines('let a = [1, 2, 3];', 'let b = a;', 'a = [0];'),
        py: lines('a = [1, 2, 3]', 'b = a', 'a = [0]'),
        expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2, 3), new: list(0) }),
        hint: 'Assigning a = [0] repoints only a at a new list; b keeps referring to [1, 2, 3].',
      }),
      write({
        title: 'Split them apart',
        given: { js: lines('let a = [1];', 'let b = a;'), py: lines('a = [1]', 'b = a') },
        js: 'b = [1, 2];',
        py: 'b = [1, 2]',
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2) }),
        hint: 'Point b at a new list [1, 2]; a keeps its original [1].',
        process: { runtime: runtime(preserve('a')) },
      }),
    ],
    [
      write({
        title: 'Peel one off',
        given: {
          js: lines('let a = [1];', 'let b = a;', 'let c = a;'),
          py: lines('a = [1]', 'b = a', 'c = a'),
        },
        js: lines('b = [];', 'c.push(2);'),
        py: lines('b = []', 'c.append(2)'),
        expected: graph(
          { a: ref('shared'), b: ref('alone'), c: ref('shared') },
          { shared: list(1, 2), alone: list() },
        ),
        hint: 'Point b at a new empty list, then grow c in place so a and c share [1, 2].',
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Grow once, pop twice',
        js: lines('let a = [4, 5];', 'a.push(6);', 'a.pop();', 'a.pop();'),
        py: lines('a = [4, 5]', 'a.append(6)', 'a.pop()', 'a.pop()'),
        expected: graph({ a: ref('a') }, { a: list(4) }),
        hint: 'Each change applies to the same list in order: grow to [4, 5, 6], then remove twice to end at [4].',
      }),
      write({
        title: 'Fill the ends',
        given: { js: 'let a = [0, 0, 0];', py: 'a = [0, 0, 0]' },
        js: lines('a[0] = 7;', 'a[2] = 8;'),
        py: lines('a[0] = 7', 'a[2] = 8'),
        expected: graph({ a: ref('a') }, { a: list(7, 0, 8) }),
        hint: 'Set slot 0 to 7 and slot 2 to 8 in place, leaving slot 1 as 0.',
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Repoint, then grow',
        js: lines('let a = [1];', 'let b = a;', 'b = [2];', 'b.push(3);'),
        py: lines('a = [1]', 'b = a', 'b = [2]', 'b.append(3)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(2, 3) }),
        hint: 'Assigning b = [2] repoints only b; growing b afterward leaves a holding [1] while b ends holding [2, 3].',
      }),
      draw({
        title: 'Both hands on one list',
        js: lines('let a = ["x", "y"];', 'let b = a;', 'b[0] = "z";', 'a.pop();'),
        py: lines('a = ["x", "y"]', 'b = a', 'b[0] = "z"', 'a.pop()'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('z') }),
        hint: 'b = a shares one list, so every change through either name lands in the same place: overwrite slot 0 to "z", then remove the last item to end at ["z"].',
      }),
    ],
  ),

  level(
    'mutating-objects',
    L('Changing Objects', 'Changing Dictionaries'),
    L(
      'Adding, changing or deleting a key changes the object itself, so every variable that refers to it sees the change. Assigning a brand new object to a variable repoints only that variable; the old object is untouched.',
      'Adding, changing or deleting a key changes the dictionary itself, so every variable that refers to it sees the change. Assigning a brand new dictionary to a variable repoints only that variable; the old dictionary is untouched.',
    ),
    [
      draw({
        title: 'Adding a key',
        js: lines('let p = { n: 1 };', 'p.m = 2;'),
        py: lines('p = {"n": 1}', 'p["m"] = 2'),
        expected: graph({ p: ref('p') }, { p: dict({ n: 1, m: 2 }) }),
        hint: 'Adding a key changes the same object in place: p ends with n holding 1 and m holding 2.',
      }),
      write({
        title: 'Fill an empty object',
        given: { js: 'let p = {};', py: 'p = {}' },
        js: lines('p.width = 4;', 'p.height = 2;'),
        py: lines('p["width"] = 4', 'p["height"] = 2'),
        expected: graph({ p: ref('p') }, { p: dict({ width: 4, height: 2 }) }),
        hint: 'Add keys width holding 4 and height holding 2 to p in place.',
        process: { runtime: runtime(preserve('p')) },
      }),
      draw({
        title: 'Changing a value',
        js: lines('let p = { n: 1 };', 'p.n = 5;'),
        py: lines('p = {"n": 1}', 'p["n"] = 5'),
        expected: graph({ p: ref('p') }, { p: dict({ n: 5 }) }),
        hint: 'Changing key n to 5 updates the same object in place.',
      }),
      draw({
        title: 'Changing through an alias',
        js: lines('let a = { n: 1 };', 'let b = a;', 'b.n = 2;'),
        py: lines('a = {"n": 1}', 'b = a', 'b["n"] = 2'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ n: 2 }) }),
        hint: 'b = a shares one object, so changing n through b is visible through a: both end with n holding 2.',
      }),
      write({
        title: 'Both see it',
        given: { js: lines('let a = { n: 1 };', 'let b = a;'), py: lines('a = {"n": 1}', 'b = a') },
        js: 'b.done = true;',
        py: 'b["done"] = True',
        expected: graph(
          { a: ref('shared'), b: ref('shared') },
          { shared: dict({ n: 1, done: true }) },
        ),
        hint: {
          js: 'Add key done holding true to b in place; a shares the same object.',
          py: 'Add key done holding True to b in place; a shares the same object.',
        },
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Deleting a key',
        js: lines('let p = { a: 1, b: 2 };', 'delete p.b;'),
        py: lines('p = {"a": 1, "b": 2}', 'del p["b"]'),
        expected: graph({ p: ref('p') }, { p: dict({ a: 1 }) }),
        hint: 'Deleting key b changes the same object in place, leaving only a holding 1.',
      }),
      write({
        title: 'Rename a key',
        given: { js: 'let p = { old: 1 };', py: 'p = {"old": 1}' },
        js: lines('p.renamed = p.old;', 'delete p.old;'),
        py: lines('p["renamed"] = p["old"]', 'del p["old"]'),
        expected: graph({ p: ref('p') }, { p: dict({ renamed: 1 }) }),
        hint: 'Copy the value at old to a new key renamed, then remove old, changing the same object in place.',
        process: {
          runtime: runtime(preserve('p')),
          hidden: [
            {
              given: { js: 'let p = { old: 7 };', py: 'p = {"old": 7}' },
              expected: graph({ p: ref('p') }, { p: dict({ renamed: 7 }) }),
            },
          ],
        },
      }),
      write({
        title: 'Clear it out',
        given: {
          js: lines('let p = { a: 1, b: 2 };', 'let q = p;'),
          py: lines('p = {"a": 1, "b": 2}', 'q = p'),
        },
        js: lines('delete p.a;', 'delete p.b;'),
        py: lines('del p["a"]', 'del p["b"]'),
        expected: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({}) }),
        hint: 'Remove keys a and b from p in place so p and q end sharing one empty object.',
        process: { runtime: runtime(preserve('p')) },
      }),
      draw({
        title: 'A brand new object',
        js: lines('let p = { n: 1 };', 'let q = p;', 'p = { n: 9 };'),
        py: lines('p = {"n": 1}', 'q = p', 'p = {"n": 9}'),
        expected: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 1 }), new: dict({ n: 9 }) }),
        hint: 'Assigning p a new object with n holding 9 repoints only p; q keeps referring to the original with n holding 1.',
      }),
      write({
        title: 'Leave the old one behind',
        given: { js: lines('let p = { n: 1 };', 'let q = p;'), py: lines('p = {"n": 1}', 'q = p') },
        js: lines('p.m = 3;', 'p = { n: 2 };'),
        py: lines('p["m"] = 3', 'p = {"n": 2}'),
        expected: graph(
          { p: ref('new'), q: ref('old') },
          { old: dict({ n: 1, m: 3 }), new: dict({ n: 2 }) },
        ),
        hint: 'Add key m holding 3 to p in place, then point p at a new object with n holding 2; q keeps the original with both keys.',
        process: { runtime: runtime(sameObject(before('p'), after('q'))) },
      }),
    ],
    [
      draw({
        title: 'Two names, two changes',
        js: lines('let p = { n: 1 };', 'let q = p;', 'q.n = q.n + 1;', 'p.m = 0;'),
        py: lines('p = {"n": 1}', 'q = p', 'q["n"] = q["n"] + 1', 'p["m"] = 0'),
        expected: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 2, m: 0 }) }),
        hint: 'p and q name the same object, so both changes land together: n becomes 2 and m holding 0 is added.',
      }),
      write({
        title: 'Swap inside an object',
        given: { js: 'let p = { a: 1, b: 2 };', py: 'p = {"a": 1, "b": 2}' },
        js: lines('let t = p.a;', 'p.a = p.b;', 'p.b = t;'),
        py: lines('t = p["a"]', 'p["a"] = p["b"]', 'p["b"] = t'),
        expected: graph({ p: ref('p') }, { p: dict({ a: 2, b: 1 }) }),
        hint: 'Use a temporary variable to hold the value at key a, then move the value at key b to a and the saved value to b.',
        process: {
          runtime: runtime(preserve('p')),
          hidden: [
            {
              given: { js: 'let p = { a: 5, b: 9 };', py: 'p = {"a": 5, "b": 9}' },
              expected: graph({ p: ref('p') }, { p: dict({ a: 9, b: 5 }) }),
            },
          ],
        },
      }),
      draw({
        title: 'Deleting through an alias',
        js: lines('let a = { x: 1, y: 2 };', 'let b = a;', 'delete b.x;'),
        py: lines('a = {"x": 1, "y": 2}', 'b = a', 'del b["x"]'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ y: 2 }) }),
        hint: 'b = a shares one object, so deleting key x through b leaves a with only y holding 2.',
      }),
      draw({
        title: 'The alias kept the original object',
        js: lines('let p = { n: 1 };', 'let q = p;', 'p = { n: 1 };', 'q.n = 2;'),
        py: lines('p = {"n": 1}', 'q = p', 'p = {"n": 1}', 'q["n"] = 2'),
        expected: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 2 }), new: dict({ n: 1 }) }),
        hint: 'Assigning p a new object with n holding 1 repoints only p; changing n through q to 2 touches the original alone.',
      }),
      write({
        title: 'Mark it, then move on',
        given: { js: lines('let a = { score: 0 };', 'let b = a;'), py: lines('a = {"score": 0}', 'b = a') },
        js: lines('b.done = true;', 'a = { score: 5 };'),
        py: lines('b["done"] = True', 'a = {"score": 5}'),
        expected: graph(
          { a: ref('new'), b: ref('old') },
          { old: dict({ score: 0, done: true }), new: dict({ score: 5 }) },
        ),
        hint: {
          js: 'Add done holding true through b in place, then point a at a new object with score 5; b keeps the marked original.',
          py: 'Add done holding True through b in place, then point a at a new object with score 5; b keeps the marked original.',
        },
        process: { runtime: runtime(sameObject(before('a'), after('b'))) },
      }),
    ],
  ),

  level(
    'nesting',
    L('Nested Arrays and Objects', 'Nested Lists and Dictionaries'),
    L(
      'Arrays and objects can hold references to other arrays and objects. Each inner array or object is a separate object in memory, and the same one can be referred to from several places. An inner container can even be the outer one, or lead back to it, so references can form loops.',
      'Lists and dictionaries can hold references to other lists and dictionaries. Each inner list or dictionary is a separate object in memory, and the same one can be referred to from several places. An inner container can even be the outer one, or lead back to it, so references can form loops.',
    ),
    [
      draw({
        title: 'A grid',
        js: 'let grid = [[1, 2], [3, 4]];',
        py: 'grid = [[1, 2], [3, 4]]',
        expected: graph(
          { grid: ref('grid') },
          {
            grid: list(ref('row0'), ref('row1')),
            row0: list(1, 2),
            row1: list(3, 4),
          },
        ),
        hint: 'Create grid as a list with two slots, each pointing at its own inner list: [1, 2] and [3, 4].',
      }),
      write({
        title: 'An object that holds itself',
        js: lines('let o = {};', 'o.self = o;'),
        py: lines('o = {}', 'o["self"] = o'),
        expected: graph({ o: ref('o') }, { o: dict({ self: ref('o') }) }),
        hint: {
          js: 'Declare o as an empty object, then point its self key back at o itself.',
          py: 'Assign o an empty dict, then point its self key back at o itself.',
        },
      }),
      draw({
        title: 'An object holding a list',
        js: 'let person = { name: "Ada", langs: ["js", "py"] };',
        py: 'person = {"name": "Ada", "langs": ["js", "py"]}',
        expected: graph(
          { person: ref('person') },
          {
            person: dict({ name: 'Ada', langs: ref('langs') }),
            langs: list('js', 'py'),
          },
        ),
        hint: 'Create person as an object with name "Ada" and langs pointing at its own list ["js", "py"].',
      }),
      write({
        title: 'An object inside an object',
        js: 'let home = { address: { city: "Oslo" } };',
        py: 'home = {"address": {"city": "Oslo"}}',
        expected: graph(
          { home: ref('home') },
          { home: dict({ address: ref('address') }), address: dict({ city: 'Oslo' }) },
        ),
        hint: {
          js: 'Declare home as an object with address pointing at its own inner object holding city "Oslo".',
          py: 'Assign home a dict with address pointing at its own inner dict holding city "Oslo".',
        },
      }),
      draw({
        title: 'A list of objects',
        js: 'let users = [{ id: 1 }, { id: 2 }];',
        py: 'users = [{"id": 1}, {"id": 2}]',
        expected: graph(
          { users: ref('users') },
          {
            users: list(ref('first'), ref('second')),
            first: dict({ id: 1 }),
            second: dict({ id: 2 }),
          },
        ),
        hint: 'Create users as a list with two slots, each pointing at its own object with its own id value.',
      }),
      write({
        title: 'Parent and child',
        js: lines('let parent = { kids: [] };', 'let kid = { parent: parent };', 'parent.kids.push(kid);'),
        py: lines('parent = {"kids": []}', 'kid = {"parent": parent}', 'parent["kids"].append(kid)'),
        expected: graph(
          { parent: ref('parent'), kid: ref('kid') },
          {
            parent: dict({ kids: ref('kids') }),
            kids: list(ref('kid')),
            kid: dict({ parent: ref('parent') }),
          },
        ),
        hint: {
          js: 'Declare parent with empty kids, declare kid pointing at parent, then add kid to parent.kids.',
          py: 'Assign parent with empty kids, assign kid pointing at parent, then add kid to parent["kids"].',
        },
      }),
      draw({
        title: 'The same inner list twice',
        js: lines('let inner = [1];', 'let outer = [inner, inner];'),
        py: lines('inner = [1]', 'outer = [inner, inner]'),
        expected: graph(
          { inner: ref('inner'), outer: ref('outer') },
          { inner: list(1), outer: list(ref('inner'), ref('inner')) },
        ),
        hint: 'Both slots of outer point at the same inner list [1]; there is only one inner list.',
      }),
      write({
        title: 'Two keys, one list',
        js: lines('let l = [0];', 'let box = { left: l, right: l };'),
        py: lines('l = [0]', 'box = {"left": l, "right": l}'),
        expected: graph(
          { box: ref('box') },
          { box: dict({ left: ref('shared'), right: ref('shared') }), shared: list(0) },
        ),
        hint: {
          js: 'Declare l as [0], then declare box as an object with left and right both pointing at that same list.',
          py: 'Assign l as [0], then assign box a dict with left and right both pointing at that same list.',
        },
      }),
      write({
        title: 'Two lists, one object',
        js: lines('let o = { v: 1 };', 'let a = [o];', 'let b = [o];'),
        py: lines('o = {"v": 1}', 'a = [o]', 'b = [o]'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          { a: list(ref('shared')), b: list(ref('shared')), shared: dict({ v: 1 }) },
        ),
        hint: 'Create o with v holding 1, then create a and b as two separate lists that both hold that same object.',
      }),
      draw({
        title: 'Changing a nested list',
        js: lines('let inner = [1];', 'let outer = [inner];', 'inner.push(2);'),
        py: lines('inner = [1]', 'outer = [inner]', 'inner.append(2)'),
        expected: graph(
          { inner: ref('inner'), outer: ref('outer') },
          { inner: list(1, 2), outer: list(ref('inner')) },
        ),
        hint: 'Growing inner in place to [1, 2] is visible through outer, since outer holds that same inner list.',
      }),
    ],
    [
      write({
        title: 'One row, used twice',
        js: lines('let row = [null, null];', 'let board = [row, row];'),
        py: lines('row = [None, None]', 'board = [row, row]'),
        expected: graph(
          { board: ref('board') },
          { board: list(ref('row'), ref('row')), row: list(null, null) },
        ),
        hint: {
          js: 'Declare row as [null, null], then declare board as a list holding that same row twice.',
          py: 'Assign row as [None, None], then assign board a list holding that same row twice.',
        },
      }),
      draw({
        title: 'Pointing at each other',
        js: lines('let a = { n: 1 };', 'let b = { n: 2 };', 'a.other = b;', 'b.other = a;'),
        py: lines('a = {"n": 1}', 'b = {"n": 2}', 'a["other"] = b', 'b["other"] = a'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          {
            a: dict({ n: 1, other: ref('b') }),
            b: dict({ n: 2, other: ref('a') }),
          },
        ),
        hint: 'Point a at b and b back at a, so the two objects refer to each other.',
      }),
      write({
        title: 'Two points in a line',
        js: 'let line = { start: { x: 0, y: 0 }, end: { x: 3, y: 4 } };',
        py: 'line = {"start": {"x": 0, "y": 0}, "end": {"x": 3, "y": 4}}',
        expected: graph(
          { line: ref('line') },
          {
            line: dict({ start: ref('start'), end: ref('end') }),
            start: dict({ x: 0, y: 0 }),
            end: dict({ x: 3, y: 4 }),
          },
        ),
        hint: {
          js: 'Declare line as an object with start and end each pointing at their own point object.',
          py: 'Assign line a dict with start and end each pointing at their own point dict.',
        },
      }),
      draw({
        title: 'One list in two objects',
        js: lines('let tag = ["new"];', 'let a = { tags: tag };', 'let b = { tags: tag };'),
        py: lines('tag = ["new"]', 'a = {"tags": tag}', 'b = {"tags": tag}'),
        expected: graph(
          { tag: ref('tag'), a: ref('a'), b: ref('b') },
          { tag: list('new'), a: dict({ tags: ref('tag') }), b: dict({ tags: ref('tag') }) },
        ),
        hint: 'Both a and b hold the same tag list ["new"] in their tags key.',
      }),
      draw({
        title: 'Changing an object inside a list',
        js: lines('let inner = { n: 1 };', 'let outer = [inner];', 'inner.n = 2;'),
        py: lines('inner = {"n": 1}', 'outer = [inner]', 'inner["n"] = 2'),
        expected: graph(
          { inner: ref('inner'), outer: ref('outer') },
          { inner: dict({ n: 2 }), outer: list(ref('inner')) },
        ),
        hint: 'Changing n to 2 inside inner is visible through outer, since outer holds that same object.',
      }),
    ],
  ),

  level(
    'copies',
    L('Copies and Aliases', 'Copies and Aliases'),
    L(
      'Copying with spread makes a new outer array or object, but any inner arrays or objects inside are shared with the original, not copied. That is a shallow copy. Repeating an item, as with fill(), repeats the same reference.',
      'Copying with list() and dict() makes a new outer list or dictionary, but any inner lists or dictionaries inside are shared with the original, not copied. That is a shallow copy. Repeating an item with * repeats the same reference.',
    ),
    [
      draw({
        title: 'A copy of a list',
        js: lines('let a = [1, 2];', 'let b = [...a];'),
        py: lines('a = [1, 2]', 'b = list(a)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2) }),
        hint: {
          js: 'b = [...a] makes a new outer list with the same slot values; a and b point at different lists.',
          py: 'b = list(a) makes a new outer list with the same slot values; a and b point at different lists.',
        },
      }),
      draw({
        title: 'A copy of an object',
        js: lines('let p = { n: 1 };', 'let q = { ...p };'),
        py: lines('p = {"n": 1}', 'q = dict(p)'),
        expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1 }) }),
        hint: {
          js: 'q = { ...p } makes a new outer object with the same keys; p and q point at different objects.',
          py: 'q = dict(p) makes a new outer dict with the same keys; p and q point at different dicts.',
        },
      }),
      write({
        title: 'Copy and add a key',
        given: { js: 'let p = { n: 1 };', py: 'p = {"n": 1}' },
        js: lines('let q = { ...p };', 'q.m = 2;'),
        py: lines('q = dict(p)', 'q["m"] = 2'),
        expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1, m: 2 }) }),
        hint: {
          js: 'Declare q as a copy of p, then add key m holding 2 to q in place; p stays with only n.',
          py: 'Assign q as a copy of p, then add key m holding 2 to q in place; p stays with only n.',
        },
        process: {
          runtime: runtime(preserve('p')),
          source: [copiesFrom('q', 'p')],
          hidden: [
            {
              given: { js: 'let p = { n: 4 };', py: 'p = {"n": 4}' },
              expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 4 }), q: dict({ n: 4, m: 2 }) }),
            },
          ],
        },
      }),
      write({
        title: 'Copy, then grow the copy',
        given: { js: 'let a = [1, 2];', py: 'a = [1, 2]' },
        js: lines('let b = [...a];', 'b.push(3);'),
        py: lines('b = list(a)', 'b.append(3)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2, 3) }),
        hint: {
          js: 'Declare b as a copy of a, then grow b to [1, 2, 3] in place; a stays [1, 2].',
          py: 'Assign b as a copy of a, then grow b to [1, 2, 3] in place; a stays [1, 2].',
        },
        process: {
          runtime: runtime(preserve('a')),
          source: [copiesFrom('b', 'a')],
          hidden: [
            {
              given: { js: 'let a = [5, 6];', py: 'a = [5, 6]' },
              expected: graph({ a: ref('a'), b: ref('b') }, { a: list(5, 6), b: list(5, 6, 3) }),
            },
          ],
        },
      }),
      draw({
        title: 'A shallow copy',
        js: lines('let a = [[1]];', 'let b = [...a];'),
        py: lines('a = [[1]]', 'b = list(a)'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          { a: list(ref('inner')), b: list(ref('inner')), inner: list(1) },
        ),
        hint: 'Copying makes a new outer list, but its one slot still points at the same inner list [1].',
      }),
      draw({
        title: 'Mutating inside a shallow copy',
        js: lines('let a = [[1]];', 'let b = [...a];', 'b[0].push(2);'),
        py: lines('a = [[1]]', 'b = list(a)', 'b[0].append(2)'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          { a: list(ref('inner')), b: list(ref('inner')), inner: list(1, 2) },
        ),
        hint: 'b shares the inner list with a, so growing that inner list to [1, 2] is visible through both outer lists.',
      }),
      write({
        title: 'A shallow object copy',
        given: { js: 'let p = { tags: ["x"] };', py: 'p = {"tags": ["x"]}' },
        js: lines('let q = { ...p };', 'q.tags.push("y");'),
        py: lines('q = dict(p)', 'q["tags"].append("y")'),
        expected: graph(
          { p: ref('p'), q: ref('q') },
          {
            p: dict({ tags: ref('tags') }),
            q: dict({ tags: ref('tags') }),
            tags: list('x', 'y'),
          },
        ),
        hint: {
          js: 'Declare q as a copy of p, then grow the shared tags list in place so both end with ["x", "y"].',
          py: 'Assign q as a copy of p, then grow the shared tags list in place so both end with ["x", "y"].',
        },
        process: {
          runtime: runtime(preserve('p'), preserve('p', 'tags')),
          source: [copiesFrom('q', 'p')],
          hidden: [
            {
              given: { js: 'let p = { tags: ["z"] };', py: 'p = {"tags": ["z"]}' },
              expected: graph(
                { p: ref('p'), q: ref('q') },
                {
                  p: dict({ tags: ref('tags') }),
                  q: dict({ tags: ref('tags') }),
                  tags: list('z', 'y'),
                },
              ),
            },
          ],
        },
      }),
      draw({
        title: 'Repeating one list',
        js: lines('let row = [0];', 'let grid = Array(2).fill(row);'),
        py: lines('row = [0]', 'grid = [row] * 2'),
        expected: graph(
          { row: ref('row'), grid: ref('grid') },
          { row: list(0), grid: list(ref('row'), ref('row')) },
        ),
        hint: {
          js: 'Array(2).fill(row) repeats the same row reference twice: both slots of grid point at the one row list.',
          py: '[row] * 2 repeats the same row reference twice: both slots of grid point at the one row list.',
        },
      }),
      write({
        title: 'Rows that don\'t share',
        js: 'let grid = [[0], [0], [0]];',
        py: 'grid = [[0], [0], [0]]',
        expected: graph(
          { grid: ref('grid') },
          {
            grid: list(ref('row0'), ref('row1'), ref('row2')),
            row0: list(0),
            row1: list(0),
            row2: list(0),
          },
        ),
        hint: {
          js: 'Declare grid as a list of three separate inner lists, each holding [0].',
          py: 'Assign grid a list of three separate inner lists, each holding [0].',
        },
      }),
      write({
        title: 'A copy that shares nothing',
        given: { js: 'let a = [[1], [2]];', py: 'a = [[1], [2]]' },
        js: 'let b = [[...a[0]], [...a[1]]];',
        py: 'b = [list(a[0]), list(a[1])]',
        expected: graph(
          { a: ref('a'), b: ref('b') },
          {
            a: list(ref('a0'), ref('a1')),
            b: list(ref('b0'), ref('b1')),
            a0: list(1),
            a1: list(2),
            b0: list(1),
            b1: list(2),
          },
        ),
        hint: {
          js: 'Declare b as a new outer list holding copies of each inner list, so no inner list is shared with a.',
          py: 'Assign b a new outer list holding copies of each inner list, so no inner list is shared with a.',
        },
        process: {
          runtime: runtime(preserve('a'), preserve('a', 0), preserve('a', 1)),
          hidden: [
            {
              given: { js: 'let a = [[3], [4]];', py: 'a = [[3], [4]]' },
              expected: graph(
                { a: ref('a'), b: ref('b') },
                {
                  a: list(ref('a0'), ref('a1')),
                  b: list(ref('b0'), ref('b1')),
                  a0: list(3),
                  a1: list(4),
                  b0: list(3),
                  b1: list(4),
                },
              ),
            },
          ],
        },
      }),
    ],
    [
      write({
        title: 'A shallow copy, changed twice',
        given: { js: 'let p = { tags: ["a"] };', py: 'p = {"tags": ["a"]}' },
        js: lines('let q = { ...p };', 'q.extra = true;', 'q.tags.push("b");'),
        py: lines('q = dict(p)', 'q["extra"] = True', 'q["tags"].append("b")'),
        expected: graph(
          { p: ref('p'), q: ref('q') },
          {
            p: dict({ tags: ref('tags') }),
            q: dict({ tags: ref('tags'), extra: true }),
            tags: list('a', 'b'),
          },
        ),
        hint: {
          js: 'Declare q as a copy of p, then add extra holding true to q and grow the shared tags list to ["a", "b"].',
          py: 'Assign q as a copy of p, then add extra holding True to q and grow the shared tags list to ["a", "b"].',
        },
        process: {
          runtime: runtime(preserve('p'), preserve('p', 'tags')),
          source: [copiesFrom('q', 'p')],
          hidden: [
            {
              given: { js: 'let p = { tags: ["c"] };', py: 'p = {"tags": ["c"]}' },
              expected: graph(
                { p: ref('p'), q: ref('q') },
                {
                  p: dict({ tags: ref('tags') }),
                  q: dict({ tags: ref('tags'), extra: true }),
                  tags: list('c', 'b'),
                },
              ),
            },
          ],
        },
      }),
      draw({
        title: 'Replacing a shared inner object',
        js: lines('let a = { inner: { n: 1 } };', 'let b = { ...a };', 'b.inner = { n: 2 };'),
        py: lines('a = {"inner": {"n": 1}}', 'b = dict(a)', 'b["inner"] = {"n": 2}'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          {
            a: dict({ inner: ref('old') }),
            b: dict({ inner: ref('new') }),
            old: dict({ n: 1 }),
            new: dict({ n: 2 }),
          },
        ),
        hint: 'Copying shares the inner object at first; assigning b a new inner object repoints only b, leaving a with the original.',
      }),
      draw({
        title: 'Changing the repeated row',
        js: lines('let row = [0];', 'let grid = Array(3).fill(row);', 'row.push(1);'),
        py: lines('row = [0]', 'grid = [row] * 3', 'row.append(1)'),
        expected: graph(
          { row: ref('row'), grid: ref('grid') },
          { row: list(0, 1), grid: list(ref('row'), ref('row'), ref('row')) },
        ),
        hint: 'All three slots of grid point at the same row list, so growing row to [0, 1] is visible through every slot.',
      }),
      write({
        title: 'Copy, then add a row',
        given: { js: 'let a = [[1], [2]];', py: 'a = [[1], [2]]' },
        js: lines('let b = [...a];', 'b.push([3]);'),
        py: lines('b = list(a)', 'b.append([3])'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          {
            a: list(ref('r1'), ref('r2')),
            b: list(ref('r1'), ref('r2'), ref('r3')),
            r1: list(1),
            r2: list(2),
            r3: list(3),
          },
        ),
        hint: {
          js: 'Declare b as a copy of a, then add a new row [3] to b in place; a stays with two rows.',
          py: 'Assign b as a copy of a, then add a new row [3] to b in place; a stays with two rows.',
        },
        process: {
          runtime: runtime(preserve('a'), preserve('a', 0), preserve('a', 1)),
          source: [copiesOrCombinesFrom('b', 'a')],
        },
      }),
      draw({
        title: 'Changing the original after copying',
        js: lines('let a = [1, 2];', 'let b = [...a];', 'a[0] = 9;'),
        py: lines('a = [1, 2]', 'b = list(a)', 'a[0] = 9'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(9, 2), b: list(1, 2) }),
        hint: 'Copying freezes the slot values: changing slot 0 of a to 9 afterward leaves b holding [1, 2].',
      }),
    ],
  ),

  level(
    'rebinding',
    L('Building New Values', 'Building New Values'),
    L(
      'Strings never change: methods like toUpperCase() build a new string. Growing an array with push changes it in place; combining with concat builds a new array and leaves the old one alone. Setting a variable to null drops one reference; a value nothing refers to is gone for good.',
      'Strings never change: methods like upper() build a new string. Growing a list with append changes it in place; combining with + builds a new list and leaves the old one alone. Setting a variable to None drops one reference; a value nothing refers to is gone for good.',
    ),
    [
      draw({
        title: 'Strings never change',
        js: lines('let s = "ab";', 'let t = s.toUpperCase();'),
        py: lines('s = "ab"', 't = s.upper()'),
        expected: graph({ s: 'ab', t: 'AB' }),
        hint: {
          js: 's.toUpperCase() builds a new string "AB"; s keeps "ab".',
          py: 's.upper() builds a new string "AB"; s keeps "ab".',
        },
      }),
      write({
        title: 'Upper and lower',
        given: { js: 'let s = "Hi";', py: 's = "Hi"' },
        js: lines('let lo = s.toLowerCase();', 'let up = s.toUpperCase();'),
        py: lines('lo = s.lower()', 'up = s.upper()'),
        expected: graph({ s: 'Hi', lo: 'hi', up: 'HI' }),
        hint: {
          js: 'Declare lo with s.toLowerCase() and up with s.toUpperCase(); s stays "Hi".',
          py: 'Assign lo with s.lower() and up with s.upper(); s stays "Hi".',
        },
        process: {
          source: [
            callsMethod('lo', 's', { javascript: 'toLowerCase', python: 'lower' }),
            callsMethod('up', 's', { javascript: 'toUpperCase', python: 'upper' }),
          ],
          hidden: [
            {
              given: { js: 'let s = "Yo";', py: 's = "Yo"' },
              expected: graph({ s: 'Yo', lo: 'yo', up: 'YO' }),
            },
          ],
        },
      }),
      draw({
        title: 'Building a new list',
        js: lines('let a = [1];', 'let b = a;', 'a = a.concat([2]);'),
        py: lines('a = [1]', 'b = a', 'a = a + [2]'),
        expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1), new: list(1, 2) }),
        hint: {
          js: 'After a = a.concat([2]), a points at a new list while b still refers to [1].',
          py: 'After a = a + [2], a points at a new list while b still refers to [1].',
        },
      }),
      draw({
        title: 'A string taken from a list',
        js: lines('let words = ["hi"];', 'let w = words[0];', 'w = w + "!";'),
        py: lines('words = ["hi"]', 'w = words[0]', 'w = w + "!"'),
        expected: graph({ words: ref('words'), w: 'hi!' }, { words: list('hi') }),
        hint: 'w gets a copy of the string from words[0]; adding "!" to w repoints w and leaves words alone.',
      }),
      draw({
        title: 'Dropping a reference',
        js: lines('let a = [1];', 'let b = a;', 'a = null;'),
        py: lines('a = [1]', 'b = a', 'a = None'),
        expected: graph({ a: null, b: ref('b') }, { b: list(1) }),
        hint: {
          js: 'Assigning a = null repoints only a; b keeps referring to [1].',
          py: 'Assigning a = None repoints only a; b keeps referring to [1].',
        },
      }),
      write({
        title: 'Nobody points here',
        given: {
          js: lines('let a = { n: 1 };', 'let b = a;'),
          py: lines('a = {"n": 1}', 'b = a'),
        },
        js: lines('a = null;', 'b = null;'),
        py: lines('a = None', 'b = None'),
        expected: graph({ a: null, b: null }),
        hint: {
          js: 'Reassign a to null, then b to null.',
          py: 'Reassign a to None, then b to None.',
        },
      }),
      write({
        title: 'Combine without changing the original',
        given: { js: lines('let a = [1, 2];', 'let b = a;'), py: lines('a = [1, 2]', 'b = a') },
        js: 'b = b.concat([3, 4]);',
        py: 'b = b + [3, 4]',
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2, 3, 4) }),
        process: {
          runtime: runtime(preserve('a')),
          source: [combines('b', 'b')],
          hidden: [
            {
              given: { js: lines('let a = [5];', 'let b = a;'), py: lines('a = [5]', 'b = a') },
              expected: graph({ a: ref('a'), b: ref('b') }, { a: list(5), b: list(5, 3, 4) }),
            },
          ],
        },
        hint: {
          js: 'Use b = b.concat([3, 4]) so b gets a new list and a keeps [1, 2].',
          py: 'Use b = b + [3, 4] so b gets a new list and a keeps [1, 2].',
        },
      }),
      draw({
        title: 'In place, then new',
        js: lines('let a = [10];', 'let b = a;', 'b.push(20);', 'b = b.concat([30]);'),
        py: lines('a = [10]', 'b = a', 'b.append(20)', 'b = b + [30]'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(10, 20), b: list(10, 20, 30) }),
        hint: {
          js: 'Growing b in place changes the shared list to [10, 20]; combining with [30] gives b a new list [10, 20, 30] and leaves a pointing at [10, 20].',
          py: 'Growing b in place changes the shared list to [10, 20]; combining with [30] gives b a new list [10, 20, 30] and leaves a pointing at [10, 20].',
        },
      }),
      write({
        title: 'Mutate, then rebind',
        given: { js: lines('let a = [1];', 'let b = a;'), py: lines('a = [1]', 'b = a') },
        js: lines('a.push(2);', 'a = [9];'),
        py: lines('a.append(2)', 'a = [9]'),
        expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2), new: list(9) }),
        hint: 'Grow a in place to [1, 2] (visible through b), then point a at a new list [9]; b keeps [1, 2].',
        process: { runtime: runtime(sameObject(before('a'), after('b'))) },
      }),
      write({
        title: 'Shout the name, keep the backup',
        given: {
          js: lines('let name = "ada";', 'let backup = name;'),
          py: lines('name = "ada"', 'backup = name'),
        },
        js: 'name = name.toUpperCase();',
        py: 'name = name.upper()',
        expected: graph({ name: 'ADA', backup: 'ada' }),
        hint: {
          js: 'Reassign name to name.toUpperCase(); strings never change in place, so backup stays "ada".',
          py: 'Reassign name to name.upper(); strings never change in place, so backup stays "ada".',
        },
        process: {
          source: [callsMethod('name', 'name', { javascript: 'toUpperCase', python: 'upper' })],
          hidden: [
            {
              given: {
                js: lines('let name = "bo";', 'let backup = name;'),
                py: lines('name = "bo"', 'backup = name'),
              },
              expected: graph({ name: 'BO', backup: 'bo' }),
            },
          ],
        },
      }),
    ],
    [
      draw({
        title: 'Combine, then grow the copy',
        js: lines('let a = [1];', 'let b = a;', 'b = b.concat([2]);', 'b.push(3);'),
        py: lines('a = [1]', 'b = a', 'b = b + [2]', 'b.append(3)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2, 3) }),
        hint: {
          js: 'After b = b.concat([2]), b points at a new list; growing it to [1, 2, 3] leaves a holding [1].',
          py: 'After b = b + [2], b points at a new list; growing it to [1, 2, 3] leaves a holding [1].',
        },
      }),
      draw({
        title: 'Upper case through an alias',
        js: lines('let s = "ab";', 'let t = s;', 's = s.toUpperCase();'),
        py: lines('s = "ab"', 't = s', 's = s.upper()'),
        expected: graph({ s: 'AB', t: 'ab' }),
        hint: {
          js: 's.toUpperCase() builds a new string "AB"; assigning it to s moves s to "AB" while t stays "ab".',
          py: 's.upper() builds a new string "AB"; assigning it to s moves s to "AB" while t stays "ab".',
        },
      }),
      write({
        title: 'Let it go',
        given: {
          js: lines('let a = [1];', 'let b = [a];'),
          py: lines('a = [1]', 'b = [a]'),
        },
        js: 'a = null;',
        py: 'a = None',
        expected: graph({ a: null, b: ref('b') }, { b: list(ref('inner')), inner: list(1) }),
        hint: {
          js: 'Reassign a to null; b still holds a reference to [1] in slot 0.',
          py: 'Reassign a to None; b still holds a reference to [1] in slot 0.',
        },
        process: {
          runtime: runtime(sameObject(before('a'), after('b', 0))),
        },
      }),
      draw({
        title: 'New list, old slot',
        js: lines('let inner = [1];', 'let outer = [inner];', 'inner = inner.concat([2]);'),
        py: lines('inner = [1]', 'outer = [inner]', 'inner = inner + [2]'),
        expected: graph(
          { inner: ref('newInner'), outer: ref('outer') },
          { outer: list(ref('oldInner')), oldInner: list(1), newInner: list(1, 2) },
        ),
        hint: {
          js: 'inner.concat([2]) builds a new list [1, 2] and assigns it to inner; outer still refers to [1].',
          py: '(inner + [2]) builds a new list [1, 2] and assigns it to inner; outer still refers to [1].',
        },
      }),
      write({
        title: 'Two ways to grow',
        given: { js: lines('let a = [4];', 'let b = a;'), py: lines('a = [4]', 'b = a') },
        js: lines('a.push(5);', 'b = b.concat([6]);'),
        py: lines('a.append(5)', 'b = b + [6]'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(4, 5), b: list(4, 5, 6) }),
        hint: {
          js: 'Grow a in place to [4, 5] with push(5), then assign b a new list using b.concat([6]).',
          py: 'Grow a in place to [4, 5] with append(5), then assign b a new list using b + [6].',
        },
        process: {
          runtime: runtime(preserve('a')),
          source: [combines('b', 'b')],
        },
      }),
    ],
  ),

  level(
    'functions',
    L(
      'Functions and Parameters',
      'Functions and Parameters',
    ),
    L(
      'Calling a function gives each parameter the value the caller passed, so a parameter and the caller\'s variable refer to the same array or object. Changing that container inside the function changes it for the caller. Assigning to the parameter only repoints the parameter. A returned value is handed back by reference, so a function that returns its argument gives the caller a second name for the same container.',
      'Calling a function gives each parameter the value the caller passed, so a parameter and the caller\'s variable refer to the same list or dict. Changing that container inside the function changes it for the caller. Assigning to the parameter only repoints the parameter. A returned value is handed back by reference, so a function that returns its argument gives the caller a second name for the same container.',
    ),
    [
      draw({
        title: 'A function that mutates',
        js: lines('function add(arr) {', '  arr.push(1);', '}', 'let a = [];', 'add(a);'),
        py: lines('def add(arr):', '    arr.append(1)', '', 'a = []', 'add(a)'),
        expected: graph({ a: ref('a') }, { a: list(1) }),
        hint: 'arr is a new name for the same list a holds, so growing it inside add changes a to [1].',
      }),
      draw({
        title: 'A function that rebinds',
        js: lines('function reset(arr) {', '  arr = [0];', '}', 'let a = [1];', 'reset(a);'),
        py: lines('def reset(arr):', '    arr = [0]', '', 'a = [1]', 'reset(a)'),
        expected: graph({ a: ref('a') }, { a: list(1) }),
        hint: 'arr is a new variable, so assigning it [0] inside reset leaves a holding [1].',
      }),
      write({
        title: 'Call it on the right list',
        given: {
          js: lines('function grow(arr) {', '  arr.push(0);', '}', 'let a = [1];', 'let b = [2];'),
          py: lines('def grow(arr):', '    arr.append(0)', '', 'a = [1]', 'b = [2]'),
        },
        js: 'grow(b);',
        py: 'grow(b)',
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(2, 0) }),
        hint: 'Call grow(b); grow adds 0 to b in place while leaving a alone.',
        process: { runtime: runtime(call('grow', [before('b')], 1)) },
      }),
      draw({
        title: 'A function that returns a new list',
        js: lines(
          'function withOne(arr) {',
          '  return arr.concat([1]);',
          '}',
          'let a = [0];',
          'let b = withOne(a);',
        ),
        py: lines(
          'def withOne(arr):',
          '    return arr + [1]',
          '',
          'a = [0]',
          'b = withOne(a)',
        ),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(0), b: list(0, 1) }),
        hint: {
          js: 'withOne returns a new list with 1 added, so b refers to [0, 1] while a stays [0].',
          py: 'withOne returns a new list with 1 added, so b refers to [0, 1] while a stays [0].',
        },
      }),
      write({
        title: 'Paired up',
        given: {
          js: lines('function pair(x) {', '  return [x, x];', '}', 'let row = [8];'),
          py: lines('def pair(x):', '    return [x, x]', '', 'row = [8]'),
        },
        js: 'let grid = pair(row);',
        py: 'grid = pair(row)',
        expected: graph(
          { row: ref('row'), grid: ref('grid') },
          { grid: list(ref('row'), ref('row')), row: list(8) },
        ),
        hint: {
          js: 'Declare grid by calling pair(row); both slots of grid point to row.',
          py: 'Assign grid by calling pair(row); both slots of grid point to row.',
        },
        process: {
          runtime: runtime(call('pair', [before('row')], 1), preserve('row')),
        },
      }),
      draw({
        title: 'Changes it and hands it back',
        js: lines(
          'function addOne(arr) {',
          '  arr.push(1);',
          '  return arr;',
          '}',
          'let a = [];',
          'let b = addOne(a);',
        ),
        py: lines(
          'def addOne(arr):',
          '    arr.append(1)',
          '    return arr',
          '',
          'a = []',
          'b = addOne(a)',
        ),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1) }),
        hint: 'addOne grows a in place and returns that same list, so a and b end up sharing [1].',
      }),
      write({
        title: 'Add without changing it',
        given: {
          js: 'let cart = ["tea"];',
          py: 'cart = ["tea"]',
        },
        then: {
          js: 'let order = withMilk(cart);',
          py: 'order = withMilk(cart)',
        },
        js: lines('function withMilk(list) {', '  return list.concat(["milk"]);', '}'),
        py: lines('def withMilk(list):', '    return list + ["milk"]'),
        expected: graph(
          { cart: ref('cart'), order: ref('order') },
          { cart: list('tea'), order: list('tea', 'milk') },
        ),
        constraints: [
          {
            rule: 'Your boss said withMilk must work for any cart. If another programmer updates the code so that the cart starts as ["coffee"], order must be ["coffee", "milk"].',
            cases: [
              {
                change: 'cart starts as ["coffee"]',
                given: { js: 'let cart = ["coffee"];', py: 'cart = ["coffee"]' },
                expected: graph(
                  { cart: ref('cart'), order: ref('order') },
                  { cart: list('coffee'), order: list('coffee', 'milk') },
                ),
              },
            ],
          },
        ],
        hint: {
          js: 'Define withMilk(list) to return list.concat(["milk"]) without modifying list.',
          py: 'Define withMilk(list) to return list + ["milk"] without modifying list.',
        },
      }),
      draw({
        title: 'A function that keeps what it is given',
        js: lines(
          'function remember(box, item) {',
          '  box.push(item);',
          '}',
          'let seen = [];',
          'let p = { n: 1 };',
          'remember(seen, p);',
          'p.n = 2;',
        ),
        py: lines(
          'def remember(box, item):',
          '    box.append(item)',
          '',
          'seen = []',
          'p = {"n": 1}',
          'remember(seen, p)',
          'p["n"] = 2',
        ),
        expected: graph(
          { seen: ref('seen'), p: ref('p') },
          { seen: list(ref('p')), p: dict({ n: 2 }) },
        ),
        hint: 'remember adds p to seen; changing p.n to 2 afterward is visible through seen because seen holds p.',
      }),
      write({
        title: 'Change it for everyone',
        given: {
          js: lines('let cart = ["tea"];', 'let saved = cart;'),
          py: lines('cart = ["tea"]', 'saved = cart'),
        },
        then: {
          js: 'addMilk(cart);',
          py: 'addMilk(cart)',
        },
        js: lines('function addMilk(list) {', '  list.push("milk");', '}'),
        py: lines('def addMilk(list):', '    list.append("milk")'),
        expected: graph(
          { cart: ref('shared'), saved: ref('shared') },
          { shared: list('tea', 'milk') },
        ),
        constraints: [
          {
            rule: 'Your boss said addMilk must change the cart in place for everyone. If another programmer updates the code so that the cart starts as ["coffee"], cart and saved must both be ["coffee", "milk"].',
            cases: [
              {
                change: 'cart starts as ["coffee"]',
                given: {
                  js: lines('let cart = ["coffee"];', 'let saved = cart;'),
                  py: lines('cart = ["coffee"]', 'saved = cart'),
                },
                expected: graph(
                  { cart: ref('shared'), saved: ref('shared') },
                  { shared: list('coffee', 'milk') },
                ),
              },
            ],
          },
        ],
        hint: {
          js: 'Define addMilk(list) to push "milk" into list in place.',
          py: 'Define addMilk(list) to append "milk" into list in place.',
        },
      }),
      write({
        title: 'Call it right',
        given: {
          js: lines('function fill(arr) {', '  arr.push(0);', '  arr = [1];', '  arr.push(2);', '}'),
          py: lines('def fill(arr):', '    arr.append(0)', '    arr = [1]', '    arr.append(2)'),
        },
        js: lines('let a = [];', 'let b = [];', 'fill(a);', 'fill(a);', 'fill(b);'),
        py: lines('a = []', 'b = []', 'fill(a)', 'fill(a)', 'fill(b)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(0, 0), b: list(0) }),
        hint: 'Call fill(a) twice and fill(b) once; each call grows that list by one in place, while the reassign inside fill never escapes.',
        process: { runtime: runtime(call('fill', [after('a')], 2), call('fill', [after('b')], 1)) },
      }),
    ],
    [
      draw({
        title: 'A function that changes an alias',
        js: lines('function mark(o) {', '  o.seen = true;', '}', 'let a = {};', 'let b = a;', 'mark(b);'),
        py: lines('def mark(o):', '    o["seen"] = True', '', 'a = {}', 'b = a', 'mark(b)'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ seen: true }) }),
        hint: {
          js: 'o is a new name for the same object, so adding seen holding true inside mark is visible through a and b.',
          py: 'o is a new name for the same dict, so adding seen holding True inside mark is visible through a and b.',
        },
      }),
      write({
        title: 'Change it from inside',
        given: {
          js: lines(
            'function touch(arr) {',
            '  arr[0] = "new";',
            '  arr = ["other"];',
            '}',
            'let a = ["old", "old"];',
            'let b = a;',
          ),
          py: lines(
            'def touch(arr):',
            '    arr[0] = "new"',
            '    arr = ["other"]',
            '',
            'a = ["old", "old"]',
            'b = a',
          ),
        },
        js: 'touch(b);',
        py: 'touch(b)',
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('new', 'old') }),
        hint: 'Call touch(b) once; the slot change inside touch lands in the shared list ["new", "old"], while the reassign inside never escapes.',
        process: { runtime: runtime(call('touch', [before('b')], 1)) },
      }),
      write({
        title: 'Tag only one',
        given: {
          js: lines('function tag(o) {', '  o.tagged = true;', '  o = {};', '  o.lost = true;', '}'),
          py: lines('def tag(o):', '    o["tagged"] = True', '    o = {}', '    o["lost"] = True'),
        },
        js: lines('let a = { n: 1 };', 'let b = { n: 2 };', 'tag(a);'),
        py: lines('a = {"n": 1}', 'b = {"n": 2}', 'tag(a)'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          { a: dict({ n: 1, tagged: true }), b: dict({ n: 2 }) },
        ),
        hint: 'Call tag(a) once; the tagged key lands on a, while the reassign inside tag is lost and b is never touched.',
        process: { runtime: runtime(call('tag', [after('a')], 1)) },
      }),
      draw({
        title: 'Rebinding before mutating',
        js: lines('function f(arr) {', '  arr = [9];', '  arr.push(1);', '}', 'let a = [5];', 'f(a);'),
        py: lines('def f(arr):', '    arr = [9]', '    arr.append(1)', '', 'a = [5]', 'f(a)'),
        expected: graph({ a: ref('a') }, { a: list(5) }),
        hint: 'Assigning arr [9] inside f repoints only the parameter; growing that new list afterward leaves a holding [5].',
      }),
      draw({
        title: 'Passing an inner list',
        js: lines(
          'function grow(arr) {',
          '  arr.push(0);',
          '}',
          'let grid = [[1], [2]];',
          'grow(grid[0]);',
        ),
        py: lines(
          'def grow(arr):',
          '    arr.append(0)',
          '',
          'grid = [[1], [2]]',
          'grow(grid[0])',
        ),
        expected: graph(
          { grid: ref('grid') },
          {
            grid: list(ref('first'), ref('second')),
            first: list(1, 0),
            second: list(2),
          },
        ),
        hint: 'grow(grid[0]) passes the inner list [1] to grow, which adds 0 to it in place to become [1, 0].',
      }),
    ],
  ),
]

export const problems: Problem[] = levels.flatMap((entry) => entry.problems)

export interface ProblemLocation<P extends Problem = Problem> {
  problem: P
  level: Level
  /** Position of the problem within its level, starting at 0. */
  index: number
}

export function findProblem(id: string): ProblemLocation | undefined {
  for (const entry of levels) {
    const index = entry.problems.findIndex((problem) => problem.id === id)
    if (index !== -1) return { problem: entry.problems[index], level: entry, index }
  }
  return undefined
}

export function previousProblem(id: string): Problem | undefined {
  const position = problems.findIndex((problem) => problem.id === id)
  return position <= 0 ? undefined : problems[position - 1]
}

export function nextProblem(id: string): Problem | undefined {
  const position = problems.findIndex((problem) => problem.id === id)
  return position === -1 ? undefined : problems[position + 1]
}

export function hintIn(hint: Hint, language: Language): string {
  return typeof hint === 'string' ? hint : hint[language]
}

export function problemHint(problem: Problem, language: Language): string | undefined {
  return problem.hint && hintIn(problem.hint, language)
}

export function problemAbout(problem: Problem, language: Language): string | undefined {
  return problem.about && hintIn(problem.about, language)
}

export function problemTitle(problem: Problem, language: Language): string {
  return typeof problem.title === 'string' ? problem.title : problem.title[language]
}
