import { graph, list, ref, scalar } from '../builders'
import type { Level } from '../types'
import { draw, L, level, lines, SHARING_REMINDER, write } from './common'

export const arraysLevel: Level = level(
  'arrays',
  L('Arrays', 'Lists'),
  L(
    'An array is a separate object in memory with numbered slots, counted from 0. Each slot is an arrow to a value, just as a variable is, and a variable refers to the whole array. Like a Pet, an array has identity: every array literal such as [1, 2] builds a new array, even when another array has the same contents.',
    'A list is a separate object in memory with numbered slots, counted from 0. Each slot is an arrow to a value, just as a variable is, and a variable refers to the whole list. Like a Pet, a list has identity: every list literal such as [1, 2] builds a new list, even when another list has the same contents.',
  ),
  [
    draw({
      title: { js: 'An array of numbers', py: 'A list of numbers' },
      js: 'let nums = [1, 2, 3];',
      py: 'nums = [1, 2, 3]',
      expected: graph({ nums: ref('nums') }, { nums: list(1, 2, 3) }),
      hint: {
        js: 'Create variable nums and an array with three slots. Point nums at the array, and each slot at its number.',
        py: 'Create variable nums and a list with three slots. Point nums at the list, and each slot at its number.',
      },
      about: {
        js: 'An array is a separate object in memory with numbered slots. The variable points to the array, and each slot points to a value.',
        py: 'A list is a separate object in memory with numbered slots. The variable points to the list, and each slot points to a value.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let nums = [1, 2, 3];</code> builds an array with three slots, numbered 0, 1, and 2, and points <code>nums</code> at it. Slot 0 points to 1, slot 1 points to 2, and slot 2 points to 3.</p>',
            py: '<p><code>nums = [1, 2, 3]</code> builds a list with three slots, numbered 0, 1, and 2, and points <code>nums</code> at it. Slot 0 points to 1, slot 1 points to 2, and slot 2 points to 3.</p>',
          },
        },
        {
          diagram: graph({ nums: ref('nums') }, { nums: list(1, 2, 3) }),
          caption: {
            js: 'nums refers to the array, and each slot refers to a number.',
            py: 'nums refers to the list, and each slot refers to a number.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ nums: 1 }),
          caption: {
            js: 'Not correct: nums refers to the whole array, not to its first number.',
            py: 'Not correct: nums refers to the whole list, not to its first number.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>A slot does not hold its number the way a box holds a thing. Each slot is an arrow, exactly like a variable. That is what will later let a slot point to another container, or two slots share one.</p>',
        },
      ],
    }),
    write({
      title: { js: 'An array of strings', py: 'A list of strings' },
      js: 'let colors = ["red", "green"];',
      ts: 'let colors: string[] = ["red", "green"];',
      py: 'colors = ["red", "green"]',
      expected: graph({ colors: ref('colors') }, { colors: list('red', 'green') }),
      hint: {
        js: 'Declare colors and assign it an array literal with "red" and "green".',
        py: 'Assign colors a list literal with "red" and "green".',
      },
      about: {
        js: 'Square brackets [...] build an array. Each item between the commas gets its own slot, in the order written.',
        py: 'Square brackets [...] build a list. Each item between the commas gets its own slot, in the order written.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>["red", "green"]</code> builds an array with two slots. Slot 0 points to <code>"red"</code> and slot 1 points to <code>"green"</code>. The variable <code>colors</code> refers to the array.</p>',
            py: '<p><code>["red", "green"]</code> builds a list with two slots. Slot 0 points to <code>"red"</code> and slot 1 points to <code>"green"</code>. The variable <code>colors</code> refers to the list.</p>',
          },
        },
        {
          diagram: graph({ colors: ref('colors') }, { colors: list('red', 'green') }),
          caption: {
            js: 'An array with two slots, each pointing to a string.',
            py: 'A list with two slots, each pointing to a string.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ colors: ref('colors') }, { colors: list('green', 'red') }),
          caption: 'Not correct: the slots follow the order of the literal, so slot 0 points to "red".',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> single quotes (<code>\'red\'</code>, <code>\'green\'</code>). In both languages, single and double quotes build the same strings.</p>',
        },
      ],
    }),
    draw({
      title: { js: 'An empty array', py: 'An empty list' },
      js: 'let items = [];',
      ts: 'let items: unknown[] = [];',
      py: 'items = []',
      expected: graph({ items: ref('items') }, { items: list() }),
      hint: {
        js: 'Create variable items and an array with no slots, then point items at the array.',
        py: 'Create variable items and a list with no slots, then point items at the list.',
      },
      about: {
        js: 'An empty array [] is a real object in memory. It simply has zero slots.',
        py: 'An empty list [] is a real object in memory. It simply has zero slots.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let items = [];</code> builds an array with zero slots and points <code>items</code> at it. Even with nothing in it, the array exists in memory.</p>',
            py: '<p><code>items = []</code> builds a list with zero slots and points <code>items</code> at it. Even with nothing in it, the list exists in memory.</p>',
          },
        },
        {
          diagram: graph({ items: ref('items') }, { items: list() }),
          caption: {
            js: 'An empty array has zero slots.',
            py: 'An empty list has zero slots.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ items: null }),
          caption: {
            js: 'Not correct: an empty array is an object with zero slots, not null.',
            py: 'Not correct: an empty list is an object with zero slots, not None.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>An empty array is not <code>null</code>, which means "no array at all". An empty array is a container that is there, ready for items.</p>',
            py: '<p>An empty list is not <code>None</code>, which means "no list at all". An empty list is a container that is there, ready for items.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Mixed values',
      js: 'let mixed = [1, "two", true];',
      py: 'mixed = [1, "two", True]',
      expected: graph({ mixed: ref('mixed') }, { mixed: list(1, 'two', true) }),
      hint: {
        js: 'One array with three slots: the number 1, the string "two", and true.',
        py: 'One list with three slots: the number 1, the string "two", and True.',
      },
      about: {
        js: 'The slots of one array can point to different kinds of value: numbers, strings, and booleans side by side.',
        py: 'The slots of one list can point to different kinds of value: numbers, strings, and booleans side by side.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>mixed</code> refers to one array with three slots: slot 0 points to the number 1, slot 1 points to the string <code>"two"</code>, and slot 2 points to the boolean <code>true</code>.</p>',
            py: '<p><code>mixed</code> refers to one list with three slots: slot 0 points to the number 1, slot 1 points to the string <code>"two"</code>, and slot 2 points to the boolean <code>True</code>.</p>',
          },
        },
        {
          diagram: graph({ mixed: ref('mixed') }, { mixed: list(1, 'two', true) }),
          caption: {
            js: 'Three different kinds of value in one array.',
            py: 'Three different kinds of value in one list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ mixed: ref('mixed') }, { mixed: list('1', 'two', 'true') }),
          caption: {
            js: 'Not correct: an array does not turn its items into one kind of value. Slot 0 points to the number 1 and slot 2 to the boolean true, not to strings.',
            py: 'Not correct: a list does not turn its items into one kind of value. Slot 0 points to the number 1 and slot 2 to the boolean True, not to strings.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Because each slot is an arrow, the container does not care what kind of value is at the other end of it.</p>',
        },
      ],
    }),
    write({
      title: { js: 'Null in an array', py: 'None in a list' },
      js: 'let cells = [null, 0, null];',
      ts: 'let cells: (number | null)[] = [null, 0, null];',
      py: 'cells = [None, 0, None]',
      expected: graph({ cells: ref('cells') }, { cells: list(null, 0, null) }),
      hint: {
        js: 'Declare cells as an array with three slots: null, 0, and null.',
        py: 'Assign cells a list with three slots: None, 0, and None.',
      },
      about: {
        js: 'null is a value that an array slot can point to like any other. A slot pointing to null is still a slot.',
        py: 'None is a value that a list slot can point to like any other. A slot pointing to None is still a slot.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>[null, 0, null]</code> builds an array with three slots. Slots 0 and 2 point to <code>null</code>, and slot 1 points to 0. <code>null</code> means "no value", but in the memory picture it is a value like any other.</p>',
            py: '<p><code>[None, 0, None]</code> builds a list with three slots. Slots 0 and 2 point to <code>None</code>, and slot 1 points to 0. <code>None</code> means "no value", but in the memory picture it is a value like any other.</p>',
          },
        },
        {
          diagram: graph({ cells: ref('cells') }, { cells: list(null, 0, null) }),
          caption: {
            js: 'Slots 0 and 2 point to null; slot 1 points to 0.',
            py: 'Slots 0 and 2 point to None; slot 1 points to 0.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ cells: ref('cells') }, { cells: list(0) }),
          caption: {
            js: 'Not correct: a slot that points to null is not missing. The array has three slots, not one.',
            py: 'Not correct: a slot that points to None is not missing. The list has three slots, not one.',
          },
          verdict: 'incorrect',
        },
        {
          diagram: graph({ cells: ref('cells') }, { cells: list(0, 0, 0) }),
          caption: {
            js: 'Not correct: null is a different value from 0.',
            py: 'Not correct: None is a different value from 0.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> slots 0 and 2 pointing to one shared <code>null</code>, or to two separate ones. Like numbers, <code>null</code> cannot be changed in place.</p>',
            py: '<p><strong>Also correct:</strong> slots 0 and 2 pointing to one shared <code>None</code>, or to two separate ones. Like numbers, <code>None</code> cannot be changed in place.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'One slot',
      js: 'let cell = [7];',
      py: 'cell = [7]',
      expected: graph({ cell: ref('cell') }, { cell: list(7) }),
      hint: {
        js: 'Create variable cell and an array with one slot. Point cell at the array, and the slot at 7.',
        py: 'Create variable cell and a list with one slot. Point cell at the list, and the slot at 7.',
      },
      about: {
        js: 'An array with one item is still an array object, not a bare number.',
        py: 'A list with one item is still a list object, not a bare number.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let cell = [7];</code> builds an array with a single slot. <code>cell</code> points to the array, and slot 0 points to 7.</p>',
            py: '<p><code>cell = [7]</code> builds a list with a single slot. <code>cell</code> points to the list, and slot 0 points to 7.</p>',
          },
        },
        {
          diagram: graph({ cell: ref('cell') }, { cell: list(7) }),
          caption: {
            js: 'cell points to the array, and slot 0 points to 7.',
            py: 'cell points to the list, and slot 0 points to 7.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ cell: 7 }),
          caption: {
            js: 'Not correct: the brackets build an array, so cell cannot point straight at 7.',
            py: 'Not correct: the brackets build a list, so cell cannot point straight at 7.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><code>[7]</code> and <code>7</code> are different things. <code>cell</code> refers to the container, and the container refers to the number.</p>',
            py: '<p><code>[7]</code> and <code>7</code> are different things. <code>cell</code> refers to the container, and the container refers to the number.</p>',
          },
        },
      ],
    }),
    write({
      title: 'A repeated number',
      js: 'let pair = [3, 3];',
      ts: 'let pair: number[] = [3, 3];',
      py: 'pair = [3, 3]',
      expected: graph({ pair: ref('pair') }, { pair: list(3, 3) }),
      hint: {
        js: 'Declare pair and assign it an array literal with 3 written twice.',
        py: 'Assign pair a list literal with 3 written twice.',
      },
      about: 'Each item in a literal gets its own slot, even when two items are equal.',
      debrief: [
        {
          html: {
            js: '<p><code>[3, 3]</code> builds an array with two slots, slot 0 and slot 1, and each one points to 3.</p>',
            py: '<p><code>[3, 3]</code> builds a list with two slots, slot 0 and slot 1, and each one points to 3.</p>',
          },
        },
        {
          diagram: graph({ pair: ref('pair') }, { pair: list(3, 3) }),
          caption: 'Two slots, each pointing to its own 3.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { pair: ref('pair') },
            { pair: list(ref('three'), ref('three')), three: scalar(3) },
          ),
          caption: 'Also correct: two slots sharing one 3.',
          verdict: 'correct',
        },
        {
          diagram: graph({ pair: ref('pair') }, { pair: list(3) }),
          caption: {
            js: 'Not correct: equal items do not merge. The literal has two items, so the array has two slots.',
            py: 'Not correct: equal items do not merge. The literal has two items, so the list has two slots.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> both slots pointing to one shared 3. Numbers cannot be changed in place, so no program can tell the two pictures apart, and the checker accepts both.</p>',
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
    write({
      title: { js: 'An array from a variable', py: 'A list from a variable' },
      given: { js: 'let n = 5;', ts: 'let n: number = 5;', py: 'n = 5' },
      js: 'let row = [n];',
      ts: 'let row: number[] = [n];',
      py: 'row = [n]',
      expected: graph({ n: 5, row: ref('row') }, { row: list(5) }),
      constraints: [
        {
          rule: 'Your boss said that if another programmer updates the code so that n starts at a different number, the slot in row must point to that different number.',
          cases: [
            {
              change: 'n starts at 7',
              given: { js: 'let n = 7;', ts: 'let n: number = 7;', py: 'n = 7' },
              expected: graph({ n: 7, row: ref('row') }, { row: list(7) }),
            },
          ],
        },
      ],
      hint: {
        js: 'Declare row as a one-slot array built from the existing variable n.',
        py: 'Assign row a one-slot list built from the existing variable n.',
      },
      hints: [
        {
          variable: 'row',
          value: 'n',
          message:
            'The value "n" is not correct. Write n without quotes, so the slot points to the value n refers to, 5.',
        },
      ],
      about: {
        js: 'When a variable appears in an array literal, the slot points to the value that variable refers to at that moment, just as b = a does. The special constraint says row must follow whatever number n starts at, so build the slot from n instead of typing the number.',
        py: 'When a variable appears in a list literal, the slot points to the value that variable refers to at that moment, just as b = a does. The special constraint says row must follow whatever number n starts at, so build the slot from n instead of typing the number.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let row = [n];</code> looks up the value <code>n</code> refers to right now, 5, and points slot 0 of the new array at that value. The slot points to 5, not to <code>n</code>.</p>',
            py: '<p><code>row = [n]</code> looks up the value <code>n</code> refers to right now, 5, and points slot 0 of the new list at that value. The slot points to 5, not to <code>n</code>.</p>',
          },
        },
        {
          diagram: graph({ n: 5, row: ref('row') }, { row: list(5) }),
          caption: {
            js: 'row refers to an array whose slot points to 5.',
            py: 'row refers to a list whose slot points to 5.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ n: ref('five'), row: ref('row') }, { row: list(ref('five')), five: scalar(5) }),
          caption: 'Also correct: n and the slot sharing one 5.',
          verdict: 'correct',
        },
        {
          diagram: graph({ n: 5, row: 5 }),
          caption: {
            js: 'Not correct: [n] builds an array, so row refers to that array, not straight to the number 5.',
            py: 'Not correct: [n] builds a list, so row refers to that list, not straight to the number 5.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Not accepted:</strong> an arrow from the slot to the variable <code>n</code>. Slots, like variables, can only refer to values, never to other variables.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let row = [5];</code> builds the same picture today, but your boss asked for row to follow n. If <code>n</code> started at 7, <code>let row = [n];</code> would point the slot at 7, while <code>let row = [5];</code> would still point it at 5.</p>',
            py: '<p><strong>Not accepted:</strong> <code>row = [5]</code> builds the same picture today, but your boss asked for row to follow n. If <code>n</code> started at 7, <code>row = [n]</code> would point the slot at 7, while <code>row = [5]</code> would still point it at 5.</p>',
          },
        },
        {
          html: "<p>Because the slot points to the value and not to <code>n</code>, reassigning <code>n</code> afterward would move only n's arrow. The slot would keep pointing to 5.</p>",
        },
      ],
    }),
    draw({
      title: { js: 'Two matching array literals', py: 'Two matching list literals' },
      js: lines('let a = [1];', 'let b = [1];'),
      py: lines('a = [1]', 'b = [1]'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1) }),
      hint: 'Each line has its own pair of square brackets. Work out how many containers that builds.',
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b come from two separate literals, so they refer to two separate containers, even though their slots match. Each [...] builds a new one.',
        },
      ],
      about: {
        js: 'Each array literal [...] builds a brand new array. Two arrays with matching contents are still two separate objects.',
        py: 'Each list literal [...] builds a brand new list. Two lists with matching contents are still two separate objects.',
      },
      debrief: [
        {
          html: {
            js: '<p>Every time <code>[...]</code> runs, JavaScript builds a <strong>new</strong> array. The code has two array literals, so <code>a</code> and <code>b</code> refer to two separate arrays, even though both have one slot pointing to 1.</p>',
            py: '<p>Every time <code>[...]</code> runs, Python builds a <strong>new</strong> list. The code has two list literals, so <code>a</code> and <code>b</code> refer to two separate lists, even though both have one slot pointing to 1.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1) }),
          caption: {
            js: 'Two separate arrays with matching contents.',
            py: 'Two separate lists with matching contents.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1) }),
          caption: {
            js: 'Not correct: matching contents do not make one array. Each [...] builds a new array.',
            py: 'Not correct: matching contents do not make one list. Each [...] builds a new list.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Compare this to <code>let b = a;</code>, which would point <code>b</code> at the array <code>a</code> already refers to, just as assigning a Pet shares it. When arrays start changing in place, in a later level, this difference decides whether a change made through <code>a</code> shows up through <code>b</code>.</p>',
            py: '<p>Compare this to <code>b = a</code>, which would point <code>b</code> at the list <code>a</code> already refers to, just as assigning a Pet shares it. When lists start changing in place, in a later level, this difference decides whether a change made through <code>a</code> shows up through <code>b</code>.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Two arrays from literals', py: 'Two lists from literals' },
      js: lines('let p = [0];', 'let q = [0];'),
      ts: lines('let p: number[] = [0];', 'let q: number[] = [0];'),
      py: lines('p = [0]', 'q = [0]'),
      expected: graph({ p: ref('p'), q: ref('q') }, { p: list(0), q: list(0) }),
      hint: {
        js: 'Give each variable its own one-slot array literal pointing to 0.',
        py: 'Give each variable its own one-slot list literal pointing to 0.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'shared',
          message:
            'p and q must refer to two separate containers. Write a separate [0] for each instead of assigning one from the other.',
        },
      ],
      about: {
        js: 'Two separate arrays need two separate array literals, even when the arrays hold equal numbers.',
        py: 'Two separate lists need two separate list literals, even when the lists hold equal numbers.',
      },
      debrief: [
        {
          html: {
            js: '<p>Each line evaluates its own <code>[0]</code>, building two separate arrays. <code>p</code> points to the first array, and <code>q</code> points to the second.</p>',
            py: '<p>Each line evaluates its own <code>[0]</code>, building two separate lists. <code>p</code> points to the first list, and <code>q</code> points to the second.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p'), q: ref('q') }, { p: list(0), q: list(0) }),
          caption: {
            js: 'Two separate arrays, each with one slot pointing to 0.',
            py: 'Two separate lists, each with one slot pointing to 0.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: list(0) }),
          caption: {
            js: 'Not correct: p and q share one array, but the picture shows two.',
            py: 'Not correct: p and q share one list, but the picture shows two.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let q = p;</code> after building p. That points <code>q</code> at the array <code>p</code> already refers to, so the two names share one array.</p>',
            py: '<p><strong>Not accepted:</strong> <code>q = p</code> after building p, or <code>p = q = [0]</code> on one line. Both point the two names at one shared list, because <code>[0]</code> runs only once.</p>',
          },
        },
      ],
    }),
  ],
  [
    write({
      title: 'Every kind of value',
      js: lines('let empty = [];', 'let full = [1, "1", true, null];'),
      ts: lines(
        'let empty: unknown[] = [];',
        'let full: (number | string | boolean | null)[] = [1, "1", true, null];',
      ),
      py: lines('empty = []', 'full = [1, "1", True, None]'),
      expected: graph(
        { empty: ref('empty'), full: ref('full') },
        { empty: list(), full: list(1, '1', true, null) },
      ),
      hint: {
        js: 'Declare empty as an empty array, and full as an array with one slot each for 1, "1", true, and null.',
        py: 'Assign empty an empty list, and full a list with one slot each for 1, "1", True, and None.',
      },
      about: {
        js: 'An array can be empty, or its slots can point to any mix of numbers, strings, booleans, and null.',
        py: 'A list can be empty, or its slots can point to any mix of numbers, strings, booleans, and None.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>empty</code> points to an array with zero slots. <code>full</code> points to a separate array with four slots, pointing to the number 1, the string <code>"1"</code>, the boolean <code>true</code>, and <code>null</code>.</p>',
            py: '<p><code>empty</code> points to a list with zero slots. <code>full</code> points to a separate list with four slots, pointing to the number 1, the string <code>"1"</code>, the boolean <code>True</code>, and <code>None</code>.</p>',
          },
        },
        {
          diagram: graph(
            { empty: ref('empty'), full: ref('full') },
            { empty: list(), full: list(1, '1', true, null) },
          ),
          caption: {
            js: 'Two separate arrays: one empty, one with four different kinds of value.',
            py: 'Two separate lists: one empty, one with four different kinds of value.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { empty: ref('empty'), full: ref('full') },
            { empty: list(), full: list(1, '1', true) },
          ),
          caption: {
            js: 'Not correct: the slot that points to null still counts, so full has four slots.',
            py: 'Not correct: the slot that points to None still counts, so full has four slots.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Notice that 1 (a number) and <code>"1"</code> (a string) are different values, even though they look alike.</p>',
        },
      ],
    }),
    draw({
      title: { js: 'A score recorded in an array', py: 'A score recorded in a list' },
      js: lines('let score = 4;', 'let history = [score];', 'score = 9;'),
      py: lines('score = 4', 'history = [score]', 'score = 9'),
      expected: graph({ score: 9, history: ref('history') }, { history: list(4) }),
      hint: {
        js: 'Work through the lines in order. Decide what slot 0 points to when the array is built, then what the last line changes.',
        py: 'Work through the lines in order. Decide what slot 0 points to when the list is built, then what the last line changes.',
      },
      hints: [
        {
          variable: 'history',
          value: 9,
          message:
            "The value 9 is not correct here. The slot got the value score referred to when the brackets ran, 4. Reassigning score afterward moves only score's arrow.",
        },
      ],
      about: {
        js: 'A slot points to the value a variable referred to when the array was built, not to the variable. Reassigning the variable later moves only its own arrow.',
        py: 'A slot points to the value a variable referred to when the list was built, not to the variable. Reassigning the variable later moves only its own arrow.',
      },
      debrief: [
        {
          html: {
            js: "<p><code>let history = [score];</code> looks up the value <code>score</code> refers to, 4, and points slot 0 at it. Then <code>score = 9;</code> moves score's arrow to 9. Nothing points the slot anywhere new, so it still points to 4.</p>",
            py: "<p><code>history = [score]</code> looks up the value <code>score</code> refers to, 4, and points slot 0 at it. Then <code>score = 9</code> moves score's arrow to 9. Nothing points the slot anywhere new, so it still points to 4.</p>",
          },
        },
        {
          diagram: graph({ score: 9, history: ref('history') }, { history: list(4) }),
          caption: 'score has moved on to 9; the slot still points to 4.',
          verdict: 'correct',
        },
        {
          diagram: graph({ score: 9, history: ref('history') }, { history: list(9) }),
          caption: 'Not correct: this treats the slot as a link to score. The slot points to a value, so reassigning score does not reach it.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Not accepted:</strong> an arrow from the slot to the variable <code>score</code>. Slots, like variables, can only refer to values, never to other variables.</p>',
        },
      ],
    }),
    draw({
      title: 'Three words',
      js: 'let words = ["I", "see", "you"];',
      py: 'words = ["I", "see", "you"]',
      expected: graph({ words: ref('words') }, { words: list('I', 'see', 'you') }),
      hint: {
        js: 'Create variable words and an array with one slot for each string, then connect them.',
        py: 'Create variable words and a list with one slot for each string, then connect them.',
      },
      about: {
        js: 'Each string in an array literal gets its own slot, in the order written, starting from slot 0.',
        py: 'Each string in a list literal gets its own slot, in the order written, starting from slot 0.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>words</code> points to an array with three slots: slot 0 points to <code>"I"</code>, slot 1 points to <code>"see"</code>, and slot 2 points to <code>"you"</code>.</p>',
            py: '<p><code>words</code> points to a list with three slots: slot 0 points to <code>"I"</code>, slot 1 points to <code>"see"</code>, and slot 2 points to <code>"you"</code>.</p>',
          },
        },
        {
          diagram: graph({ words: ref('words') }, { words: list('I', 'see', 'you') }),
          caption: 'Three slots pointing to three strings, in order.',
          verdict: 'correct',
        },
        {
          diagram: graph({ words: 'I see you' }),
          caption: {
            js: 'Not correct: words refers to an array of three strings, not to one string with spaces in it.',
            py: 'Not correct: words refers to a list of three strings, not to one string with spaces in it.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: { js: 'Booleans in an array', py: 'Booleans in a list' },
      js: 'let flags = [true, false, true];',
      py: 'flags = [True, False, True]',
      expected: graph({ flags: ref('flags') }, { flags: list(true, false, true) }),
      hint: {
        js: 'One array with three slots: true, false, and true.',
        py: 'One list with three slots: True, False, and True.',
      },
      about: {
        js: 'Booleans are values that slots point to, like numbers and strings. A repeated true still gets its own slot.',
        py: 'Booleans are values that slots point to, like numbers and strings. A repeated True still gets its own slot.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>flags</code> refers to an array with three slots: slot 0 points to <code>true</code>, slot 1 points to <code>false</code>, and slot 2 points to <code>true</code>.</p>',
            py: '<p><code>flags</code> refers to a list with three slots: slot 0 points to <code>True</code>, slot 1 points to <code>False</code>, and slot 2 points to <code>True</code>.</p>',
          },
        },
        {
          diagram: graph({ flags: ref('flags') }, { flags: list(true, false, true) }),
          caption: {
            js: 'Three boolean values in an array.',
            py: 'Three boolean values in a list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ flags: ref('flags') }, { flags: list(true, false) }),
          caption: {
            js: 'Not correct: equal items do not merge. The second true needs its own slot, so the array has three.',
            py: 'Not correct: equal items do not merge. The second True needs its own slot, so the list has three.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> slots 0 and 2 sharing one <code>true</code> or pointing to two separate ones. Like numbers, booleans cannot be changed in place.</p>',
            py: '<p><strong>Also correct:</strong> slots 0 and 2 sharing one <code>True</code> or pointing to two separate ones. Like numbers, booleans cannot be changed in place.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Two empty arrays', py: 'Two empty lists' },
      js: lines('let todo = [];', 'let done = [];'),
      ts: lines('let todo: unknown[] = [];', 'let done: unknown[] = [];'),
      py: lines('todo = []', 'done = []'),
      expected: graph({ todo: ref('todo'), done: ref('done') }, { todo: list(), done: list() }),
      hint: {
        js: 'Give each variable its own empty array.',
        py: 'Give each variable its own empty list.',
      },
      hints: [
        {
          variable: 'done',
          aliasing: 'shared',
          message:
            'todo and done must refer to two separate empty containers. Each [] builds a new one, so write [] once for each variable instead of assigning one from the other.',
        },
      ],
      about: {
        js: 'Every [] builds a new, separate empty array. Two variables that need their own empty arrays each need their own [].',
        py: 'Every [] builds a new, separate empty list. Two variables that need their own empty lists each need their own [].',
      },
      debrief: [
        {
          html: {
            js: '<p>Each line runs its own <code>[]</code>, so there are two separate empty arrays. <code>todo</code> points to one and <code>done</code> points to the other.</p>',
            py: '<p>Each line runs its own <code>[]</code>, so there are two separate empty lists. <code>todo</code> points to one and <code>done</code> points to the other.</p>',
          },
        },
        {
          diagram: graph({ todo: ref('todo'), done: ref('done') }, { todo: list(), done: list() }),
          caption: {
            js: 'Two separate empty arrays.',
            py: 'Two separate empty lists.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ todo: ref('shared'), done: ref('shared') }, { shared: list() }),
          caption: {
            js: 'Not correct: two empty arrays look alike, but todo and done must not share one.',
            py: 'Not correct: two empty lists look alike, but todo and done must not share one.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let done = todo;</code>. That points <code>done</code> at the array <code>todo</code> already refers to, so both names share one array.</p>',
            py: '<p><strong>Not accepted:</strong> <code>done = todo</code>, or <code>todo = done = []</code> on one line. Both point the two names at one shared list, because <code>[]</code> runs only once.</p>',
          },
        },
        {
          html: {
            js: '<p>Once arrays can change in place, sharing one by mistake becomes a real bug: an item added to the to-do array would also appear in the done array.</p>',
            py: '<p>Once lists can change in place, sharing one by mistake becomes a real bug: an item added to the to-do list would also appear in the done list.</p>',
          },
        },
      ],
    }),
  ],
)
