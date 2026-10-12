import { dict, graph, list, ref } from '../builders'
import { before, call, preserve, runtime } from '../process'
import type { Level } from '../types'
import { draw, L, level, lines, write } from './common'

export const functionsLevel: Level = level(
  'functions',
  L(
    'Functions and Parameters',
    'Functions and Parameters',
  ),
  L(
    'Calling a function makes each parameter refer to whatever the caller passed, so the parameter and the caller\'s variable share one array or object. Changing that container inside the function changes it for the caller. Reassigning the parameter only repoints the parameter. Whatever a function returns, the caller gets a reference to it: a new container, or possibly the very one the caller passed in.',
    'Calling a function makes each parameter refer to whatever the caller passed, so the parameter and the caller\'s variable share one list or dictionary. Changing that container inside the function changes it for the caller. Reassigning the parameter only repoints the parameter. Whatever a function returns, the caller gets a reference to it: a new container, or possibly the very one the caller passed in.',
  ),
  [
    draw({
      title: { js: 'A function that changes an array', py: 'A function that changes a list' },
      js: lines('function setFirst(arr) {', '  arr[0] = 2;', '}', 'let a = [1];', 'setFirst(a);'),
      ts: lines('function setFirst(arr: number[]): void {', '  arr[0] = 2;', '}', 'let a = [1];', 'setFirst(a);'),
      py: lines('def set_first(arr):', '    arr[0] = 2', '', 'a = [1]', 'set_first(a)'),
      expected: graph({ a: ref('a') }, { a: list(2) }),
      hint: {
        js: 'arr refers to whatever array the caller passed in. Follow its arrow when arr[0] = 2 runs.',
        py: 'arr refers to whatever list the caller passed in. Follow its arrow when arr[0] = 2 runs.',
      },
      hints: [
        {
          variable: 'a',
          value: 1,
          message:
            'The value 1 is not correct. arr is not a private copy: it refers to the same container as a, so arr[0] = 2 changes the container a refers to.',
        },
      ],
      about: {
        js: 'When you pass an array to a function, the parameter refers to that same array. Changing the array inside the function changes it for the caller.',
        py: 'When you pass a list to a function, the parameter refers to that same list. Changing the list inside the function changes it for the caller.',
      },
      debrief: [
        {
          html: {
            js: '<p>Calling <code>setFirst(a)</code> does not copy the array. The parameter <code>arr</code> starts out referring to the same array as <code>a</code>.</p>',
            py: '<p>Calling <code>set_first(a)</code> does not copy the list. The parameter <code>arr</code> starts out referring to the same list as <code>a</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><code>arr[0] = 2;</code> changes slot 0 of that array in place. When <code>setFirst</code> finishes, <code>arr</code> disappears, but the change stays in the array that <code>a</code> still refers to.</p>',
            py: '<p><code>arr[0] = 2</code> changes slot 0 of that list in place. When <code>set_first</code> finishes, <code>arr</code> disappears, but the change stays in the list that <code>a</code> still refers to.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(2) }),
          caption: {
            js: 'Correct: the function changed the array that a refers to.',
            py: 'Correct: the function changed the list that a refers to.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(1) }),
          caption: {
            js: 'Not correct: this is what you would draw if the function worked on its own copy of the array.',
            py: 'Not correct: this is what you would draw if the function worked on its own copy of the list.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>The next puzzle adds a second line to the function: one that reassigns its parameter after the change.</p>',
        },
      ],
    }),
    draw({
      title: 'Changing a parameter, then reassigning it',
      js: lines(
        'function archive(box) {',
        '  box.push(1);',
        '  box = [];',
        '}',
        'let a = [0];',
        'archive(a);',
      ),
      ts: lines(
        'function archive(box: number[]): void {',
        '  box.push(1);',
        '  box = [];',
        '}',
        'let a = [0];',
        'archive(a);',
      ),
      py: lines('def archive(box):', '    box.append(1)', '    box = []', '', 'a = [0]', 'archive(a)'),
      expected: graph({ a: ref('a') }, { a: list(0, 1) }),
      hint: 'Take the lines of archive in order. One changes a container and one moves an arrow. Which arrow does the second line move?',
      hints: [
        {
          variable: 'a',
          length: 0,
          message: {
            js: 'a should still hold two items. box = [] moves only the parameter box; it never empties the array a refers to.',
            py: 'a should still hold two items. box = [] moves only the parameter box; it never empties the list a refers to.',
          },
        },
        {
          variable: 'a',
          length: 1,
          message: {
            js: 'a should hold two items. box.push(1) changes the array a refers to, because box refers to that same array. Only the second line moves box away from it.',
            py: 'a should hold two items. box.append(1) changes the list a refers to, because box refers to that same list. Only the second line moves box away from it.',
          },
        },
      ],
      about: {
        js: 'A function can change the array its parameter refers to and then reassign the parameter. The change stays with the caller\'s array. The reassignment only moves the parameter.',
        py: 'A function can change the list its parameter refers to and then reassign the parameter. The change stays with the caller\'s list. The reassignment only moves the parameter.',
      },
      debrief: [
        {
          html: {
            js: '<p>When <code>archive(a);</code> is called, the parameter <code>box</code> refers to the same array <code>[0]</code> as <code>a</code>. <code>box.push(1);</code> changes that array in place, so it becomes <code>[0, 1]</code>.</p>',
            py: '<p>When <code>archive(a)</code> is called, the parameter <code>box</code> refers to the same list <code>[0]</code> as <code>a</code>. <code>box.append(1)</code> changes that list in place, so it becomes <code>[0, 1]</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><code>box = [];</code> builds a new empty array and repoints <code>box</code> at it. It moves only <code>box</code>\'s arrow, so the array <code>[0, 1]</code> and the variable <code>a</code> are left alone. The new array is garbage once <code>archive</code> returns.</p>',
            py: '<p><code>box = []</code> builds a new empty list and repoints <code>box</code> at it. It moves only <code>box</code>\'s arrow, so the list <code>[0, 1]</code> and the variable <code>a</code> are left alone. The new list is garbage once <code>archive</code> returns.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(0, 1) }),
          caption: 'Correct: a still refers to the array it started with, which now holds 0 and 1.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list() }),
          caption: 'Not correct: this is what you would draw if box = [] repointed a as well.',
          verdict: 'incorrect',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(0) }),
          caption: {
            js: 'Not correct: this is what you would draw if archive worked on its own copy of the array, so the push never reached a.',
            py: 'Not correct: this is what you would draw if archive worked on its own copy of the list, so the append never reached a.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> drawing the new empty array with nothing pointing to it. Once <code>archive</code> returns, nothing refers to it, so it is garbage and is never checked.</p>',
            py: '<p><strong>Also correct:</strong> drawing the new empty list with nothing pointing to it. Once <code>archive</code> returns, nothing refers to it, so it is garbage and is never checked.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Call it on the right array', py: 'Call it on the right list' },
      given: {
        js: lines('function grow(arr) {', '  arr.push(0);', '}', 'let a = [1];', 'let b = [2];', 'let c = b;'),
        ts: lines(
          'function grow(arr: number[]): void {',
          '  arr.push(0);',
          '}',
          'let a: number[] = [1];',
          'let b: number[] = [2];',
          'let c: number[] = b;',
        ),
        py: lines('def grow(arr):', '    arr.append(0)', '', 'a = [1]', 'b = [2]', 'c = b'),
      },
      js: 'grow(b);',
      py: 'grow(b)',
      expected: graph(
        { a: ref('a'), b: ref('shared'), c: ref('shared') },
        { a: list(1), shared: list(2, 0) },
      ),
      hint: {
        js: 'Use grow, and pass it a name that refers to the array that should end up longer. Check which names refer to it.',
        py: 'Use grow, and pass it a name that refers to the list that should end up longer. Check which names refer to it.',
      },
      hints: [
        {
          variable: 'a',
          aliasing: 'shared',
          message: 'a must stay separate from b and c. grow changes only the container it is passed.',
        },
        {
          variable: 'c',
          aliasing: 'separate',
          message: 'b and c must still share one container. grow changes the container its parameter refers to, so every name for it sees the change.',
        },
      ],
      about: {
        js: 'A function changes whichever array it is passed, whatever name the caller used for it. Use the starter function to change just the array you want.',
        py: 'A function changes whichever list it is passed, whatever name the caller used for it. Use the starter function to change just the list you want.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>grow(b);</code> passes <code>b</code>\'s array to <code>grow</code>. Inside the function, <code>arr</code> refers to that array, and <code>arr.push(0);</code> changes it in place to <code>[2, 0]</code>.</p>',
            py: '<p><code>grow(b)</code> passes <code>b</code>\'s list to <code>grow</code>. Inside the function, <code>arr</code> refers to that list, and <code>arr.append(0)</code> changes it in place to <code>[2, 0]</code>.</p>',
          },
        },
        {
          html: '<p><code>c</code> is another name for that same container, so it sees the change too. <code>a</code> was not passed to <code>grow</code>, so it still refers to <code>[1]</code>.</p>',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('shared'), c: ref('shared') },
            { a: list(1), shared: list(2, 0) },
          ),
          caption: 'Correct: b and c share the grown container, and a is unchanged.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('shared'), c: ref('shared') },
            { a: list(1, 0), shared: list(2) },
          ),
          caption: 'Not correct: calling grow(a) changes a instead of b and c.',
          verdict: 'incorrect',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b'), c: ref('c') },
            { a: list(1), b: list(2, 0), c: list(2) },
          ),
          caption: 'Not correct: c refers to the same container as b, so it cannot be left behind.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> <code>grow(c)</code>. The function receives the same container whichever of its two names you pass.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>b.push(0);</code> builds the same picture but skips <code>grow</code>. This puzzle checks that <code>grow</code> is called once, with the array <code>b</code> and <code>c</code> share.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b.append(0)</code> builds the same picture but skips <code>grow</code>. This puzzle checks that <code>grow</code> is called once, with the list <code>b</code> and <code>c</code> share.</p>',
          },
        },
      ],
      process: { runtime: runtime(call('grow', [before('b')], 1)) },
    }),
    draw({
      title: { js: 'A function that returns a new array', py: 'A function that returns a new list' },
      js: lines(
        'function withOne(arr) {',
        '  return arr.concat([1]);',
        '}',
        'let a = [0];',
        'let b = withOne(a);',
      ),
      ts: lines(
        'function withOne(arr: number[]): number[] {',
        '  return arr.concat([1]);',
        '}',
        'let a = [0];',
        'let b = withOne(a);',
      ),
      py: lines(
        'def with_one(arr):',
        '    return arr + [1]',
        '',
        'a = [0]',
        'b = with_one(a)',
      ),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(0), b: list(0, 1) }),
      hint: {
        js: 'Look at what concat does: does it change arr, or build a new array? withOne returns whatever concat gives it.',
        py: 'Look at what + does: does it change arr, or build a new list? with_one returns whatever + gives it.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: {
            js: 'a and b should not share an array. concat builds a new array rather than changing arr, and withOne returns that new one.',
            py: 'a and b should not share a list. + builds a new list rather than changing arr, and with_one returns that new one.',
          },
        },
      ],
      about: {
        js: 'Not every function changes its parameter. A function can build and return a new array, leaving the caller\'s array unchanged.',
        py: 'Not every function changes its parameter. A function can build and return a new list, leaving the caller\'s list unchanged.',
      },
      debrief: [
        {
          html: {
            js: '<p>Inside <code>withOne</code>, <code>arr.concat([1])</code> builds a new array holding <code>0</code> and <code>1</code>, and <code>return</code> hands it back. <code>arr</code> is not changed.</p>',
            py: '<p>Inside <code>with_one</code>, <code>arr + [1]</code> builds a new list holding <code>0</code> and <code>1</code>, and <code>return</code> hands it back. <code>arr</code> is not changed.</p>',
          },
        },
        {
          html: {
            js: '<p>The caller assigns that new array to <code>b</code>. <code>a</code> still refers to the original array <code>[0]</code>.</p>',
            py: '<p>The caller assigns that new list to <code>b</code>. <code>a</code> still refers to the original list <code>[0]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(0), b: list(0, 1) }),
          caption: {
            js: 'Correct: a is unchanged, and b refers to the new array.',
            py: 'Correct: a is unchanged, and b refers to the new list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(0, 1) }),
          caption: {
            js: 'Not correct: this is what you would draw if concat changed arr in place and withOne returned arr.',
            py: 'Not correct: this is what you would draw if + changed arr in place and with_one returned arr.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>A returned array is not always a new one. "Changes it and hands it back" shows a function that returns the very array it was given.</p>',
            py: '<p>A returned list is not always a new one. "Changes it and hands it back" shows a function that returns the very list it was given.</p>',
          },
        },
      ],
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
      ts: lines(
        'function remember(box: { n: number }[], item: { n: number }): void {',
        '  box.push(item);',
        '}',
        'let seen: { n: number }[] = [];',
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
      hint: {
        js: 'Ask whether remember puts p\'s object itself into seen, or a copy of it. Then apply p.n = 2.',
        py: 'Ask whether remember puts p\'s dictionary itself into seen, or a copy of it. Then apply p["n"] = 2.',
      },
      hints: [
        {
          variable: 'p',
          value: 1,
          message:
            'The value 1 is not correct. remember put a reference to p\'s container into seen, not a snapshot, so changing n to 2 through p is visible through seen as well.',
        },
        {
          variable: 'seen',
          aliasing: 'separate',
          message:
            'seen should hold a reference to the very container p refers to, not a copy. A function that stores its parameter stores a reference.',
        },
      ],
      about: {
        js: 'When a function stores its parameter inside an array, it stores a reference to the caller\'s object. Later changes to that object are visible through the array.',
        py: 'When a function stores its parameter inside a list, it stores a reference to the caller\'s dictionary. Later changes to that dictionary are visible through the list.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>remember(seen, p);</code> makes <code>box</code> refer to <code>seen</code>\'s array and <code>item</code> refer to <code>p</code>\'s object. <code>box.push(item);</code> puts a reference to that object into the array. Nothing is copied.</p>',
            py: '<p><code>remember(seen, p)</code> makes <code>box</code> refer to <code>seen</code>\'s list and <code>item</code> refer to <code>p</code>\'s dictionary. <code>box.append(item)</code> puts a reference to that dictionary into the list. Nothing is copied.</p>',
          },
        },
        {
          html: {
            js: '<p><code>p.n = 2;</code> changes the object in place, so the change is visible through both <code>p</code> and <code>seen[0]</code>: they refer to the same object.</p>',
            py: '<p><code>p["n"] = 2</code> changes the dictionary in place, so the change is visible through both <code>p</code> and <code>seen[0]</code>: they refer to the same dictionary.</p>',
          },
        },
        {
          diagram: graph(
            { seen: ref('seen'), p: ref('p') },
            { seen: list(ref('p')), p: dict({ n: 2 }) },
          ),
          caption: {
            js: 'Correct: seen\'s only slot refers to p\'s object, which has n: 2.',
            py: 'Correct: seen\'s only slot refers to p\'s dictionary, which has "n": 2.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { seen: ref('seen'), p: ref('p') },
            { seen: list(ref('old_p')), old_p: dict({ n: 1 }), p: dict({ n: 2 }) },
          ),
          caption: 'Not correct: this is what you would draw if remember stored a snapshot of p.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Nothing in the line <code>remember(seen, p);</code> shows that <code>seen</code> now shares <code>p</code>\'s object. A function that stores what it is given creates sharing you can only see by reading the function.</p>',
            py: '<p>Nothing in the line <code>remember(seen, p)</code> shows that <code>seen</code> now shares <code>p</code>\'s dictionary. A function that stores what it is given creates sharing you can only see by reading the function.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Pairing a row',
      given: {
        js: lines('function pair(x) {', '  return [x, x];', '}', 'let row = [8];'),
        ts: lines(
          'function pair(x: number[]): number[][] {',
          '  return [x, x];',
          '}',
          'let row: number[] = [8];',
        ),
        py: lines('def pair(x):', '    return [x, x]', '', 'row = [8]'),
      },
      js: 'let grid = pair(row);',
      ts: 'let grid: number[][] = pair(row);',
      py: 'grid = pair(row)',
      expected: graph(
        { row: ref('row'), grid: ref('grid') },
        { grid: list(ref('row'), ref('row')), row: list(8) },
      ),
      hint: {
        js: 'Build grid by calling pair. Look at what pair puts in each slot of the array it returns.',
        py: 'Build grid by calling pair. Look at what pair puts in each slot of the list it returns.',
      },
      hints: [
        {
          variable: 'grid',
          aliasing: 'separate',
          message:
            'Both slots of grid should point to the one container row refers to. Passing row to pair does not copy it.',
        },
      ],
      about: {
        js: 'A function that puts its parameter into the array it returns stores a reference to the caller\'s container, not a copy. Use the starter function to build the picture.',
        py: 'A function that puts its parameter into the list it returns stores a reference to the caller\'s container, not a copy. Use the starter function to build the picture.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let grid = pair(row);</code> passes <code>row</code>\'s array to <code>pair</code>, where the parameter <code>x</code> refers to it.</p>',
            py: '<p><code>grid = pair(row)</code> passes <code>row</code>\'s list to <code>pair</code>, where the parameter <code>x</code> refers to it.</p>',
          },
        },
        {
          html: {
            js: '<p><code>return [x, x];</code> builds one new outer array whose two slots both point to the array <code>x</code> refers to, which is <code>row</code>\'s. Nothing is copied.</p>',
            py: '<p><code>return [x, x]</code> builds one new outer list whose two slots both point to the list <code>x</code> refers to, which is <code>row</code>\'s. Nothing is copied.</p>',
          },
        },
        {
          diagram: graph(
            { row: ref('row'), grid: ref('grid') },
            { grid: list(ref('row'), ref('row')), row: list(8) },
          ),
          caption: {
            js: 'Correct: both slots of grid refer to the one array row refers to.',
            py: 'Correct: both slots of grid refer to the one list row refers to.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { row: ref('row'), grid: ref('grid') },
            { grid: list(ref('r1'), ref('r2')), row: list(8), r1: list(8), r2: list(8) },
          ),
          caption: 'Not correct: this is what you would draw if passing row to pair made copies of it.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let grid = [row, row];</code> builds the same picture but skips <code>pair</code>. This puzzle checks that <code>pair</code> is called once, with <code>row</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>grid = [row, row]</code> builds the same picture but skips <code>pair</code>. This puzzle checks that <code>pair</code> is called once, with <code>row</code>.</p>',
          },
        },
      ],
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
      ts: lines(
        'function addOne(arr: number[]): number[] {',
        '  arr.push(1);',
        '  return arr;',
        '}',
        'let a: number[] = [];',
        'let b = addOne(a);',
      ),
      py: lines(
        'def add_one(arr):',
        '    arr.append(1)',
        '    return arr',
        '',
        'a = []',
        'b = add_one(a)',
      ),
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1) }),
      hint: {
        js: 'Follow the reference that return arr hands back. Is it a new array, or one that already exists?',
        py: 'Follow the reference that return arr hands back. Is it a new list, or one that already exists?',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'a and b should share one container. return arr hands back the container arr refers to, which is a\'s, without copying it.',
        },
      ],
      about: {
        js: 'A function that returns its parameter hands back a reference to the caller\'s own array, not a copy. The caller\'s variable and the variable that receives the result become aliases.',
        py: 'A function that returns its parameter hands back a reference to the caller\'s own list, not a copy. The caller\'s variable and the variable that receives the result become aliases.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>addOne(a)</code> passes <code>a</code>\'s array into <code>addOne</code>. <code>arr.push(1);</code> changes that array in place.</p>',
            py: '<p><code>add_one(a)</code> passes <code>a</code>\'s list into <code>add_one</code>. <code>arr.append(1)</code> changes that list in place.</p>',
          },
        },
        {
          html: {
            js: '<p>Then <code>return arr;</code> hands back a reference to that same array. Assigning it to <code>b</code> makes <code>b</code> another name for the array <code>a</code> already refers to.</p>',
            py: '<p>Then <code>return arr</code> hands back a reference to that same list. Assigning it to <code>b</code> makes <code>b</code> another name for the list <code>a</code> already refers to.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1) }),
          caption: {
            js: 'Correct: a and b share one array.',
            py: 'Correct: a and b share one list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1) }),
          caption: 'Not correct: this is what you would draw if return made a copy.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Whether a returned array is new depends on what the function returns, not on the call. Compare "A function that returns a new array", where <code>concat</code> built a new one.</p>',
            py: '<p>Whether a returned list is new depends on what the function returns, not on the call. Compare "A function that returns a new list", where <code>+</code> built a new one.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Add without changing it',
      given: {
        js: 'let cart = ["tea"];',
        ts: 'let cart: string[] = ["tea"];',
        py: 'cart = ["tea"]',
      },
      then: {
        js: 'let order = withMilk(cart);',
        ts: 'let order: string[] = withMilk(cart);',
        py: 'order = with_milk(cart)',
      },
      js: lines('function withMilk(items) {', '  return items.concat(["milk"]);', '}'),
      ts: lines('function withMilk(items: string[]): string[] {', '  return items.concat(["milk"]);', '}'),
      py: lines('def with_milk(items):', '    return items + ["milk"]'),
      expected: graph(
        { cart: ref('cart'), order: ref('order') },
        { cart: list('tea'), order: list('tea', 'milk') },
      ),
      constraints: [
        {
          rule: {
            js: 'Your boss said withMilk must work for any cart. If another programmer updates the code so that the cart starts as ["coffee"], order must be ["coffee", "milk"].',
            py: 'Your boss said with_milk must work for any cart. If another programmer updates the code so that the cart starts as ["coffee"], order must be ["coffee", "milk"].',
          },
          cases: [
            {
              change: 'cart starts as ["coffee"]',
              given: {
                js: 'let cart = ["coffee"];',
                ts: 'let cart: string[] = ["coffee"];',
                py: 'cart = ["coffee"]',
              },
              expected: graph(
                { cart: ref('cart'), order: ref('order') },
                { cart: list('coffee'), order: list('coffee', 'milk') },
              ),
            },
          ],
        },
      ],
      hint: {
        js: 'Write a function withMilk that returns a new array made from its parameter plus "milk", leaving the array it was given unchanged.',
        py: 'Write a function with_milk that returns a new list made from its parameter plus "milk", leaving the list it was given unchanged.',
      },
      hints: [
        {
          variable: 'order',
          aliasing: 'shared',
          message: {
            js: 'cart and order share one array, so withMilk changed cart in place and returned it. Build a new array and return that, leaving the parameter alone.',
            py: 'cart and order share one list, so with_milk changed cart in place and returned it. Build a new list and return that, leaving the parameter alone.',
          },
        },
      ],
      about: {
        js: 'A function that builds and returns a new array leaves the caller\'s array unchanged. The code after yours calls withMilk(cart), so the function must work for whatever cart it is given.',
        py: 'A function that builds and returns a new list leaves the caller\'s list unchanged. The code after yours calls with_milk(cart), so the function must work for whatever cart it is given.',
      },
      debrief: [
        {
          html: {
            js: '<p>The code after yours runs <code>let order = withMilk(cart);</code>. Inside <code>withMilk</code>, <code>items</code> refers to <code>cart</code>\'s array, and <code>items.concat(["milk"])</code> builds a new array with <code>"milk"</code> added. <code>return</code> hands that new array to <code>order</code>.</p>',
            py: '<p>The code after yours runs <code>order = with_milk(cart)</code>. Inside <code>with_milk</code>, <code>items</code> refers to <code>cart</code>\'s list, and <code>items + ["milk"]</code> builds a new list with <code>"milk"</code> added. <code>return</code> hands that new list to <code>order</code>.</p>',
          },
        },
        {
          html: '<p>Nothing changed the container <code>items</code> refers to, so <code>cart</code> still refers to <code>["tea"]</code>.</p>',
        },
        {
          diagram: graph(
            { cart: ref('cart'), order: ref('order') },
            { cart: list('tea'), order: list('tea', 'milk') },
          ),
          caption: 'Correct: cart still refers to ["tea"], and order refers to a separate ["tea", "milk"].',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { cart: ref('shared'), order: ref('shared') },
            { shared: list('tea', 'milk') },
          ),
          caption: {
            js: 'Not correct: this is what happens if withMilk pushes onto its parameter and returns it. cart changes too.',
            py: 'Not correct: this is what happens if with_milk appends to its parameter and returns it. cart changes too.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>return [...items, "milk"];</code>, or copying first with <code>[...items]</code> and pushing <code>"milk"</code> onto the copy before returning it. Either way the array that <code>cart</code> refers to is never changed.</p>',
            py: '<p><strong>Also correct:</strong> copying first with <code>list(items)</code> and appending <code>"milk"</code> to the copy before returning it. The list that <code>cart</code> refers to is never changed.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>items.push("milk"); return items;</code> changes <code>cart</code> as well. <code>return ["tea", "milk"];</code> builds the right picture but breaks the boss\'s constraint when <code>cart</code> starts as <code>["coffee"]</code>.</p>',
            py: '<p><strong>Not accepted:</strong> appending <code>"milk"</code> to <code>items</code> and returning <code>items</code> changes <code>cart</code> as well. <code>return ["tea", "milk"]</code> builds the right picture but breaks the boss\'s constraint when <code>cart</code> starts as <code>["coffee"]</code>.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Change it for everyone',
      given: {
        js: lines('let cart = ["tea"];', 'let saved = cart;'),
        ts: lines('let cart: string[] = ["tea"];', 'let saved: string[] = cart;'),
        py: lines('cart = ["tea"]', 'saved = cart'),
      },
      then: {
        js: 'addMilk(cart);',
        py: 'add_milk(cart)',
      },
      js: lines('function addMilk(items) {', '  items.push("milk");', '}'),
      ts: lines('function addMilk(items: string[]): void {', '  items.push("milk");', '}'),
      py: lines('def add_milk(items):', '    items.append("milk")'),
      expected: graph(
        { cart: ref('shared'), saved: ref('shared') },
        { shared: list('tea', 'milk') },
      ),
      process: {
        hidden: [
          {
            given: {
              js: lines('let cart = ["coffee"];', 'let saved = cart;'),
              ts: lines('let cart: string[] = ["coffee"];', 'let saved: string[] = cart;'),
              py: lines('cart = ["coffee"]', 'saved = cart'),
            },
            then: { js: '', py: '' },
            expected: graph({ cart: ref('shared'), saved: ref('shared') }, { shared: list('coffee') }),
            message: {
              js: 'Put the change inside addMilk. Your code changed cart before addMilk was called, so the function does nothing when it runs.',
              py: 'Put the change inside add_milk. Your code changed cart before add_milk was called, so the function does nothing when it runs.',
            },
          },
        ],
      },
      hint: {
        js: 'Write a function addMilk that changes the array it is given in place, rather than building a new one.',
        py: 'Write a function add_milk that changes the list it is given in place, rather than building a new one.',
      },
      hints: [
        {
          variable: 'cart',
          aliasing: 'separate',
          message:
            'cart and saved must keep sharing one container. Change the parameter\'s container in place instead of repointing any variable.',
        },
        {
          variable: 'cart',
          length: 1,
          message: {
            js: 'cart should hold two items. Reassigning items to a new array, such as items.concat(["milk"]), only repoints items. To change the array cart refers to, add to the array items refers to.',
            py: 'cart should hold two items. Reassigning items to a new list, such as items + ["milk"], only repoints items. To change the list cart refers to, add to the list items refers to.',
          },
        },
      ],
      about: {
        js: 'To change an array so that every variable referring to it sees the change, write a function that changes its parameter in place. The code after yours calls addMilk(cart), so the change must happen inside the function.',
        py: 'To change a list so that every variable referring to it sees the change, write a function that changes its parameter in place. The code after yours calls add_milk(cart), so the change must happen inside the function.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>cart</code> and <code>saved</code> start out sharing one array. The code after yours runs <code>addMilk(cart);</code>, which makes <code>items</code> refer to that same array.</p>',
            py: '<p><code>cart</code> and <code>saved</code> start out sharing one list. The code after yours runs <code>add_milk(cart)</code>, which makes <code>items</code> refer to that same list.</p>',
          },
        },
        {
          html: {
            js: '<p><code>items.push("milk");</code> changes that array in place. Because <code>cart</code> and <code>saved</code> are aliases for it, both see <code>["tea", "milk"]</code>.</p>',
            py: '<p><code>items.append("milk")</code> changes that list in place. Because <code>cart</code> and <code>saved</code> are aliases for it, both see <code>["tea", "milk"]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { cart: ref('shared'), saved: ref('shared') },
            { shared: list('tea', 'milk') },
          ),
          caption: {
            js: 'Correct: changing the array in place changes it for both cart and saved.',
            py: 'Correct: changing the list in place changes it for both cart and saved.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { cart: ref('shared'), saved: ref('shared') },
            { shared: list('tea') },
          ),
          caption: {
            js: 'Not correct: this is what happens if addMilk reassigns items to items.concat(["milk"]). Only items moves; cart and saved still share ["tea"].',
            py: 'Not correct: this is what happens if add_milk reassigns items to items + ["milk"]. Only items moves; cart and saved still share ["tea"].',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> returning <code>items</code> after pushing. The code after yours ignores the result.</p>',
            py: '<p><strong>Also correct:</strong> returning <code>items</code> after appending. The code after yours ignores the result.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> pushing <code>"milk"</code> onto <code>cart</code> yourself and leaving <code>addMilk</code> empty. The game runs your code again without the call that follows it, and the function must be the one that makes the change.</p>',
            py: '<p><strong>Not accepted:</strong> appending <code>"milk"</code> to <code>cart</code> yourself and leaving <code>add_milk</code> empty. The game runs your code again without the call that follows it, and the function must be the one that makes the change.</p>',
          },
        },
        {
          html: {
            js: '<p>Compare this with "Add without changing it", where the original array had to be left alone, so the function built and returned a new one. Here every alias must see the change, so the function changes its parameter in place.</p>',
            py: '<p>Compare this with "Add without changing it", where the original list had to be left alone, so the function built and returned a new one. Here every alias must see the change, so the function changes its parameter in place.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Moving a finished task',
      given: {
        js: lines('let todo = ["wash"];', 'let done = [];'),
        ts: lines('let todo: string[] = ["wash"];', 'let done: string[] = [];'),
        py: lines('todo = ["wash"]', 'done = []'),
      },
      then: {
        js: 'finish(todo, done);',
        py: 'finish(todo, done)',
      },
      js: lines('function finish(tasks, finished) {', '  finished.push(tasks[0]);', '  tasks.pop();', '}'),
      ts: lines('function finish(tasks: string[], finished: string[]): void {', '  finished.push(tasks[0]);', '  tasks.pop();', '}'),
      py: lines('def finish(tasks, finished):', '    finished.append(tasks[0])', '    tasks.pop()'),
      expected: graph({ todo: ref('todo'), done: ref('done') }, { todo: list(), done: list('wash') }),
      constraints: [
        {
          rule: 'Your boss said finish must work for any task. If another programmer updates the code so that todo starts as ["dry"], done must end up as ["dry"] and todo must end up empty.',
          cases: [
            {
              change: 'todo starts as ["dry"]',
              given: {
                js: lines('let todo = ["dry"];', 'let done = [];'),
                ts: lines('let todo: string[] = ["dry"];', 'let done: string[] = [];'),
                py: lines('todo = ["dry"]', 'done = []'),
              },
              expected: graph({ todo: ref('todo'), done: ref('done') }, { todo: list(), done: list('dry') }),
            },
          ],
        },
      ],
      process: {
        hidden: [
          {
            given: {
              js: lines('let todo = ["dry"];', 'let done = [];'),
              ts: lines('let todo: string[] = ["dry"];', 'let done: string[] = [];'),
              py: lines('todo = ["dry"]', 'done = []'),
            },
            then: { js: '', py: '' },
            expected: graph({ todo: ref('todo'), done: ref('done') }, { todo: list('dry'), done: list() }),
            message: 'Put the changes inside finish. Your code moved the task before finish was called, so the function does nothing when it runs.',
          },
        ],
      },
      hint: {
        js: 'Write a function finish that changes both arrays it is given in place: one gains the task and the other loses it.',
        py: 'Write a function finish that changes both lists it is given in place: one gains the task and the other loses it.',
      },
      hints: [
        {
          variable: 'todo',
          length: 1,
          message:
            'todo should be empty. Reassigning a parameter to a new empty container only repoints the parameter; to empty the caller\'s container, remove the task from it in place.',
        },
      ],
      about: {
        js: 'A function can empty its caller\'s array only by changing that array in place. Reassigning the parameter to a new empty array repoints the parameter and leaves the caller\'s array as it was. The code after yours calls finish(todo, done).',
        py: 'A function can empty its caller\'s list only by changing that list in place. Reassigning the parameter to a new empty list repoints the parameter and leaves the caller\'s list as it was. The code after yours calls finish(todo, done).',
      },
      debrief: [
        {
          html: {
            js: '<p>The code after yours runs <code>finish(todo, done);</code>. Inside <code>finish</code>, <code>tasks</code> refers to <code>todo</code>\'s array and <code>finished</code> refers to <code>done</code>\'s array.</p>',
            py: '<p>The code after yours runs <code>finish(todo, done)</code>. Inside <code>finish</code>, <code>tasks</code> refers to <code>todo</code>\'s list and <code>finished</code> refers to <code>done</code>\'s list.</p>',
          },
        },
        {
          html: {
            js: '<p><code>finished.push(tasks[0]);</code> adds <code>"wash"</code> to <code>done</code>\'s array in place, and <code>tasks.pop();</code> removes it from <code>todo</code>\'s array in place. Both changes are made to the caller\'s own arrays, so both last after <code>finish</code> returns.</p>',
            py: '<p><code>finished.append(tasks[0])</code> adds <code>"wash"</code> to <code>done</code>\'s list in place, and <code>tasks.pop()</code> removes it from <code>todo</code>\'s list in place. Both changes are made to the caller\'s own lists, so both last after <code>finish</code> returns.</p>',
          },
        },
        {
          diagram: graph({ todo: ref('todo'), done: ref('done') }, { todo: list(), done: list('wash') }),
          caption: 'Correct: todo is empty and done holds "wash".',
          verdict: 'correct',
        },
        {
          diagram: graph({ todo: ref('todo'), done: ref('done') }, { todo: list('wash'), done: list('wash') }),
          caption: {
            js: 'Not correct: this is what happens if finish ends with tasks = [];. Only the parameter tasks moves to the new empty array; todo still refers to ["wash"].',
            py: 'Not correct: this is what happens if finish ends with tasks = []. Only the parameter tasks moves to the new empty list; todo still refers to ["wash"].',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>finished.push(tasks.pop());</code>, because <code>pop</code> hands back the item it removes.</p>',
            py: '<p><strong>Also correct:</strong> <code>finished.append(tasks.pop())</code>, because <code>pop</code> hands back the item it removes, or emptying the list with <code>tasks.clear()</code> instead of <code>tasks.pop()</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>finished.push(tasks[0]); tasks = [];</code> keeps the push, which changed <code>done</code>\'s array in place, but loses the reassignment, which only moved <code>tasks</code>. <code>finished.push("wash");</code> builds the right picture but breaks the boss\'s constraint when <code>todo</code> starts as <code>["dry"]</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>finished.append(tasks[0])</code> followed by <code>tasks = []</code> keeps the append, which changed <code>done</code>\'s list in place, but loses the reassignment, which only moved <code>tasks</code>. <code>finished.append("wash")</code> builds the right picture but breaks the boss\'s constraint when <code>todo</code> starts as <code>["dry"]</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>Compare "Change it for everyone", where reassigning the parameter could not grow the caller\'s array. Here it cannot empty it. Only changes made in place reach the caller.</p>',
            py: '<p>Compare "Change it for everyone", where reassigning the parameter could not grow the caller\'s list. Here it cannot empty it. Only changes made in place reach the caller.</p>',
          },
        },
      ],
    }),
  ],
  [
    draw({
      title: 'A function that changes an alias',
      js: lines('function mark(o) {', '  o.seen = true;', '}', 'let a = {};', 'let b = a;', 'mark(b);'),
      ts: lines('function mark(o: { seen?: boolean }): void {', '  o.seen = true;', '}', 'let a: { seen?: boolean } = {};', 'let b = a;', 'mark(b);'),
      py: lines('def mark(o):', '    o["seen"] = True', '', 'a = {}', 'b = a', 'mark(b)'),
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ seen: true }) }),
      hint: {
        js: 'Count how many objects exist before mark is called, then follow o.',
        py: 'Count how many dictionaries exist before mark is called, then follow o.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'a and b should share one container. b = a made them aliases, and mark changes that one container in place.',
        },
      ],
      about: {
        js: 'When two variables refer to the same object, passing either one to a function that changes its parameter changes the object for both.',
        py: 'When two variables refer to the same dictionary, passing either one to a function that changes its parameter changes the dictionary for both.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = a;</code> makes <code>b</code> an alias for <code>a</code>\'s object. When <code>mark(b);</code> runs, the parameter <code>o</code> becomes a third name for that same object.</p>',
            py: '<p><code>b = a</code> makes <code>b</code> an alias for <code>a</code>\'s dictionary. When <code>mark(b)</code> runs, the parameter <code>o</code> becomes a third name for that same dictionary.</p>',
          },
        },
        {
          html: {
            js: '<p><code>o.seen = true;</code> changes that shared object in place, so both <code>a</code> and <code>b</code> see <code>seen: true</code>.</p>',
            py: '<p><code>o["seen"] = True</code> changes that shared dictionary in place, so both <code>a</code> and <code>b</code> see <code>"seen": True</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ seen: true }) }),
          caption: {
            js: 'Correct: a and b share one object, which now has seen: true.',
            py: 'Correct: a and b share one dictionary, which now has "seen": True.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: dict({}), b: dict({ seen: true }) }),
          caption: {
            js: 'Not correct: b = a does not copy the object, so a sees the change too.',
            py: 'Not correct: b = a does not copy the dictionary, so a sees the change too.',
          },
          verdict: 'incorrect',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({}) }),
          caption: {
            js: 'Not correct: this is what you would draw if mark worked on its own copy of the object.',
            py: 'Not correct: this is what you would draw if mark worked on its own copy of the dictionary.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Restocking a shelf',
      given: {
        js: lines('let shelf = { items: ["jam"] };', 'let old = shelf.items;'),
        ts: lines(
          'let shelf: { items: string[] } = { items: ["jam"] };',
          'let old: string[] = shelf.items;',
        ),
        py: lines('shelf = {"items": ["jam"]}', 'old = shelf["items"]'),
      },
      then: {
        js: 'restock(shelf);',
        py: 'restock(shelf)',
      },
      js: lines('function restock(s) {', '  s.items = [];', '}'),
      ts: lines('function restock(s: { items: string[] }): void {', '  s.items = [];', '}'),
      py: lines('def restock(s):', '    s["items"] = []'),
      expected: graph(
        { shelf: ref('shelf'), old: ref('old') },
        { shelf: dict({ items: ref('fresh') }), fresh: list(), old: list('jam') },
      ),
      process: {
        runtime: runtime(preserve('shelf')),
        hidden: [
          {
            given: {
              js: lines('let shelf = { items: ["jam"] };', 'let old = shelf.items;'),
              ts: lines(
                'let shelf: { items: string[] } = { items: ["jam"] };',
                'let old: string[] = shelf.items;',
              ),
              py: lines('shelf = {"items": ["jam"]}', 'old = shelf["items"]'),
            },
            then: { js: '', py: '' },
            expected: graph(
              { shelf: ref('shelf'), old: ref('items') },
              { shelf: dict({ items: ref('items') }), items: list('jam') },
            ),
            message:
              'Put the change inside restock. Your code changed shelf before restock was called, so the function does nothing when it runs.',
          },
        ],
      },
      hint: {
        js: 'The function has to change the object its parameter refers to, and old must still see ["jam"]. Think about the difference between changing an array and changing which array a slot refers to.',
        py: 'The function has to change the dictionary its parameter refers to, and old must still see ["jam"]. Think about the difference between changing a list and changing which list a slot refers to.',
      },
      hints: [
        {
          variable: 'old',
          aliasing: 'shared',
          message:
            'old and the list in the items slot of shelf should be separate lists. Changing a list in place changes it for every name that refers to it, so the new empty list has to be a different list from the one old refers to.',
        },
        {
          variable: 'shelf',
          length: 1,
          message: {
            js: 'The items slot of shelf should refer to an empty array. Reassigning the parameter only repoints the parameter; it never changes the object shelf refers to. Change that object through the parameter.',
            py: 'The items slot of shelf should refer to an empty list. Reassigning the parameter only repoints the parameter; it never changes the dictionary shelf refers to. Change that dictionary through the parameter.',
          },
        },
      ],
      about: {
        js: 'A function changes its caller\'s object by changing the object its parameter refers to. Replacing what a slot refers to leaves the old array alone, while emptying that array changes it for every name that refers to it. The code after yours calls restock(shelf), so the change must happen inside the function.',
        py: 'A function changes its caller\'s dictionary by changing the dictionary its parameter refers to. Replacing what a slot refers to leaves the old list alone, while emptying that list changes it for every name that refers to it. The code after yours calls restock(shelf), so the change must happen inside the function.',
      },
      debrief: [
        {
          html: {
            js: '<p>The code after yours runs <code>restock(shelf);</code>, so whichever parameter name you chose (we\'ll use <code>s</code> in these examples) refers to <code>shelf</code>\'s object. <code>old</code> was taken from the <code>items</code> slot before that, so it refers to the array <code>["jam"]</code>.</p>',
            py: '<p>The code after yours runs <code>restock(shelf)</code>, so whichever parameter name you chose (we\'ll use <code>s</code> in these examples) refers to <code>shelf</code>\'s dictionary. <code>old</code> was taken from the <code>"items"</code> slot before that, so it refers to the list <code>["jam"]</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>Reassigning the slot through that parameter, as in <code>s.items = [];</code>, builds a new empty array and makes the <code>items</code> slot refer to it. That changes <code>shelf</code>\'s object in place, so the caller sees it. The array <code>["jam"]</code> is not touched, and <code>old</code> still refers to it.</p>',
            py: '<p>Reassigning the slot through that parameter, as in <code>s["items"] = []</code>, builds a new empty list and makes the <code>"items"</code> slot refer to it. That changes <code>shelf</code>\'s dictionary in place, so the caller sees it. The list <code>["jam"]</code> is not touched, and <code>old</code> still refers to it.</p>',
          },
        },
        {
          diagram: graph(
            { shelf: ref('shelf'), old: ref('old') },
            { shelf: dict({ items: ref('fresh') }), fresh: list(), old: list('jam') },
          ),
          caption: {
            js: 'Correct: shelf refers to a new empty array, and old still refers to ["jam"].',
            py: 'Correct: shelf refers to a new empty list, and old still refers to ["jam"].',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { shelf: ref('shelf'), old: ref('shared') },
            { shelf: dict({ items: ref('shared') }), shared: list('jam') },
          ),
          caption: {
            js: 'Not correct: this is what you get if restock reassigns its parameter, as in s = { items: [] }. Only the parameter moves to the new object; shelf is untouched.',
            py: 'Not correct: this is what you get if restock reassigns its parameter, as in s = {"items": []}. Only the parameter moves to the new dictionary; shelf is untouched.',
          },
          verdict: 'incorrect',
        },
        {
          diagram: graph(
            { shelf: ref('shelf'), old: ref('shared') },
            { shelf: dict({ items: ref('shared') }), shared: list() },
          ),
          caption: {
            js: 'Not correct: this is what you get if restock empties the array in place. old refers to that same array, so it is emptied too.',
            py: 'Not correct: this is what you get if restock empties the list in place. old refers to that same list, so it is emptied too.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>Object.assign(s, { items: [] });</code>, which also gives the object a new array in its <code>items</code> slot.</p>',
            py: '<p><strong>Also correct:</strong> <code>s.update({"items": []})</code> or <code>s["items"] = list()</code>, which also give the dictionary a new list in its <code>"items"</code> slot.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>s.items.length = 0;</code> empties the array that <code>old</code> refers to, so <code>old</code> loses <code>"jam"</code>. Reassigning the parameter itself, as in <code>s = { items: [] };</code>, repoints only the parameter. Changing <code>shelf</code> outside <code>restock</code> is also rejected: the game runs your code again without the call that follows it, and the function must be the one that makes the change.</p>',
            py: '<p><strong>Not accepted:</strong> <code>s["items"].clear()</code> empties the list that <code>old</code> refers to, so <code>old</code> loses <code>"jam"</code>. Reassigning the parameter itself, as in <code>s = {"items": []}</code>, repoints only the parameter. Changing <code>shelf</code> outside <code>restock</code> is also rejected: the game runs your code again without the call that follows it, and the function must be the one that makes the change.</p>',
          },
        },
        {
          html: {
            js: '<p>Compare "Moving a finished task", where the caller\'s array was emptied in place. Here the array has another name, so replacing it is the only way to leave <code>old</code> alone.</p>',
            py: '<p>Compare "Moving a finished task", where the caller\'s list was emptied in place. Here the list has another name, so replacing it is the only way to leave <code>old</code> alone.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Tagging in place',
      given: {
        js: lines('let a = { n: 1 };', 'let b = { n: 2 };'),
        ts: lines(
          'let a: { n: number; tagged?: boolean } = { n: 1 };',
          'let b: { n: number; tagged?: boolean } = { n: 2 };',
        ),
        py: lines('a = {"n": 1}', 'b = {"n": 2}'),
      },
      then: {
        js: 'tag(a);',
        py: 'tag(a)',
      },
      js: lines('function tag(o) {', '  o.tagged = true;', '}'),
      ts: lines('function tag(o: { n: number; tagged?: boolean }): void {', '  o.tagged = true;', '}'),
      py: lines('def tag(o):', '    o["tagged"] = True'),
      expected: graph(
        { a: ref('a'), b: ref('b') },
        { a: dict({ n: 1, tagged: true }), b: dict({ n: 2 }) },
      ),
      constraints: [
        {
          rule: 'Your boss said tag must tag whichever object it is given. If another programmer updates the code so that tag is called on b instead of a, b must be tagged and a must not be.',
          cases: [
            {
              change: 'tag is called on b instead of a',
              given: {
                js: lines('let a = { n: 1 };', 'let b = { n: 2 };'),
                ts: lines(
                  'let a: { n: number; tagged?: boolean } = { n: 1 };',
                  'let b: { n: number; tagged?: boolean } = { n: 2 };',
                ),
                py: lines('a = {"n": 1}', 'b = {"n": 2}'),
              },
              then: { js: 'tag(b);', py: 'tag(b)' },
              expected: graph(
                { a: ref('a'), b: ref('b') },
                { a: dict({ n: 1 }), b: dict({ n: 2, tagged: true }) },
              ),
            },
          ],
        },
      ],
      hint: {
        js: 'Write a function tag that adds the key tagged to the object it is given.',
        py: 'Write a function tag that adds the key "tagged" to the dictionary it is given.',
      },
      hints: [
        {
          variable: 'a',
          missingKey: 'tagged',
          message: {
            js: 'a should have the key tagged. Reassigning the parameter to a new object, even a tagged copy, only repoints the parameter. To tag a\'s object, add the key to the object the parameter refers to.',
            py: 'a should have the key "tagged". Reassigning the parameter to a new dictionary, even a tagged copy, only repoints the parameter. To tag a\'s dictionary, add the key to the dictionary the parameter refers to.',
          },
        },
      ],
      about: {
        js: 'A function that must tag the caller\'s object has to add the key to the object its parameter refers to. Building a tagged copy and reassigning the parameter leaves the caller\'s object untagged.',
        py: 'A function that must tag the caller\'s dictionary has to add the key to the dictionary its parameter refers to. Building a tagged copy and reassigning the parameter leaves the caller\'s dictionary untagged.',
      },
      debrief: [
        {
          html: {
            js: '<p>The code after yours runs <code>tag(a);</code>, so <code>o</code> refers to <code>a</code>\'s object. <code>o.tagged = true;</code> adds the <code>tagged</code> property to that object in place. <code>b</code> was never passed to <code>tag</code>, so it still refers to <code>{ n: 2 }</code>.</p>',
            py: '<p>The code after yours runs <code>tag(a)</code>, so <code>o</code> refers to <code>a</code>\'s dictionary. <code>o["tagged"] = True</code> adds the <code>"tagged"</code> key to that dictionary in place. <code>b</code> was never passed to <code>tag</code>, so it still refers to <code>{"n": 2}</code>.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: dict({ n: 1, tagged: true }), b: dict({ n: 2 }) },
          ),
          caption: {
            js: 'Correct: a\'s object has tagged: true, and b\'s object is unchanged.',
            py: 'Correct: a\'s dictionary has "tagged": True, and b\'s dictionary is unchanged.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: dict({ n: 1 }), b: dict({ n: 2 }) }),
          caption: {
            js: 'Not correct: this is what you get if tag builds a tagged copy with o = { ...o, tagged: true }. Only the parameter moves to the copy, so a is untouched.',
            py: 'Not correct: this is what you get if tag builds a tagged copy with o = dict(o) and then adds the key to that copy. Only the parameter moves to the copy, so a is untouched.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>Object.assign(o, { tagged: true });</code>, which adds the property to the object <code>o</code> refers to.</p>',
            py: '<p><strong>Also correct:</strong> <code>o.update({"tagged": True})</code>, which adds the key to the dictionary <code>o</code> refers to.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>a.tagged = true;</code> inside the function builds the right picture but breaks the boss\'s constraint when <code>tag</code> is called on <code>b</code> instead.</p>',
            py: '<p><strong>Not accepted:</strong> <code>a["tagged"] = True</code> inside the function builds the right picture but breaks the boss\'s constraint when <code>tag</code> is called on <code>b</code> instead.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Copying a parameter before changing it',
      js: lines(
        'function withNine(arr) {',
        '  arr = [...arr];',
        '  arr[0] = 9;',
        '  return arr;',
        '}',
        'let a = [5];',
        'let b = withNine(a);',
      ),
      ts: lines(
        'function withNine(arr: number[]): number[] {',
        '  arr = [...arr];',
        '  arr[0] = 9;',
        '  return arr;',
        '}',
        'let a = [5];',
        'let b = withNine(a);',
      ),
      py: lines(
        'def with_nine(arr):',
        '    arr = list(arr)',
        '    arr[0] = 9',
        '    return arr',
        '',
        'a = [5]',
        'b = with_nine(a)',
      ),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(5), b: list(9) }),
      hint: {
        js: 'Watch which array arr refers to when arr[0] = 9 runs, and which array return hands back.',
        py: 'Watch which list arr refers to when arr[0] = 9 runs, and which list return hands back.',
      },
      hints: [
        {
          variable: 'a',
          value: 9,
          message:
            'The value 9 is not correct for a. Reassigning arr to a copy points arr at a new container, so arr[0] = 9 changes the copy, not the container a refers to.',
        },
      ],
      about: {
        js: 'If a function reassigns its parameter to a copy before changing it, the change lands in the copy and the caller\'s array is untouched. Returning the copy hands the change back.',
        py: 'If a function reassigns its parameter to a copy before changing it, the change lands in the copy and the caller\'s list is untouched. Returning the copy hands the change back.',
      },
      debrief: [
        {
          html: {
            js: '<p>When <code>withNine(a)</code> is called, <code>arr</code> refers to <code>a</code>\'s array <code>[5]</code>. <code>arr = [...arr];</code> builds a copy and repoints <code>arr</code> at it, so <code>a</code> still refers to the original.</p>',
            py: '<p>When <code>with_nine(a)</code> is called, <code>arr</code> refers to <code>a</code>\'s list <code>[5]</code>. <code>arr = list(arr)</code> builds a copy and repoints <code>arr</code> at it, so <code>a</code> still refers to the original.</p>',
          },
        },
        {
          html: '<p><code>arr[0] = 9</code> changes the copy to <code>[9]</code>, and <code>return arr</code> hands that copy to <code>b</code>.</p>',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(5), b: list(9) }),
          caption: 'Correct: a still refers to [5], and b refers to the changed copy [9].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(9) }),
          caption: 'Not correct: reassigning arr repointed only arr, so the change never reached a.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Copying a parameter first is a common way to keep a function from changing its caller\'s container. The function must then return the copy, or the change is lost.</p>',
        },
      ],
    }),
    draw({
      title: { js: 'Passing an inner array', py: 'Passing an inner list' },
      js: lines(
        'function zero(arr) {',
        '  arr[0] = 0;',
        '}',
        'let grid = [[1], [2]];',
        'zero(grid[0]);',
      ),
      ts: lines(
        'function zero(arr: number[]): void {',
        '  arr[0] = 0;',
        '}',
        'let grid = [[1], [2]];',
        'zero(grid[0]);',
      ),
      py: lines(
        'def zero(arr):',
        '    arr[0] = 0',
        '',
        'grid = [[1], [2]]',
        'zero(grid[0])',
      ),
      expected: graph(
        { grid: ref('grid') },
        {
          grid: list(ref('first'), ref('second')),
          first: list(0),
          second: list(2),
        },
      ),
      hint: {
        js: 'grid[0] looks up the array in slot 0 of grid. Follow that arrow into zero.',
        py: 'grid[0] looks up the list in slot 0 of grid. Follow that arrow into zero.',
      },
      hints: [
        {
          variable: 'grid',
          value: 1,
          message:
            'The value 1 is not correct. grid[0] hands zero the inner container itself, not a copy, so arr[0] = 0 changes the container in slot 0 of grid.',
        },
      ],
      about: {
        js: 'Passing a slot such as grid[0] to a function passes a reference to the inner array in that slot. The function can change that inner array in place.',
        py: 'Passing a slot such as grid[0] to a function passes a reference to the inner list in that slot. The function can change that inner list in place.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>grid</code> is an array whose first slot refers to the inner array <code>[1]</code> and whose second slot refers to <code>[2]</code>.</p>',
            py: '<p><code>grid</code> is a list whose first slot refers to the inner list <code>[1]</code> and whose second slot refers to <code>[2]</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><code>zero(grid[0]);</code> looks up the inner array in slot 0 and passes it to <code>zero</code>. The parameter <code>arr</code> refers to that inner array, not to a copy.</p>',
            py: '<p><code>zero(grid[0])</code> looks up the inner list in slot 0 and passes it to <code>zero</code>. The parameter <code>arr</code> refers to that inner list, not to a copy.</p>',
          },
        },
        {
          html: {
            js: '<p><code>arr[0] = 0;</code> changes that inner array in place to <code>[0]</code>. The outer array and the second inner array are unchanged.</p>',
            py: '<p><code>arr[0] = 0</code> changes that inner list in place to <code>[0]</code>. The outer list and the second inner list are unchanged.</p>',
          },
        },
        {
          diagram: graph(
            { grid: ref('grid') },
            {
              grid: list(ref('first'), ref('second')),
              first: list(0),
              second: list(2),
            },
          ),
          caption: {
            js: 'Correct: zero changed the inner array in slot 0 of grid.',
            py: 'Correct: zero changed the inner list in slot 0 of grid.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { grid: ref('grid') },
            {
              grid: list(ref('first'), ref('second')),
              first: list(1),
              second: list(2),
            },
          ),
          caption: 'Not correct: this is what you would draw if passing grid[0] passed a copy of the inner container.',
          verdict: 'incorrect',
        },
      ],
    }),
  ],
)
