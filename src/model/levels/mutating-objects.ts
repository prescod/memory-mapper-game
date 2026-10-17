import { dict, graph, ref, withGarbage } from '../builders'
import { after, before, preserve, runtime, sameObject } from '../process'
import type { UnnumberedLevel } from '../types'
import { draw, L, level, lines, write } from './common'

export const mutatingObjectsLevel: UnnumberedLevel = level(
  'mutating-objects',
  L('Changing Objects', 'Changing Dictionaries'),
  L(
    'Adding, changing, or deleting a key changes the object itself, so every variable that refers to it sees the change. Assigning a brand new object to a variable repoints only that variable; the old object is untouched.',
    'Adding, changing, or deleting a key changes the dictionary itself, so every variable that refers to it sees the change. Assigning a brand new dictionary to a variable repoints only that variable; the old dictionary is untouched.',
  ),
  [
    draw({
      title: 'Adding a key',
      js: lines('let p = { n: 1 };', 'p.m = 2;'),
      py: lines('p = {"n": 1}', 'p["m"] = 2'),
      expected: graph({ p: ref('p') }, { p: dict({ n: 1, m: 2 }) }),
      hint: {
        js: 'Adding a property changes the object in place: p ends with n holding 1 and m holding 2.',
        py: 'Adding a key changes the dictionary in place: p ends with "n" holding 1 and "m" holding 2.',
      },
      about: {
        js: 'Assigning to a property that does not yet exist adds that key to the existing object in place. The object grows; no new object is created.',
        py: 'Assigning to a key that does not yet exist adds that key to the existing dictionary in place. The dictionary grows; no new dictionary is created.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let p = { n: 1 };</code> creates an object with one key and points <code>p</code> at it. Then <code>p.m = 2;</code> adds the key <code>m</code>, pointing to <code>2</code>, to that same object in place.</p>',
            py: '<p><code>p = {"n": 1}</code> creates a dictionary with one key and points <code>p</code> at it. Then <code>p["m"] = 2</code> adds the key <code>"m"</code>, pointing to <code>2</code>, to that same dictionary in place.</p>',
          },
        },
        {
          html: {
            js: '<p>No new object was created, and <code>p</code> was not reassigned. It still refers to the object from the first line, which now has two keys.</p>',
            py: '<p>No new dictionary was created, and <code>p</code> was not reassigned. It still refers to the dictionary from the first line, which now has two keys.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ n: 1, m: 2 }) }),
          caption: {
            js: 'Correct: one object, now with keys n and m.',
            py: 'Correct: one dictionary, now with keys "n" and "m".',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ m: 2 }) }),
          caption: {
            js: 'Not correct: this is what p = { m: 2 } would build. Adding a key keeps the keys already there.',
            py: 'Not correct: this is what p = {"m": 2} would build. Adding a key keeps the keys already there.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>In place:</strong> Adding a property changes the object itself. You do not need to reassign <code>p</code> to keep the new key.</p>',
            py: '<p><strong>In place:</strong> Adding a key changes the dictionary itself. You do not need to reassign <code>p</code> to keep the new key.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Fill an empty object', py: 'Fill an empty dictionary' },
      given: { js: 'let p = {};', ts: 'let p: { width?: number; height?: number } = {};', py: 'p = {}' },
      js: lines('p.width = 4;', 'p.height = 2;'),
      py: lines('p["width"] = 4', 'p["height"] = 2'),
      expected: graph({ p: ref('p') }, { p: dict({ width: 4, height: 2 }) }),
      hint: {
        js: 'Add properties width holding 4 and height holding 2 to p in place.',
        py: 'Add keys "width" holding 4 and "height" holding 2 to p in place.',
      },
      about: {
        js: 'An empty object can be filled one property at a time. Each assignment adds a key to the existing object in place, so the variable keeps referring to the same object.',
        py: 'An empty dictionary can be filled one key at a time. Each assignment adds a key to the existing dictionary in place, so the variable keeps referring to the same dictionary.',
      },
      process: { runtime: runtime(preserve('p')) },
      debrief: [
        {
          html: {
            js: '<p>Assigning <code>p.width = 4;</code> and <code>p.height = 2;</code> adds both properties to the existing empty object in place. <code>p</code> still refers to the starter object.</p>',
            py: '<p>Assigning <code>p["width"] = 4</code> and <code>p["height"] = 2</code> adds both keys to the existing empty dictionary in place. <code>p</code> still refers to the starter dictionary.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ width: 4, height: 2 }) }),
          caption: {
            js: 'Correct: the starter object now has width and height.',
            py: 'Correct: the starter dictionary now has "width" and "height".',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({}) }),
          caption: {
            js: 'Not correct: the starter object is still empty.',
            py: 'Not correct: the starter dictionary is still empty.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> Reassigning <code>p = { width: 4, height: 2 };</code> creates a brand new object instead of modifying the existing one. The game requires you to preserve the starter object by mutating it in place.</p>',
            py: '<p><strong>Not accepted:</strong> Reassigning <code>p = {"width": 4, "height": 2}</code> creates a brand new dictionary instead of modifying the existing one. The game requires you to preserve the starter dictionary by mutating it in place.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Changing a value',
      js: lines('let p = { n: 1 };', 'p.n = 5;'),
      py: lines('p = {"n": 1}', 'p["n"] = 5'),
      expected: graph({ p: ref('p') }, { p: dict({ n: 5 }) }),
      hint: {
        js: 'Changing property n to 5 updates the same object in place.',
        py: 'Changing key "n" to 5 updates the same dictionary in place.',
      },
      hints: [
        {
          variable: 'p',
          value: 1,
          message:
            'The value 1 is not correct here. Assigning to a key that already exists repoints that key at the new value; the old value does not stay.',
        },
      ],
      about: {
        js: 'Assigning to an existing property replaces the value that key points to. The object itself stays the same; only the arrow for that key moves.',
        py: 'Assigning to an existing key replaces the value that key points to. The dictionary itself stays the same; only the arrow for that key moves.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>p.n = 5;</code> finds the key <code>n</code> on the object and repoints its arrow from 1 to 5. The object identity does not change, and no new object is created.</p>',
            py: '<p><code>p["n"] = 5</code> finds the key <code>"n"</code> on the dictionary and repoints its arrow from 1 to 5. The dictionary identity does not change, and no new dictionary is created.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ n: 5 }) }),
          caption: {
            js: 'Correct: key n now refers to 5.',
            py: 'Correct: key "n" now refers to 5.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ n: 1 }) }),
          caption: {
            js: 'Not correct: p.n = 5 repoints the key n, so it no longer refers to 1.',
            py: 'Not correct: p["n"] = 5 repoints the key "n", so it no longer refers to 1.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the old 1 on the canvas with nothing pointing to it. It is garbage, which the checker ignores.</p>',
        },
        {
          diagram: withGarbage(graph({ p: ref('p') }, { p: dict({ n: 5 }) }), 1),
          caption: 'Also correct: the replaced 1 left behind as garbage.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p>Keys inside an object act like variable names: each key is an arrow pointing to a value. Reassigning a property moves that arrow to the new value.</p>',
            py: '<p>Keys inside a dictionary act like variable names: each key is an arrow pointing to a value. Reassigning a key moves that arrow to the new value.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Changing through an alias',
      js: lines('let x = { n: 1 };', 'let y = x;', 'y.n = 2;'),
      py: lines('x = {"n": 1}', 'y = x', 'y["n"] = 2'),
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: dict({ n: 2 }) }),
      hint: {
        js: 'y = x shares one object, so changing n through y is visible through x: both end with n holding 2.',
        py: 'y = x shares one dictionary, so changing "n" through y is visible through x: both end with "n" holding 2.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y should share one container. y = x does not copy anything: both names point to the same container, so changing n through y is visible through x.',
        },
      ],
      about: {
        js: 'When two variables refer to the same object, modifying a property through one variable changes the object for both. There is only one object in memory.',
        py: 'When two variables refer to the same dictionary, modifying a key through one variable changes the dictionary for both. There is only one dictionary in memory.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> does not copy the object. It points <code>y</code> at the very same object that <code>x</code> refers to.</p>',
            py: '<p><code>y = x</code> does not copy the dictionary. It points <code>y</code> at the very same dictionary that <code>x</code> refers to.</p>',
          },
        },
        {
          html: {
            js: '<p>When <code>y.n = 2;</code> runs, it modifies that single shared object in place. Looking at <code>x.n</code> afterward shows <code>2</code> as well.</p>',
            py: '<p>When <code>y["n"] = 2</code> runs, it modifies that single shared dictionary in place. Looking at <code>x["n"]</code> afterward shows <code>2</code> as well.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: dict({ n: 2 }) }),
          caption: {
            js: 'Correct: x and y share one object, where n now refers to 2.',
            py: 'Correct: x and y share one dictionary, where "n" now refers to 2.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: dict({ n: 1 }), y: dict({ n: 2 }) }),
          caption: {
            js: 'Not correct: this picture treats y as a copy of x. y = x makes an alias, so there is only one object to change.',
            py: 'Not correct: this picture treats y as a copy of x. y = x makes an alias, so there is only one dictionary to change.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>This is the core rule of aliasing: if two names refer to one container, mutating through either name changes what both names see.</p>',
        },
      ],
    }),
    write({
      title: 'Both see it',
      given: {
        js: lines('let x = { n: 1 };', 'let y = x;'),
        ts: lines(
          'let x: { n: number; done?: boolean } = { n: 1 };',
          'let y: { n: number; done?: boolean } = x;',
        ),
        py: lines('x = {"n": 1}', 'y = x'),
      },
      js: 'y.done = true;',
      py: 'y["done"] = True',
      expected: graph(
        { x: ref('shared'), y: ref('shared') },
        { shared: dict({ n: 1, done: true }) },
      ),
      hint: {
        js: 'Add property done holding true to y in place; x shares the same object.',
        py: 'Add key "done" holding True to y in place; x shares the same dictionary.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y point to different containers, but they should still share one. Assigning y a new container repoints only y; add the key to the shared container in place instead.',
        },
      ],
      about: {
        js: 'Adding a property through an alias mutates the shared object. Because both variables refer to that same object, the new property is visible through both names.',
        py: 'Adding a key through an alias mutates the shared dictionary. Because both variables refer to that same dictionary, the new key is visible through both names.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p><code>y.done = true;</code> adds the property <code>done</code> to the object referred to by <code>y</code>. Because <code>x</code> and <code>y</code> are aliases for the same object, <code>x.done</code> is also <code>true</code>.</p>',
            py: '<p><code>y["done"] = True</code> adds the key <code>"done"</code> to the dictionary referred to by <code>y</code>. Because <code>x</code> and <code>y</code> are aliases for the same dictionary, <code>x["done"]</code> is also <code>True</code>.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('shared') },
            { shared: dict({ n: 1, done: true }) },
          ),
          caption: {
            js: 'Correct: x and y both see the new done key.',
            py: 'Correct: x and y both see the new "done" key.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y') },
            { x: dict({ n: 1 }), y: dict({ n: 1, done: true }) },
          ),
          caption: {
            js: 'Not correct: this is what assigning y a new object would build. x would never see done.',
            py: 'Not correct: this is what assigning y a new dictionary would build. x would never see "done".',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>x.done = true;</code> builds the exact same memory picture, because <code>x</code> and <code>y</code> refer to the same object.</p>',
            py: '<p><strong>Also correct:</strong> <code>x["done"] = True</code> builds the exact same memory picture, because <code>x</code> and <code>y</code> refer to the same dictionary.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>y = { n: 1, done: true };</code> repoints only <code>y</code> at a new object, so <code>x</code> and <code>y</code> stop sharing and <code>x</code> never gets the new key.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y = {"n": 1, "done": True}</code> repoints only <code>y</code> at a new dictionary, so <code>x</code> and <code>y</code> stop sharing and <code>x</code> never gets the new key.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Deleting a key',
      js: lines('let p = { a: 1, b: 2 };', 'delete p.b;'),
      py: lines('p = {"a": 1, "b": 2}', 'del p["b"]'),
      expected: graph({ p: ref('p') }, { p: dict({ a: 1 }) }),
      hint: {
        js: 'Deleting property b changes the same object in place, leaving only a holding 1.',
        py: 'Deleting key "b" changes the same dictionary in place, leaving only "a" holding 1.',
      },
      about: {
        js: 'The delete operator removes a property from an object in place. The object itself stays in memory with its remaining keys.',
        py: 'The del statement removes a key from a dictionary in place. The dictionary itself stays in memory with its remaining keys.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>delete p.b;</code> removes the key <code>b</code> and its arrow from the object. The key <code>a</code> and the object itself are untouched.</p>',
            py: '<p><code>del p["b"]</code> removes the key <code>"b"</code> and its arrow from the dictionary. The key <code>"a"</code> and the dictionary itself are untouched.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ a: 1 }) }),
          caption: {
            js: 'Correct: the same object remains, with only key a.',
            py: 'Correct: the same dictionary remains, with only key "a".',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ a: 1, b: null }) }),
          caption: {
            js: 'Not correct: delete removes the key b entirely; it does not leave b pointing to null.',
            py: 'Not correct: del removes the key "b" entirely; it does not leave "b" pointing to None.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the 2 on the canvas with nothing pointing to it. Once its key is gone, it is garbage, which the checker ignores.</p>',
        },
        {
          diagram: withGarbage(graph({ p: ref('p') }, { p: dict({ a: 1 }) }), 2),
          caption: 'Also correct: the 2 left behind as garbage.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p>Notice the syntax: JavaScript uses <code>delete p.b</code> (or <code>delete p["b"]</code>). It changes the object in place without reassigning <code>p</code>.</p>',
            py: '<p>Notice the syntax: Python uses <code>del p["b"]</code>. It changes the dictionary in place without reassigning <code>p</code>.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Rename a key',
      given: {
        js: 'let p = { old: 1 };',
        ts: 'let p: { old?: number; renamed?: number } = { old: 1 };',
        py: 'p = {"old": 1}',
      },
      js: lines('p.renamed = p.old;', 'delete p.old;'),
      py: lines('p["renamed"] = p["old"]', 'del p["old"]'),
      expected: graph({ p: ref('p') }, { p: dict({ renamed: 1 }) }),
      hint: {
        js: 'Point a new property renamed at the value of old, then delete old, changing the same object in place.',
        py: 'Point a new key "renamed" at the value of "old", then delete "old", changing the same dictionary in place.',
      },
      about: {
        js: 'Renaming a key takes two steps: assign the existing value to the new property name, then delete the old property. The object itself is preserved.',
        py: 'Renaming a key takes two steps: assign the existing value to the new key name, then delete the old key with del. The dictionary itself is preserved.',
      },
      process: {
        runtime: runtime(preserve('p')),
        hidden: [
          {
            given: {
              js: 'let p = { old: 7 };',
              ts: 'let p: { old?: number; renamed?: number } = { old: 7 };',
              py: 'p = {"old": 7}',
            },
            expected: graph({ p: ref('p') }, { p: dict({ renamed: 7 }) }),
          },
        ],
      },
      debrief: [
        {
          html: {
            js: '<p>There is no single "rename" operation. Instead, point the new key at the old key\'s value (<code>p.renamed = p.old;</code>), then delete the old key (<code>delete p.old;</code>).</p>',
            py: '<p>There is no single "rename" operation. Instead, point the new key at the old key\'s value (<code>p["renamed"] = p["old"]</code>), then delete the old key (<code>del p["old"]</code>).</p>',
          },
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ renamed: 1 }) }),
          caption: {
            js: 'Correct: key renamed refers to 1 and old is gone.',
            py: 'Correct: key "renamed" refers to 1 and "old" is gone.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ old: 1, renamed: 1 }) }),
          caption: {
            js: 'Not correct: old was not deleted.',
            py: 'Not correct: "old" was not deleted.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Order matters:</strong> deleting first loses the value. After <code>delete p.old;</code>, reading <code>p.old</code> gives <code>undefined</code>, so <code>renamed</code> would point to <code>undefined</code> instead of 1.</p>',
            py: '<p><strong>Order matters:</strong> deleting first loses the value. After <code>del p["old"]</code>, reading <code>p["old"]</code> stops the program with a <code>KeyError</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>p.renamed = 1; delete p.old;</code> builds the right picture here, but only because <code>old</code> happens to start at 1. The checker also reruns your code with <code>old</code> starting at a different number, so the new key must take its value from <code>p.old</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>p["renamed"] = 1</code> followed by <code>del p["old"]</code> builds the right picture here, but only because <code>"old"</code> happens to start at 1. The checker also reruns your code with <code>"old"</code> starting at a different number, so the new key must take its value from <code>p["old"]</code>.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Clear it out',
      given: {
        js: lines('let p = { a: 1, b: 2 };', 'let q = p;'),
        ts: lines(
          'let p: { a?: number; b?: number } = { a: 1, b: 2 };',
          'let q: { a?: number; b?: number } = p;',
        ),
        py: lines('p = {"a": 1, "b": 2}', 'q = p'),
      },
      js: lines('delete p.a;', 'delete p.b;'),
      py: lines('del p["a"]', 'del p["b"]'),
      expected: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({}) }),
      hint: {
        js: 'Remove properties a and b from p in place so p and q end sharing one empty object.',
        py: 'Remove keys "a" and "b" from p in place so p and q end sharing one empty dictionary.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'separate',
          message:
            'p and q point to different containers, but they should still share one. Assigning p a new empty container repoints only p and leaves q with both keys; delete the keys in place instead.',
        },
      ],
      about: {
        js: 'Deleting all keys from an object leaves it empty, but it is still the same object. Any alias pointing to it sees an empty object too.',
        py: 'Deleting all keys from a dictionary leaves it empty, but it is still the same dictionary. Any alias pointing to it sees an empty dictionary too.',
      },
      process: { runtime: runtime(preserve('p')) },
      debrief: [
        {
          html: {
            js: '<p>Deleting both properties (<code>delete p.a; delete p.b;</code>) empties the object in place without creating a new one. Because <code>q</code> refers to that same object, <code>q</code> also sees an empty object.</p>',
            py: '<p>Deleting both keys (<code>del p["a"]</code>, then <code>del p["b"]</code>) empties the dictionary in place without creating a new one. Because <code>q</code> refers to that same dictionary, <code>q</code> also sees an empty dictionary.</p>',
          },
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({}) }),
          caption: {
            js: 'Correct: p and q share the emptied object.',
            py: 'Correct: p and q share the emptied dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { p: ref('p'), q: ref('q') },
            { p: dict({}), q: dict({ a: 1, b: 2 }) },
          ),
          caption: {
            js: 'Not correct: this is what p = {} would build. It repoints p and leaves q with the original object.',
            py: 'Not correct: this is what p = {} would build. It repoints p and leaves q with the original dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> deleting through the alias, <code>delete q.a; delete q.b;</code>, empties the very same object.</p>',
            py: '<p><strong>Also correct:</strong> deleting through the alias, <code>del q["a"]</code> and <code>del q["b"]</code>, empties the very same dictionary. So does <code>p.clear()</code>, which removes every key in place in one call.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>p = {};</code> repoints only <code>p</code>, leaving <code>q</code> pointing to the original object with both keys. To clear the object for both names, you must delete its properties in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>p = {}</code> repoints only <code>p</code>, leaving <code>q</code> pointing to the original dictionary with both keys. To clear the dictionary for both names, you must delete its keys in place.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'A brand new object', py: 'A brand new dictionary' },
      js: lines('let p = { n: 1 };', 'let q = p;', 'p = { n: 9 };'),
      py: lines('p = {"n": 1}', 'q = p', 'p = {"n": 9}'),
      expected: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 1 }), new: dict({ n: 9 }) }),
      hint: {
        js: 'Assigning p a new object with n holding 9 repoints only p; q keeps referring to the original with n holding 1.',
        py: 'Assigning p a new dictionary with "n" holding 9 repoints only p; q keeps referring to the original with "n" holding 1.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'shared',
          message:
            "p and q should not share a container here. Assigning a brand new container to p moves only p's arrow; q still refers to the original, where n is still 1.",
        },
      ],
      about: {
        js: 'Assigning an object literal with = creates a new object and moves the variable arrow to it. It does not change the old object, and any alias still points to the old object.',
        py: 'Assigning a dictionary literal with = creates a new dictionary and moves the variable arrow to it. It does not change the old dictionary, and any alias still points to the old dictionary.',
      },
      debrief: [
        {
          html: {
            js: '<p>The line <code>p = { n: 9 };</code> creates a brand new object in memory and points <code>p</code> at it. This is reassignment, not mutation.</p>',
            py: '<p>The line <code>p = {"n": 9}</code> creates a brand new dictionary in memory and points <code>p</code> at it. This is reassignment, not mutation.</p>',
          },
        },
        {
          html: {
            js: '<p>The original object is untouched. Because <code>q</code> still refers to that original object, <code>q.n</code> remains <code>1</code>.</p>',
            py: '<p>The original dictionary is untouched. Because <code>q</code> still refers to that original dictionary, <code>q["n"]</code> remains <code>1</code>.</p>',
          },
        },
        {
          diagram: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 1 }), new: dict({ n: 9 }) }),
          caption: {
            js: 'Correct: p points to the new object; q points to the original.',
            py: 'Correct: p points to the new dictionary; q points to the original.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 9 }) }),
          caption: {
            js: 'Not correct: this picture has the new object replacing the old one everywhere. Assigning to p moves only p\'s arrow.',
            py: 'Not correct: this picture has the new dictionary replacing the old one everywhere. Assigning to p moves only p\'s arrow.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Compare this to <code>p.n = 9;</code>: property assignment mutates the existing object so all aliases see <code>9</code>. Variable assignment (<code>p = ...</code>) moves only <code>p</code>\'s arrow.</p>',
            py: '<p>Compare this to <code>p["n"] = 9</code>: key assignment mutates the existing dictionary so all aliases see <code>9</code>. Variable assignment (<code>p = ...</code>) moves only <code>p</code>\'s arrow.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Leave the old one behind',
      given: {
        js: lines('let p = { n: 1 };', 'let q = p;'),
        ts: lines(
          'let p: { n: number; m?: number } = { n: 1 };',
          'let q: { n: number; m?: number } = p;',
        ),
        py: lines('p = {"n": 1}', 'q = p'),
      },
      js: lines('p.m = 3;', 'p = { n: 2 };'),
      py: lines('p["m"] = 3', 'p = {"n": 2}'),
      expected: graph(
        { p: ref('new'), q: ref('old') },
        { old: dict({ n: 1, m: 3 }), new: dict({ n: 2 }) },
      ),
      hint: {
        js: 'Add property m holding 3 to p in place, then point p at a new object with n holding 2; q keeps the original with both properties.',
        py: 'Add key "m" holding 3 to p in place, then point p at a new dictionary with "n" holding 2; q keeps the original with both keys.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'shared',
          message:
            "p and q share one container, but they should be separate. Assigning p a new container after adding m moves only p's arrow, so q keeps the original.",
        },
      ],
      about: {
        js: 'You can mutate an object while an alias shares it, and then reassign one variable to a new object. The alias keeps the mutated original.',
        py: 'You can mutate a dictionary while an alias shares it, and then reassign one variable to a new dictionary. The alias keeps the mutated original.',
      },
      process: { runtime: runtime(sameObject(before('p'), after('q'))) },
      debrief: [
        {
          html: {
            js: '<p>First, <code>p.m = 3;</code> mutates the shared object in place, so it now has <code>n: 1</code> and <code>m: 3</code>.</p>',
            py: '<p>First, <code>p["m"] = 3</code> mutates the shared dictionary in place, so it now has <code>"n": 1</code> and <code>"m": 3</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>Next, <code>p = { n: 2 };</code> points <code>p</code> at a new object. <code>q</code> stays pointing at the original, keeping both properties.</p>',
            py: '<p>Next, <code>p = {"n": 2}</code> points <code>p</code> at a new dictionary. <code>q</code> stays pointing at the original, keeping both keys.</p>',
          },
        },
        {
          diagram: graph(
            { p: ref('new'), q: ref('old') },
            { old: dict({ n: 1, m: 3 }), new: dict({ n: 2 }) },
          ),
          caption: {
            js: 'Correct: q keeps the mutated original; p points to the new object.',
            py: 'Correct: q keeps the mutated original; p points to the new dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { p: ref('shared'), q: ref('shared') },
            { shared: dict({ n: 2, m: 3 }) },
          ),
          caption: {
            js: 'Not correct: this is what p.n = 2 would build. Changing a key mutates the shared object; only assigning p a new object separates p from q.',
            py: 'Not correct: this is what p["n"] = 2 would build. Changing a key mutates the shared dictionary; only assigning p a new dictionary separates p from q.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>q.m = 3;</code> in place of <code>p.m = 3;</code>. Before <code>p</code> is reassigned, both names refer to the same object.</p>',
            py: '<p><strong>Also correct:</strong> <code>q["m"] = 3</code> in place of <code>p["m"] = 3</code>. Before <code>p</code> is reassigned, both names refer to the same dictionary.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Order matters:</strong> if you reassigned <code>p</code> first and then wrote <code>p.m = 3;</code>, the new key would land on the new object, and <code>q</code> would never see it.</p>',
            py: '<p><strong>Order matters:</strong> if you reassigned <code>p</code> first and then wrote <code>p["m"] = 3</code>, the new key would land on the new dictionary, and <code>q</code> would never see it.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>q = { n: 1, m: 3 }; p = { n: 2 };</code> builds the same picture with two new objects. The game checks that <code>q</code> still refers to the starter object, so the key must be added to that object in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>q = {"n": 1, "m": 3}</code> followed by <code>p = {"n": 2}</code> builds the same picture with two new dictionaries. The game checks that <code>q</code> still refers to the starter dictionary, so the key must be added to that dictionary in place.</p>',
          },
        },
      ],
    }),
  ],
  [
    draw({
      title: 'Two names, two changes',
      js: lines('let p = { n: 1 };', 'let q = p;', 'q.n = q.n + 1;', 'p.m = 0;'),
      py: lines('p = {"n": 1}', 'q = p', 'q["n"] = q["n"] + 1', 'p["m"] = 0'),
      expected: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 2, m: 0 }) }),
      hint: {
        js: 'p and q name the same object, so both changes land together: n becomes 2 and m holding 0 is added.',
        py: 'p and q name the same dictionary, so both changes land together: "n" becomes 2 and "m" holding 0 is added.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'separate',
          message:
            'p and q should share one container. q = p made them aliases, so changes made through either name land on that one container.',
        },
      ],
      about: {
        js: 'Multiple aliases can make separate changes to the same object. Every change accumulates on that single object in memory.',
        py: 'Multiple aliases can make separate changes to the same dictionary. Every change accumulates on that single dictionary in memory.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>p</code> and <code>q</code> refer to the same object. <code>q.n = q.n + 1;</code> increments <code>n</code> to <code>2</code> on that object, and <code>p.m = 0;</code> adds <code>m: 0</code> to the same object.</p>',
            py: '<p><code>p</code> and <code>q</code> refer to the same dictionary. <code>q["n"] = q["n"] + 1</code> increments <code>"n"</code> to <code>2</code> on that dictionary, and <code>p["m"] = 0</code> adds <code>"m": 0</code> to the same dictionary.</p>',
          },
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 2, m: 0 }) }),
          caption: {
            js: 'Correct: one shared object with both changes.',
            py: 'Correct: one shared dictionary with both changes.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { p: ref('p'), q: ref('q') },
            { p: dict({ n: 1, m: 0 }), q: dict({ n: 2 }) },
          ),
          caption: {
            js: 'Not correct: this picture gives each name its own object. q = p made an alias, so both changes land on one object.',
            py: 'Not correct: this picture gives each name its own dictionary. q = p made an alias, so both changes land on one dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>It does not matter which name was used for each edit: every property access and modification through either <code>p</code> or <code>q</code> targets the same object in memory.</p>',
            py: '<p>It does not matter which name was used for each edit: every key access and modification through either <code>p</code> or <code>q</code> targets the same dictionary in memory.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Swap inside an object', py: 'Swap inside a dictionary' },
      given: {
        js: 'let p = { a: 1, b: 2 };',
        ts: 'let p: { a: number; b: number } = { a: 1, b: 2 };',
        py: 'p = {"a": 1, "b": 2}',
      },
      js: lines('let t = p.a;', 'p.a = p.b;', 'p.b = t;'),
      ts: lines('let t: number = p.a;', 'p.a = p.b;', 'p.b = t;'),
      py: lines('t = p["a"]', 'p["a"] = p["b"]', 'p["b"] = t'),
      expected: graph({ p: ref('p') }, { p: dict({ a: 2, b: 1 }) }),
      hint: {
        js: 'Use a temporary variable to hold the value at property a, then move the value at property b to a and the saved value to b.',
        py: 'Use a temporary variable to hold the value at key "a", then move the value at key "b" to "a" and the saved value to "b".',
      },
      about: {
        js: 'Swapping two values stored under different properties requires saving one value first, just like swapping two variables. The object itself is preserved.',
        py: 'Swapping two values stored under different keys requires saving one value first, just like swapping two variables. The dictionary itself is preserved.',
      },
      process: {
        runtime: runtime(preserve('p')),
        hidden: [
          {
            given: {
              js: 'let p = { a: 5, b: 9 };',
              ts: 'let p: { a: number; b: number } = { a: 5, b: 9 };',
              py: 'p = {"a": 5, "b": 9}',
            },
            expected: graph({ p: ref('p') }, { p: dict({ a: 9, b: 5 }) }),
          },
        ],
      },
      debrief: [
        {
          html: {
            js: '<p>Assigning <code>p.a = p.b;</code> immediately repoints <code>a</code> away from its old value. Saving <code>let t = p.a;</code> first keeps that value reachable so it can be assigned to <code>p.b</code>.</p>',
            py: '<p>Assigning <code>p["a"] = p["b"]</code> immediately repoints <code>"a"</code> away from its old value. Saving <code>t = p["a"]</code> first keeps that value reachable so it can be assigned to <code>p["b"]</code>.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ a: 2, b: 1 }) }),
          caption: {
            js: 'Correct: the values of a and b are swapped in place.',
            py: 'Correct: the values of "a" and "b" are swapped in place.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ a: 2, b: 2 }) }),
          caption: {
            js: 'Not correct: without saving p.a first, the 1 is lost.',
            py: 'Not correct: without saving p["a"] first, the 1 is lost.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> JavaScript destructuring can swap in one line: <code>[p.a, p.b] = [p.b, p.a];</code>.</p>',
            py: '<p><strong>Also correct:</strong> Python tuple unpacking can swap in one line: <code>p["a"], p["b"] = p["b"], p["a"]</code>.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>p.a = 2; p.b = 1;</code> builds the right picture only because you can see the starting numbers. The checker also reruns your code from other starting values, so a real swap must read them from <code>p</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>p["a"] = 2</code> and <code>p["b"] = 1</code> build the right picture only because you can see the starting numbers. The checker also reruns your code from other starting values, so a real swap must read them from <code>p</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Deleting through an alias',
      js: lines('let x = { left: 1, right: 2 };', 'let y = x;', 'delete y.left;'),
      py: lines('x = {"left": 1, "right": 2}', 'y = x', 'del y["left"]'),
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: dict({ right: 2 }) }),
      hint: {
        js: 'y = x shares one object, so deleting property left through y leaves x with only right holding 2.',
        py: 'y = x shares one dictionary, so deleting key "left" through y leaves x with only "right" holding 2.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y should share one container. Deleting a key through y removes it from that shared container, so x sees the key disappear too.',
        },
      ],
      about: {
        js: 'Deleting a property through an alias removes that key from the shared object. Every variable referring to the object sees the key disappear.',
        py: 'Deleting a key through an alias removes that key from the shared dictionary. Every variable referring to the dictionary sees the key disappear.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>delete y.left;</code> mutates the object that <code>y</code> refers to. Because <code>x</code> points to that very same object, the property <code>left</code> is gone when viewed through <code>x</code> as well.</p>',
            py: '<p><code>del y["left"]</code> mutates the dictionary that <code>y</code> refers to. Because <code>x</code> points to that very same dictionary, the key <code>"left"</code> is gone when viewed through <code>x</code> as well.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: dict({ right: 2 }) }),
          caption: {
            js: 'Correct: left was deleted from the shared object.',
            py: 'Correct: "left" was deleted from the shared dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y') },
            { x: dict({ left: 1, right: 2 }), y: dict({ right: 2 }) },
          ),
          caption: {
            js: 'Not correct: this picture deletes left only for y. Deleting through an alias changes the one shared object.',
            py: 'Not correct: this picture deletes "left" only for y. Deleting through an alias changes the one shared dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>There are no "per-variable" properties. Properties belong to the object itself, so deleting one changes the object for all aliases.</p>',
            py: '<p>There are no "per-variable" keys. Keys belong to the dictionary itself, so deleting one changes the dictionary for all aliases.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'The alias kept the original object', py: 'The alias kept the original dictionary' },
      js: lines('let p = { n: 1 };', 'let q = p;', 'p = { n: 1 };', 'q.n = 2;'),
      py: lines('p = {"n": 1}', 'q = p', 'p = {"n": 1}', 'q["n"] = 2'),
      expected: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 2 }), new: dict({ n: 1 }) }),
      hint: {
        js: 'Assigning p a new object with n holding 1 repoints only p; changing n through q to 2 touches the original alone.',
        py: 'Assigning p a new dictionary with "n" holding 1 repoints only p; changing "n" through q to 2 touches the original alone.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'shared',
          message:
            "p and q should not share a container here. Assigning a new container to p, even one with the same keys, moves only p's arrow; q still refers to the original, and that is the one the last line changes.",
        },
      ],
      about: {
        js: 'Assigning a new object to p separates p from q, even if the new object has the same properties. Subsequent mutations through q affect only the original object.',
        py: 'Assigning a new dictionary to p separates p from q, even if the new dictionary has the same keys. Subsequent mutations through q affect only the original dictionary.',
      },
      debrief: [
        {
          html: {
            js: '<p>The line <code>p = { n: 1 };</code> creates a new object and moves <code>p</code>\'s arrow to it. Even though it looks identical to the original, it is a separate object in memory.</p>',
            py: '<p>The line <code>p = {"n": 1}</code> creates a new dictionary and moves <code>p</code>\'s arrow to it. Even though it looks identical to the original, it is a separate dictionary in memory.</p>',
          },
        },
        {
          html: {
            js: '<p>When <code>q.n = 2;</code> runs, it modifies the original object that <code>q</code> still refers to. <code>p</code>\'s new object is untouched and keeps <code>n: 1</code>.</p>',
            py: '<p>When <code>q["n"] = 2</code> runs, it modifies the original dictionary that <code>q</code> still refers to. <code>p</code>\'s new dictionary is untouched and keeps <code>"n": 1</code>.</p>',
          },
        },
        {
          diagram: graph({ p: ref('new'), q: ref('old') }, { old: dict({ n: 2 }), new: dict({ n: 1 }) }),
          caption: {
            js: 'Correct: q points to the modified original; p points to the new object.',
            py: 'Correct: q points to the modified original; p points to the new dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 2 }) }),
          caption: {
            js: 'Not correct: this picture treats the look-alike object as the original. Reassigning p broke the link, so p and q no longer share an object.',
            py: 'Not correct: this picture treats the look-alike dictionary as the original. Reassigning p broke the link, so p and q no longer share a dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Reassigning a variable moves its arrow; mutating changes the container at the end of the arrow. Knowing which line does which is the key to tracing references.</p>',
        },
      ],
    }),
    write({
      title: 'Mark it, then move on',
      given: {
        js: lines('let x = { score: 0 };', 'let y = x;'),
        ts: lines(
          'let x: { score: number; done?: boolean } = { score: 0 };',
          'let y: { score: number; done?: boolean } = x;',
        ),
        py: lines('x = {"score": 0}', 'y = x'),
      },
      js: lines('y.done = true;', 'x = { score: 5 };'),
      py: lines('y["done"] = True', 'x = {"score": 5}'),
      expected: graph(
        { x: ref('new'), y: ref('old') },
        { old: dict({ score: 0, done: true }), new: dict({ score: 5 }) },
      ),
      hint: {
        js: 'Add done holding true through y in place, then point x at a new object with score holding 5; y keeps the marked original.',
        py: 'Add "done" holding True through y in place, then point x at a new dictionary with "score" holding 5; y keeps the marked original.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            "x and y share one container, but they should be separate. Assigning a new container to x moves only x's arrow, so y keeps the original with done added.",
        },
      ],
      about: {
        js: 'Mutate a shared object through one name to update it, then reassign the other name to point to a new object. The alias preserves the modified original.',
        py: 'Mutate a shared dictionary through one name to update it, then reassign the other name to point to a new dictionary. The alias preserves the modified original.',
      },
      process: { runtime: runtime(sameObject(before('x'), after('y'))) },
      debrief: [
        {
          html: {
            js: '<p>First, <code>y.done = true;</code> adds the property <code>done</code> to the shared object in place. Both <code>x</code> and <code>y</code> see this change.</p>',
            py: '<p>First, <code>y["done"] = True</code> adds the key <code>"done"</code> to the shared dictionary in place. Both <code>x</code> and <code>y</code> see this change.</p>',
          },
        },
        {
          html: {
            js: '<p>Then, <code>x = { score: 5 };</code> repoints <code>x</code> at a brand new object. <code>y</code> keeps referring to the original object with <code>score: 0</code> and <code>done: true</code>.</p>',
            py: '<p>Then, <code>x = {"score": 5}</code> repoints <code>x</code> at a brand new dictionary. <code>y</code> keeps referring to the original dictionary with <code>"score": 0</code> and <code>"done": True</code>.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('new'), y: ref('old') },
            { old: dict({ score: 0, done: true }), new: dict({ score: 5 }) },
          ),
          caption: {
            js: 'Correct: y keeps the marked original; x points to the new object.',
            py: 'Correct: y keeps the marked original; x points to the new dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('shared') },
            { shared: dict({ score: 5, done: true }) },
          ),
          caption: {
            js: 'Not correct: this is what x.score = 5 would build. Changing a key mutates the shared object; only assigning a new object to x separates the two names.',
            py: 'Not correct: this is what x["score"] = 5 would build. Changing a key mutates the shared dictionary; only assigning a new dictionary to x separates the two names.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>x.done = true;</code> in place of <code>y.done = true;</code>, as long as it runs before <code>x</code> is reassigned. Until then, both names refer to the same object.</p>',
            py: '<p><strong>Also correct:</strong> <code>x["done"] = True</code> in place of <code>y["done"] = True</code>, as long as it runs before <code>x</code> is reassigned. Until then, both names refer to the same dictionary.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> Reassigning <code>y</code> instead of mutating it, or reassigning both variables with literals, loses the connection to the starter object. The game checks that <code>y</code> afterward is the exact same object that <code>x</code> pointed to at the start.</p>',
            py: '<p><strong>Not accepted:</strong> Reassigning <code>y</code> instead of mutating it, or reassigning both variables with literals, loses the connection to the starter dictionary. The game checks that <code>y</code> afterward is the exact same dictionary that <code>x</code> pointed to at the start.</p>',
          },
        },
      ],
    }),
  ],
)
