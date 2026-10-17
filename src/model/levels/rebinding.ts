import { dict, graph, list, ref, scalar, withGarbage } from '../builders'
import {
  after,
  before,
  callsMethod,
  combines,
  preserve,
  runtime,
  sameObject,
} from '../process'
import type { UnnumberedLevel } from '../types'
import { draw, L, level, lines, write } from './common'

export const rebindingLevel: UnnumberedLevel = level(
  'rebinding',
  L('Building New Values', 'Building New Values'),
  L(
    'Strings never change: joining with + and methods like toUpperCase() and toLowerCase() build a new string. Growing an array with push changes it in place; combining with concat builds a new array and leaves the old one alone. Setting a variable to null drops one reference; a value nothing refers to is gone for good.',
    'Strings never change: joining with + and methods like upper() and lower() build a new string. Growing a list with append changes it in place; combining with + builds a new list and leaves the old one alone. Setting a variable to None drops one reference; a value nothing refers to is gone for good.',
  ),
  [
    draw({
      title: 'Building a new string',
      js: lines('let s = "hi";', 'let t = s;', 's = s + "!";'),
      py: lines('s = "hi"', 't = s', 's = s + "!"'),
      expected: graph({ s: 'hi!', t: 'hi' }),
      hint: 'Adding "!" builds a new string. Trace which variable is reassigned to it.',
      hints: [
        {
          variable: 't',
          value: 'hi!',
          message:
            'The value "hi!" for t is not correct. s = s + "!" builds a new string and moves only s\'s arrow. The string "hi" that t refers to cannot change.',
        },
        {
          variable: 's',
          value: 'hi',
          message:
            'The value "hi" for s is not correct. s = s + "!" builds "hi!" and moves s\'s arrow to that new string.',
        },
        {
          variable: 's',
          value: '!',
          message:
            'The value "!" for s is not correct. s = s + "!" joins the old value of s, "hi", with "!", producing "hi!".',
        },
      ],
      tip: '<p>Adding with <code>+</code> joins two strings end to end. This is called <strong>concatenation</strong>, and it produces a new string.</p>',
      teaches: ['string.concat'],
      about:
        'A string cannot be changed in place. Adding to a string builds a new string, and reassigning moves only that one variable\'s arrow to it.',
      debrief: [
        {
          html: {
            js: '<p>After <code>let t = s;</code> both variables refer to <code>"hi"</code>. Then <code>s = s + "!";</code> does not change that string. It builds a brand new string, <code>"hi!"</code>, and moves only <code>s</code>\'s arrow to it, so <code>t</code> still refers to <code>"hi"</code>.</p>',
            py: '<p>After <code>t = s</code> both variables refer to <code>"hi"</code>. Then <code>s = s + "!"</code> does not change that string. It builds a brand new string, <code>"hi!"</code>, and moves only <code>s</code>\'s arrow to it, so <code>t</code> still refers to <code>"hi"</code>.</p>',
          },
        },
        {
          diagram: graph({ s: 'hi!', t: 'hi' }),
          caption: 'Correct: s refers to the new "hi!", and t still refers to "hi".',
          verdict: 'correct',
        },
        {
          diagram: graph({ s: 'hi!', t: 'hi!' }),
          caption: 'Not correct: this is what would happen if strings changed in place.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving a second "hi" on the canvas with nothing referring to it, if you first drew s and t with separate strings. As with numbers, unreferenced values are garbage-collected.</p>',
        },
        {
          diagram: withGarbage(graph({ s: 'hi!', t: 'hi' }), 'hi'),
          caption: 'Also correct: an old "hi" left behind with nothing pointing to it.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>s += "!";</code> is a shorter way to write the last line. It also builds a new string and moves only s\'s arrow.</p>',
            py: '<p><strong>Also correct:</strong> <code>s += "!"</code> is a shorter way to write the last line. It also builds a new string and moves only s\'s arrow.</p>',
          },
        },
        {
          html: {
            js: '<p>Later levels introduce arrays and objects, which can be changed in place. A change made through one name is then seen through every name that shares the array or object. Strings never work that way.</p>',
            py: '<p>Later levels introduce lists and dictionaries, which can be changed in place. A change made through one name is then seen through every name that shares the list or dictionary. Strings never work that way.</p>',
          },
        },
      ],
    }),
    write({
      title: 'A full name',
      given: {
        js: lines('let first = "Ada";', 'let last = "Lovelace";'),
        ts: lines('let first: string = "Ada";', 'let last: string = "Lovelace";'),
        py: lines('first = "Ada"', 'last = "Lovelace"'),
      },
      js: 'let full = first + " " + last;',
      ts: 'let full: string = first + " " + last;',
      py: 'full = first + " " + last',
      expected: graph({ first: 'Ada', last: 'Lovelace', full: 'Ada Lovelace' }),
      hint: {
        js: 'Declare full by joining first, a space " ", and last.',
        py: 'Assign full by joining first, a space " ", and last.',
      },
      hints: [
        {
          variable: 'full',
          value: 'AdaLovelace',
          message: 'Remember to include a space " " between first and last.',
        },
      ],
      process: {
        hidden: [
          {
            given: {
              js: lines('let first = "Grace";', 'let last = "Hopper";'),
              ts: lines('let first: string = "Grace";', 'let last: string = "Hopper";'),
              py: lines('first = "Grace"', 'last = "Hopper"'),
            },
            expected: graph({ first: 'Grace', last: 'Hopper', full: 'Grace Hopper' }),
          },
        ],
      },
      reliesOn: ['string.concat'],
      about:
        'Combining strings with + builds a new string value. It reads the values of existing variables without changing them.',
      debrief: [
        {
          html: {
            js: '<p><code>let full = first + " " + last;</code> joins the three strings and points <code>full</code> at the new string <code>"Ada Lovelace"</code>. Neither <code>first</code> nor <code>last</code> is changed.</p>',
            py: '<p><code>full = first + " " + last</code> joins the three strings and points <code>full</code> at the new string <code>"Ada Lovelace"</code>. Neither <code>first</code> nor <code>last</code> is changed.</p>',
          },
        },
        {
          diagram: graph({ first: 'Ada', last: 'Lovelace', full: 'Ada Lovelace' }),
          caption: 'first and last unchanged, full refers to the joined string.',
          verdict: 'correct',
        },
        {
          diagram: graph({ first: 'Ada', last: 'Lovelace', full: 'AdaLovelace' }),
          caption: 'Not correct: missing the space between first and last.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> a template literal, <code>let full = `${first} ${last}`;</code>, builds the same new string from the same parts.</p>',
            py: '<p><strong>Also correct:</strong> an f-string, <code>full = f"{first} {last}"</code>, builds the same new string from the same parts.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let full = "Ada Lovelace";</code> produces the right picture for these names, but retypes the result. The checker also runs your code with other starting names, and a retyped result is wrong for them.</p>',
            py: '<p><strong>Not accepted:</strong> <code>full = "Ada Lovelace"</code> produces the right picture for these names, but retypes the result. The checker also runs your code with other starting names, and a retyped result is wrong for them.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Upper and lower',
      given: { js: 'let s = "Hi";', ts: 'let s: string = "Hi";', py: 's = "Hi"' },
      js: lines('let lo = s.toLowerCase();', 'let up = s.toUpperCase();'),
      ts: lines('let lo: string = s.toLowerCase();', 'let up: string = s.toUpperCase();'),
      py: lines('lo = s.lower()', 'up = s.upper()'),
      expected: graph({ s: 'Hi', lo: 'hi', up: 'HI' }),
      teaches: ['string.toUpperCase', 'string.toLowerCase'],
      tip: {
        js: '<p>String methods such as <code>toUpperCase()</code> and <code>toLowerCase()</code> return a new string. They never change the string they are called on.</p>',
        py: '<p>String methods such as <code>upper()</code> and <code>lower()</code> return a new string. They never change the string they are called on.</p>',
      },
      hint: {
        js: 'Declare lo as s.toLowerCase() and up as s.toUpperCase(); s stays "Hi".',
        py: 'Set lo to s.lower() and up to s.upper(); s stays "Hi".',
      },
      hints: [
        {
          variable: 's',
          value: ['hi', 'HI'],
          message:
            's should still refer to "Hi". Give each new string its own variable instead of reassigning s.',
        },
        {
          variable: 'lo',
          value: 'Hi',
          message:
            'lo should refer to "hi". Calling a string method does not change s; it returns a new string, and that result is what lo should refer to.',
        },
        {
          variable: 'up',
          value: 'Hi',
          message:
            'up should refer to "HI". Calling a string method does not change s; it returns a new string, and that result is what up should refer to.',
        },
      ],
      about: {
        js: 'Transform a string into lowercase and uppercase versions. Because strings are immutable, each method call builds a new string and leaves s untouched. The special constraint says lo and up must be built using string methods so they follow whatever string s starts with.',
        py: 'Transform a string into lowercase and uppercase versions. Because strings are immutable, each method call builds a new string and leaves s untouched. The special constraint says lo and up must be built using string methods so they follow whatever string s starts with.',
      },
      constraints: [
        {
          rule:
            'The boss says that lo and up must be built using string methods on s, so if another programmer updates what s starts with, lo and up still become lowercase and uppercase versions of that string.',
          cases: [
            {
              change: 's starts as "Yo"',
              given: { js: 'let s = "Yo";', ts: 'let s: string = "Yo";', py: 's = "Yo"' },
              expected: graph({ s: 'Yo', lo: 'yo', up: 'YO' }),
            },
          ],
        },
      ],
      process: {
        source: [
          callsMethod('lo', 's', { javascript: 'toLowerCase', python: 'lower' }),
          callsMethod('up', 's', { javascript: 'toUpperCase', python: 'upper' }),
        ],
      },
      debrief: [
        {
          html: {
            js: '<p><code>s.toLowerCase()</code> builds a new string <code>"hi"</code> for <code>lo</code>, and <code>s.toUpperCase()</code> builds <code>"HI"</code> for <code>up</code>. The original string <code>"Hi"</code> referenced by <code>s</code> is unchanged.</p>',
            py: '<p><code>s.lower()</code> builds a new string <code>"hi"</code> for <code>lo</code>, and <code>s.upper()</code> builds <code>"HI"</code> for <code>up</code>. The original string <code>"Hi"</code> referenced by <code>s</code> is unchanged.</p>',
          },
        },
        {
          diagram: graph({ s: 'Hi', lo: 'hi', up: 'HI' }),
          caption: 'Correct: lo and up refer to new strings; s remains "Hi".',
          verdict: 'correct',
        },
        {
          diagram: graph({ s: 'HI', lo: 'hi', up: 'HI' }),
          caption: 'Not correct: this is what would happen if string methods changed s in place.',
          verdict: 'incorrect',
        },
        {
          html: '<p>No string method in either language ever modifies an existing string in place. Any operation that transforms a string produces a new value.</p>',
        },
        {
          html: '<p>This is why sharing one string or keeping two separate equal strings never makes a difference: nothing can change a string in place, so no program can tell the two pictures apart.</p>',
        },
        {
          html: '<p><strong>Also correct:</strong> writing the two lines in the other order. Neither call changes <code>s</code>, so each one starts from <code>"Hi"</code>.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> typing literals like <code>let lo = "hi"; let up = "HI";</code>. The checker reruns your code from other starting strings to make sure you called the methods on <code>s</code>.</p>',
            py: '<p><strong>Not accepted:</strong> typing literals like <code>lo = "hi"</code> and <code>up = "HI"</code>. The checker reruns your code from other starting strings to make sure you called the methods on <code>s</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'Building a new array', py: 'Building a new list' },
      js: lines('let x = [1];', 'let y = x;', 'x = x.concat([2]);'),
      py: lines('x = [1]', 'y = x', 'x = x + [2]'),
      expected: graph({ x: ref('new'), y: ref('old') }, { old: list(1), new: list(1, 2) }),
      teaches: ['array.concat'],
      hint: {
        js: 'After x = x.concat([2]), x points at a new array while y still refers to [1].',
        py: 'After x = x + [2], x points at a new list while y still refers to [1].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should not share a container. Combining builds a new container for x and leaves the original alone, so y still refers to [1].',
        },
      ],
      about: {
        js: "Combining arrays with concat creates a brand-new array and leaves the original untouched. Assigning the result back to x moves only x's arrow, while y remains pointing at the original array.",
        py: "Combining lists with + creates a brand-new list and leaves the original untouched. Assigning the result back to x moves only x's arrow, while y remains pointing at the original list.",
      },
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> creates an alias: both variables refer to <code>[1]</code>. When <code>x = x.concat([2]);</code> runs, <code>concat</code> does not modify <code>[1]</code> in place. It constructs a new array <code>[1, 2]</code> and rebinds <code>x</code> to it. <code>y</code> continues to refer to <code>[1]</code>.</p>',
            py: '<p><code>y = x</code> creates an alias: both variables refer to <code>[1]</code>. When <code>x = x + [2]</code> runs, <code>+</code> does not modify <code>[1]</code> in place. It constructs a new list <code>[1, 2]</code> and rebinds <code>x</code> to it. <code>y</code> continues to refer to <code>[1]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('new'), y: ref('old') }, { old: list(1), new: list(1, 2) }),
          caption: {
            js: 'Correct: x points to the new array [1, 2]; y still refers to [1].',
            py: 'Correct: x points to the new list [1, 2]; y still refers to [1].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(1, 2) }),
          caption: {
            js: 'Not correct: this is what x.push(2) would do. concat builds a new array instead of changing the shared one.',
            py: 'Not correct: this is what x.append(2) would do. + builds a new list instead of changing the shared one.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Contrast this with <code>x.push(2);</code>, which modifies the array in place so that both <code>x</code> and <code>y</code> see the change. <code>concat</code> builds a new array instead.</p>',
            py: '<p>Contrast this with <code>x.append(2)</code>, which modifies the list in place so that both <code>x</code> and <code>y</code> see the change. <code>+</code> builds a new list instead.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Combine without changing the original',
      given: {
        js: lines('let x = [1, 2];', 'let y = x;'),
        ts: lines('let x: number[] = [1, 2];', 'let y: number[] = x;'),
        py: lines('x = [1, 2]', 'y = x'),
      },
      js: 'y = y.concat([3, 4]);',
      py: 'y = y + [3, 4]',
      expected: graph({ x: ref('x'), y: ref('y') }, { x: list(1, 2), y: list(1, 2, 3, 4) }),
      reliesOn: ['array.concat'],
      hint: {
        js: 'Use y = y.concat([3, 4]) so y gets a new array and x keeps [1, 2].',
        py: 'Use y = y + [3, 4] so y gets a new list and x keeps [1, 2].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should not share a container. Growing the shared container in place changes what x sees too; combining builds a new container for y and leaves x with [1, 2].',
        },
      ],
      about: {
        js: 'Combine an array with additional elements to produce a larger array without mutating the original. Using concat builds a new array and leaves the array referenced by x unchanged. The special constraint says y must be built by combining y so it follows whatever x starts with.',
        py: 'Combine a list with additional elements to produce a larger list without mutating the original. Using + builds a new list and leaves the list referenced by x unchanged. The special constraint says y must be built by combining y so it follows whatever x starts with.',
      },
      constraints: [
        {
          rule: {
            js:
              'The boss says that y must be built by combining y with [3, 4], so if another programmer updates what x starts with, y still receives the combined items and x stays untouched.',
            py:
              'The boss says that y must be built by combining y with [3, 4], so if another programmer updates what x starts with, y still receives the combined items and x stays untouched.',
          },
          cases: [
            {
              change: 'x starts as [5]',
              given: {
                js: lines('let x = [5];', 'let y = x;'),
                ts: lines('let x: number[] = [5];', 'let y: number[] = x;'),
                py: lines('x = [5]', 'y = x'),
              },
              expected: graph({ x: ref('x'), y: ref('y') }, { x: list(5), y: list(5, 3, 4) }),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(
          sameObject(
            before('x'),
            after('x'),
            'Keep "x" referring to the container it started with, and build the new one for "y".',
          ),
        ),
        source: [combines('y', 'y')],
      },
      debrief: [
        {
          html: {
            js: '<p><code>y = y.concat([3, 4]);</code> evaluates <code>y.concat([3, 4])</code>, building a brand-new array <code>[1, 2, 3, 4]</code>, and points <code>y</code> at it. The original array <code>[1, 2]</code> is untouched, so <code>x</code> still refers to it.</p>',
            py: '<p><code>y = y + [3, 4]</code> evaluates <code>y + [3, 4]</code>, building a brand-new list <code>[1, 2, 3, 4]</code>, and points <code>y</code> at it. The original list <code>[1, 2]</code> is untouched, so <code>x</code> still refers to it.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(1, 2), y: list(1, 2, 3, 4) }),
          caption: {
            js: 'Correct: x keeps [1, 2]; y points to the new array [1, 2, 3, 4].',
            py: 'Correct: x keeps [1, 2]; y points to the new list [1, 2, 3, 4].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(1, 2, 3, 4) }),
          caption: {
            js: 'Not correct: this is what growing the shared array in place with push would do; x would see the change too.',
            py: 'Not correct: this is what growing the shared list in place with append would do; x would see the change too.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>y.push(3, 4);</code> changes the shared array in place, so <code>x</code> would see <code>[1, 2, 3, 4]</code> too. Typing <code>y = [1, 2, 3, 4];</code> builds the right picture here, but the checker reruns your code from other starting arrays. <code>y = [...y, 3, 4];</code> also builds a new array, but this puzzle practices <code>concat</code>, so the checker asks for it.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y.extend([3, 4])</code> changes the shared list in place, so <code>x</code> would see <code>[1, 2, 3, 4]</code> too. Typing <code>y = [1, 2, 3, 4]</code> builds the right picture here, but the checker reruns your code from other starting lists.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'In place, then new',
      js: lines('let x = [10];', 'let y = x;', 'y.push(20);', 'y = y.concat([30]);'),
      py: lines('x = [10]', 'y = x', 'y.append(20)', 'y = y + [30]'),
      expected: graph({ x: ref('x'), y: ref('y') }, { x: list(10, 20), y: list(10, 20, 30) }),
      hint: {
        js: 'Growing y in place changes the shared array to [10, 20]; combining with [30] gives y a new array [10, 20, 30] and leaves x pointing at [10, 20].',
        py: 'Growing y in place changes the shared list to [10, 20]; combining with [30] gives y a new list [10, 20, 30] and leaves x pointing at [10, 20].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            "x and y should not share a container. Growing in place changed the shared container, but combining then built a new one for y and moved only y's arrow, so x still refers to [10, 20].",
        },
      ],
      about: {
        js: 'push changes an array in place, so every alias sees the change; concat builds a new array, so only the variable it is assigned to moves to it.',
        py: 'append changes a list in place, so every alias sees the change; + builds a new list, so only the variable it is assigned to moves to it.',
      },
      debrief: [
        {
          html: {
            js: '<p>Follow the lines in order:</p><ol><li><code>y.push(20);</code> mutates the shared array in place, so both <code>x</code> and <code>y</code> see <code>[10, 20]</code>.</li><li><code>y = y.concat([30]);</code> builds a brand-new array <code>[10, 20, 30]</code> and rebinds only <code>y</code>.</li></ol><p><code>x</code> still refers to the original array, which holds <code>[10, 20]</code>.</p>',
            py: '<p>Follow the lines in order:</p><ol><li><code>y.append(20)</code> mutates the shared list in place, so both <code>x</code> and <code>y</code> see <code>[10, 20]</code>.</li><li><code>y = y + [30]</code> builds a brand-new list <code>[10, 20, 30]</code> and rebinds only <code>y</code>.</li></ol><p><code>x</code> still refers to the original list, which holds <code>[10, 20]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(10, 20), y: list(10, 20, 30) }),
          caption: {
            js: 'Correct: x keeps [10, 20]; y refers to the new array [10, 20, 30].',
            py: 'Correct: x keeps [10, 20]; y refers to the new list [10, 20, 30].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(10, 20, 30) }),
          caption: {
            js: 'Not correct: this is what would happen if concat changed the shared array in place like push.',
            py: 'Not correct: this is what would happen if + changed the shared list in place like append.',
          },
          verdict: 'incorrect',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(10), y: list(10, 20, 30) }),
          caption: {
            js: 'Not correct: y.push(20) ran while x and y still shared one array, so x sees the 20.',
            py: 'Not correct: y.append(20) ran while x and y still shared one list, so x sees the 20.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Once a variable is rebound to a new container, later operations on that variable cannot affect the old container.</p>',
        },
      ],
    }),
    write({
      title: 'Mutate, then rebind',
      given: {
        js: lines('let x = [1];', 'let y = x;'),
        ts: lines('let x: number[] = [1];', 'let y: number[] = x;'),
        py: lines('x = [1]', 'y = x'),
      },
      js: lines('x.push(2);', 'x = [9];'),
      py: lines('x.append(2)', 'x = [9]'),
      expected: graph({ x: ref('new'), y: ref('old') }, { old: list(1, 2), new: list(9) }),
      hint: {
        js: 'Grow x in place to [1, 2] with push(2), which y sees too, then repoint x to a new array [9]; y keeps [1, 2].',
        py: 'Grow x in place to [1, 2] with append(2), which y sees too, then repoint x to a new list [9]; y keeps [1, 2].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            "x and y should not share a container. Reassigning x to a new [9] moves only x's arrow; y stays with the original, now [1, 2].",
        },
      ],
      process: { runtime: runtime(sameObject(before('x'), after('y'))) },
      about: {
        js: 'Changing an array in place is seen through every alias, but reassigning a name afterward repoints only that name, so the alias stays with the changed original.',
        py: 'Changing a list in place is seen through every alias, but reassigning a name afterward repoints only that name, so the alias stays with the changed original.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>x.push(2);</code> mutates the array in place, so <code>y</code> sees <code>[1, 2]</code>. Then <code>x = [9];</code> builds a new array and rebinds <code>x</code>. <code>y</code> still points to the original array <code>[1, 2]</code>.</p>',
            py: '<p><code>x.append(2)</code> mutates the list in place, so <code>y</code> sees <code>[1, 2]</code>. Then <code>x = [9]</code> builds a new list and rebinds <code>x</code>. <code>y</code> still points to the original list <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('new'), y: ref('old') }, { old: list(1, 2), new: list(9) }),
          caption: {
            js: 'Correct: y keeps the modified array [1, 2]; x refers to [9].',
            py: 'Correct: y keeps the modified list [1, 2]; x refers to [9].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(9) }),
          caption: {
            js: 'Not correct: x = [9] repoints only x. It does not replace the array y refers to.',
            py: 'Not correct: x = [9] repoints only x. It does not replace the list y refers to.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>y.push(2);</code> instead of <code>x.push(2);</code>, since both names refer to the starter array. Pushing through <code>y</code> can even come after <code>x = [9];</code>, because by then <code>y</code> is the only name left on the original.</p>',
            py: '<p><strong>Also correct:</strong> <code>y.append(2)</code> instead of <code>x.append(2)</code>, since both names refer to the starter list. Appending through <code>y</code> can even come after <code>x = [9]</code>, because by then <code>y</code> is the only name left on the original.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = [9];</code> followed by <code>y = [1, 2];</code>. The picture matches, but the checker requires <code>y</code> to end up on the same array that <code>x</code> referred to at the start.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = [9]</code> followed by <code>y = [1, 2]</code>. The picture matches, but the checker requires <code>y</code> to end up on the same list that <code>x</code> referred to at the start.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'A string taken from an array', py: 'A string taken from a list' },
      js: lines('let words = ["hi"];', 'let w = words[0];', 'w = w + "!";'),
      py: lines('words = ["hi"]', 'w = words[0]', 'w = w + "!"'),
      expected: graph({ words: ref('words'), w: 'hi!' }, { words: list('hi') }),
      reliesOn: ['string.concat'],
      hint: {
        js: 'w gets the string from words[0]; adding "!" builds a new string for w, leaving words[0] unchanged.',
        py: 'w gets the string from words[0]; adding "!" builds a new string for w, leaving words[0] unchanged.',
      },
      hints: [
        {
          variable: 'words',
          value: 'hi!',
          message:
            'words[0] should still refer to "hi". w refers to the string, not to the slot, so reassigning w moves only w\'s arrow.',
        },
      ],
      about: {
        js: 'Assigning a variable from an array slot points the variable at the value in that slot, not at the slot itself, so reassigning the variable later leaves the slot alone.',
        py: 'Assigning a variable from a list slot points the variable at the value in that slot, not at the slot itself, so reassigning the variable later leaves the slot alone.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let w = words[0];</code> points <code>w</code> at <code>"hi"</code>, the string in slot 0. It does not link <code>w</code> to the slot. When <code>w = w + "!";</code> runs, concatenation builds a new string <code>"hi!"</code> and moves only <code>w</code>\'s arrow, so <code>words[0]</code> still points to <code>"hi"</code>.</p>',
            py: '<p><code>w = words[0]</code> points <code>w</code> at <code>"hi"</code>, the string in slot 0. It does not link <code>w</code> to the slot. When <code>w = w + "!"</code> runs, concatenation builds a new string <code>"hi!"</code> and moves only <code>w</code>\'s arrow, so <code>words[0]</code> still points to <code>"hi"</code>.</p>',
          },
        },
        {
          diagram: graph({ words: ref('words'), w: 'hi!' }, { words: list('hi') }),
          caption: 'Correct: w refers to "hi!", while words[0] remains "hi".',
          verdict: 'correct',
        },
        {
          diagram: graph({ words: ref('words'), w: 'hi!' }, { words: list('hi!') }),
          caption: {
            js: 'Not correct: reassigning w does not update the slot in the array.',
            py: 'Not correct: reassigning w does not update the slot in the list.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> after the second line, <code>w</code> and <code>words[0]</code> may share one <code>"hi"</code> or refer to separate ones. If you drew them separate, <code>w</code>\'s old <code>"hi"</code> is left with nothing pointing to it, and the checker ignores it.</p>',
        },
        {
          diagram: withGarbage(graph({ words: ref('words'), w: 'hi!' }, { words: list('hi') }), 'hi'),
          caption: 'Also correct: w\'s old "hi" left behind as garbage.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p>Only assigning to the slot itself, as in <code>words[0] = w;</code>, would change what the array holds.</p>',
            py: '<p>Only assigning to the slot itself, as in <code>words[0] = w</code>, would change what the list holds.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Dropping a reference',
      js: lines('let x = [1];', 'let y = x;', 'x = null;'),
      py: lines('x = [1]', 'y = x', 'x = None'),
      expected: graph({ x: null, y: ref('y') }, { y: list(1) }),
      teaches: ['reference.drop'],
      hint: {
        js: 'Assigning x = null repoints only x; y keeps referring to [1].',
        py: 'Assigning x = None repoints only x; y keeps referring to [1].',
      },
      about: {
        js: "Setting a variable to null moves only that variable's arrow. As long as another variable still refers to the array, the array remains in memory.",
        py: "Setting a variable to None moves only that variable's arrow. As long as another variable still refers to the list, the list remains in memory.",
      },
      debrief: [
        {
          html: {
            js: '<p><code>x = null;</code> removes <code>x</code>\'s reference to <code>[1]</code>. It does not destroy the array or affect <code>y</code>. Because <code>y</code> still refers to <code>[1]</code>, the array stays alive in memory.</p>',
            py: '<p><code>x = None</code> removes <code>x</code>\'s reference to <code>[1]</code>. It does not destroy the list or affect <code>y</code>. Because <code>y</code> still refers to <code>[1]</code>, the list stays alive in memory.</p>',
          },
        },
        {
          diagram: graph({ x: null, y: ref('y') }, { y: list(1) }),
          caption: {
            js: 'Correct: x is null, while y still refers to [1].',
            py: 'Correct: x is None, while y still refers to [1].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: null, y: null }),
          caption: {
            js: 'Not correct: this is what would happen if x = null destroyed the array. Dropping x leaves y alone.',
            py: 'Not correct: this is what would happen if x = None destroyed the list. Dropping x leaves y alone.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>A value is only reclaimed by garbage collection when <em>no</em> references to it remain. As long as at least one variable or container slot points to it, it survives.</p>',
        },
      ],
    }),
    write({
      title: 'Nobody points here',
      given: {
        js: lines('let x = { n: 1 };', 'let y = x;'),
        ts: lines('let x: { n: number } | null = { n: 1 };', 'let y: { n: number } | null = x;'),
        py: lines('x = {"n": 1}', 'y = x'),
      },
      js: lines('x = null;', 'y = null;'),
      py: lines('x = None', 'y = None'),
      expected: graph({ x: null, y: null }),
      reliesOn: ['reference.drop'],
      hint: {
        js: 'Reassign x to null, then y to null.',
        py: 'Reassign x to None, then y to None.',
      },
      about: {
        js: 'When all variables referring to an object are reassigned to null, no arrows point to that object anymore. It becomes unreachable garbage and can be collected.',
        py: 'When all variables referring to a dictionary are reassigned to None, no arrows point to that dictionary anymore. It becomes unreachable garbage and can be collected.',
      },
      debrief: [
        {
          html: {
            js: '<p>Setting <code>x = null;</code> drops the first reference to the object. Setting <code>y = null;</code> drops the second. With no remaining references pointing to <code>{ n: 1 }</code>, the object is unreachable.</p>',
            py: '<p>Setting <code>x = None</code> drops the first reference to the dictionary. Setting <code>y = None</code> drops the second. With no remaining references pointing to <code>{"n": 1}</code>, the dictionary is unreachable.</p>',
          },
        },
        {
          diagram: graph({ x: null, y: null }),
          caption: {
            js: 'Correct: both x and y are null.',
            py: 'Correct: both x and y are None.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: null, y: ref('y') }, { y: dict({ n: 1 }) }),
          caption: {
            js: 'Not correct: dropping only x leaves y still pointing to the object.',
            py: 'Not correct: dropping only x leaves y still pointing to the dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> dropping <code>y</code> before <code>x</code>, or both at once with <code>x = y = null;</code>.</p>',
            py: '<p><strong>Also correct:</strong> dropping <code>y</code> before <code>x</code>, or both at once with <code>x = y = None</code>.</p>',
          },
        },
        {
          diagram: graph({ x: null, y: null }, { old: dict({ n: 1 }) }),
          caption: {
            js: 'Also correct: the unreachable object left on the canvas as garbage.',
            py: 'Also correct: the unreachable dictionary left on the canvas as garbage.',
          },
          verdict: 'correct',
        },
        {
          html: '<p>When a value has zero references pointing to it, the program can never access it again. The language automatically reclaims its memory through <strong>garbage collection</strong>.</p>',
        },
      ],
    }),
  ],
  [
    draw({
      title: { js: 'Combine, then grow the new array', py: 'Combine, then grow the new list' },
      js: lines('let x = [1];', 'let y = x;', 'y = y.concat([2]);', 'y.push(3);'),
      py: lines('x = [1]', 'y = x', 'y = y + [2]', 'y.append(3)'),
      expected: graph({ x: ref('x'), y: ref('y') }, { x: list(1), y: list(1, 2, 3) }),
      hint: {
        js: 'After y = y.concat([2]), y points at a new array; growing it to [1, 2, 3] leaves x holding [1].',
        py: 'After y = y + [2], y points at a new list; growing it to [1, 2, 3] leaves x holding [1].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should not share a container. Combining built a new container for y first, so the later growth reaches only y; x still refers to [1].',
        },
      ],
      about: {
        js: 'Combining an array with concat builds a new array and rebinds the variable. Any subsequent in-place mutations like push affect only that new array, leaving the original array untouched.',
        py: 'Combining a list with + builds a new list and rebinds the variable. Any subsequent in-place mutations like append affect only that new list, leaving the original list untouched.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>y = y.concat([2]);</code> builds a brand-new array <code>[1, 2]</code> and rebinds <code>y</code>. From that moment, <code>x</code> and <code>y</code> point to separate arrays. The later <code>y.push(3);</code> mutates only <code>y</code>\'s new array, leaving <code>x</code> referring to <code>[1]</code>.</p>',
            py: '<p><code>y = y + [2]</code> builds a brand-new list <code>[1, 2]</code> and rebinds <code>y</code>. From that moment, <code>x</code> and <code>y</code> point to separate lists. The later <code>y.append(3)</code> mutates only <code>y</code>\'s new list, leaving <code>x</code> referring to <code>[1]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(1), y: list(1, 2, 3) }),
          caption: 'Correct: x retains [1], while y refers to [1, 2, 3].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(1, 2, 3) }),
          caption: {
            js: 'Not correct: concat creates a new array, so x and y do not share [1, 2, 3].',
            py: 'Not correct: + creates a new list, so x and y do not share [1, 2, 3].',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Rebinding breaks the alias. Once <code>y</code> points to a new container, changes made through <code>y</code> can never reach <code>x</code> again. This is the reverse of "In place, then new", where the change in place came first and both names saw it.</p>',
        },
      ],
    }),
    draw({
      title: 'Upper case through an alias',
      js: lines('let s = "ok";', 'let t = s;', 'let u = t;', 't = t.toUpperCase();'),
      py: lines('s = "ok"', 't = s', 'u = t', 't = t.upper()'),
      expected: graph({ s: 'ok', t: 'OK', u: 'ok' }),
      reliesOn: ['string.toUpperCase'],
      hint: {
        js: 'All three names start on "ok". t.toUpperCase() builds a new string, and only t is reassigned to it.',
        py: 'All three names start on "ok". t.upper() builds a new string, and only t is reassigned to it.',
      },
      hints: [
        {
          variable: 's',
          value: 'OK',
          message:
            "s should still refer to \"ok\". Strings never change in place, and reassigning t moves only t's arrow.",
        },
        {
          variable: 'u',
          value: 'OK',
          message:
            'u should still refer to "ok". u = t gave u the string t referred to at that moment; it did not link u to t.',
        },
      ],
      about: {
        js: 'Upper-casing a string through one alias builds a new string for that alias only; every other name keeps the original string.',
        py: 'Upper-casing a string through one alias builds a new string for that alias only; every other name keeps the original string.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let t = s;</code> and <code>let u = t;</code> point all three names at <code>"ok"</code>. When <code>t = t.toUpperCase();</code> runs, it builds a new string <code>"OK"</code> and points only <code>t</code> at it. Strings cannot change in place, and reassigning <code>t</code> never moves another variable\'s arrow, so <code>s</code> and <code>u</code> still refer to <code>"ok"</code>.</p>',
            py: '<p><code>t = s</code> and <code>u = t</code> point all three names at <code>"ok"</code>. When <code>t = t.upper()</code> runs, it builds a new string <code>"OK"</code> and points only <code>t</code> at it. Strings cannot change in place, and reassigning <code>t</code> never moves another variable\'s arrow, so <code>s</code> and <code>u</code> still refer to <code>"ok"</code>.</p>',
          },
        },
        {
          diagram: graph({ s: 'ok', t: 'OK', u: 'ok' }),
          caption: 'Correct: t refers to "OK"; s and u still refer to "ok".',
          verdict: 'correct',
        },
        {
          diagram: graph({ s: 'OK', t: 'OK', u: 'OK' }),
          caption: {
            js: 'Not correct: this is what would happen if toUpperCase() changed the shared "ok" in place.',
            py: 'Not correct: this is what would happen if upper() changed the shared "ok" in place.',
          },
          verdict: 'incorrect',
        },
        {
          diagram: graph({ s: 'ok', t: 'OK', u: 'OK' }),
          caption: 'Not correct: u = t did not link u to t, so u does not follow t to "OK".',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> <code>s</code> and <code>u</code> sharing one <code>"ok"</code>, or referring to separate ones. Strings cannot change in place, so the two pictures behave the same.</p>',
        },
        {
          diagram: graph({ s: ref('ok'), t: 'OK', u: ref('ok') }, { ok: scalar('ok') }),
          caption: 'Also correct: s and u sharing one "ok".',
          verdict: 'correct',
        },
      ],
    }),
    write({
      title: 'Let it go',
      given: {
        js: lines('let x = [1];', 'let y = [x];'),
        ts: lines('let x: number[] | null = [1];', 'let y: (number[] | null)[] = [x];'),
        py: lines('x = [1]', 'y = [x]'),
      },
      js: 'x = null;',
      py: 'x = None',
      expected: graph({ x: null, y: ref('y') }, { y: list(ref('inner')), inner: list(1) }),
      hint: {
        js: 'Reassign x to null; y still holds a reference to [1] in slot 0.',
        py: 'Reassign x to None; y still holds a reference to [1] in slot 0.',
      },
      process: {
        runtime: runtime(sameObject(before('x'), after('y', 0))),
      },
      about: {
        js: "Reassigning a variable to null removes only that variable's reference. If a container still holds an arrow to the array, that array remains reachable and alive.",
        py: "Reassigning a variable to None removes only that variable's reference. If a container still holds an arrow to the list, that list remains reachable and alive.",
      },
      debrief: [
        {
          html: {
            js: '<p><code>x = null;</code> moves only <code>x</code>\'s arrow to <code>null</code>. The array <code>y</code> still holds an arrow to <code>[1]</code> in slot 0. Because that inner array is reachable through <code>y</code>, it remains in memory and is not garbage collected.</p>',
            py: '<p><code>x = None</code> moves only <code>x</code>\'s arrow to <code>None</code>. The list <code>y</code> still holds an arrow to <code>[1]</code> in slot 0. Because that inner list is reachable through <code>y</code>, it remains in memory and is not garbage collected.</p>',
          },
        },
        {
          diagram: graph({ x: null, y: ref('y') }, { y: list(ref('inner')), inner: list(1) }),
          caption: {
            js: 'Correct: x is null, while y[0] still holds the reference to [1].',
            py: 'Correct: x is None, while y[0] still holds the reference to [1].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: null, y: ref('y') }, { y: list(null) }),
          caption: {
            js: 'Not correct: this is what would happen if x = null destroyed the inner array. The slot inside y still refers to it.',
            py: 'Not correct: this is what would happen if x = None destroyed the inner list. The slot inside y still refers to it.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> rebuilding <code>y</code> with <code>y = [[1]];</code> before dropping <code>x</code>. The picture matches, but the checker requires <code>y[0]</code> to still be the array <code>x</code> referred to at the start.</p>',
            py: '<p><strong>Not accepted:</strong> rebuilding <code>y</code> with <code>y = [[1]]</code> before dropping <code>x</code>. The picture matches, but the checker requires <code>y[0]</code> to still be the list <code>x</code> referred to at the start.</p>',
          },
        },
        {
          html: '<p>A value is garbage-collected only when every reference to it is gone. Dropping one variable has no effect on references stored inside containers.</p>',
        },
      ],
    }),
    draw({
      title: { js: 'New array, old slot', py: 'New list, old slot' },
      js: lines('let inner = [1];', 'let outer = [inner];', 'inner = inner.concat([2]);'),
      py: lines('inner = [1]', 'outer = [inner]', 'inner = inner + [2]'),
      expected: graph(
        { inner: ref('newInner'), outer: ref('outer') },
        { outer: list(ref('oldInner')), oldInner: list(1), newInner: list(1, 2) },
      ),
      hint: {
        js: 'inner.concat([2]) builds a new array [1, 2] and assigns it to inner; outer[0] still refers to [1].',
        py: 'inner + [2] builds a new list [1, 2] and assigns it to inner; outer[0] still refers to [1].',
      },
      hints: [
        {
          variable: 'inner',
          aliasing: 'shared',
          message:
            'inner and outer[0] should not share a container. Combining built a new container for inner; outer[0] still refers to the original [1].',
        },
      ],
      about: {
        js: "When an array holds a reference to an inner array, reassigning the variable that originally pointed to that inner array does not update the outer array's slot. Combining with concat builds a new array and leaves the slot pointing at the old one.",
        py: "When a list holds a reference to an inner list, reassigning the variable that originally pointed to that inner list does not update the outer list's slot. Combining with + builds a new list and leaves the slot pointing at the old one.",
      },
      debrief: [
        {
          html: {
            js: '<p><code>let outer = [inner];</code> stores an arrow to <code>[1]</code> in <code>outer[0]</code>. When <code>inner = inner.concat([2]);</code> runs, <code>concat</code> builds a brand-new array <code>[1, 2]</code> and points <code>inner</code> at it. Slots store references to values, not variable names, so <code>outer[0]</code> still points to <code>[1]</code>.</p>',
            py: '<p><code>outer = [inner]</code> stores an arrow to <code>[1]</code> in <code>outer[0]</code>. When <code>inner = inner + [2]</code> runs, <code>+</code> builds a brand-new list <code>[1, 2]</code> and points <code>inner</code> at it. Slots store references to values, not variable names, so <code>outer[0]</code> still points to <code>[1]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { inner: ref('newInner'), outer: ref('outer') },
            { outer: list(ref('oldInner')), oldInner: list(1), newInner: list(1, 2) },
          ),
          caption: {
            js: 'Correct: inner points to the new array [1, 2]; outer[0] still points to [1].',
            py: 'Correct: inner points to the new list [1, 2]; outer[0] still points to [1].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { inner: ref('shared'), outer: ref('outer') },
            { outer: list(ref('shared')), shared: list(1, 2) },
          ),
          caption: {
            js: 'Not correct: this is what inner.push(2) would do. concat builds a new array, so outer[0] keeps the original.',
            py: 'Not correct: this is what inner.append(2) would do. + builds a new list, so outer[0] keeps the original.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Remember: arrows in diagrams go from names or slots to values. Arrows never point to variables.</p>',
        },
      ],
    }),
    write({
      title: 'Two ways to grow',
      given: {
        js: lines('let x = [4];', 'let y = x;'),
        ts: lines('let x: number[] = [4];', 'let y: number[] = x;'),
        py: lines('x = [4]', 'y = x'),
      },
      js: lines('x.push(5);', 'y = y.concat([6]);'),
      py: lines('x.append(5)', 'y = y + [6]'),
      expected: graph({ x: ref('x'), y: ref('y') }, { x: list(4, 5), y: list(4, 5, 6) }),
      hint: {
        js: 'Grow x in place to [4, 5] with push(5), then assign y a new array using y.concat([6]).',
        py: 'Grow x in place to [4, 5] with append(5), then assign y a new list using y + [6].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should not share a container. Grow the shared container in place first, then combine to give y a new container and leave x with [4, 5].',
        },
      ],
      about: {
        js: 'Growing a shared array in place with push is seen through every alias; combining with concat builds a new array, so only the variable it is assigned to moves to it. The special constraint says y must be built by combining y with [6].',
        py: 'Growing a shared list in place with append is seen through every alias; combining with + builds a new list, so only the variable it is assigned to moves to it. The special constraint says y must be built by combining y with [6].',
      },
      constraints: [
        {
          rule: {
            js:
              'The boss says that y must be built by combining y with [6], so if another programmer updates what x starts with, x still grows by 5 and y gets the combined items.',
            py:
              'The boss says that y must be built by combining y with [6], so if another programmer updates what x starts with, x still grows by 5 and y gets the combined items.',
          },
          cases: [
            {
              change: 'x starts as [10]',
              given: {
                js: lines('let x = [10];', 'let y = x;'),
                ts: lines('let x: number[] = [10];', 'let y: number[] = x;'),
                py: lines('x = [10]', 'y = x'),
              },
              expected: graph({ x: ref('x'), y: ref('y') }, { x: list(10, 5), y: list(10, 5, 6) }),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(preserve('x')),
        source: [combines('y', 'y')],
      },
      debrief: [
        {
          html: {
            js: '<p><code>x.push(5);</code> modifies the shared array in place, so both <code>x</code> and <code>y</code> refer to <code>[4, 5]</code>. Then <code>y = y.concat([6]);</code> constructs a brand-new array <code>[4, 5, 6]</code> and rebinds <code>y</code>. <code>x</code> continues to refer to the original array <code>[4, 5]</code>.</p>',
            py: '<p><code>x.append(5)</code> modifies the shared list in place, so both <code>x</code> and <code>y</code> refer to <code>[4, 5]</code>. Then <code>y = y + [6]</code> constructs a brand-new list <code>[4, 5, 6]</code> and rebinds <code>y</code>. <code>x</code> continues to refer to the original list <code>[4, 5]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(4, 5), y: list(4, 5, 6) }),
          caption: {
            js: 'Correct: x remains [4, 5]; y refers to the new array [4, 5, 6].',
            py: 'Correct: x remains [4, 5]; y refers to the new list [4, 5, 6].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(4, 5, 6) }),
          caption: {
            js: 'Not correct: this is what y.push(6) would do, changing the array x refers to as well.',
            py: 'Not correct: this is what y.append(6) would do, changing the list x refers to as well.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>y.push(5);</code> instead of <code>x.push(5);</code>. Before <code>y</code> is rebound, both names refer to the starter array.</p>',
            py: '<p><strong>Also correct:</strong> <code>y.append(5)</code> instead of <code>x.append(5)</code>. Before <code>y</code> is rebound, both names refer to the starter list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x.push(5);</code> followed by <code>y.push(6);</code> leaves both variables sharing <code>[4, 5, 6]</code>. Typing <code>y = [4, 5, 6];</code> matches the picture, but the checker reruns your code from another starting array to make sure you built <code>y</code> with <code>y.concat(...)</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x.append(5)</code> followed by <code>y.append(6)</code> leaves both variables sharing <code>[4, 5, 6]</code>. Typing <code>y = [4, 5, 6]</code> matches the picture, but the checker reruns your code from another starting list to make sure you built <code>y</code> with <code>y + [...]</code>.</p>',
          },
        },
      ],
    }),
  ],
)
