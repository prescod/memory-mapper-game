import { dict, graph, list, ref } from '../builders'
import { after, before, call, preserve, runtime } from '../process'
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
      py: lines('def setFirst(arr):', '    arr[0] = 2', '', 'a = [1]', 'setFirst(a)'),
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
            py: '<p>Calling <code>setFirst(a)</code> does not copy the list. The parameter <code>arr</code> starts out referring to the same list as <code>a</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><code>arr[0] = 2;</code> changes slot 0 of that array in place. When <code>setFirst</code> finishes, <code>arr</code> disappears, but the change stays in the array that <code>a</code> still refers to.</p>',
            py: '<p><code>arr[0] = 2</code> changes slot 0 of that list in place. When <code>setFirst</code> finishes, <code>arr</code> disappears, but the change stays in the list that <code>a</code> still refers to.</p>',
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
          html: '<p>The next puzzle shows the contrast: a function that reassigns its parameter instead of changing what it refers to.</p>',
        },
      ],
    }),
    draw({
      title: 'A function that reassigns its parameter',
      js: lines('function reset(arr) {', '  arr = [0];', '}', 'let a = [1];', 'reset(a);'),
      py: lines('def reset(arr):', '    arr = [0]', '', 'a = [1]', 'reset(a)'),
      expected: graph({ a: ref('a') }, { a: list(1) }),
      hint: 'Ask what arr = [0] moves: the arrow from arr, or the arrow from a.',
      hints: [
        {
          variable: 'a',
          value: 0,
          message:
            'The value 0 is not correct. Reassigning the parameter arr moves only arr\'s arrow; it never repoints the caller\'s variable a.',
        },
      ],
      about: {
        js: 'A parameter is a variable of its own. Reassigning it inside the function points it at a new array and leaves the caller\'s variable alone.',
        py: 'A parameter is a variable of its own. Reassigning it inside the function points it at a new list and leaves the caller\'s variable alone.',
      },
      debrief: [
        {
          html: {
            js: '<p>When <code>reset(a)</code> is called, the parameter <code>arr</code> refers to the same array <code>[1]</code> as <code>a</code>.</p>',
            py: '<p>When <code>reset(a)</code> is called, the parameter <code>arr</code> refers to the same list <code>[1]</code> as <code>a</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><code>arr = [0];</code> builds a new array and repoints <code>arr</code> at it. It moves only <code>arr</code>\'s arrow; it does not change the old array and cannot repoint <code>a</code>.</p>',
            py: '<p><code>arr = [0]</code> builds a new list and repoints <code>arr</code> at it. It moves only <code>arr</code>\'s arrow; it does not change the old list and cannot repoint <code>a</code>.</p>',
          },
        },
        {
          html: '<p>When the function finishes, the parameter disappears. <code>a</code> still refers to <code>[1]</code>.</p>',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(1) }),
          caption: 'Correct: a still refers to [1].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(0) }),
          caption: 'Not correct: reassigning a parameter does not repoint the caller\'s variable.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> drawing the new array <code>[0]</code> with nothing pointing to it. Once <code>reset</code> returns, nothing refers to it, so it is garbage and is never checked.</p>',
            py: '<p><strong>Also correct:</strong> drawing the new list <code>[0]</code> with nothing pointing to it. Once <code>reset</code> returns, nothing refers to it, so it is garbage and is never checked.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Call it on the right array', py: 'Call it on the right list' },
      given: {
        js: lines('function grow(arr) {', '  arr.push(0);', '}', 'let a = [1];', 'let b = [2];'),
        py: lines('def grow(arr):', '    arr.append(0)', '', 'a = [1]', 'b = [2]'),
      },
      js: 'grow(b);',
      py: 'grow(b)',
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(2, 0) }),
      hint: {
        js: 'Use grow, and pass it the array that should end up longer.',
        py: 'Use grow, and pass it the list that should end up longer.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b must stay separate containers. Passing b to grow changes only the container b refers to.',
        },
      ],
      about: {
        js: 'A function that changes its parameter changes whichever array you pass to it, and no other. Use the starter function to change just the array you want.',
        py: 'A function that changes its parameter changes whichever list you pass to it, and no other. Use the starter function to change just the list you want.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>grow(b);</code> passes <code>b</code>\'s array to <code>grow</code>. Inside the function, <code>arr</code> refers to that array, and <code>arr.push(0);</code> changes it in place to <code>[2, 0]</code>.</p>',
            py: '<p><code>grow(b)</code> passes <code>b</code>\'s list to <code>grow</code>. Inside the function, <code>arr</code> refers to that list, and <code>arr.append(0)</code> changes it in place to <code>[2, 0]</code>.</p>',
          },
        },
        {
          html: '<p><code>a</code> was not passed to <code>grow</code>, so it still refers to <code>[1]</code>.</p>',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(2, 0) }),
          caption: 'Correct: only b was grown.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 0), b: list(2) }),
          caption: 'Not correct: calling grow(a) changes a instead of b.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>b.push(0);</code> builds the same picture but skips <code>grow</code>. This puzzle checks that <code>grow</code> is called once, with <code>b</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b.append(0)</code> builds the same picture but skips <code>grow</code>. This puzzle checks that <code>grow</code> is called once, with <code>b</code>.</p>',
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
      py: lines(
        'def withOne(arr):',
        '    return arr + [1]',
        '',
        'a = [0]',
        'b = withOne(a)',
      ),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(0), b: list(0, 1) }),
      hint: {
        js: 'Look at what concat does: does it change arr, or build a new array? withOne returns whatever concat gives it.',
        py: 'Look at what + does: does it change arr, or build a new list? withOne returns whatever + gives it.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. concat and + build a new container rather than changing arr, and withOne returns that new one.',
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
            py: '<p>Inside <code>withOne</code>, <code>arr + [1]</code> builds a new list holding <code>0</code> and <code>1</code>, and <code>return</code> hands it back. <code>arr</code> is not changed.</p>',
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
            py: 'Not correct: this is what you would draw if + changed arr in place and withOne returned arr.',
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
    write({
      title: 'Pairing a row',
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
      py: lines(
        'def addOne(arr):',
        '    arr.append(1)',
        '    return arr',
        '',
        'a = []',
        'b = addOne(a)',
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
            py: '<p><code>addOne(a)</code> passes <code>a</code>\'s list into <code>addOne</code>. <code>arr.append(1)</code> changes that list in place.</p>',
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
        py: 'cart = ["tea"]',
      },
      then: {
        js: 'let order = withMilk(cart);',
        py: 'order = withMilk(cart)',
      },
      js: lines('function withMilk(items) {', '  return items.concat(["milk"]);', '}'),
      py: lines('def withMilk(items):', '    return items + ["milk"]'),
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
        js: 'Write a function withMilk that returns a new array made from its parameter plus "milk", leaving the array it was given unchanged.',
        py: 'Write a function withMilk that returns a new list made from its parameter plus "milk", leaving the list it was given unchanged.',
      },
      hints: [
        {
          variable: 'order',
          aliasing: 'shared',
          message:
            'cart and order share one container, so withMilk changed cart in place and returned it. Build a new container and return that, leaving the parameter alone.',
        },
      ],
      about: {
        js: 'A function that builds and returns a new array leaves the caller\'s array unchanged. The code after yours calls withMilk(cart), so the function must work for whatever cart it is given.',
        py: 'A function that builds and returns a new list leaves the caller\'s list unchanged. The code after yours calls withMilk(cart), so the function must work for whatever cart it is given.',
      },
      debrief: [
        {
          html: {
            js: '<p>The code after yours runs <code>let order = withMilk(cart);</code>. Inside <code>withMilk</code>, <code>items</code> refers to <code>cart</code>\'s array, and <code>items.concat(["milk"])</code> builds a new array with <code>"milk"</code> added. <code>return</code> hands that new array to <code>order</code>.</p>',
            py: '<p>The code after yours runs <code>order = withMilk(cart)</code>. Inside <code>withMilk</code>, <code>items</code> refers to <code>cart</code>\'s list, and <code>items + ["milk"]</code> builds a new list with <code>"milk"</code> added. <code>return</code> hands that new list to <code>order</code>.</p>',
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
            py: 'Not correct: this is what happens if withMilk appends to its parameter and returns it. cart changes too.',
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
      title: 'Change it for everyone',
      given: {
        js: lines('let cart = ["tea"];', 'let saved = cart;'),
        py: lines('cart = ["tea"]', 'saved = cart'),
      },
      then: {
        js: 'addMilk(cart);',
        py: 'addMilk(cart)',
      },
      js: lines('function addMilk(items) {', '  items.push("milk");', '}'),
      py: lines('def addMilk(items):', '    items.append("milk")'),
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
        js: 'Write a function addMilk that changes the array it is given in place, rather than building a new one.',
        py: 'Write a function addMilk that changes the list it is given in place, rather than building a new one.',
      },
      hints: [
        {
          variable: 'cart',
          aliasing: 'separate',
          message:
            'cart and saved must keep sharing one container. Change the parameter\'s container in place instead of repointing any variable.',
        },
      ],
      about: {
        js: 'To change an array so that every variable referring to it sees the change, write a function that changes its parameter in place. The code after yours calls addMilk(cart).',
        py: 'To change a list so that every variable referring to it sees the change, write a function that changes its parameter in place. The code after yours calls addMilk(cart).',
      },
      debrief: [
        {
          html: {
            js: '<p><code>cart</code> and <code>saved</code> start out sharing one array. The code after yours runs <code>addMilk(cart);</code>, which makes <code>items</code> refer to that same array.</p>',
            py: '<p><code>cart</code> and <code>saved</code> start out sharing one list. The code after yours runs <code>addMilk(cart)</code>, which makes <code>items</code> refer to that same list.</p>',
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
            py: 'Not correct: this is what happens if addMilk reassigns items to items + ["milk"]. Only items moves; cart and saved still share ["tea"].',
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
            js: '<p>Compare this with "Add without changing it", where the boss needed the original array left alone, so the function built and returned a new one. Here the boss needs every alias to see the change, so the function changes its parameter in place.</p>',
            py: '<p>Compare this with "Add without changing it", where the boss needed the original list left alone, so the function built and returned a new one. Here the boss needs every alias to see the change, so the function changes its parameter in place.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Filling two arrays', py: 'Filling two lists' },
      given: {
        js: lines('function fill(arr) {', '  arr.push(0);', '  arr = [1];', '  arr.push(2);', '}'),
        py: lines('def fill(arr):', '    arr.append(0)', '    arr = [1]', '    arr.append(2)'),
      },
      js: lines('let a = [];', 'let b = [];', 'fill(a);', 'fill(a);', 'fill(b);'),
      py: lines('a = []', 'b = []', 'fill(a)', 'fill(a)', 'fill(b)'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(0, 0), b: list(0) }),
      hint: {
        js: 'Work out what one call to fill leaves in the caller\'s array. Then decide how many times to call it on each array.',
        py: 'Work out what one call to fill leaves in the caller\'s list. Then decide how many times to call it on each list.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b must be separate containers. Create each one as its own empty container before calling fill.',
        },
      ],
      about: {
        js: 'A function can change its parameter, reassign it, and change it again. Only the changes made before the reassignment reach the caller\'s array.',
        py: 'A function can change its parameter, reassign it, and change it again. Only the changes made before the reassignment reach the caller\'s list.',
      },
      debrief: [
        {
          html: {
            js: '<p>In each call to <code>fill</code>, <code>arr.push(0);</code> adds <code>0</code> to the caller\'s array in place. Then <code>arr = [1];</code> repoints <code>arr</code> at a new array, and <code>arr.push(2);</code> changes that new array, which is garbage once <code>fill</code> returns.</p>',
            py: '<p>In each call to <code>fill</code>, <code>arr.append(0)</code> adds <code>0</code> to the caller\'s list in place. Then <code>arr = [1]</code> repoints <code>arr</code> at a new list, and <code>arr.append(2)</code> changes that new list, which is garbage once <code>fill</code> returns.</p>',
          },
        },
        {
          html: {
            js: '<p>So each call adds exactly one <code>0</code> to the array it was given. Calling <code>fill(a)</code> twice gives <code>a</code> two zeros, and calling <code>fill(b)</code> once gives <code>b</code> one.</p>',
            py: '<p>So each call adds exactly one <code>0</code> to the list it was given. Calling <code>fill(a)</code> twice gives <code>a</code> two zeros, and calling <code>fill(b)</code> once gives <code>b</code> one.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(0, 0), b: list(0) }),
          caption: {
            js: 'Correct: each call to fill adds one 0 to the caller\'s array.',
            py: 'Correct: each call to fill adds one 0 to the caller\'s list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2) }),
          caption: 'Not correct: this is what you would expect if arr = [1] repointed the caller\'s variable. Every call would leave the caller with [1, 2].',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> making the three calls in any order, such as calling <code>fill(b)</code> between the two calls to <code>fill(a)</code>.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> building <code>[0, 0]</code> and <code>[0]</code> without calling <code>fill</code>, or pushing the zeros yourself. This puzzle checks that <code>fill(a)</code> runs twice and <code>fill(b)</code> runs once.</p>',
            py: '<p><strong>Not accepted:</strong> building <code>[0, 0]</code> and <code>[0]</code> without calling <code>fill</code>, or appending the zeros yourself. This puzzle checks that <code>fill(a)</code> runs twice and <code>fill(b)</code> runs once.</p>',
          },
        },
      ],
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
      hint: {
        js: 'The starter code already shares one array between a and b. Find the single call to touch that leaves the picture shown.',
        py: 'The starter code already shares one list between a and b. Find the single call to touch that leaves the picture shown.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'a and b should still share one container. touch changes slot 0 of that container in place, and both names see it.',
        },
      ],
      about: {
        js: 'Changing a slot inside a function changes the caller\'s array in place. Reassigning the parameter afterward has no effect outside the function.',
        py: 'Changing a slot inside a function changes the caller\'s list in place. Reassigning the parameter afterward has no effect outside the function.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>touch(b);</code> passes the shared array to <code>touch</code>. <code>arr[0] = "new";</code> changes slot 0 in place, so the array becomes <code>["new", "old"]</code>.</p>',
            py: '<p><code>touch(b)</code> passes the shared list to <code>touch</code>. <code>arr[0] = "new"</code> changes slot 0 in place, so the list becomes <code>["new", "old"]</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>The next line, <code>arr = ["other"];</code>, repoints only the parameter <code>arr</code>. <code>a</code> and <code>b</code> still share <code>["new", "old"]</code>.</p>',
            py: '<p>The next line, <code>arr = ["other"]</code>, repoints only the parameter <code>arr</code>. <code>a</code> and <code>b</code> still share <code>["new", "old"]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('new', 'old') }),
          caption: {
            js: 'Correct: slot 0 of the shared array is now "new"; ["other"] is garbage.',
            py: 'Correct: slot 0 of the shared list is now "new"; ["other"] is garbage.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('other') }),
          caption: 'Not correct: this is what you would expect if arr = ["other"] repointed the caller\'s variables.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>touch(a);</code>. <code>a</code> and <code>b</code> refer to the same array, so the function receives the same array either way.</p>',
            py: '<p><strong>Also correct:</strong> <code>touch(a)</code>. <code>a</code> and <code>b</code> refer to the same list, so the function receives the same list either way.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>b[0] = "new";</code> builds the same picture but skips <code>touch</code>. This puzzle checks that <code>touch</code> is called once, with the shared array.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b[0] = "new"</code> builds the same picture but skips <code>touch</code>. This puzzle checks that <code>touch</code> is called once, with the shared list.</p>',
          },
        },
      ],
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
      hint: {
        js: 'Create the two objects shown without the tagged key, then call tag on the one that should end up tagged.',
        py: 'Create the two dictionaries shown without the "tagged" key, then call tag on the one that should end up tagged.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'a and b must be separate containers, each with its own n.',
        },
      ],
      about: {
        js: 'When a function changes its parameter and then reassigns it, only the changes made before the reassignment reach the caller\'s object.',
        py: 'When a function changes its parameter and then reassigns it, only the changes made before the reassignment reach the caller\'s dictionary.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>tag(a);</code> passes <code>a</code>\'s object to <code>tag</code>. <code>o.tagged = true;</code> adds the <code>tagged</code> property to that object in place.</p>',
            py: '<p><code>tag(a)</code> passes <code>a</code>\'s dictionary to <code>tag</code>. <code>o["tagged"] = True</code> adds the <code>"tagged"</code> key to that dictionary in place.</p>',
          },
        },
        {
          html: {
            js: '<p><code>o = {};</code> repoints <code>o</code> at a new empty object. <code>o.lost = true;</code> changes that new object, which is garbage once <code>tag</code> returns. <code>b</code> was never passed to <code>tag</code>, so it still refers to <code>{ n: 2 }</code>.</p>',
            py: '<p><code>o = {}</code> repoints <code>o</code> at a new empty dictionary. <code>o["lost"] = True</code> changes that new dictionary, which is garbage once <code>tag</code> returns. <code>b</code> was never passed to <code>tag</code>, so it still refers to <code>{"n": 2}</code>.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: dict({ n: 1, tagged: true }), b: dict({ n: 2 }) },
          ),
          caption: {
            js: 'Correct: tag(a) adds tagged: true to a; lost: true went to an object that is now garbage.',
            py: 'Correct: tag(a) adds "tagged": True to a; "lost": True went to a dictionary that is now garbage.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: dict({ n: 1, tagged: true, lost: true }), b: dict({ n: 2 }) },
          ),
          caption: {
            js: 'Not correct: o = {} points o at a new object, so lost: true never reaches a.',
            py: 'Not correct: o = {} points o at a new dictionary, so "lost": True never reaches a.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> creating <code>a</code> with <code>tagged: true</code> already in it instead of calling <code>tag(a)</code>. This puzzle checks that <code>tag</code> is called once, with <code>a</code>.</p>',
            py: '<p><strong>Not accepted:</strong> creating <code>a</code> with <code>"tagged": True</code> already in it instead of calling <code>tag(a)</code>. This puzzle checks that <code>tag</code> is called once, with <code>a</code>.</p>',
          },
        },
      ],
      process: { runtime: runtime(call('tag', [after('a')], 1)) },
    }),
    draw({
      title: 'Copying a parameter before changing it',
      js: lines('function f(arr) {', '  arr = [...arr];', '  arr[0] = 9;', '}', 'let a = [5];', 'f(a);'),
      py: lines('def f(arr):', '    arr = list(arr)', '    arr[0] = 9', '', 'a = [5]', 'f(a)'),
      expected: graph({ a: ref('a') }, { a: list(5) }),
      hint: {
        js: 'Watch which array arr refers to when arr[0] = 9 runs.',
        py: 'Watch which list arr refers to when arr[0] = 9 runs.',
      },
      hints: [
        {
          variable: 'a',
          value: 9,
          message:
            'The value 9 is not correct. Reassigning arr to a copy points arr at a new container, so arr[0] = 9 changes the copy, not the container a refers to.',
        },
      ],
      about: {
        js: 'If a function reassigns its parameter before changing it, even to a copy of the same array, the change lands in the new array and the caller\'s array is untouched.',
        py: 'If a function reassigns its parameter before changing it, even to a copy of the same list, the change lands in the new list and the caller\'s list is untouched.',
      },
      debrief: [
        {
          html: {
            js: '<p>When <code>f(a);</code> is called, <code>arr</code> refers to <code>a</code>\'s array <code>[5]</code>.</p>',
            py: '<p>When <code>f(a)</code> is called, <code>arr</code> refers to <code>a</code>\'s list <code>[5]</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><code>arr = [...arr];</code> builds a copy and repoints <code>arr</code> at it. <code>a</code> is not affected and still refers to the original.</p>',
            py: '<p><code>arr = list(arr)</code> builds a copy and repoints <code>arr</code> at it. <code>a</code> is not affected and still refers to the original.</p>',
          },
        },
        {
          html: '<p><code>arr[0] = 9</code> changes the copy. When <code>f</code> returns, nothing refers to the copy any more, so it is garbage.</p>',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(5) }),
          caption: 'Correct: a still refers to [5], because the change went to the copy.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(9) }),
          caption: 'Not correct: reassigning arr repointed only arr, so arr[0] = 9 never reached a.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Copying a parameter first is a common way to keep a function from changing its caller\'s container. If the caller needs the changed version, the function must return the copy.</p>',
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
