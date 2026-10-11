import { dict, graph, list, ref } from './builders'
import {
  after,
  before,
  call,
  callsMethod,
  combines,
  copiesFrom,
  preserve,
  runtime,
  sameObject,
  type RuntimeChecks,
  type SourceRule,
} from './process'
import type { DiagnosticHint, Language, Level, MemoryGraph, Problem } from './types'

const lines = (...rows: string[]) => rows.join('\n')

export type SpecHint = string | { js: string; py: string }

interface DrawSpec {
  kind: 'draw'
  title: string
  js: string
  py: string
  expected: MemoryGraph
  hints?: DiagnosticHint[]
  hint?: SpecHint
}

interface WriteSpec {
  kind: 'write'
  title: string
  /** Read-only code that runs before the learner's. */
  given?: { js: string; py: string }
  /** Reference answer, in the two languages. */
  js: string
  py: string
  expected: MemoryGraph
  process?: ProcessSpec
  hints?: DiagnosticHint[]
  hint?: SpecHint
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
  const hint =
    typeof spec.hint === 'string'
      ? spec.hint
      : spec.hint
        ? { javascript: spec.hint.js, python: spec.hint.py }
        : undefined

  if (spec.kind === 'draw') {
    return {
      kind: 'draw',
      id,
      title: spec.title,
      mystery,
      code: { javascript: spec.js, python: spec.py },
      expected: spec.expected,
      hints: spec.hints,
      hint,
    }
  }
  return {
    kind: 'write',
    id,
    title: spec.title,
    mystery,
    expected: spec.expected,
    given: spec.given && { javascript: spec.given.js, python: spec.given.py },
    solution: { javascript: spec.js, python: spec.py },
    process: spec.process && {
      runtime: spec.process.runtime,
      source: spec.process.source,
      hidden: spec.process.hidden?.map(({ given, expected }) => ({
        given: { javascript: given.js, python: given.py },
        expected,
      })),
    },
    hints: spec.hints,
    hint,
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
  title: string,
  description: string,
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
    'numbers',
    'Variables and Numbers',
    'A variable is a name that holds a value. Assigning a new value replaces the old one. Setting one variable from another gives it the same value, but the two stay independent: changing one later leaves the other alone. When a value in the diagram already belongs to an existing variable, your code must refer to that variable by name rather than typing the number again.',
    [
      draw({
        title: 'One variable',
        js: 'let x = 10;',
        py: 'x = 10',
        expected: graph({ x: 10 }),
        hint: 'Create a variable named x and a number node with value 10, then connect x to 10.',
      }),
      write({
        title: 'A negative number',
        js: 'let temp = -4;',
        py: 'temp = -4',
        expected: graph({ temp: -4 }),
        hint: {
          js: 'Declare a variable named temp and assign it -4.',
          py: 'Assign -4 to a variable named temp.',
        },
      }),
      write({
        title: 'A decimal',
        js: 'let price = 2.5;',
        py: 'price = 2.5',
        expected: graph({ price: 2.5 }),
        hint: {
          js: 'Declare a variable named price and assign it 2.5.',
          py: 'Assign 2.5 to a variable named price.',
        },
      }),
      draw({
        title: 'Reassignment',
        js: lines('let x = 5;', 'x = 7;'),
        py: lines('x = 5', 'x = 7'),
        expected: graph({ x: 7 }),
        hint: 'Reassigning a variable replaces its previous value. In the final memory, x holds 7.',
      }),
      draw({
        title: 'Copying a variable',
        js: lines('let x = 10;', 'let y = x;'),
        py: lines('x = 10', 'y = x'),
        expected: graph({ x: 10, y: 10 }),
        hint: 'Numbers are simple values. Both x and y each get their own number node with value 10.',
      }),
      write({
        title: 'Two equal values',
        given: { js: 'let a = 8;', py: 'a = 8' },
        js: 'let b = a;',
        py: 'b = a',
        expected: graph({ a: 8, b: 8 }),
        process: {
          hidden: [{ given: { js: 'let a = 5;', py: 'a = 5' }, expected: graph({ a: 5, b: 5 }) }],
        },
        hint: {
          js: 'Declare b and assign it from a instead of typing 8 again.',
          py: 'Set b from a instead of typing 8 again.',
        },
      }),
      draw({
        title: 'Area after a change',
        js: lines('let width = 3;', 'let height = 4;', 'let area = width * height;', 'height = 5;'),
        py: lines('width = 3', 'height = 4', 'area = width * height', 'height = 5'),
        expected: graph({ width: 3, height: 5, area: 12 }),
        hint: 'Pay careful attention to the order of your work.',
        hints: [
          {
            variable: 'area',
            value: 15,
            message:
              'The value 15 is not correct here. Changing height later does not update area — variables hold static values, not live formulas.',
          },
        ],
      }),
      write({
        title: 'Three variables',
        given: { js: lines('let x = 1;', 'let y = 2;'), py: lines('x = 1', 'y = 2') },
        js: 'let z = x;',
        py: 'z = x',
        expected: graph({ x: 1, y: 2, z: 1 }),
        process: {
          hidden: [
            {
              given: { js: lines('let x = 5;', 'let y = 6;'), py: lines('x = 5', 'y = 6') },
              expected: graph({ x: 5, y: 6, z: 5 }),
            },
          ],
        },
        hint: {
          js: 'Declare z and assign it from x.',
          py: 'Set z from x.',
        },
      }),
      draw({
        title: 'Reassigning a copy',
        js: lines('let a = 1;', 'let b = a;', 'b = 2;'),
        py: lines('a = 1', 'b = a', 'b = 2'),
        expected: graph({ a: 1, b: 2 }),
        hint: 'Changing b leaves a unchanged: a stays 1 while b becomes 2.',
      }),
      write({
        title: 'Swapped',
        given: { js: lines('let a = 1;', 'let b = 2;'), py: lines('a = 1', 'b = 2') },
        js: lines('let t = a;', 'a = b;', 'b = t;'),
        py: lines('t = a', 'a = b', 'b = t'),
        expected: graph({ a: 2, b: 1 }),
        hint: 'It is okay for you to add a third variable.',
        process: {
          hidden: [
            {
              given: { js: lines('let a = 3;', 'let b = 4;'), py: lines('a = 3', 'b = 4') },
              expected: graph({ a: 4, b: 3 }),
            },
          ],
        },
      }),
    ],
    [
      draw({
        title: 'Changing the original leaves the copy',
        js: lines('let a = 3;', 'let b = a;', 'a = 8;'),
        py: lines('a = 3', 'b = a', 'a = 8'),
        expected: graph({ a: 8, b: 3 }),
        hint: 'Copying a variable copies its current value. When a is reassigned to 8, b keeps its value 3.',
      }),
      write({
        title: 'Only one changes',
        given: { js: lines('let x = 4;', 'let y = x;'), py: lines('x = 4', 'y = x') },
        js: 'y = 9;',
        py: 'y = 9',
        expected: graph({ x: 4, y: 9 }),
        hint: 'Reassign only y to 9. The variable x will remain unchanged.',
      }),
      draw({
        title: 'A chain of copies',
        js: lines('let a = 6;', 'let b = a;', 'let c = b;', 'a = 0;'),
        py: lines('a = 6', 'b = a', 'c = b', 'a = 0'),
        expected: graph({ a: 0, b: 6, c: 6 }),
        hint: 'Each variable holds its own independent number. Only a is changed to 0; b and c remain 6.',
      }),
      write({
        title: 'Rotate three',
        given: {
          js: lines('let a = 1;', 'let b = 2;', 'let c = 3;'),
          py: lines('a = 1', 'b = 2', 'c = 3'),
        },
        js: lines('let t = a;', 'a = b;', 'b = c;', 'c = t;'),
        py: lines('t = a', 'a = b', 'b = c', 'c = t'),
        expected: graph({ a: 2, b: 3, c: 1 }),
        hint:
          'Use a temporary variable to hold a, then set a = b, b = c, and c to that saved value.',
        process: {
          hidden: [
            {
              given: {
                js: lines('let a = 7;', 'let b = 8;', 'let c = 9;'),
                py: lines('a = 7', 'b = 8', 'c = 9'),
              },
              expected: graph({ a: 8, b: 9, c: 7 }),
            },
          ],
        },
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
      }),
    ],
  ),

