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
import type { Level } from '../types'
import { draw, L, level, lines, write } from './common'

export const rebindingLevel: Level = level(
  'rebinding',
  L('Building New Values', 'Building New Values'),
  L(
    'Strings never change: methods like toUpperCase() build a new string. Growing an array with push changes it in place; combining with concat builds a new array and leaves the old one alone. Setting a variable to null drops one reference; a value nothing refers to is gone for good.',
    'Strings never change: methods like upper() build a new string. Growing a list with append changes it in place; combining with + builds a new list and leaves the old one alone. Setting a variable to None drops one reference; a value nothing refers to is gone for good.',
  ),
  [
    draw({
      title: 'Upper-casing a string',
      js: lines('let s = "ab";', 'let t = s.toUpperCase();'),
      py: lines('s = "ab"', 't = s.upper()'),
      expected: graph({ s: 'ab', t: 'AB' }),
      hint: {
        js: 's.toUpperCase() builds a new string "AB" for t. Ask whether it changes the string s refers to.',
        py: 's.upper() builds a new string "AB" for t. Ask whether it changes the string s refers to.',
      },
      hints: [
        {
          variable: 's',
          value: 'AB',
          message:
            's should still refer to "ab". Strings never change in place: string methods like toUpperCase() and upper() return a new string and leave the original alone.',
        },
      ],
      about: {
        js: 'Strings are immutable: they can never be changed in place. Methods like toUpperCase() build and return a new string, leaving the original string untouched.',
        py: 'Strings are immutable: they can never be changed in place. Methods like upper() build and return a new string, leaving the original string untouched.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let s = "ab";</code> points <code>s</code> at <code>"ab"</code>. When <code>s.toUpperCase()</code> runs, it does not modify <code>"ab"</code>. Instead, it builds a brand-new string <code>"AB"</code>, which <code>t</code> points to. <code>s</code> still refers to <code>"ab"</code>.</p>',
            py: '<p><code>s = "ab"</code> points <code>s</code> at <code>"ab"</code>. When <code>s.upper()</code> runs, it does not modify <code>"ab"</code>. Instead, it builds a brand-new string <code>"AB"</code>, which <code>t</code> points to. <code>s</code> still refers to <code>"ab"</code>.</p>',
          },
        },
        {
          diagram: graph({ s: 'ab', t: 'AB' }),
          caption: 'Correct: s keeps "ab" while t refers to the new string "AB".',
          verdict: 'correct',
        },
        {
          diagram: graph({ s: 'AB', t: 'AB' }),
          caption: {
            js: 'Not correct: this is what would happen if toUpperCase() changed "ab" in place.',
            py: 'Not correct: this is what would happen if upper() changed "ab" in place.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>No string method in either language ever modifies an existing string in place. Any operation that transforms a string produces a new value.</p>',
        },
        {
          html: '<p>This is why, in earlier levels, sharing one string or keeping two separate equal strings never made a difference: nothing can change a string in place, so no program can tell the two pictures apart.</p>',
        },
      ],
    }),
    write({
      title: 'Upper and lower',
      given: { js: 'let s = "Hi";', py: 's = "Hi"' },
      js: lines('let lo = s.toLowerCase();', 'let up = s.toUpperCase();'),
      py: lines('lo = s.lower()', 'up = s.upper()'),
      expected: graph({ s: 'Hi', lo: 'hi', up: 'HI' }),
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
      about: {
        js: 'Transform a string into lowercase and uppercase versions. Because strings are immutable, each method call builds a new string and leaves s untouched.',
        py: 'Transform a string into lowercase and uppercase versions. Because strings are immutable, each method call builds a new string and leaves s untouched.',
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
      js: lines('let a = [1];', 'let b = a;', 'a = a.concat([2]);'),
      py: lines('a = [1]', 'b = a', 'a = a + [2]'),
      expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1), new: list(1, 2) }),
      hint: {
        js: 'After a = a.concat([2]), a points at a new array while b still refers to [1].',
        py: 'After a = a + [2], a points at a new list while b still refers to [1].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. Combining builds a new container for a and leaves the original alone, so b still refers to [1].',
        },
      ],
      about: {
        js: "Combining arrays with concat creates a brand-new array and leaves the original untouched. Assigning the result back to a moves only a's arrow, while b remains pointing at the original array.",
        py: "Combining lists with + creates a brand-new list and leaves the original untouched. Assigning the result back to a moves only a's arrow, while b remains pointing at the original list.",
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = a;</code> creates an alias: both variables refer to <code>[1]</code>. When <code>a = a.concat([2]);</code> runs, <code>concat</code> does not modify <code>[1]</code> in place. It constructs a new array <code>[1, 2]</code> and rebinds <code>a</code> to it. <code>b</code> continues to refer to <code>[1]</code>.</p>',
            py: '<p><code>b = a</code> creates an alias: both variables refer to <code>[1]</code>. When <code>a = a + [2]</code> runs, <code>+</code> does not modify <code>[1]</code> in place. It constructs a new list <code>[1, 2]</code> and rebinds <code>a</code> to it. <code>b</code> continues to refer to <code>[1]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('new'), b: ref('old') }, { old: list(1), new: list(1, 2) }),
          caption: {
            js: 'Correct: a points to the new array [1, 2]; b still refers to [1].',
            py: 'Correct: a points to the new list [1, 2]; b still refers to [1].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2) }),
          caption: {
            js: 'Not correct: this is what a.push(2) would do. concat builds a new array instead of changing the shared one.',
            py: 'Not correct: this is what a.append(2) would do. + builds a new list instead of changing the shared one.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Contrast this with <code>a.push(2);</code>, which modifies the array in place so that both <code>a</code> and <code>b</code> see the change. <code>concat</code> builds a new array instead.</p>',
            py: '<p>Contrast this with <code>a.append(2)</code>, which modifies the list in place so that both <code>a</code> and <code>b</code> see the change. <code>+</code> builds a new list instead.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'A string taken from an array', py: 'A string taken from a list' },
      js: lines('let words = ["hi"];', 'let w = words[0];', 'w = w + "!";'),
      py: lines('words = ["hi"]', 'w = words[0]', 'w = w + "!"'),
      expected: graph({ words: ref('words'), w: 'hi!' }, { words: list('hi') }),
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
      js: lines('let a = [1];', 'let b = a;', 'a = null;'),
      py: lines('a = [1]', 'b = a', 'a = None'),
      expected: graph({ a: null, b: ref('b') }, { b: list(1) }),
      hint: {
        js: 'Assigning a = null repoints only a; b keeps referring to [1].',
        py: 'Assigning a = None repoints only a; b keeps referring to [1].',
      },
      about: {
        js: "Setting a variable to null moves only that variable's arrow. As long as another variable still refers to the array, the array remains in memory.",
        py: "Setting a variable to None moves only that variable's arrow. As long as another variable still refers to the list, the list remains in memory.",
      },
      debrief: [
        {
          html: {
            js: '<p><code>a = null;</code> removes <code>a</code>\'s reference to <code>[1]</code>. It does not destroy the array or affect <code>b</code>. Because <code>b</code> still refers to <code>[1]</code>, the array stays alive in memory.</p>',
            py: '<p><code>a = None</code> removes <code>a</code>\'s reference to <code>[1]</code>. It does not destroy the list or affect <code>b</code>. Because <code>b</code> still refers to <code>[1]</code>, the list stays alive in memory.</p>',
          },
        },
        {
          diagram: graph({ a: null, b: ref('b') }, { b: list(1) }),
          caption: {
            js: 'Correct: a is null, while b still refers to [1].',
            py: 'Correct: a is None, while b still refers to [1].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: null, b: null }),
          caption: {
            js: 'Not correct: this is what would happen if a = null destroyed the array. Dropping a leaves b alone.',
            py: 'Not correct: this is what would happen if a = None destroyed the list. Dropping a leaves b alone.',
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
      about: {
        js: 'When all variables referring to an object are reassigned to null, no arrows point to that object anymore. It becomes unreachable garbage and can be collected.',
        py: 'When all variables referring to a dictionary are reassigned to None, no arrows point to that dictionary anymore. It becomes unreachable garbage and can be collected.',
      },
      debrief: [
        {
          html: {
            js: '<p>Setting <code>a = null;</code> drops the first reference to the object. Setting <code>b = null;</code> drops the second. With no remaining references pointing to <code>{ n: 1 }</code>, the object is unreachable.</p>',
            py: '<p>Setting <code>a = None</code> drops the first reference to the dictionary. Setting <code>b = None</code> drops the second. With no remaining references pointing to <code>{"n": 1}</code>, the dictionary is unreachable.</p>',
          },
        },
        {
          diagram: graph({ a: null, b: null }),
          caption: {
            js: 'Correct: both a and b are null.',
            py: 'Correct: both a and b are None.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: null, b: ref('b') }, { b: dict({ n: 1 }) }),
          caption: {
            js: 'Not correct: dropping only a leaves b still pointing to the object.',
            py: 'Not correct: dropping only a leaves b still pointing to the dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> dropping <code>b</code> before <code>a</code>, or both at once with <code>a = b = null;</code>.</p>',
            py: '<p><strong>Also correct:</strong> dropping <code>b</code> before <code>a</code>, or both at once with <code>a = b = None</code>.</p>',
          },
        },
        {
          diagram: graph({ a: null, b: null }, { old: dict({ n: 1 }) }),
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
    write({
      title: 'Combine without changing the original',
      given: { js: lines('let a = [1, 2];', 'let b = a;'), py: lines('a = [1, 2]', 'b = a') },
      js: 'b = b.concat([3, 4]);',
      py: 'b = b + [3, 4]',
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2, 3, 4) }),
      process: {
        runtime: runtime(
          sameObject(
            before('a'),
            after('a'),
            'Keep "a" referring to the container it started with, and build the new one for "b".',
          ),
        ),
        source: [combines('b', 'b')],
        hidden: [
          {
            given: { js: lines('let a = [5];', 'let b = a;'), py: lines('a = [5]', 'b = a') },
            expected: graph({ a: ref('a'), b: ref('b') }, { a: list(5), b: list(5, 3, 4) }),
          },
        ],
      },
      hint: {
        js: 'Use b = b.concat([3, 4]) so b gets a new array and a keeps [1, 2].',
        py: 'Use b = b + [3, 4] so b gets a new list and a keeps [1, 2].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. Growing the shared container in place changes what a sees too; combining builds a new container for b and leaves a with [1, 2].',
        },
      ],
      about: {
        js: 'Combine an array with additional elements to produce a larger array without mutating the original. Using concat builds a new array and leaves the array referenced by a unchanged.',
        py: 'Combine a list with additional elements to produce a larger list without mutating the original. Using + builds a new list and leaves the list referenced by a unchanged.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>b = b.concat([3, 4]);</code> evaluates <code>b.concat([3, 4])</code>, building a brand-new array <code>[1, 2, 3, 4]</code>, and points <code>b</code> at it. The original array <code>[1, 2]</code> is untouched, so <code>a</code> still refers to it.</p>',
            py: '<p><code>b = b + [3, 4]</code> evaluates <code>b + [3, 4]</code>, building a brand-new list <code>[1, 2, 3, 4]</code>, and points <code>b</code> at it. The original list <code>[1, 2]</code> is untouched, so <code>a</code> still refers to it.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2, 3, 4) }),
          caption: {
            js: 'Correct: a keeps [1, 2]; b points to the new array [1, 2, 3, 4].',
            py: 'Correct: a keeps [1, 2]; b points to the new list [1, 2, 3, 4].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2, 3, 4) }),
          caption: {
            js: 'Not correct: this is what growing the shared array in place with push would do; a would see the change too.',
            py: 'Not correct: this is what growing the shared list in place with append would do; a would see the change too.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>b.push(3, 4);</code> changes the shared array in place, so <code>a</code> would see <code>[1, 2, 3, 4]</code> too. Typing <code>b = [1, 2, 3, 4];</code> builds the right picture here, but the checker reruns your code from other starting arrays. <code>b = [...b, 3, 4];</code> also builds a new array, but this puzzle practices <code>concat</code>, so the checker asks for it.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b.extend([3, 4])</code> changes the shared list in place, so <code>a</code> would see <code>[1, 2, 3, 4]</code> too. Typing <code>b = [1, 2, 3, 4]</code> builds the right picture here, but the checker reruns your code from other starting lists.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'In place, then new',
      js: lines('let a = [10];', 'let b = a;', 'b.push(20);', 'b = b.concat([30]);'),
      py: lines('a = [10]', 'b = a', 'b.append(20)', 'b = b + [30]'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(10, 20), b: list(10, 20, 30) }),
      hint: {
        js: 'Growing b in place changes the shared array to [10, 20]; combining with [30] gives b a new array [10, 20, 30] and leaves a pointing at [10, 20].',
        py: 'Growing b in place changes the shared list to [10, 20]; combining with [30] gives b a new list [10, 20, 30] and leaves a pointing at [10, 20].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            "a and b should not share a container. Growing in place changed the shared container, but combining then built a new one for b and moved only b's arrow, so a still refers to [10, 20].",
        },
      ],
      about: {
        js: 'push changes an array in place, so every alias sees the change; concat builds a new array, so only the variable it is assigned to moves to it.',
        py: 'append changes a list in place, so every alias sees the change; + builds a new list, so only the variable it is assigned to moves to it.',
      },
      debrief: [
        {
          html: {
            js: '<p>Follow the lines in order:</p><ol><li><code>b.push(20);</code> mutates the shared array in place, so both <code>a</code> and <code>b</code> see <code>[10, 20]</code>.</li><li><code>b = b.concat([30]);</code> builds a brand-new array <code>[10, 20, 30]</code> and rebinds only <code>b</code>.</li></ol><p><code>a</code> still refers to the original array, which holds <code>[10, 20]</code>.</p>',
            py: '<p>Follow the lines in order:</p><ol><li><code>b.append(20)</code> mutates the shared list in place, so both <code>a</code> and <code>b</code> see <code>[10, 20]</code>.</li><li><code>b = b + [30]</code> builds a brand-new list <code>[10, 20, 30]</code> and rebinds only <code>b</code>.</li></ol><p><code>a</code> still refers to the original list, which holds <code>[10, 20]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(10, 20), b: list(10, 20, 30) }),
          caption: {
            js: 'Correct: a keeps [10, 20]; b refers to the new array [10, 20, 30].',
            py: 'Correct: a keeps [10, 20]; b refers to the new list [10, 20, 30].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(10, 20, 30) }),
          caption: {
            js: 'Not correct: this is what would happen if concat changed the shared array in place like push.',
            py: 'Not correct: this is what would happen if + changed the shared list in place like append.',
          },
          verdict: 'incorrect',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(10), b: list(10, 20, 30) }),
          caption: {
            js: 'Not correct: b.push(20) ran while a and b still shared one array, so a sees the 20.',
            py: 'Not correct: b.append(20) ran while a and b still shared one list, so a sees the 20.',
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
      given: { js: lines('let a = [1];', 'let b = a;'), py: lines('a = [1]', 'b = a') },
      js: lines('a.push(2);', 'a = [9];'),
      py: lines('a.append(2)', 'a = [9]'),
      expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2), new: list(9) }),
      hint: {
        js: 'Grow a in place to [1, 2] with push(2), which b sees too, then repoint a to a new array [9]; b keeps [1, 2].',
        py: 'Grow a in place to [1, 2] with append(2), which b sees too, then repoint a to a new list [9]; b keeps [1, 2].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            "a and b should not share a container. Reassigning a to a new [9] moves only a's arrow; b stays with the original, now [1, 2].",
        },
      ],
      process: { runtime: runtime(sameObject(before('a'), after('b'))) },
      about: {
        js: 'Changing an array in place is seen through every alias, but reassigning a name afterward repoints only that name, so the alias stays with the changed original.',
        py: 'Changing a list in place is seen through every alias, but reassigning a name afterward repoints only that name, so the alias stays with the changed original.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>a.push(2);</code> mutates the array in place, so <code>b</code> sees <code>[1, 2]</code>. Then <code>a = [9];</code> builds a new array and rebinds <code>a</code>. <code>b</code> still points to the original array <code>[1, 2]</code>.</p>',
            py: '<p><code>a.append(2)</code> mutates the list in place, so <code>b</code> sees <code>[1, 2]</code>. Then <code>a = [9]</code> builds a new list and rebinds <code>a</code>. <code>b</code> still points to the original list <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2), new: list(9) }),
          caption: {
            js: 'Correct: b keeps the modified array [1, 2]; a refers to [9].',
            py: 'Correct: b keeps the modified list [1, 2]; a refers to [9].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(9) }),
          caption: {
            js: 'Not correct: a = [9] repoints only a. It does not replace the array b refers to.',
            py: 'Not correct: a = [9] repoints only a. It does not replace the list b refers to.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>b.push(2);</code> instead of <code>a.push(2);</code>, since both names refer to the starter array. Pushing through <code>b</code> can even come after <code>a = [9];</code>, because by then <code>b</code> is the only name left on the original.</p>',
            py: '<p><strong>Also correct:</strong> <code>b.append(2)</code> instead of <code>a.append(2)</code>, since both names refer to the starter list. Appending through <code>b</code> can even come after <code>a = [9]</code>, because by then <code>b</code> is the only name left on the original.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>a = [9];</code> followed by <code>b = [1, 2];</code>. The picture matches, but the checker requires <code>b</code> to end up on the same array that <code>a</code> referred to at the start.</p>',
            py: '<p><strong>Not accepted:</strong> <code>a = [9]</code> followed by <code>b = [1, 2]</code>. The picture matches, but the checker requires <code>b</code> to end up on the same list that <code>a</code> referred to at the start.</p>',
          },
        },
      ],
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
      hints: [
        {
          variable: 'name',
          value: 'ada',
          message:
            'name should refer to "ADA". Strings never change in place, so calling the method by itself leaves name alone; assign its result back to name.',
        },
        {
          variable: 'backup',
          value: 'ADA',
          message:
            'backup should still refer to "ada". Upper-casing name builds a new string and moves only name\'s arrow, so backup needs no change.',
        },
      ],
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
      about: {
        js: 'Strings are immutable. Converting name to uppercase builds a new string. Reassigning name moves its arrow to the uppercase string while backup remains pointing to the original lowercase string.',
        py: 'Strings are immutable. Converting name to uppercase builds a new string. Reassigning name moves its arrow to the uppercase string while backup remains pointing to the original lowercase string.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>name.toUpperCase()</code> builds a new string <code>"ADA"</code>. Assigning that back to <code>name</code> moves only <code>name</code>\'s arrow. Because strings are immutable, the original string was never altered, and <code>backup</code> continues to refer to <code>"ada"</code>.</p>',
            py: '<p><code>name.upper()</code> builds a new string <code>"ADA"</code>. Assigning that back to <code>name</code> moves only <code>name</code>\'s arrow. Because strings are immutable, the original string was never altered, and <code>backup</code> continues to refer to <code>"ada"</code>.</p>',
          },
        },
        {
          diagram: graph({ name: 'ADA', backup: 'ada' }),
          caption: 'Correct: name points to "ADA"; backup still refers to "ada".',
          verdict: 'correct',
        },
        {
          diagram: graph({ name: 'ADA', backup: 'ADA' }),
          caption: {
            js: 'Not correct: this is what would happen if toUpperCase() changed the shared "ada" in place.',
            py: 'Not correct: this is what would happen if upper() changed the shared "ada" in place.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>name = "ADA";</code>. The checker reruns your code from another starting name to make sure you called <code>toUpperCase()</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>name = "ADA"</code>. The checker reruns your code from another starting name to make sure you called <code>upper()</code>.</p>',
          },
        },
        {
          html: '<p>Whether <code>name</code> and <code>backup</code> started out sharing one <code>"ada"</code> or referring to separate ones makes no difference: nothing can change <code>"ada"</code> in place, so a backup of a string is safe either way.</p>',
        },
      ],
    }),
  ],
  [
    draw({
      title: { js: 'Combine, then grow the new array', py: 'Combine, then grow the new list' },
      js: lines('let a = [1];', 'let b = a;', 'b = b.concat([2]);', 'b.push(3);'),
      py: lines('a = [1]', 'b = a', 'b = b + [2]', 'b.append(3)'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2, 3) }),
      hint: {
        js: 'After b = b.concat([2]), b points at a new array; growing it to [1, 2, 3] leaves a holding [1].',
        py: 'After b = b + [2], b points at a new list; growing it to [1, 2, 3] leaves a holding [1].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. Combining built a new container for b first, so the later growth reaches only b; a still refers to [1].',
        },
      ],
      about: {
        js: 'Combining an array with concat builds a new array and rebinds the variable. Any subsequent in-place mutations like push affect only that new array, leaving the original array untouched.',
        py: 'Combining a list with + builds a new list and rebinds the variable. Any subsequent in-place mutations like append affect only that new list, leaving the original list untouched.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>b = b.concat([2]);</code> builds a brand-new array <code>[1, 2]</code> and rebinds <code>b</code>. From that moment, <code>a</code> and <code>b</code> point to separate arrays. The later <code>b.push(3);</code> mutates only <code>b</code>\'s new array, leaving <code>a</code> referring to <code>[1]</code>.</p>',
            py: '<p><code>b = b + [2]</code> builds a brand-new list <code>[1, 2]</code> and rebinds <code>b</code>. From that moment, <code>a</code> and <code>b</code> point to separate lists. The later <code>b.append(3)</code> mutates only <code>b</code>\'s new list, leaving <code>a</code> referring to <code>[1]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2, 3) }),
          caption: 'Correct: a retains [1], while b refers to [1, 2, 3].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2, 3) }),
          caption: {
            js: 'Not correct: concat creates a new array, so a and b do not share [1, 2, 3].',
            py: 'Not correct: + creates a new list, so a and b do not share [1, 2, 3].',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Rebinding breaks the alias. Once <code>b</code> points to a new container, changes made through <code>b</code> can never reach <code>a</code> again. This is the reverse of "In place, then new", where the change in place came first and both names saw it.</p>',
        },
      ],
    }),
    draw({
      title: 'Upper case through an alias',
      js: lines('let s = "ok";', 'let t = s;', 'let u = t;', 't = t.toUpperCase();'),
      py: lines('s = "ok"', 't = s', 'u = t', 't = t.upper()'),
      expected: graph({ s: 'ok', t: 'OK', u: 'ok' }),
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
      about: {
        js: "Reassigning a variable to null removes only that variable's reference. If a container still holds an arrow to the array, that array remains reachable and alive.",
        py: "Reassigning a variable to None removes only that variable's reference. If a container still holds an arrow to the list, that list remains reachable and alive.",
      },
      debrief: [
        {
          html: {
            js: '<p><code>a = null;</code> moves only <code>a</code>\'s arrow to <code>null</code>. The array <code>b</code> still holds an arrow to <code>[1]</code> in slot 0. Because that inner array is reachable through <code>b</code>, it remains in memory and is not garbage collected.</p>',
            py: '<p><code>a = None</code> moves only <code>a</code>\'s arrow to <code>None</code>. The list <code>b</code> still holds an arrow to <code>[1]</code> in slot 0. Because that inner list is reachable through <code>b</code>, it remains in memory and is not garbage collected.</p>',
          },
        },
        {
          diagram: graph({ a: null, b: ref('b') }, { b: list(ref('inner')), inner: list(1) }),
          caption: {
            js: 'Correct: a is null, while b[0] still holds the reference to [1].',
            py: 'Correct: a is None, while b[0] still holds the reference to [1].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: null, b: ref('b') }, { b: list(null) }),
          caption: {
            js: 'Not correct: this is what would happen if a = null destroyed the inner array. The slot inside b still refers to it.',
            py: 'Not correct: this is what would happen if a = None destroyed the inner list. The slot inside b still refers to it.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> rebuilding <code>b</code> with <code>b = [[1]];</code> before dropping <code>a</code>. The picture matches, but the checker requires <code>b[0]</code> to still be the array <code>a</code> referred to at the start.</p>',
            py: '<p><strong>Not accepted:</strong> rebuilding <code>b</code> with <code>b = [[1]]</code> before dropping <code>a</code>. The picture matches, but the checker requires <code>b[0]</code> to still be the list <code>a</code> referred to at the start.</p>',
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
      given: { js: lines('let a = [4];', 'let b = a;'), py: lines('a = [4]', 'b = a') },
      js: lines('a.push(5);', 'b = b.concat([6]);'),
      py: lines('a.append(5)', 'b = b + [6]'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(4, 5), b: list(4, 5, 6) }),
      hint: {
        js: 'Grow a in place to [4, 5] with push(5), then assign b a new array using b.concat([6]).',
        py: 'Grow a in place to [4, 5] with append(5), then assign b a new list using b + [6].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. Grow the shared container in place first, then combine to give b a new container and leave a with [4, 5].',
        },
      ],
      process: {
        runtime: runtime(preserve('a')),
        source: [combines('b', 'b')],
      },
      about: {
        js: 'Growing a shared array in place with push is seen through every alias; combining with concat builds a new array, so only the variable it is assigned to moves to it.',
        py: 'Growing a shared list in place with append is seen through every alias; combining with + builds a new list, so only the variable it is assigned to moves to it.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>a.push(5);</code> modifies the shared array in place, so both <code>a</code> and <code>b</code> refer to <code>[4, 5]</code>. Then <code>b = b.concat([6]);</code> constructs a brand-new array <code>[4, 5, 6]</code> and rebinds <code>b</code>. <code>a</code> continues to refer to the original array <code>[4, 5]</code>.</p>',
            py: '<p><code>a.append(5)</code> modifies the shared list in place, so both <code>a</code> and <code>b</code> refer to <code>[4, 5]</code>. Then <code>b = b + [6]</code> constructs a brand-new list <code>[4, 5, 6]</code> and rebinds <code>b</code>. <code>a</code> continues to refer to the original list <code>[4, 5]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(4, 5), b: list(4, 5, 6) }),
          caption: {
            js: 'Correct: a remains [4, 5]; b refers to the new array [4, 5, 6].',
            py: 'Correct: a remains [4, 5]; b refers to the new list [4, 5, 6].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(4, 5, 6) }),
          caption: {
            js: 'Not correct: this is what b.push(6) would do, changing the array a refers to as well.',
            py: 'Not correct: this is what b.append(6) would do, changing the list a refers to as well.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>b.push(5);</code> instead of <code>a.push(5);</code>. Before <code>b</code> is rebound, both names refer to the starter array.</p>',
            py: '<p><strong>Also correct:</strong> <code>b.append(5)</code> instead of <code>a.append(5)</code>. Before <code>b</code> is rebound, both names refer to the starter list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>a.push(5);</code> followed by <code>b.push(6);</code> leaves both variables sharing <code>[4, 5, 6]</code>. Typing <code>b = [4, 5, 6];</code> matches the picture, but the checker requires <code>b</code> to be built with <code>b.concat(...)</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>a.append(5)</code> followed by <code>b.append(6)</code> leaves both variables sharing <code>[4, 5, 6]</code>. Typing <code>b = [4, 5, 6]</code> matches the picture, but the checker requires <code>b</code> to be built with <code>b + [...]</code>.</p>',
          },
        },
      ],
    }),
  ],
)
