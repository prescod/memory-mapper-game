import { graph, withGarbage } from '../builders'
import type { UnnumberedLevel } from '../types'
import { draw, L, level, lines, write } from './common'

export const tutorialLevel: UnnumberedLevel = level(
  'tutorial',
  L('Getting Started', 'Getting Started'),
  L(
    'A variable is a name, and a value is a piece of data such as a number or a string. Assigning points the name at the value with an arrow. In this level you learn to draw that picture for some code, and to write code for a picture.',
    'A variable is a name, and a value is a piece of data such as a number or a string. Assigning points the name at the value with an arrow. In this level you learn to draw that picture for some code, and to write code for a picture.',
  ),
  [
    draw({
      title: 'Your first variable',
      js: 'let score = 3;',
      py: 'score = 3',
      expected: graph({ score: 3 }),
      hint: 'Add a Variable block named score and a Primitive block holding 3, then draw an arrow from score to 3.',
      hints: [
        {
          variable: 'score',
          value: '3',
          message: 'The value 3 is a number, not a string. Do not put quotes around numbers.',
        },
      ],
      coach: [
        {
          text: 'This code makes a <strong>variable</strong> named score and points it at a <strong>value</strong>, the number 3. You will draw that. Tap <strong>Variable</strong> to add a variable block.',
          target: 'add-variable',
          done: { variable: true },
        },
        {
          text: 'Type the variable\'s name, score, into the block.',
          target: 'variable-name',
          done: { variable: true, name: 'score' },
        },
        {
          text: 'Now tap <strong>Primitive</strong> to add a block for the value.',
          target: 'add-primitive',
          done: { primitive: true },
        },
        {
          text: 'Type 3 into the value block. Numbers are written without quotes.',
          target: 'primitive-value',
          done: { primitive: true, text: '3' },
        },
        {
          text: 'Connect them: tap the dot at the bottom of score, then tap the 3. You can also drag from the dot to the 3.',
          target: 'variable-dot',
          done: { arrow: true, from: 'score', to: '3' },
        },
        {
          text: 'The arrow means "score refers to 3." Tap <strong>Check</strong> to compare your picture with memory. If something is highlighted, fix it and check again.',
          target: 'check',
          done: { passed: true },
        },
        {
          text: 'Every puzzle ends with a short lesson about why the answer is right. Read it, then tap <strong>Next problem</strong>.',
          target: 'next',
          done: { end: true },
        },
      ],
      about:
        'A variable and its value are two separate things. A variable is a name; a value is a piece of data. Assigning points the name at the value with an arrow.',
      debrief: [
        {
          html: {
            js: '<p><code>let score = 3;</code> makes two things: a <strong>variable</strong> named <code>score</code> and a <strong>value</strong>, the number 3. The arrow means "score refers to 3."</p>',
            py: '<p><code>score = 3</code> makes two things: a <strong>variable</strong> named <code>score</code> and a <strong>value</strong>, the number 3. The arrow means "score refers to 3."</p>',
          },
        },
        {
          diagram: graph({ score: 3 }),
          caption: 'A variable, a value, and an arrow from one to the other.',
          verdict: 'correct',
        },
        {
          diagram: graph({ score: '3' }),
          caption: 'Not correct: "3" in quotes is a string of text, not the number 3.',
          verdict: 'incorrect',
        },
        {
          html: '<p>The name is not the value, and the value does not live inside the name. The variable only points at it. Every picture in this game is made of these pieces: names, values, and arrows from names to values.</p>',
        },
      ],
    }),
    draw({
      title: 'A word and a number',
      js: lines('let color = "red";', 'let size = 2;'),
      py: lines('color = "red"', 'size = 2'),
      expected: graph({ color: 'red', size: 2 }),
      hint: 'Draw one variable and one value for each line, and connect each variable to its own value.',
      hints: [
        {
          variable: 'size',
          value: '2',
          message: 'The value 2 is a number, not a string. Do not put quotes around numbers.',
        },
      ],
      coach: [
        {
          text: 'Two lines make two variables, each with its own value. Start with color: add a variable block and name it color.',
          target: 'add-variable',
          done: { variable: true, name: 'color' },
        },
        {
          text: 'Add a primitive block and type <code>"red"</code>, quotes included. Quotes make it a <strong>string</strong>, a piece of text. The block\'s label shows the kind of value it read.',
          target: 'add-primitive',
          done: { primitive: true, text: '"red"' },
        },
        {
          text: 'Connect color to "red".',
          target: 'variable-dot',
          done: { arrow: true, from: 'color', to: '"red"' },
        },
        {
          text: 'Now draw size and its value, 2, the same way. Drag blocks wherever you like: where they sit does not matter, only what the arrows connect.',
          target: 'canvas',
          done: { arrow: true, from: 'size', to: '2' },
        },
        {
          text: 'When you are stuck, <strong>Hint</strong> gives a nudge without giving the answer away. Try it now.',
          target: 'hint',
          done: { hint: true },
        },
        {
          text: 'Tap <strong>Check</strong>.',
          target: 'check',
          done: { passed: true },
        },
        {
          text: 'Read the lesson, then tap <strong>Next problem</strong>.',
          target: 'next',
          done: { end: true },
        },
      ],
      about:
        'Each assignment points its own variable at its own value. Values come in kinds: a string is text in quotes, and a number has no quotes.',
      debrief: [
        {
          html: '<p>Each line makes one variable and one value. <code>"red"</code> is a <strong>string</strong>: the quotes mark it as text. <code>2</code> has no quotes, so it is a <strong>number</strong>.</p>',
        },
        {
          diagram: graph({ color: 'red', size: 2 }),
          caption: 'Two variables, each with an arrow to its own value.',
          verdict: 'correct',
        },
        {
          diagram: graph({ color: 'red', size: '2' }),
          caption: 'Not correct: 2 has no quotes in the code, so it is a number, not a string.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> the blocks in any position. The checker looks only at which arrows connect which names to which values.</p>',
        },
        {
          html: '<p>Quotes are also how you tell a value from a name. Without them, <code>red</code> in the code would mean a variable named red, not the text "red".</p>',
        },
      ],
    }),
    draw({
      title: 'Fixing a picture',
      js: 'let speed = 6;',
      py: 'speed = 6',
      start: withGarbage(graph({ speed: 9 }), 6),
      expected: graph({ speed: 6 }),
      hint: "speed's arrow points at the wrong value. Delete that arrow and draw a new one.",
      hints: [
        {
          variable: 'speed',
          value: 9,
          message: 'speed refers to 6 in the code, not 9. Move its arrow to the 6.',
        },
      ],
      coach: [
        {
          text: 'This picture was started for you, and it has a mistake. Tap <strong>Check</strong> to find it.',
          target: 'check',
          done: { checked: true },
        },
        {
          text: 'The checker highlights what is wrong: the code points speed at 6, but the picture points it at 9. Select the wrong part: tap the arrow from speed, or the 9 itself.',
          target: 'canvas',
          done: { selected: true },
        },
        {
          text: 'Tap the trash can to delete what you selected. On a keyboard, Backspace or Delete works too. Deleting a block deletes its arrows as well.',
          target: 'delete',
          done: { noArrowTo: '9' },
        },
        {
          text: 'Now connect speed to the 6.',
          target: 'variable-dot',
          done: { arrow: true, from: 'speed', to: '6' },
        },
        {
          text: 'If the 9 is still there, nothing points at it, so nothing can ever use it again and the checker ignores it. Delete it or leave it, then tap <strong>Check</strong>. If a picture ever gets too tangled, <strong>Reset</strong> puts it back the way the puzzle started.',
          target: 'check',
          done: { passed: true },
        },
        {
          text: 'Next comes the other kind of puzzle. Tap <strong>Next problem</strong>.',
          target: 'next',
          done: { end: true },
        },
      ],
      about:
        'The picture shows what memory looks like after the code runs: each variable with an arrow to the value it refers to. A value with nothing pointing to it does not matter.',
      debrief: [
        {
          html: {
            js: '<p><code>let speed = 6;</code> points speed at 6, so the arrow had to move from 9 to 6.</p>',
            py: '<p><code>speed = 6</code> points speed at 6, so the arrow had to move from 9 to 6.</p>',
          },
        },
        {
          diagram: graph({ speed: 6 }),
          caption: 'speed refers to 6.',
          verdict: 'correct',
        },
        {
          diagram: withGarbage(graph({ speed: 6 }), 9),
          caption: 'Also correct: the 9 left behind with nothing pointing to it.',
          verdict: 'correct',
        },
        {
          diagram: graph({ speed: 9 }),
          caption: 'Not correct: this is the picture you started with.',
          verdict: 'incorrect',
        },
        {
          html: '<p>A value that nothing refers to can never be used again, so the checker ignores it. The language reclaims that memory on its own, which is called garbage collection.</p>',
        },
      ],
    }),
    write({
      title: 'Code for a picture',
      js: 'let lives = 5;',
      py: 'lives = 5',
      expected: graph({ lives: 5 }),
      hint: {
        js: 'Write let, the variable name, =, and the value.',
        py: 'Write the variable name, =, and the value.',
      },
      hints: [
        {
          variable: 'lives',
          value: '5',
          message: 'The value 5 is a number, not a string. Do not put quotes around numbers.',
        },
      ],
      tip: {
        js: '<p><code>let</code> creates a new variable. Write it the first time a name appears.</p>',
        py: '<p>In Python, assigning to a name for the first time creates the variable.</p>',
      },
      coach: [
        {
          text: 'Now the other way around: here is a picture of memory, and you write the code that builds it.',
          target: 'picture',
          done: { read: true },
        },
        {
          text: {
            js: 'In the editor, write one line that creates lives and points it at 5: <code>let</code>, the name, <code>=</code>, and the value.',
            py: 'In the editor, write one line that points lives at 5: the name, <code>=</code>, and the value.',
          },
          target: 'code',
          done: { typed: true, text: 'lives = 5' },
        },
        {
          text: 'Tap <strong>Check</strong>. Your code runs, and the game compares the memory it leaves with the picture. If you are ever completely stuck, <strong>Answer</strong> shows a solution, but the puzzle is not marked solved.',
          target: 'check',
          done: { passed: true },
        },
        {
          text: 'Read the lesson, then tap <strong>Next problem</strong>.',
          target: 'next',
          done: { end: true },
        },
      ],
      about:
        'Code builds the picture. One assignment makes a variable, a value, and the arrow between them.',
      debrief: [
        {
          html: {
            js: '<p><code>let lives = 5;</code> builds exactly the picture: a variable named lives, the number 5, and an arrow from one to the other.</p>',
            py: '<p><code>lives = 5</code> builds exactly the picture: a variable named lives, the number 5, and an arrow from one to the other.</p>',
          },
        },
        {
          diagram: graph({ lives: 5 }),
          caption: 'The memory your line builds.',
          verdict: 'correct',
        },
        {
          diagram: graph({ lives: '5' }),
          caption: {
            js: 'Not correct: let lives = "5"; builds a string, not a number.',
            py: 'Not correct: lives = "5" builds a string, not a number.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Drawing puzzles go from code to a picture, and writing puzzles go from a picture to code. Both test the same idea: knowing what memory looks like after code runs.</p>',
        },
      ],
    }),
    write({
      title: 'Adding to existing code',
      given: { js: 'let apples = 4;', py: 'apples = 4' },
      js: 'let pears = 2;',
      py: 'pears = 2',
      expected: graph({ apples: 4, pears: 2 }),
      hint: 'apples already exists. Write one line for pears.',
      hints: [
        {
          variable: 'pears',
          value: '2',
          message: 'The value 2 is a number, not a string. Do not put quotes around numbers.',
        },
      ],
      coach: [
        {
          text: 'Some puzzles start with code already in place. It runs before yours, so apples already exists and already refers to 4.',
          target: 'given',
          done: { read: true },
        },
        {
          text: {
            js: 'Write one line that creates pears. Leave apples alone: declaring it again with <code>let</code> is an error.',
            py: 'Write one line for pears. apples is already done.',
          },
          target: 'code',
          done: { typed: true, text: 'pears = 2' },
        },
        {
          text: 'Tap <strong>Check</strong>.',
          target: 'check',
          done: { passed: true },
        },
        {
          text: 'You know the basics now: variables, values, the arrows between them, and both kinds of puzzle. Level 1 builds on them. Tap <strong>Next problem</strong> to start it.',
          target: 'next',
          done: { end: true },
        },
      ],
      about:
        'Code that is already in place has already made its variables. Add only what the picture still needs.',
      debrief: [
        {
          html: {
            js: '<p>The starter line made apples. Your line, <code>let pears = 2;</code>, adds pears and its value, which completes the picture.</p>',
            py: '<p>The starter line made apples. Your line, <code>pears = 2</code>, adds pears and its value, which completes the picture.</p>',
          },
        },
        {
          diagram: graph({ apples: 4, pears: 2 }),
          caption: 'apples from the starter code, pears from yours.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> writing <code>let apples = 4;</code> again. <code>let</code> declares a new variable, and apples was already declared, so JavaScript stops with an error.</p>',
            py: '<p><strong>Also correct:</strong> writing <code>apples = 4</code> again. It points apples at 4 once more, which changes nothing, but it is not needed.</p>',
          },
        },
      ],
    }),
  ],
  [],
)
