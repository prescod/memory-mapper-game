import { graph, ref, scalar, withGarbage } from '../builders'
import type { UnnumberedLevel } from '../types'
import {
  draw,
  L,
  level,
  lines,
  SHARING_LATER,
  SHARING_REMINDER,
  write,
} from './common'

export const scalarsLevel: UnnumberedLevel = level(
  'scalars',
  L('Variables and Primitives', 'Variables and Primitives'),
  L(
    'A variable refers to a value at the moment you assign it, not a live formula or spreadsheet cell. Reassigning moves its arrow to a new value. Assigning from another variable gives it the value the first one refers to at that moment. Reassigning one later repoints only that variable, leaving the other unchanged.',
    'A variable refers to a value at the moment you assign it, not a live formula or spreadsheet cell. Reassigning moves its arrow to a new value. Assigning from another variable gives it the value the first one refers to at that moment. Reassigning one later repoints only that variable, leaving the other unchanged.',
  ),
  [
    draw({
      title: 'One variable. One primitive',
      js: 'let x = 10;',
      py: 'x = 10',
      expected: graph({ x: 10 }),
      hint: 'Create a variable named x and a primitive number node with value 10, then connect x to 10.',
      hints: [
        {
          variable: 'x',
          value: '10',
          message: 'The value 10 is a number, not a string. Do not put quotes around numbers.',
        },
      ],
      tip: '<p>A number is a <strong>primitive</strong> value: a simple, single value. A variable is one block, its value is another, and an arrow connects them.</p>',
      about:
        'A variable and its value are two separate things. Assigning creates a name and points an arrow at its value.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = 10;</code> creates two things: a <strong>variable</strong> named <code>x</code> and a <strong>value</strong>, the number 10. The arrow means "x currently refers to 10."</p>',
            py: '<p><code>x = 10</code> creates two things: a <strong>variable</strong> named <code>x</code> and a <strong>value</strong>, the number 10. The arrow means "x currently refers to 10."</p>',
          },
        },
        {
          html: '<p>Every diagram in this game is built from these pieces: names, values, and arrows from names to values. Where the blocks sit on the canvas does not matter, only what points to what.</p>',
        },
        {
          diagram: graph({ x: 10 }),
          caption: 'One name, one value, one arrow.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: '10' }),
          caption: 'Not correct: 10 is a number, not a string.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> placing the blocks anywhere on the canvas. Their position does not matter, only which arrows connect which names to which values.</p>',
        },
        {
          html: '<p><strong>Not accepted:</strong> creating a string value <code>"10"</code> instead of the number <code>10</code>. Numbers are written without quotes.</p>',
        },
      ],
    }),
    draw({
      title: 'Reassignment',
      js: lines('let x = 5;', 'x = 7;'),
      py: lines('x = 5', 'x = 7'),
      expected: graph({ x: 7 }),
      hint: 'Draw memory as it is after both lines have run. A variable refers to only one value at a time.',
      hints: [
        {
          variable: 'x',
          value: 5,
          message:
            'The value 5 is not correct here. x stopped referring to 5 when it was reassigned: the second line moved its arrow to 7.',
        },
      ],
      tip: '<p>A value that no arrow points to is ignored, so you may delete the old value or leave it on the canvas.</p>',
      about:
        'Assigning to a variable that already exists moves its arrow to a new value. The variable keeps no memory of what it referred to before.',
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
          diagram: graph({ x: 5 }),
          caption: 'Not correct: x was reassigned, so it no longer refers to 5.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the old 5 on the canvas with nothing pointing to it. A value that nothing refers to can never be used again, so the checker ignores it. The language reclaims that memory on its own, which is called garbage collection.</p>',
        },
        {
          diagram: withGarbage(graph({ x: 7 }), 5),
          caption: 'Also correct: the old 5 left behind with nothing pointing to it.',
          verdict: 'correct',
        },
        {
          html: '<p><strong>Not accepted:</strong> leaving x pointing at 5. Reassigning moves the arrow; a variable can only refer to one value at a time.</p>',
        },
      ],
    }),
    draw({
      title: 'Assigning from a variable',
      js: lines('let x = 10;', 'let y = x;'),
      py: lines('x = 10', 'y = x'),
      expected: graph({ x: 10, y: 10 }),
      hint:
        'Look up what x refers to when the second line runs, and point y at that value. One shared 10 or two separate 10s are both correct.',
      hints: [
        {
          variable: 'y',
          value: 'x',
          message:
            'The value "x" is not correct. Assigning from a variable evaluates that variable to find its value, 10, rather than using its name as text.',
        },
      ],
      tip: '<p>Arrows go from variables to values, never to other variables. To draw a variable assigned from another, point it at the value the other one currently refers to.</p>',
      about:
        'Assigning one variable from another gives the new variable the value the first one refers to at that moment.',
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> does not point y at x. Variables never point to variables. It looks up the value x refers to right now, 10, and points y at that value.</p>',
            py: '<p><code>y = x</code> does not point y at x. Variables never point to variables. It looks up the value x refers to right now, 10, and points y at that value.</p>',
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
          diagram: graph({ x: 10, y: 'x' }),
          caption: 'Not correct: y gets the value x refers to (10), not the string "x".',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>JavaScript describes <code>let y = x;</code> as copying the number into y, which matches the first picture.</p>',
            py: '<p>In Python, y now refers to the very same 10 object as x, which matches the second picture.</p>',
          },
        },
        {
          html: '<p>Either way, a number can never be changed in place, so no program can tell the two pictures apart, and the checker accepts both.</p>',
        },
        {
          html: '<p><strong>Also correct:</strong> drawing either one shared 10 node or two separate 10 nodes.</p>',
        },
        {
          html: '<p><strong>Not accepted:</strong> pointing y at the variable x. Variables can only refer to values, never to other variables.</p>',
        },
        {
          html: SHARING_LATER,
        },
      ],
    }),
    write({
      title: 'Two equal values',
      given: { js: 'let x = 8;', ts: 'let x: number = 8;', py: 'x = 8' },
      js: 'let y = x;',
      ts: 'let y: number = x;',
      py: 'y = x',
      expected: graph({ x: 8, y: 8 }),
      constraints: [
        {
          rule:
            'The boss says that if another programmer updates the code so that x starts at a different number, y must also use that different number.',
          cases: [
            {
              change: 'x starts at 3',
              given: { js: 'let x = 3;', ts: 'let x: number = 3;', py: 'x = 3' },
              expected: graph({ x: 3, y: 3 }),
            },
          ],
        },
      ],
      hint: {
        js: 'Declare y and assign it from x instead of typing 8 again.',
        py: 'Set y from x instead of typing 8 again.',
      },
      hints: [
        {
          variable: 'y',
          value: 'x',
          message:
            'The value "x" is not correct. Assign from the variable x without quotes so that y receives its numerical value, 8.',
        },
      ],
      tip: {
        js: '<p>A variable name stands for the value it refers to, so you can write the name wherever a value goes. <code>let</code> creates a new variable: use it only the first time a name appears.</p>',
        py: '<p>A variable name stands for the value it refers to, so you can write the name wherever a value goes.</p>',
      },
      about:
        'Give y the value that x already refers to. The special constraint says y must follow whatever number x starts at, so assign from x instead of typing the number again.',
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> gives y whatever value x refers to at that moment: 8.</p>',
            py: '<p><code>y = x</code> gives y whatever value x refers to at that moment: 8.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: scalar(8) }),
          caption: 'This picture, with one shared 8, shows the same memory as the one you matched.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 8, y: 'x' }),
          caption: 'Not correct: y must receive the value x refers to, not the text "x".',
          verdict: 'incorrect',
        },
        {
          html: "<p><strong>Also correct:</strong> y sharing x's 8, as above, or referring to a separate 8, as in the picture you matched. Numbers cannot change in place, so the two pictures behave the same.</p>",
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let y = 8;</code> builds exactly the same picture, so the picture alone cannot tell the two apart. The special constraint can. If another programmer changes the first line to <code>let x = 3;</code>, then <code>let y = x;</code> gives y 3 as well, as your boss asked, but <code>let y = 8;</code> leaves y at 8.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y = 8</code> builds exactly the same picture, so the picture alone cannot tell the two apart. The special constraint can. If another programmer changes the first line to <code>x = 3</code>, then <code>y = x</code> gives y 3 as well, as your boss asked, but <code>y = 8</code> leaves y at 8.</p>',
          },
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
            'The value 15 is not correct here. Changing height later does not update area: area refers to the number calculated when its line ran, not to a live formula.',
        },
        {
          variable: 'height',
          value: 4,
          message:
            'The value 4 is not correct for height. Remember that height was reassigned to 5 on the final line.',
        },
      ],
      tip: '<p><code>*</code> multiplies. The result is a new number, calculated at the moment that line runs.</p>',
      about:
        'An assignment calculates its value once, when that line runs. A variable is not a spreadsheet cell, so reassigning one of its inputs later does not update the calculated value.',
      debrief: [
        {
          html: '<p><code>width * height</code> multiplied 3 by 4 when that line ran, and area was pointed at the result, 12. The formula is not saved anywhere: area refers only to the number.</p>',
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
          html: '<p><strong>Also correct:</strong> leaving the old 4 on the canvas with nothing pointing to it. Unreferenced values are garbage-collected automatically.</p>',
        },
        {
          html: '<p><strong>Not accepted:</strong> updating area to 15 when height changes. In programming languages, unlike spreadsheets, an assignment does not establish an ongoing connection between variables.</p>',
        },
      ],
    }),
    write({
      title: 'Two teams',
      given: { js: 'let players = 2;', ts: 'let players: number = 2;', py: 'players = 2' },
      js: 'let teams = 2;',
      ts: 'let teams: number = 2;',
      py: 'teams = 2',
      expected: graph({ players: 2, teams: 2 }),
      constraints: [
        {
          rule:
            'The boss says the game always has exactly 2 teams, no matter how many players there are. If another programmer updates the code so that players starts at a different number, teams must stay 2.',
          cases: [
            {
              change: 'players starts at 6',
              given: { js: 'let players = 6;', ts: 'let players: number = 6;', py: 'players = 6' },
              expected: graph({ players: 6, teams: 2 }),
            },
          ],
        },
      ],
      hint: {
        js: 'Declare teams with the number 2 itself, not from players.',
        py: 'Set teams to the number 2 itself, not from players.',
      },
      hints: [
        {
          variable: 'teams',
          value: '2',
          message: 'The value 2 is a number, not a string. Do not put quotes around numbers.',
        },
      ],
      about:
        'Two variables can refer to the same number for different reasons. When two values should not be linked, assign the value directly rather than from another variable.',
      debrief: [
        {
          html: {
            js: '<p><code>let teams = 2;</code> gives teams its own 2. If another programmer changes the first line to <code>let players = 6;</code>, teams is still 2, as your boss asked.</p>',
            py: '<p><code>teams = 2</code> gives teams its own 2. If another programmer changes the first line to <code>players = 6</code>, teams is still 2, as your boss asked.</p>',
          },
        },
        {
          diagram: graph({ players: 2, teams: 2 }),
          caption: 'Correct: teams refers to 2 independently.',
          verdict: 'correct',
        },
        {
          diagram: graph({ players: ref('two'), teams: ref('two') }, { two: scalar(2) }),
          caption: 'Also correct: one 2 shared by both.',
          verdict: 'correct',
        },
        {
          diagram: graph({ players: 6, teams: 6 }),
          caption: 'Not correct if players changes to 6: teams must stay 2, not follow players.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> players and teams sharing one 2, or referring to separate 2s. Drawing one shared 2 does not mean teams follows players. It only means both refer to the number 2 right now.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let teams = players;</code> builds the same picture today, but if players started at 6, teams would be 6 too.</p>',
            py: '<p><strong>Not accepted:</strong> <code>teams = players</code> builds the same picture today, but if players started at 6, teams would be 6 too.</p>',
          },
        },
        {
          html: '<p>Compare this with Two equal values, where your boss asked for the opposite. Both pictures have the same shape: two variables referring to the same number. The picture cannot tell you whether one value should follow the other. That depends on what the numbers mean, and deciding it is part of your job as the programmer.</p>',
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
    draw({
      title: 'Reassigning the second variable',
      js: lines('let x = 1;', 'let y = x;', 'y = 2;'),
      py: lines('x = 1', 'y = x', 'y = 2'),
      expected: graph({ x: 1, y: 2 }),
      hint: 'Trace the lines in order. Which arrow does the last line move?',
      hints: [
        {
          variable: 'x',
          value: 2,
          message:
            "The value 2 for x is not correct. Reassigning y moves only y's arrow; x still refers to 1.",
        },
        {
          variable: 'y',
          value: 1,
          message: "The value 1 for y is not correct. The line y = 2 reassigned y to 2.",
        },
      ],
      about:
        'Once two variables refer to the same value, reassigning one of them moves only its own arrow. The other variable keeps its value.',
      debrief: [
        {
          html: {
            js: "<p>After <code>let y = x;</code> both variables refer to 1. Then <code>y = 2;</code> moves only y's arrow. Nothing happened to x, so x still refers to 1.</p>",
            py: "<p>After <code>y = x</code> both variables refer to 1. Then <code>y = 2</code> moves only y's arrow. Nothing happened to x, so x still refers to 1.</p>",
          },
        },
        {
          diagram: graph({ x: 1, y: 2 }),
          caption: 'x keeps 1. y now refers to 2.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 2, y: 2 }),
          caption: 'Not correct: reassigning y does not change x.',
          verdict: 'incorrect',
        },
        {
          html: "<p>If you pictured x and y sharing one 1 after the second line, moving y's arrow leaves x pointing at that same 1. If you pictured two separate 1s, y's old 1 is left with nothing pointing to it. Both ways end at the same picture.</p>",
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the old 1 on the canvas if separate nodes were used.</p>',
        },
        {
          html: "<p><strong>Not accepted:</strong> moving x's arrow to 2. Reassigning a variable never changes any other variable. That stays true for every kind of value you will meet in this game.</p>",
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
    write({
      title: 'Swapped',
      given: {
        js: lines('let x = 1;', 'let y = 2;'),
        ts: lines('let x: number = 1;', 'let y: number = 2;'),
        py: lines('x = 1', 'y = 2'),
      },
      js: lines('let t = x;', 'x = y;', 'y = t;'),
      ts: lines('let t: number = x;', 'x = y;', 'y = t;'),
      py: lines('t = x', 'x = y', 'y = t'),
      expected: graph({ x: 2, y: 1 }),
      constraints: [
        {
          rule:
            'The boss says that if another programmer updates the code so that x and y start at different numbers, your code must still swap them.',
          cases: [
            {
              change: 'x starts at 5 and y starts at 9',
              given: {
                js: lines('let x = 5;', 'let y = 9;'),
                ts: lines('let x: number = 5;', 'let y: number = 9;'),
                py: lines('x = 5', 'y = 9'),
              },
              expected: graph({ x: 9, y: 5 }),
            },
          ],
        },
      ],
      hint: 'It is okay to introduce a third variable to save one value during the swap.',
      hints: [
        {
          variable: 'y',
          value: 2,
          message:
            "y still refers to 2. If x = y ran first, it moved x's arrow before x's old value was saved anywhere, so the 1 was lost. Save x in a temporary variable first.",
        },
        {
          variable: 'x',
          value: 1,
          message:
            "x still refers to 1. If y = x ran first, it moved y's arrow before y's old value was saved anywhere, so the 2 was lost. Save one of the values in a temporary variable first.",
        },
      ],
      tip: {
        js: '<p>You may create extra variables beyond the ones in the picture, and they are not checked. Reassigning a variable discards what it referred to unless another variable still refers to it, so an extra variable can hold a value for safekeeping. Use <code>let</code> only on the line that creates a variable.</p>',
        py: '<p>You may create extra variables beyond the ones in the picture, and they are not checked. Reassigning a variable discards what it referred to unless another variable still refers to it, so an extra variable can hold a value for safekeeping.</p>',
      },
      about:
        'Exchange the values of two variables. Each assignment replaces what a variable refers to, so one value must be saved in a temporary variable first.',
      debrief: [
        {
          html: {
            js: "<p><code>x = y; y = x;</code> does not work: after the first line both variables refer to 2, and the 1 is lost. Saving x's value in a third variable first keeps it reachable:</p><pre><code>let t = x;\nx = y;\ny = t;</code></pre>",
            py: "<p><code>x = y</code> followed by <code>y = x</code> does not work: after the first line both variables refer to 2, and the 1 is lost. Saving x's value in a third variable first keeps it reachable:</p><pre><code>t = x\nx = y\ny = t</code></pre>",
          },
        },
        {
          diagram: graph({ x: 2, y: 1 }),
          caption: 'The final values: x refers to 2 and y refers to 1.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 2, y: 2 }),
          caption: 'Not correct: without a temporary variable, both variables end up referring to 2.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> JavaScript can swap in one line: <code>[x, y] = [y, x];</code>. The right side is calculated first and holds both old values before either variable is reassigned.</p>',
            py: '<p><strong>Also correct:</strong> Python can swap in one line: <code>x, y = y, x</code>. The right side is calculated first and holds both old values before either name is reassigned.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = 2; y = 1;</code> builds the same picture because you can see the numbers, but the special constraint asks for a real swap, one that works whatever the starting values are.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = 2</code> and <code>y = 1</code> build the same picture because you can see the numbers, but the special constraint asks for a real swap, one that works whatever the starting values are.</p>',
          },
        },
        {
          diagram: graph({ x: 2, y: 1, t: 1 }),
          caption:
            'Memory after the swap with a temporary variable. t still refers to 1; the picture you matched shows only x and y.',
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
    write({
      title: 'Only one changes',
      given: {
        js: lines('let x = 4;', 'let y = x;'),
        ts: lines('let x: number = 4;', 'let y: number = x;'),
        py: lines('x = 4', 'y = x'),
      },
      js: 'y = 9;',
      py: 'y = 9',
      expected: graph({ x: 4, y: 9 }),
      hint: 'Only y needs a new value. x does not have to change.',
      hints: [
        {
          variable: 'x',
          value: 9,
          message:
            "x should still refer to 4. Reassigning x does not reach y: y got x's value once, and only reassigning y moves y's arrow.",
        },
        {
          variable: 'y',
          value: 4,
          message: 'The variable y still refers to 4. Reassign y to 9.',
        },
      ],
      tip: {
        js: '<p>Both variables already exist, so do not write <code>let</code> again. Reassigning is just the name, <code>=</code>, and the new value.</p>',
        py: '',
      },
      about:
        'To give one of two variables a new value, reassign that variable alone. It does not matter that one was assigned from the other: reassigning repoints only the variable you name.',
      debrief: [
        {
          html: {
            js: "<p><code>y = 9;</code> moves only y's arrow. x still refers to 4, even though y first got its value from x.</p>",
            py: "<p><code>y = 9</code> moves only y's arrow. x still refers to 4, even though y first got its value from x.</p>",
          },
        },
        {
          diagram: graph({ x: 4, y: 9 }),
          caption: 'After your line runs: x still refers to 4, and y refers to 9.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 9, y: 9 }),
          caption: 'Not correct: reassigning y does not change x.',
          verdict: 'incorrect',
        },
        {
          html: "<p><strong>Also correct:</strong> whether x and y initially shared a 4 or had separate 4 nodes, reassigning y moves only y's arrow.</p>",
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = 9;</code>, in the hope that y follows x. y got its value from x once and does not follow it, so x becomes 9 and y stays 4.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = 9</code>, in the hope that y follows x. y got its value from x once and does not follow it, so x becomes 9 and y stays 4.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let y = 9;</code>. <code>let</code> declares a new variable, but y was already declared in the starter code, so JavaScript stops with a duplicate declaration error.</p>',
            py: '<p>In Python, <code>y = 9</code> is the same line whether y is new or already exists. Python has no separate keyword for declaring a variable.</p>',
          },
        },
      ],
    }),
    write({
      title: 'One of each',
      js: lines('let name = "Bo";', 'let age = 7;', 'let member = true;', 'let nickname = null;'),
      ts: lines(
        'let name: string = "Bo";',
        'let age: number = 7;',
        'let member: boolean = true;',
        'let nickname: null = null;',
      ),
      py: lines('name = "Bo"', 'age = 7', 'member = True', 'nickname = None'),
      expected: graph({ name: 'Bo', age: 7, member: true, nickname: null }),
      hint: {
        js: 'Write one declaration per variable. Only the string needs quotes: true and null are keywords, not text.',
        py: 'Write one assignment per variable. Only the string needs quotes: True and None are keywords, not text, and they start with capital letters.',
      },
      hints: [
        {
          variable: 'nickname',
          value: ['null', 'None'],
          message:
            'With quotes around it, this is a string of letters, not the special value that means "nothing". Write it without quotes.',
        },
        {
          variable: 'member',
          value: ['true', 'True'],
          message:
            'With quotes around it, this is a string of letters, not a boolean. Write it without quotes.',
        },
        {
          variable: 'age',
          value: '7',
          message:
            'The value "7" is a string, but age should be the number 7 without quotes.',
        },
      ],
      tip: {
        js: '<p>Strings, booleans and <code>null</code> are primitive values too, like numbers. Only text needs quotes.</p>',
        py: '<p>Strings, booleans and <code>None</code> are primitive values too, like numbers. Only text needs quotes.</p>',
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
          diagram: graph({ name: 'Bo', age: 7, member: true, nickname: null }),
          caption: 'Four variables, each pointing to a different kind of value.',
          verdict: 'correct',
        },
        {
          diagram: graph({ name: 'Bo', age: 7, member: true, nickname: 'null' }),
          caption: {
            js: 'Not correct: nickname must refer to null, not the string "null".',
            py: 'Not correct: nickname must refer to None, not a string of letters.',
          },
          verdict: 'incorrect',
        },
        {
          html: "<p><strong>Also correct:</strong> <code>'Bo'</code> in single quotes is the same string as <code>\"Bo\"</code>, and the four lines can come in any order.</p>",
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> leaving nickname without a value as in <code>let nickname;</code>. In JavaScript, an uninitialized variable refers to <code>undefined</code>, which is a different value from <code>null</code>.</p>',
            py: '<p><strong>Not accepted:</strong> spelling boolean or None in lowercase, such as <code>true</code> or <code>none</code>. Python requires <code>True</code> and <code>None</code> with capital letters.</p>',
          },
        },
      ],
    }),
  ],
  [
    draw({
      title: 'Reassigning the original leaves the other unchanged',
      js: lines('let x = 3;', 'let y = x;', 'x = 8;'),
      py: lines('x = 3', 'y = x', 'x = 8'),
      expected: graph({ x: 8, y: 3 }),
      hint: 'Trace the lines in order. When the second line runs, which value does x refer to?',
      hints: [
        {
          variable: 'y',
          value: 8,
          message:
            'The value 8 for y is not correct. Reassigning x to 8 does not change y; y still refers to 3.',
        },
        {
          variable: 'x',
          value: 3,
          message:
            'The value 3 for x is not correct. The line x = 8 reassigned x to 8.',
        },
      ],
      about:
        'Reassigning a variable never changes another variable that was assigned from it earlier. That variable keeps the value it received.',
      debrief: [
        {
          html: {
            js: "<p><code>let y = x;</code> gave y the value 3. It did not link y to x. When x is reassigned to 8, only x's arrow moves, so y still refers to 3.</p>",
            py: "<p><code>y = x</code> gave y the value 3. It did not link y to x. When x is reassigned to 8, only x's arrow moves, so y still refers to 3.</p>",
          },
        },
        {
          diagram: graph({ x: 8, y: 3 }),
          caption: 'Correct: y keeps 3.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 8, y: 8 }),
          caption: 'Not correct: y does not follow x.',
          verdict: 'incorrect',
        },
        {
          html: "<p>If you pictured x and y sharing one 3, moving x's arrow to 8 leaves y pointing at that 3. If you pictured two separate 3s, x's old 3 is left with nothing pointing to it. Either way you end at the correct picture.</p>",
        },
        {
          html: '<p><strong>Also correct:</strong> sharing one 3 between x and y before the reassignment, or having two separate 3 nodes.</p>',
        },
        {
          html: "<p><strong>Not accepted:</strong> moving y to 8. Assigning y from x looks up x's value once; it does not bind y to x.</p>",
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
    draw({
      title: 'A swap without a temporary variable',
      js: lines('let x = "red";', 'let y = "blue";', 'x = y;', 'y = x;'),
      py: lines('x = "red"', 'y = "blue"', 'x = y', 'y = x'),
      expected: graph({ x: 'blue', y: 'blue' }),
      hint: 'Trace the lines in order. When the last line runs, which value does x refer to?',
      hints: [
        {
          variable: 'y',
          value: 'red',
          message:
            'The value "red" for y is not correct. By the time y = x runs, x already refers to "blue", so y gets "blue" too.',
        },
        {
          variable: 'x',
          value: 'red',
          message: 'The value "red" for x is not correct. The line x = y moved x\'s arrow to "blue".',
        },
      ],
      about:
        'Two assignments in a row cannot exchange two values. The first one moves an arrow away from a value, and once nothing refers to that value, no later line can reach it.',
      debrief: [
        {
          html: {
            js: '<p>Follow it one line at a time:</p><ol><li>x refers to "red" and y refers to "blue".</li><li><code>x = y;</code> moves x\'s arrow to "blue". Now nothing refers to "red".</li><li><code>y = x;</code> looks up x\'s value, which is now "blue", and points y at it. y already referred to "blue", so nothing visible changes.</li></ol>',
            py: '<p>Follow it one line at a time:</p><ol><li>x refers to "red" and y refers to "blue".</li><li><code>x = y</code> moves x\'s arrow to "blue". Now nothing refers to "red".</li><li><code>y = x</code> looks up x\'s value, which is now "blue", and points y at it. y already referred to "blue", so nothing visible changes.</li></ol>',
          },
        },
        {
          diagram: graph({ x: 'blue', y: 'blue' }),
          caption: 'Both variables refer to "blue".',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('blue'), y: ref('blue') }, { blue: scalar('blue') }),
          caption: 'Also correct: one "blue" shared by both.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 'blue', y: 'red' }),
          caption: 'Not correct: this is what a real swap would do, and these two lines are not one.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving "red" on the canvas with nothing pointing to it. No variable can reach it again, so the checker ignores it.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> y referring to "red". To keep "red", the code would have to save it first, with <code>let t = x;</code>, as in Swapped.</p>',
            py: '<p><strong>Not accepted:</strong> y referring to "red". To keep "red", the code would have to save it first, with <code>t = x</code>, as in Swapped.</p>',
          },
        },
        {
          html: '<p>Strings cannot be changed in place either, so, as with numbers, sharing one "blue" or keeping two makes no difference yet.</p>',
        },
      ],
    }),
    draw({
      title: 'A chain of assignments',
      js: lines('let x = 6;', 'let y = x;', 'let z = y;', 'x = 0;'),
      py: lines('x = 6', 'y = x', 'z = y', 'x = 0'),
      expected: graph({ x: 0, y: 6, z: 6 }),
      hint: 'Work out what each variable refers to right after its own line runs. Then check which arrow the last line moves.',
      hints: [
        {
          variable: 'y',
          value: 0,
          message:
            "The value 0 for y is not correct. Reassigning x moves only x's arrow; y still refers to 6.",
        },
        {
          variable: 'z',
          value: 0,
          message:
            "The value 0 for z is not correct. Reassigning x moves only x's arrow; z still refers to 6.",
        },
      ],
      about:
        'Each assignment from a variable takes the value it refers to at that moment. A chain of such assignments does not link the variables together.',
      debrief: [
        {
          html: "<p>z got its value from y, and y got its value from x, but neither assignment linked the variables. Each one looked up a value, 6. Reassigning x to 0 moves only x's arrow, so y and z still refer to 6.</p>",
        },
        {
          diagram: graph({ x: 0, y: 6, z: 6 }),
          caption: 'Correct: y and z each refer to 6.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 0, y: ref('shared'), z: ref('shared') }, { shared: scalar(6) }),
          caption: 'Also correct: y and z sharing one 6.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 0, y: 0, z: 0 }),
          caption: 'Not correct: changing x does not travel down the chain to y or z.',
          verdict: 'incorrect',
        },
        {
          html: "<p><strong>Also correct:</strong> leaving x's old 6 on the canvas with nothing pointing to it, if you drew a separate 6 for each variable.</p>",
        },
        {
          html: '<p><strong>Not accepted:</strong> moving y or z to 0. A chain of assignments looks up values at each step; it never builds a live chain of connections between variables.</p>',
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
    draw({
      title: 'Rotate left',
      js: lines(
        'let x = 1;',
        'let y = 2;',
        'let z = 3;',
        'let t = x;',
        'x = y;',
        'y = z;',
        'z = t;',
      ),
      py: lines('x = 1', 'y = 2', 'z = 3', 't = x', 'x = y', 'y = z', 'z = t'),
      expected: graph({ x: 2, y: 3, z: 1, t: 1 }),
      hint: 'Trace one line at a time, noting what every variable refers to after each line.',
      hints: [
        {
          variable: 'z',
          value: 2,
          message:
            "The value 2 for z is not correct. Notice that z gets its value from t (the original value of x, which was 1), not from x after x was reassigned to 2.",
        },
        {
          variable: 'x',
          value: 1,
          message: 'The value 1 for x is not correct. The line x = y reassigned x to 2.',
        },
        {
          variable: 'y',
          value: 2,
          message: 'The value 2 for y is not correct. The line y = z reassigned y to 3.',
        },
      ],
      about:
        'Rotating three values works like a swap: one value is saved in a temporary variable before its variable is reassigned, so it is still reachable at the end.',
      debrief: [
        {
          html: "<p>Follow it one line at a time:</p><ol><li>t saves x's value: t is 1.</li><li>x takes y's value: x is 2.</li><li>y takes z's value: y is 3.</li><li>z takes the saved value: z is 1.</li></ol><p>Each value moves one place to the left, and the first one wraps around to the end.</p>",
        },
        {
          diagram: graph({ x: 2, y: 3, z: 1, t: 1 }),
          caption: 'After the rotation.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 2, y: 3, z: ref('one'), t: ref('one') }, { one: scalar(1) }),
          caption: 'Also correct: z and t sharing one 1.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 2, y: 3, z: 2, t: 1 }),
          caption: "Not correct: z receives the saved value from t (1), not x's new value (2).",
          verdict: 'incorrect',
        },
        {
          html: '<p>t still exists and refers to 1, so it is part of the final memory too.</p>',
        },
        {
          html: '<p><strong>Also correct:</strong> z and t sharing one 1, or each referring to its own 1.</p>',
        },
        {
          html: '<p><strong>Not accepted:</strong> omitting t from the diagram. Even though t was used as a temporary variable, it still exists in memory after the code runs.</p>',
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
    draw({
      title: 'Area before a change',
      js: lines('let width = 3;', 'let height = 4;', 'height = 5;', 'let area = width * height;'),
      py: lines('width = 3', 'height = 4', 'height = 5', 'area = width * height'),
      expected: graph({ width: 3, height: 5, area: 15 }),
      hint: 'Trace the lines in the order they run, and check which height the multiplication uses.',
      hints: [
        {
          variable: 'area',
          value: 12,
          message:
            'The value 12 is not correct here. Notice that height was changed to 5 before area was calculated, so area uses 5, not 4.',
        },
        {
          variable: 'height',
          value: 4,
          message:
            'The value 4 for height is not correct. The line height = 5 reassigned height before area was computed.',
        },
      ],
      about:
        'A calculation uses the values its variables refer to when its line runs. This is the same rule as Area after a change, with the lines in a different order.',
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
        {
          html: '<p><strong>Also correct:</strong> leaving the old 4 on the canvas with nothing pointing to it as garbage.</p>',
        },
        {
          html: '<p><strong>Not accepted:</strong> calculating area using the old height (4). A calculation always uses the values its variables refer to when its line runs.</p>',
        },
      ],
    }),
  ],
)