  level(
    'simple-values',
    'Strings, Booleans and Null',
    'Strings, booleans and null (None in Python) are simple values, just like numbers: each variable holds its own. A string can\'t be changed in place, so adding to one builds a new string.',
    [
      draw({
        title: 'A string',
        js: 'let name = "Ada";',
        py: 'name = "Ada"',
        expected: graph({ name: 'Ada' }),
        hint: 'Create a variable named name and connect it to a string node with Ada.',
      }),
      draw({
        title: 'A boolean',
        js: 'let ready = true;',
        py: 'ready = True',
        expected: graph({ ready: true }),
        hint: {
          js: 'Create a variable named ready and connect it to a boolean node with value true.',
          py: 'Create a variable named ready and connect it to a boolean node with value True.',
        },
      }),
      write({
        title: 'False',
        js: 'let done = false;',
        py: 'done = False',
        expected: graph({ done: false }),
        hint: {
          js: 'Declare a variable named done and assign it false.',
          py: 'Assign False to a variable named done.',
        },
      }),
      write({
        title: 'An empty string',
        js: 'let label = "";',
        py: 'label = ""',
        expected: graph({ label: '' }),
        hint: {
          js: 'Declare a variable named label and assign it an empty string "".',
          py: 'Assign an empty string "" to a variable named label.',
        },
      }),
      draw({
        title: 'Nothing',
        js: 'let nothing = null;',
        py: 'nothing = None',
        expected: graph({ nothing: null }),
        hint: {
          js: 'Create a variable named nothing and connect it to a null node.',
          py: 'Create a variable named nothing and connect it to a None node.',
        },
      }),
      write({
        title: 'Text, not a number',
        js: 'let code = "42";',
        py: 'code = "42"',
        expected: graph({ code: '42' }),
        hint: 'Enclose 42 in quotes so it is stored as text rather than a number.',
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
      }),
      draw({
        title: 'Copying a string',
        js: lines('let s = "hi";', 'let t = s;'),
        py: lines('s = "hi"', 't = s'),
        expected: graph({ s: 'hi', t: 'hi' }),
        hint: 'Strings are simple values. Both s and t each get their own string node holding hi.',
      }),
      draw({
        title: 'Building a new string',
        js: lines('let s = "hi";', 's = s + "!";'),
        py: lines('s = "hi"', 's = s + "!"'),
        expected: graph({ s: 'hi!' }),
        hint: 'Adding to a string builds a new string. In the end, s points to hi!.',
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
        hint: 'Join first, a space " ", and last to build full.',
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
    ],
    [
      draw({
        title: 'Adding to a copied string',
        js: lines('let s = "ab";', 'let t = s;', 't = t + "c";'),
        py: lines('s = "ab"', 't = s', 't = t + "c"'),
        expected: graph({ s: 'ab', t: 'abc' }),
        hint: 'Changing t creates a new string abc for t, leaving s holding ab.',
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
      draw({
        title: 'Joining digits makes text',
        js: 'let n = "1" + "2";',
        py: 'n = "1" + "2"',
        expected: graph({ n: '12' }),
        hint: 'Joining the strings "1" and "2" produces the string node "12".',
      }),
      draw({
        title: 'A copied boolean',
        js: lines('let on = true;', 'let was = on;', 'on = false;'),
        py: lines('on = True', 'was = on', 'on = False'),
        expected: graph({ on: false, was: true }),
        hint: {
          js: 'Reassigning on to false does not change was, which remains true.',
          py: 'Reassigning on to False does not change was, which remains True.',
        },
      }),
      write({
        title: 'A greeting',
        given: { js: 'let name = "Bo";', py: 'name = "Bo"' },
        js: 'let greeting = "Hello, " + name + "!";',
        py: 'greeting = "Hello, " + name + "!"',
        expected: graph({ name: 'Bo', greeting: 'Hello, Bo!' }),
        hint: 'Combine "Hello, ", the existing variable name, and "!" into greeting.',
        process: {
          hidden: [
            {
              given: { js: 'let name = "Cy";', py: 'name = "Cy"' },
              expected: graph({ name: 'Cy', greeting: 'Hello, Cy!' }),
            },
          ],
        },
      }),
    ],
  ),

  level(
    'arrays',
    'Arrays and Lists',
    'An array (JavaScript) or list (Python) is a separate object in memory with numbered slots. A variable holds only a reference to it, so two variables can refer to the same list or array. Two lists or arrays with equal contents are still two separate objects.',
    [
      draw({
        title: 'A list of numbers',
        js: 'let nums = [1, 2, 3];',
        py: 'nums = [1, 2, 3]',
        expected: graph({ nums: ref('nums') }, { nums: list(1, 2, 3) }),
      }),
      write({
        title: 'A list of strings',
        js: 'let colors = ["red", "green"];',
        py: 'colors = ["red", "green"]',
        expected: graph({ colors: ref('colors') }, { colors: list('red', 'green') }),
      }),
      draw({
        title: 'An empty list',
        js: 'let items = [];',
        py: 'items = []',
        expected: graph({ items: ref('items') }, { items: list() }),
      }),
      draw({
        title: 'Mixed values',
        js: 'let mixed = [1, "two", true];',
        py: 'mixed = [1, "two", True]',
        expected: graph({ mixed: ref('mixed') }, { mixed: list(1, 'two', true) }),
      }),
      write({
        title: 'Null and None in a list',
        js: 'let cells = [null, 0, null];',
        py: 'cells = [None, 0, None]',
        expected: graph({ cells: ref('cells') }, { cells: list(null, 0, null) }),
      }),
      draw({
        title: 'Two names, one list',
        js: lines('let a = [7];', 'let b = a;'),
        py: lines('a = [7]', 'b = a'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(7) }),
      }),
      write({
        title: 'Three names, one list',
        js: lines('let a = ["x"];', 'let b = a;', 'let c = a;'),
        py: lines('a = ["x"]', 'b = a', 'c = a'),
        expected: graph(
          { a: ref('shared'), b: ref('shared'), c: ref('shared') },
          { shared: list('x') },
        ),
      }),
      draw({
        title: 'Equal but separate',
        js: lines('let a = [1, 2];', 'let b = [1, 2];'),
        py: lines('a = [1, 2]', 'b = [1, 2]'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2) }),
      }),
      write({
        title: 'Two empty lists',
        js: lines('let p = [];', 'let q = [];'),
        py: lines('p = []', 'q = []'),
        expected: graph({ p: ref('p'), q: ref('q') }, { p: list(), q: list() }),
      }),
      write({
        title: 'Two share, one doesn\'t',
        js: lines('let a = [1];', 'let b = a;', 'let c = [1];'),
        py: lines('a = [1]', 'b = a', 'c = [1]'),
        expected: graph(
          { a: ref('shared'), b: ref('shared'), c: ref('alone') },
          { shared: list(1), alone: list(1) },
        ),
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
      }),
      draw({
        title: 'Copying the copy',
        js: lines('let a = [];', 'let b = a;', 'let c = b;'),
        py: lines('a = []', 'b = a', 'c = b'),
        expected: graph(
          { a: ref('shared'), b: ref('shared'), c: ref('shared') },
          { shared: list() },
        ),
      }),
      write({
        title: 'One shared, one empty',
        js: lines('let x = ["a", "b"];', 'let y = x;', 'let z = [];'),
        py: lines('x = ["a", "b"]', 'y = x', 'z = []'),
        expected: graph(
          { x: ref('shared'), y: ref('shared'), z: ref('empty') },
          { shared: list('a', 'b'), empty: list() },
        ),
      }),
      draw({
        title: 'Two pairs',
        js: lines('let a = [true];', 'let b = a;', 'let c = [true];', 'let d = c;'),
        py: lines('a = [True]', 'b = a', 'c = [True]', 'd = c'),
        expected: graph(
          { a: ref('first'), b: ref('first'), c: ref('second'), d: ref('second') },
          { first: list(true), second: list(true) },
        ),
      }),
      draw({
        title: 'The alias is the one that matters',
        js: lines('let a = [0, 0];', 'let b = [0, 0];', 'let c = a;'),
        py: lines('a = [0, 0]', 'b = [0, 0]', 'c = a'),
        expected: graph(
          { a: ref('shared'), b: ref('alone'), c: ref('shared') },
          { shared: list(0, 0), alone: list(0, 0) },
        ),
      }),
    ],
  ),

  level(
    'objects',
    'Objects and Dictionaries',
    'An object (JavaScript) or dictionary (Python) stores values under named keys. Like a list or array, it is a separate object or dictionary in memory, and variables hold references to it.',
    [
      draw({
        title: 'One key',
        js: 'let user = { name: "Ada" };',
        py: 'user = {"name": "Ada"}',
        expected: graph({ user: ref('user') }, { user: dict({ name: 'Ada' }) }),
      }),
      write({
        title: 'A key holding null',
        js: 'let cell = { value: null };',
        py: 'cell = {"value": None}',
        expected: graph({ cell: ref('cell') }, { cell: dict({ value: null }) }),
      }),
      draw({
        title: 'Two keys',
        js: 'let point = { x: 1, y: 2 };',
        py: 'point = {"x": 1, "y": 2}',
        expected: graph({ point: ref('point') }, { point: dict({ x: 1, y: 2 }) }),
      }),
      write({
        title: 'Settings',
        js: 'let settings = { dark: true, size: 12 };',
        py: 'settings = {"dark": True, "size": 12}',
        expected: graph({ settings: ref('settings') }, { settings: dict({ dark: true, size: 12 }) }),
      }),
      draw({
        title: 'An empty object',
        js: 'let empty = {};',
        py: 'empty = {}',
        expected: graph({ empty: ref('empty') }, { empty: dict({}) }),
      }),
      write({
        title: 'A book',
        js: 'let book = { title: "Dune", year: 1965, read: false };',
        py: 'book = {"title": "Dune", "year": 1965, "read": False}',
        expected: graph(
          { book: ref('book') },
          { book: dict({ title: 'Dune', year: 1965, read: false }) },
        ),
      }),
      draw({
        title: 'Two names, one object',
        js: lines('let a = { k: 1 };', 'let b = a;'),
        py: lines('a = {"k": 1}', 'b = a'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ k: 1 }) }),
      }),
      draw({
        title: 'Equal but separate',
        js: lines('let a = { k: 1 };', 'let b = { k: 1 };'),
        py: lines('a = {"k": 1}', 'b = {"k": 1}'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: dict({ k: 1 }), b: dict({ k: 1 }) }),
      }),
      write({
        title: 'Three names, one object',
        js: lines('let x = { n: 0 };', 'let y = x;', 'let z = x;'),
        py: lines('x = {"n": 0}', 'y = x', 'z = x'),
        expected: graph(
          { x: ref('shared'), y: ref('shared'), z: ref('shared') },
          { shared: dict({ n: 0 }) },
        ),
      }),
      write({
        title: 'One alone, two together',
        js: lines('let a = { id: 1 };', 'let b = { id: 2 };', 'let c = b;'),
        py: lines('a = {"id": 1}', 'b = {"id": 2}', 'c = b'),
        expected: graph(
          { a: ref('alone'), b: ref('pair'), c: ref('pair') },
          { alone: dict({ id: 1 }), pair: dict({ id: 2 }) },
        ),
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
      }),
      draw({
        title: 'Two pairs of names',
        js: lines('let a = { on: true };', 'let b = { on: true };', 'let c = a;', 'let d = b;'),
        py: lines('a = {"on": True}', 'b = {"on": True}', 'c = a', 'd = b'),
        expected: graph(
          { a: ref('first'), b: ref('second'), c: ref('first'), d: ref('second') },
          { first: dict({ on: true }), second: dict({ on: true }) },
        ),
      }),
      draw({
        title: 'Three kinds of value',
        js: 'let pet = { name: "Rex", owner: null, age: 3 };',
        py: 'pet = {"name": "Rex", "owner": None, "age": 3}',
        expected: graph({ pet: ref('pet') }, { pet: dict({ name: 'Rex', owner: null, age: 3 }) }),
      }),
      write({
        title: 'Settings under another name',
        js: lines('let config = { debug: false, name: "app", retries: 0 };', 'let settings = config;'),
        py: lines('config = {"debug": False, "name": "app", "retries": 0}', 'settings = config'),
        expected: graph(
          { config: ref('shared'), settings: ref('shared') },
          { shared: dict({ debug: false, name: 'app', retries: 0 }) },
        ),
      }),
      draw({
        title: 'Two keys, same value',
        js: 'let p = { a: 0, b: 0 };',
        py: 'p = {"a": 0, "b": 0}',
        expected: graph({ p: ref('p') }, { p: dict({ a: 0, b: 0 }) }),
      }),
    ],
  ),

  level(
    'mutating-arrays',
    'Changing Arrays',
    'Adding, removing or overwriting an item changes the list or array itself, so every variable that refers to it sees the change. Assigning a new list or array to a variable is different: it repoints only that variable and leaves the previous one as it was.',
    [
      draw({
        title: 'Appending',
        js: lines('let a = [1];', 'a.push(2);'),
        py: lines('a = [1]', 'a.append(2)'),
        expected: graph({ a: ref('a') }, { a: list(1, 2) }),
      }),
      write({
        title: 'Grow a list',
        given: { js: 'let a = [];', py: 'a = []' },
        js: lines('a.push(3);', 'a.push(6);', 'a.push(9);'),
        py: lines('a.append(3)', 'a.append(6)', 'a.append(9)'),
        expected: graph({ a: ref('a') }, { a: list(3, 6, 9) }),
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Overwriting a slot',
        js: lines('let a = [1, 2, 3];', 'a[0] = 9;'),
        py: lines('a = [1, 2, 3]', 'a[0] = 9'),
        expected: graph({ a: ref('a') }, { a: list(9, 2, 3) }),
      }),
      draw({
        title: 'Removing the last item',
        js: lines('let a = [1, 2, 3];', 'a.pop();'),
        py: lines('a = [1, 2, 3]', 'a.pop()'),
        expected: graph({ a: ref('a') }, { a: list(1, 2) }),
      }),
      write({
        title: 'Change the middle',
        given: { js: 'let a = [1, 2, 3];', py: 'a = [1, 2, 3]' },
        js: 'a[1] = 5;',
        py: 'a[1] = 5',
        expected: graph({ a: ref('a') }, { a: list(1, 5, 3) }),
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Mutating through an alias',
        js: lines('let a = [1];', 'let b = a;', 'b.push(2);'),
        py: lines('a = [1]', 'b = a', 'b.append(2)'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2) }),
      }),
      write({
        title: 'Empty it for both',
        given: { js: lines('let a = [4, 5];', 'let b = a;'), py: lines('a = [4, 5]', 'b = a') },
        js: lines('a.pop();', 'a.pop();'),
        py: lines('a.pop()', 'a.pop()'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list() }),
        process: { runtime: runtime(preserve('a')) },
      }),
      write({
        title: 'Add for both',
        given: { js: lines('let a = ["x"];', 'let b = a;'), py: lines('a = ["x"]', 'b = a') },
        js: 'b.push("y");',
        py: 'b.append("y")',
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('x', 'y') }),
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Pointing a name elsewhere',
        js: lines('let a = [1, 2, 3];', 'let b = a;', 'a = [0];'),
        py: lines('a = [1, 2, 3]', 'b = a', 'a = [0]'),
        expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2, 3), new: list(0) }),
      }),
      write({
        title: 'Split them apart',
        given: { js: lines('let a = [1];', 'let b = a;'), py: lines('a = [1]', 'b = a') },
        js: 'b = [1, 2];',
        py: 'b = [1, 2]',
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2) }),
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
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Grow once, pop twice',
        js: lines('let a = [4, 5];', 'a.push(6);', 'a.pop();', 'a.pop();'),
        py: lines('a = [4, 5]', 'a.append(6)', 'a.pop()', 'a.pop()'),
        expected: graph({ a: ref('a') }, { a: list(4) }),
      }),
      write({
        title: 'Fill the ends',
        given: { js: 'let a = [0, 0, 0];', py: 'a = [0, 0, 0]' },
        js: lines('a[0] = 7;', 'a[2] = 8;'),
        py: lines('a[0] = 7', 'a[2] = 8'),
        expected: graph({ a: ref('a') }, { a: list(7, 0, 8) }),
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Repoint, then grow',
        js: lines('let a = [1];', 'let b = a;', 'b = [2];', 'b.push(3);'),
        py: lines('a = [1]', 'b = a', 'b = [2]', 'b.append(3)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(2, 3) }),
      }),
      draw({
        title: 'Both hands on one list',
        js: lines('let a = ["x", "y"];', 'let b = a;', 'b[0] = "z";', 'a.pop();'),
        py: lines('a = ["x", "y"]', 'b = a', 'b[0] = "z"', 'a.pop()'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('z') }),
      }),
    ],
  ),

  level(
    'mutating-objects',
    'Changing Objects',
    'Adding, changing or deleting a key changes the object itself, so every variable that refers to it sees the change. Assigning a brand new object to a variable repoints only that variable; the old object is untouched.',
    [
      draw({
        title: 'Adding a key',
        js: lines('let p = { n: 1 };', 'p.m = 2;'),
        py: lines('p = {"n": 1}', 'p["m"] = 2'),
        expected: graph({ p: ref('p') }, { p: dict({ n: 1, m: 2 }) }),
      }),
      write({
        title: 'Fill an empty object',
        given: { js: 'let p = {};', py: 'p = {}' },
        js: lines('p.width = 4;', 'p.height = 2;'),
        py: lines('p["width"] = 4', 'p["height"] = 2'),
        expected: graph({ p: ref('p') }, { p: dict({ width: 4, height: 2 }) }),
        process: { runtime: runtime(preserve('p')) },
      }),
      draw({
        title: 'Changing a value',
        js: lines('let p = { n: 1 };', 'p.n = 5;'),
        py: lines('p = {"n": 1}', 'p["n"] = 5'),
        expected: graph({ p: ref('p') }, { p: dict({ n: 5 }) }),
      }),
      draw({
        title: 'Changing through an alias',
        js: lines('let a = { n: 1 };', 'let b = a;', 'b.n = 2;'),
        py: lines('a = {"n": 1}', 'b = a', 'b["n"] = 2'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ n: 2 }) }),
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
        process: { runtime: runtime(preserve('a')) },
      }),
      draw({
        title: 'Deleting a key',
        js: lines('let p = { a: 1, b: 2 };', 'delete p.b;'),
        py: lines('p = {"a": 1, "b": 2}', 'del p["b"]'),
        expected: graph({ p: ref('p') }, { p: dict({ a: 1 }) }),
      }),
      write({
        title: 'Rename a key',
        given: { js: 'let p = { old: 1 };', py: 'p = {"old": 1}' },
        js: lines('p.renamed = p.old;', 'delete p.old;'),
        py: lines('p["renamed"] = p["old"]', 'del p["old"]'),
        expected: graph({ p: ref('p') }, { p: dict({ renamed: 1 }) }),
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
        process: { runtime: runtime(preserve('p')) },
      }),
      draw({
        title: 'A brand new object',
        js: lines('let p = { n: 1 };', 'let q = p;', 'p = { n: 9 };'),
        py: lines('p = {"n": 1}', 'q = p', 'p = {"n": 9}'),
        expected: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 1 }), new: dict({ n: 9 }) }),
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
        process: { runtime: runtime(sameObject(before('p'), after('q'))) },
      }),
    ],
    [
      draw({
        title: 'Two names, two changes',
        js: lines('let p = { n: 1 };', 'let q = p;', 'q.n = q.n + 1;', 'p.m = 0;'),
        py: lines('p = {"n": 1}', 'q = p', 'q["n"] = q["n"] + 1', 'p["m"] = 0'),
        expected: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 2, m: 0 }) }),
      }),
      write({
        title: 'Swap inside an object',
        given: { js: 'let p = { a: 1, b: 2 };', py: 'p = {"a": 1, "b": 2}' },
        js: lines('let t = p.a;', 'p.a = p.b;', 'p.b = t;'),
        py: lines('t = p["a"]', 'p["a"] = p["b"]', 'p["b"] = t'),
        expected: graph({ p: ref('p') }, { p: dict({ a: 2, b: 1 }) }),
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
      }),
      draw({
        title: 'The alias kept the original object',
        js: lines('let p = { n: 1 };', 'let q = p;', 'p = { n: 1 };', 'q.n = 2;'),
        py: lines('p = {"n": 1}', 'q = p', 'p = {"n": 1}', 'q["n"] = 2'),
        expected: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 2 }), new: dict({ n: 1 }) }),
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
        process: { runtime: runtime(sameObject(before('a'), after('b'))) },
      }),
    ],
  ),

  level(
    'nesting',
    'Nested Structures',
    'Lists (arrays) and objects (dictionaries) can hold references to other lists and objects. Each inner list or object is a separate object in memory, and the same one can be referred to from several places.',
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
      }),
      write({
        title: 'A ragged grid',
        js: 'let rows = [[1], [2, 3], []];',
        py: 'rows = [[1], [2, 3], []]',
        expected: graph(
          { rows: ref('rows') },
          {
            rows: list(ref('row0'), ref('row1'), ref('row2')),
            row0: list(1),
            row1: list(2, 3),
            row2: list(),
          },
        ),
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
      }),
      write({
        title: 'An object inside an object',
        js: 'let home = { address: { city: "Oslo" } };',
        py: 'home = {"address": {"city": "Oslo"}}',
        expected: graph(
          { home: ref('home') },
          { home: dict({ address: ref('address') }), address: dict({ city: 'Oslo' }) },
        ),
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
      }),
      write({
        title: 'A tree',
        js: lines(
          'let tree = {',
          '  value: 1,',
          '  kids: [{ value: 2, kids: [] }, { value: 3, kids: [] }],',
          '};',
        ),
        py: lines(
          'tree = {',
          '    "value": 1,',
          '    "kids": [{"value": 2, "kids": []}, {"value": 3, "kids": []}],',
          '}',
        ),
        expected: graph(
          { tree: ref('tree') },
          {
            tree: dict({ value: 1, kids: ref('kids') }),
            kids: list(ref('left'), ref('right')),
            left: dict({ value: 2, kids: ref('leftKids') }),
            right: dict({ value: 3, kids: ref('rightKids') }),
            leftKids: list(),
            rightKids: list(),
          },
        ),
      }),
      draw({
        title: 'The same inner list twice',
        js: lines('let inner = [1];', 'let outer = [inner, inner];'),
        py: lines('inner = [1]', 'outer = [inner, inner]'),
        expected: graph(
          { inner: ref('inner'), outer: ref('outer') },
          { inner: list(1), outer: list(ref('inner'), ref('inner')) },
        ),
      }),
      write({
        title: 'Two keys, one list',
        js: lines('let l = [0];', 'let box = { left: l, right: l };'),
        py: lines('l = [0]', 'box = {"left": l, "right": l}'),
        expected: graph(
          { box: ref('box') },
          { box: dict({ left: ref('shared'), right: ref('shared') }), shared: list(0) },
        ),
      }),
      write({
        title: 'Two lists, one object',
        js: lines('let o = { v: 1 };', 'let a = [o];', 'let b = [o];'),
        py: lines('o = {"v": 1}', 'a = [o]', 'b = [o]'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          { a: list(ref('shared')), b: list(ref('shared')), shared: dict({ v: 1 }) },
        ),
      }),
      draw({
        title: 'Changing a nested list',
        js: lines('let inner = [1];', 'let outer = [inner];', 'inner.push(2);'),
        py: lines('inner = [1]', 'outer = [inner]', 'inner.append(2)'),
        expected: graph(
          { inner: ref('inner'), outer: ref('outer') },
          { inner: list(1, 2), outer: list(ref('inner')) },
        ),
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
      }),
      draw({
        title: 'A list of pairs',
        js: 'let pairs = [["a", 1], ["b", 2]];',
        py: 'pairs = [["a", 1], ["b", 2]]',
        expected: graph(
          { pairs: ref('pairs') },
          { pairs: list(ref('first'), ref('second')), first: list('a', 1), second: list('b', 2) },
        ),
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
      }),
      draw({
        title: 'One list in two objects',
        js: lines('let tag = ["new"];', 'let a = { tags: tag };', 'let b = { tags: tag };'),
        py: lines('tag = ["new"]', 'a = {"tags": tag}', 'b = {"tags": tag}'),
        expected: graph(
          { tag: ref('tag'), a: ref('a'), b: ref('b') },
          { tag: list('new'), a: dict({ tags: ref('tag') }), b: dict({ tags: ref('tag') }) },
        ),
      }),
      draw({
        title: 'Changing an object inside a list',
        js: lines('let inner = { n: 1 };', 'let outer = [inner];', 'inner.n = 2;'),
        py: lines('inner = {"n": 1}', 'outer = [inner]', 'inner["n"] = 2'),
        expected: graph(
          { inner: ref('inner'), outer: ref('outer') },
          { inner: dict({ n: 2 }), outer: list(ref('inner')) },
        ),
      }),
    ],
  ),

  level(
    'copies',
    'Copies and Aliases',
    'Copying with spread (JavaScript) or list() and dict() (Python) makes a new outer list or array or object or dictionary, but any inner lists or objects inside are shared with the original, not copied. That is a shallow copy. Repeating an item, as with fill() or *, repeats the same reference.',
    [
      draw({
        title: 'A copy of a list',
        js: lines('let a = [1, 2];', 'let b = [...a];'),
        py: lines('a = [1, 2]', 'b = list(a)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2) }),
      }),
      draw({
        title: 'A copy of an object',
        js: lines('let p = { n: 1 };', 'let q = { ...p };'),
        py: lines('p = {"n": 1}', 'q = dict(p)'),
        expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1 }) }),
      }),
      write({
        title: 'Copy and add a key',
        given: { js: 'let p = { n: 1 };', py: 'p = {"n": 1}' },
        js: lines('let q = { ...p };', 'q.m = 2;'),
        py: lines('q = dict(p)', 'q["m"] = 2'),
        expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1, m: 2 }) }),
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
      }),
      draw({
        title: 'Mutating inside a shallow copy',
        js: lines('let a = [[1]];', 'let b = [...a];', 'b[0].push(2);'),
        py: lines('a = [[1]]', 'b = list(a)', 'b[0].append(2)'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          { a: list(ref('inner')), b: list(ref('inner')), inner: list(1, 2) },
        ),
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
        process: {
          runtime: runtime(preserve('p'), preserve('p', 'tags')),
          source: [copiesFrom('q', 'p')],
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
        process: {
          runtime: runtime(preserve('a'), preserve('a', 0), preserve('a', 1)),
          source: [copiesFrom('b', 'a')],
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
        process: {
          runtime: runtime(preserve('p'), preserve('p', 'tags')),
          source: [copiesFrom('q', 'p')],
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
      }),
      draw({
        title: 'Changing the repeated row',
        js: lines('let row = [0];', 'let grid = Array(3).fill(row);', 'row.push(1);'),
        py: lines('row = [0]', 'grid = [row] * 3', 'row.append(1)'),
        expected: graph(
          { row: ref('row'), grid: ref('grid') },
          { row: list(0, 1), grid: list(ref('row'), ref('row'), ref('row')) },
        ),
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
        process: {
          runtime: runtime(preserve('a'), preserve('a', 0), preserve('a', 1)),
          source: [copiesFrom('b', 'a')],
        },
      }),
      draw({
        title: 'Changing the original after copying',
        js: lines('let a = [1, 2];', 'let b = [...a];', 'a[0] = 9;'),
        py: lines('a = [1, 2]', 'b = list(a)', 'a[0] = 9'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(9, 2), b: list(1, 2) }),
      }),
    ],
  ),

  level(
    'rebinding',
    'Rebinding and Functions',
    'Assigning to a variable only changes what that variable refers to; the object it referred to before is untouched. A function parameter is a new variable referring to the caller\'s object, so the function can change that object but cannot repoint the caller\'s variable.',
    [
      draw({
        title: 'Strings never change',
        js: lines('let s = "ab";', 'let t = s.toUpperCase();'),
        py: lines('s = "ab"', 't = s.upper()'),
        expected: graph({ s: 'ab', t: 'AB' }),
      }),
      write({
        title: 'Upper and lower',
        given: { js: 'let s = "Hi";', py: 's = "Hi"' },
        js: lines('let lo = s.toLowerCase();', 'let up = s.toUpperCase();'),
        py: lines('lo = s.lower()', 'up = s.upper()'),
        expected: graph({ s: 'Hi', lo: 'hi', up: 'HI' }),
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
      }),
      draw({
        title: 'Dropping a reference',
        js: lines('let a = [1];', 'let b = a;', 'a = null;'),
        py: lines('a = [1]', 'b = a', 'a = None'),
        expected: graph({ a: null, b: ref('b') }, { b: list(1) }),
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
      }),
      write({
        title: 'Mutate, then rebind',
        given: { js: lines('let a = [1];', 'let b = a;'), py: lines('a = [1]', 'b = a') },
        js: lines('a.push(2);', 'a = [9];'),
        py: lines('a.append(2)', 'a = [9]'),
        expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2), new: list(9) }),
        process: { runtime: runtime(sameObject(before('a'), after('b'))) },
      }),
      draw({
        title: 'A function that mutates',
        js: lines('function add(arr) {', '  arr.push(1);', '}', 'let a = [];', 'add(a);'),
        py: lines('def add(arr):', '    arr.append(1)', '', 'a = []', 'add(a)'),
        expected: graph({ a: ref('a') }, { a: list(1) }),
      }),
      draw({
        title: 'A function that rebinds',
        js: lines('function reset(arr) {', '  arr = [0];', '}', 'let a = [1];', 'reset(a);'),
        py: lines('def reset(arr):', '    arr = [0]', '', 'a = [1]', 'reset(a)'),
        expected: graph({ a: ref('a') }, { a: list(1) }),
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
        process: { runtime: runtime(call('fill', [after('a')], 2), call('fill', [after('b')], 1)) },
      }),
    ],
    [
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
        process: { runtime: runtime(call('touch', [before('b')], 1)) },
      }),
      draw({
        title: 'A function that changes an alias',
        js: lines('function mark(o) {', '  o.seen = true;', '}', 'let a = {};', 'let b = a;', 'mark(b);'),
        py: lines('def mark(o):', '    o["seen"] = True', '', 'a = {}', 'b = a', 'mark(b)'),
        expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ seen: true }) }),
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
        process: { runtime: runtime(call('tag', [after('a')], 1)) },
      }),
      draw({
        title: 'Rebinding before mutating',
        js: lines('function f(arr) {', '  arr = [9];', '  arr.push(1);', '}', 'let a = [5];', 'f(a);'),
        py: lines('def f(arr):', '    arr = [9]', '    arr.append(1)', '', 'a = [5]', 'f(a)'),
        expected: graph({ a: ref('a') }, { a: list(5) }),
      }),
      draw({
        title: 'Combine, then grow the copy',
        js: lines('let a = [1];', 'let b = a;', 'b = b.concat([2]);', 'b.push(3);'),
        py: lines('a = [1]', 'b = a', 'b = b + [2]', 'b.append(3)'),
        expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2, 3) }),
      }),
    ],
  ),

  level(
    'cycles',
    'Cycles and Linked Data',
    'Objects can be chained into a linked list, where each one refers to the next and the last refers to null (None in Python). References can also loop back: a list or array or object or dictionary can refer to itself, and two objects can refer to each other.',
    [
      draw({
        title: 'A linked list',
        js: lines(
          'let c = { v: 3, next: null };',
          'let b = { v: 2, next: c };',
          'let a = { v: 1, next: b };',
        ),
        py: lines(
          'c = {"v": 3, "next": None}',
          'b = {"v": 2, "next": c}',
          'a = {"v": 1, "next": b}',
        ),
        expected: graph(
          { a: ref('a'), b: ref('b'), c: ref('c') },
          {
            a: dict({ v: 1, next: ref('b') }),
            b: dict({ v: 2, next: ref('c') }),
            c: dict({ v: 3, next: null }),
          },
        ),
      }),
      write({
        title: 'A two-node list',
        js: lines('let tail = { v: "b", next: null };', 'let head = { v: "a", next: tail };'),
        py: lines('tail = {"v": "b", "next": None}', 'head = {"v": "a", "next": tail}'),
        expected: graph(
          { head: ref('head') },
          {
            head: dict({ v: 'a', next: ref('tail') }),
            tail: dict({ v: 'b', next: null }),
          },
        ),
      }),
      write({
        title: 'A circular linked list',
        js: lines(
          'let c = { v: 3, next: null };',
          'let b = { v: 2, next: c };',
          'let head = { v: 1, next: b };',
          'c.next = head;',
        ),
        py: lines(
          'c = {"v": 3, "next": None}',
          'b = {"v": 2, "next": c}',
          'head = {"v": 1, "next": b}',
          'c["next"] = head',
        ),
        expected: graph(
          { head: ref('head') },
          {
            head: dict({ v: 1, next: ref('second') }),
            second: dict({ v: 2, next: ref('third') }),
            third: dict({ v: 3, next: ref('head') }),
          },
        ),
      }),
      draw({
        title: 'A list containing itself',
        js: lines('let a = [];', 'a.push(a);'),
        py: lines('a = []', 'a.append(a)'),
        expected: graph({ a: ref('a') }, { a: list(ref('a')) }),
      }),
      write({
        title: 'A list holding itself twice',
        js: lines('let a = [];', 'a.push(a);', 'a.push(a);'),
        py: lines('a = []', 'a.append(a)', 'a.append(a)'),
        expected: graph({ a: ref('a') }, { a: list(ref('a'), ref('a')) }),
      }),
      draw({
        title: 'An object containing itself',
        js: lines('let a = {};', 'a.self = a;'),
        py: lines('a = {}', 'a["self"] = a'),
        expected: graph({ a: ref('a') }, { a: dict({ self: ref('a') }) }),
      }),
      write({
        title: 'An object in its own list',
        js: lines('let o = { items: [] };', 'o.items.push(o);'),
        py: lines('o = {"items": []}', 'o["items"].append(o)'),
        expected: graph(
          { o: ref('o') },
          { o: dict({ items: ref('items') }), items: list(ref('o')) },
        ),
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
      }),
      write({
        title: 'A doubly linked pair',
        js: lines(
          'let first = { v: 1, prev: null, next: null };',
          'let second = { v: 2, prev: first, next: null };',
          'first.next = second;',
        ),
        py: lines(
          'first = {"v": 1, "prev": None, "next": None}',
          'second = {"v": 2, "prev": first, "next": None}',
          'first["next"] = second',
        ),
        expected: graph(
          { first: ref('first') },
          {
            first: dict({ v: 1, prev: null, next: ref('second') }),
            second: dict({ v: 2, prev: ref('first'), next: null }),
          },
        ),
      }),
      draw({
        title: 'Two lists in a loop',
        js: lines('let x = [1];', 'let y = [x];', 'x.push(y);'),
        py: lines('x = [1]', 'y = [x]', 'x.append(y)'),
        expected: graph(
          { x: ref('x'), y: ref('y') },
          { x: list(1, ref('y')), y: list(ref('x')) },
        ),
      }),
    ],
    [
      draw({
        title: 'A two-node ring',
        js: lines('let a = { v: 1, next: null };', 'let b = { v: 2, next: a };', 'a.next = b;'),
        py: lines('a = {"v": 1, "next": None}', 'b = {"v": 2, "next": a}', 'a["next"] = b'),
        expected: graph(
          { a: ref('a'), b: ref('b') },
          { a: dict({ v: 1, next: ref('b') }), b: dict({ v: 2, next: ref('a') }) },
        ),
      }),
      write({
        title: 'Two keys back home',
        js: lines('let o = {};', 'o.me = o;', 'o.also = o;'),
        py: lines('o = {}', 'o["me"] = o', 'o["also"] = o'),
        expected: graph({ o: ref('o') }, { o: dict({ me: ref('o'), also: ref('o') }) }),
      }),
      draw({
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
      }),
      draw({
        title: 'A loop through an inner list',
        js: lines('let a = [[]];', 'a[0].push(a);'),
        py: lines('a = [[]]', 'a[0].append(a)'),
        expected: graph({ a: ref('a') }, { a: list(ref('inner')), inner: list(ref('a')) }),
      }),
      write({
        title: 'A ring linked a, c, b',
        given: {
          js: lines(
            'let a = { v: 1, next: null };',
            'let b = { v: 2, next: null };',
            'let c = { v: 3, next: null };',
          ),
          py: lines(
            'a = {"v": 1, "next": None}',
            'b = {"v": 2, "next": None}',
            'c = {"v": 3, "next": None}',
          ),
        },
        js: lines('a.next = c;', 'c.next = b;', 'b.next = a;'),
        py: lines('a["next"] = c', 'c["next"] = b', 'b["next"] = a'),
        expected: graph(
          { a: ref('a'), b: ref('b'), c: ref('c') },
          {
            a: dict({ v: 1, next: ref('c') }),
            b: dict({ v: 2, next: ref('a') }),
            c: dict({ v: 3, next: ref('b') }),
          },
        ),
        process: { runtime: runtime(preserve('a'), preserve('b'), preserve('c')) },
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

export function problemHint(problem: Problem, language: Language): string | undefined {
  if (!problem.hint) return undefined
  if (typeof problem.hint === 'string') return problem.hint
  return problem.hint[language]
}
