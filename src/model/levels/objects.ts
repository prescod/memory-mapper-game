import { dict, graph, ref, scalar } from '../builders'
import type { Level } from '../types'
import { draw, L, level, lines, SHARING_REMINDER, write } from './common'

export const objectsLevel: Level = level(
  'objects',
  L('Objects', 'Dictionaries'),
  L(
    'An object is a separate thing in memory, like an array, but its slots are named keys instead of numbers. Each key is an arrow to a value. As with arrays, b = a makes two names share one object, while two literals build two separate objects even when their keys and values match.',
    'A dictionary is a separate thing in memory, like a list, but its slots are named keys instead of numbers. Each key is an arrow to a value. As with lists, b = a makes two names share one dictionary, while two literals build two separate dictionaries even when their keys and values match.',
  ),
  [
    draw({
      title: 'One key',
      js: 'let user = { name: "Ada" };',
      py: 'user = {"name": "Ada"}',
      expected: graph({ user: ref('user') }, { user: dict({ name: 'Ada' }) }),
      hint: {
        js: 'Create variable user and an object with a key name pointing to "Ada", then connect user to the object.',
        py: 'Create variable user and a dictionary with a key "name" pointing to "Ada", then connect user to the dictionary.',
      },
      about: {
        js: 'An object is a separate container in memory. A variable refers to the whole object, and each key inside it is an arrow pointing to a value.',
        py: 'A dictionary is a separate container in memory. A variable refers to the whole dictionary, and each key inside it is an arrow pointing to a value.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let user = { name: "Ada" };</code> creates a variable named <code>user</code> and an object in memory, and points <code>user</code> at the object. Inside the object, the key <code>name</code> is an arrow pointing to the string <code>"Ada"</code>.</p>',
            py: '<p><code>user = {"name": "Ada"}</code> creates a variable named <code>user</code> and a dictionary in memory, and points <code>user</code> at the dictionary. Inside the dictionary, the key <code>"name"</code> is an arrow pointing to the string <code>"Ada"</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>Array slots are numbered (0, 1, 2...). An object names each slot with a key instead, but each key is still an arrow pointing to a value.</p>',
            py: '<p>List slots are numbered (0, 1, 2...). A dictionary names each slot with a key instead, but each key is still an arrow pointing to a value.</p>',
          },
        },
        {
          diagram: graph({ user: ref('user') }, { user: dict({ name: 'Ada' }) }),
          caption: {
            js: 'user refers to the object; its key name points to "Ada".',
            py: 'user refers to the dictionary; its key "name" points to "Ada".',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ user: 'Ada' }),
          caption: {
            js: 'Not correct: user refers to an object, not directly to "Ada". The braces build an object.',
            py: 'Not correct: user refers to a dictionary, not directly to "Ada". The braces build a dictionary.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: { js: 'A key pointing to null', py: 'A key pointing to None' },
      js: 'let game = { winner: null };',
      ts: 'let game: { winner: null } = { winner: null };',
      py: 'game = {"winner": None}',
      expected: graph({ game: ref('game') }, { game: dict({ winner: null }) }),
      hint: {
        js: 'Declare game as an object with a key winner that points to null.',
        py: 'Assign game a dictionary with a key "winner" that points to None.',
      },
      about: {
        js: 'A key can point to null just like any other value. The key still exists; null is simply the value its arrow points to.',
        py: 'A key can point to None just like any other value. The key still exists; None is simply the value its arrow points to.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let game = { winner: null };</code> creates an object with one key, <code>winner</code>. <code>null</code> means "no value here yet", but it is still a real value that an arrow can point to, so the key exists and points to <code>null</code>.</p>',
            py: '<p><code>game = {"winner": None}</code> creates a dictionary with one key, <code>"winner"</code>. <code>None</code> means "no value here yet", but it is still a real value that an arrow can point to, so the key exists and points to <code>None</code>.</p>',
          },
        },
        {
          diagram: graph({ game: ref('game') }, { game: dict({ winner: null }) }),
          caption: {
            js: 'The key winner points to null.',
            py: 'The key "winner" points to None.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ game: ref('game') }, { game: dict({}) }),
          caption: {
            js: 'Not correct: this object has no keys at all. Writing winner: null creates the key.',
            py: 'Not correct: this dictionary has no keys at all. Writing "winner": None creates the key.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> quoting the key, <code>{ "winner": null }</code>. In JavaScript, an unquoted key is a shorter spelling of the same string, so both build the same object.</p>',
            py: '<p><strong>Also correct:</strong> <code>dict(winner=None)</code>, which builds the same dictionary.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let game = {};</code>. An empty object has no keys, which is different from having a key that points to <code>null</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>game = {}</code>. An empty dictionary has no keys, which is different from having a key that points to <code>None</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Two keys',
      js: 'let point = { x: 1, y: 2 };',
      py: 'point = {"x": 1, "y": 2}',
      expected: graph({ point: ref('point') }, { point: dict({ x: 1, y: 2 }) }),
      hint: {
        js: 'Create variable point and one object with two keys: x pointing to 1 and y pointing to 2.',
        py: 'Create variable point and one dictionary with two keys: "x" pointing to 1 and "y" pointing to 2.',
      },
      about: {
        js: 'An object can have several keys. Each key is its own arrow, pointing to its own value.',
        py: 'A dictionary can have several keys. Each key is its own arrow, pointing to its own value.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>point</code> refers to one object with two keys. Key <code>x</code> points to 1 and key <code>y</code> points to 2.</p>',
            py: '<p><code>point</code> refers to one dictionary with two keys. Key <code>"x"</code> points to 1 and key <code>"y"</code> points to 2.</p>',
          },
        },
        {
          diagram: graph({ point: ref('point') }, { point: dict({ x: 1, y: 2 }) }),
          caption: {
            js: 'One object with two keys, each pointing to a number.',
            py: 'One dictionary with two keys, each pointing to a number.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ point: ref('point') }, { point: dict({ x: 2, y: 1 }) }),
          caption: {
            js: 'Not correct: both keys exist, but a key is identified by its name, not its position. x must point to 1 and y to 2.',
            py: 'Not correct: both keys exist, but a key is identified by its name, not its position. "x" must point to 1 and "y" to 2.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> drawing <code>y</code> above <code>x</code>, or in any other arrangement inside the object. What matters is which key points to which value, not where the keys sit.</p>',
            py: '<p><strong>Also correct:</strong> drawing <code>"y"</code> above <code>"x"</code>, or in any other arrangement inside the dictionary. What matters is which key points to which value, not where the keys sit.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Settings',
      js: 'let settings = { dark: true, size: 12 };',
      ts: 'let settings: { dark: boolean; size: number } = { dark: true, size: 12 };',
      py: 'settings = {"dark": True, "size": 12}',
      expected: graph({ settings: ref('settings') }, { settings: dict({ dark: true, size: 12 }) }),
      hint: {
        js: 'Declare settings as an object whose key dark points to true and whose key size points to 12.',
        py: 'Assign settings a dictionary whose key "dark" points to True and whose key "size" points to 12.',
      },
      about: {
        js: 'The keys of one object can point to different kinds of value, such as a boolean and a number.',
        py: 'The keys of one dictionary can point to different kinds of value, such as a boolean and a number.',
      },
      debrief: [
        {
          html: {
            js: '<p>The key <code>dark</code> points to a boolean, <code>true</code>, and the key <code>size</code> points to a number, 12. An object does not require every value to be of the same kind.</p>',
            py: '<p>The key <code>"dark"</code> points to a boolean, <code>True</code>, and the key <code>"size"</code> points to a number, 12. A dictionary does not require every value to be of the same kind.</p>',
          },
        },
        {
          diagram: graph({ settings: ref('settings') }, { settings: dict({ dark: true, size: 12 }) }),
          caption: {
            js: 'One object holding a boolean and a number.',
            py: 'One dictionary holding a boolean and a number.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ settings: ref('settings') }, { settings: dict({ dark: true, size: '12' }) }),
          caption: {
            js: 'Not correct: "12" in quotes is a string. size must point to the number 12.',
            py: 'Not correct: "12" in quotes is a string. "size" must point to the number 12.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> listing the keys in the other order, <code>{ size: 12, dark: true }</code>. The picture only records which key points to which value.</p>',
            py: '<p><strong>Also correct:</strong> listing the keys in the other order, <code>{"size": 12, "dark": True}</code>. The picture only records which key points to which value.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'An empty object', py: 'An empty dictionary' },
      js: 'let empty = {};',
      ts: 'let empty: Record<string, unknown> = {};',
      py: 'empty = {}',
      expected: graph({ empty: ref('empty') }, { empty: dict({}) }),
      hint: {
        js: 'Create variable empty and an object with no keys, then connect them.',
        py: 'Create variable empty and a dictionary with no keys, then connect them.',
      },
      about: {
        js: 'An empty object is a real object in memory that has no keys yet.',
        py: 'An empty dictionary is a real dictionary in memory that has no keys yet.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>{}</code> creates a real object in memory with zero keys, and <code>empty</code> refers to it.</p>',
            py: '<p><code>{}</code> creates a real dictionary in memory with zero keys, and <code>empty</code> refers to it.</p>',
          },
        },
        {
          diagram: graph({ empty: ref('empty') }, { empty: dict({}) }),
          caption: {
            js: 'empty points to an object with no keys.',
            py: 'empty points to a dictionary with no keys.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ empty: null }),
          caption: {
            js: 'Not correct: an empty object is not null. It is a container that exists, even though it has no keys.',
            py: 'Not correct: an empty dictionary is not None. It is a container that exists, even though it has no keys.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Compare this with <em>A key pointing to null</em>: <code>{}</code> has no keys at all, while <code>{ winner: null }</code> has one key whose arrow points to <code>null</code>. Neither object is <code>null</code> itself.</p>',
            py: '<p>Compare this with <em>A key pointing to None</em>: <code>{}</code> has no keys at all, while <code>{"winner": None}</code> has one key whose arrow points to <code>None</code>. Neither dictionary is <code>None</code> itself.</p>',
          },
        },
      ],
    }),
    write({
      title: 'A book',
      js: 'let book = { title: "Dune", year: 1965, read: false };',
      ts: 'let book: { title: string; year: number; read: boolean } = { title: "Dune", year: 1965, read: false };',
      py: 'book = {"title": "Dune", "year": 1965, "read": False}',
      expected: graph(
        { book: ref('book') },
        { book: dict({ title: 'Dune', year: 1965, read: false }) },
      ),
      hint: {
        js: 'Declare one variable, book, as an object whose keys title, year, and read point to "Dune", 1965, and false.',
        py: 'Assign one variable, book, a dictionary whose keys "title", "year", and "read" point to "Dune", 1965, and False.',
      },
      about: {
        js: 'However many keys an object has, it is still one object. The keys belong to the object, and the variable has a single arrow to it.',
        py: 'However many keys a dictionary has, it is still one dictionary. The keys belong to the dictionary, and the variable has a single arrow to it.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>book</code> refers to one object with three keys: <code>title</code> points to <code>"Dune"</code>, <code>year</code> points to 1965, and <code>read</code> points to <code>false</code>. The three values travel together because they all hang off the one object that <code>book</code> refers to.</p>',
            py: '<p><code>book</code> refers to one dictionary with three keys: <code>"title"</code> points to <code>"Dune"</code>, <code>"year"</code> points to 1965, and <code>"read"</code> points to <code>False</code>. The three values travel together because they all hang off the one dictionary that <code>book</code> refers to.</p>',
          },
        },
        {
          diagram: graph(
            { book: ref('book') },
            { book: dict({ title: 'Dune', year: 1965, read: false }) },
          ),
          caption: {
            js: 'One variable, one object, three keys.',
            py: 'One variable, one dictionary, three keys.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ title: 'Dune', year: 1965, read: false }),
          caption: {
            js: 'Not correct: keys are not variables. title, year, and read belong to the object that book refers to.',
            py: 'Not correct: keys are not variables. "title", "year", and "read" belong to the dictionary that book refers to.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> writing the three keys in any order inside the braces.</p>',
            py: '<p><strong>Also correct:</strong> writing the three keys in any order inside the braces.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> three separate variables, <code>let title = "Dune";</code> and so on. That builds the wrong picture above: there is no <code>book</code>, and nothing groups the values together.</p>',
            py: '<p><strong>Not accepted:</strong> three separate variables, <code>title = "Dune"</code> and so on. That builds the wrong picture above: there is no <code>book</code>, and nothing groups the values together.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'Two names, one object', py: 'Two names, one dictionary' },
      js: lines('let a = { k: 1 };', 'let b = a;'),
      py: lines('a = {"k": 1}', 'b = a'),
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ k: 1 }) }),
      hint: {
        js: 'Only one line builds an object. Look at what b = a copies.',
        py: 'Only one line builds a dictionary. Look at what b = a copies.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'b = a copies the reference, not the container. Only the first line builds one, so a and b must point to that same one.',
        },
      ],
      about: {
        js: 'Assigning one variable from another copies the reference, not the object. Both variables then point to the same object in memory.',
        py: 'Assigning one variable from another copies the reference, not the dictionary. Both variables then point to the same dictionary in memory.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let a = { k: 1 };</code> creates an object in memory. <code>let b = a;</code> copies the reference from <code>a</code> into <code>b</code>. It does <strong>not</strong> create a second object. Both variables now refer to the same object.</p>',
            py: '<p><code>a = {"k": 1}</code> creates a dictionary in memory. <code>b = a</code> copies the reference from <code>a</code> into <code>b</code>. It does <strong>not</strong> create a second dictionary. Both variables now refer to the same dictionary.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ k: 1 }) }),
          caption: {
            js: 'Both a and b point to the same object.',
            py: 'Both a and b point to the same dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: dict({ k: 1 }), b: dict({ k: 1 }) }),
          caption: {
            js: 'Not correct: this is what you get if b = a copied the object. It copies only the reference.',
            py: 'Not correct: this is what you get if b = a copied the dictionary. It copies only the reference.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> pointing <code>b</code> at the variable <code>a</code>. Variables can only refer to values, never to other variables; <code>b</code> points to the object itself.</p>',
            py: '<p><strong>Not accepted:</strong> pointing <code>b</code> at the variable <code>a</code>. Variables can only refer to values, never to other variables; <code>b</code> points to the dictionary itself.</p>',
          },
        },
        {
          html: {
            js: '<p>When two names refer to the same object, they are called <strong>aliases</strong>. In a later level, you will see that changing the object through <code>b</code> is immediately visible through <code>a</code>.</p>',
            py: '<p>When two names refer to the same dictionary, they are called <strong>aliases</strong>. In a later level, you will see that changing the dictionary through <code>b</code> is immediately visible through <code>a</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Equal but separate',
      js: lines('let a = { k: 1 };', 'let b = { k: 1 };'),
      py: lines('a = {"k": 1}', 'b = {"k": 1}'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: dict({ k: 1 }), b: dict({ k: 1 }) }),
      hint: {
        js: 'Count how many object literals the code evaluates.',
        py: 'Count how many dictionary literals the code evaluates.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b are built from two separate literals, so they refer to two separate containers in memory, even though their keys and values match.',
        },
      ],
      about: {
        js: 'Every object literal creates a brand new object in memory. Two literals with matching keys and values produce two separate objects.',
        py: 'Every dictionary literal creates a brand new dictionary in memory. Two literals with matching keys and values produce two separate dictionaries.',
      },
      debrief: [
        {
          html: {
            js: '<p>Each <code>{ k: 1 }</code> literal evaluates to a brand new object in memory. Their keys and values match, but <code>a</code> and <code>b</code> refer to two separate objects.</p>',
            py: '<p>Each <code>{"k": 1}</code> literal evaluates to a brand new dictionary in memory. Their keys and values match, but <code>a</code> and <code>b</code> refer to two separate dictionaries.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: dict({ k: 1 }), b: dict({ k: 1 }) }),
          caption: {
            js: 'Two separate objects with matching keys and values.',
            py: 'Two separate dictionaries with matching keys and values.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: dict({ k: 1 }) }),
          caption: {
            js: 'Not correct: equal contents do not make one object. Two literals build two objects.',
            py: 'Not correct: equal contents do not make one dictionary. Two literals build two dictionaries.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> both <code>k</code> keys pointing to one shared 1. Numbers cannot change in place, so sharing the 1 makes no difference. What must be separate is the two objects.</p>',
            py: '<p><strong>Also correct:</strong> both <code>"k"</code> keys pointing to one shared 1. Numbers cannot change in place, so sharing the 1 makes no difference. What must be separate is the two dictionaries.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: dict({ k: ref('one') }), b: dict({ k: ref('one') }), one: scalar(1) },
          ),
          caption: {
            js: 'Also correct: two separate objects whose keys share one 1.',
            py: 'Also correct: two separate dictionaries whose keys share one 1.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p>Compare this with the previous puzzle, <em>Two names, one object</em>. There, <code>b = a</code> copied a reference. Here, two literals were evaluated, so two objects were created.</p>',
            py: '<p>Compare this with the previous puzzle, <em>Two names, one dictionary</em>. There, <code>b = a</code> copied a reference. Here, two literals were evaluated, so two dictionaries were created.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Three names, one object', py: 'Three names, one dictionary' },
      js: lines('let x = { n: 0 };', 'let y = x;', 'let z = x;'),
      ts: lines('let x: { n: number } = { n: 0 };', 'let y: { n: number } = x;', 'let z: { n: number } = x;'),
      py: lines('x = {"n": 0}', 'y = x', 'z = x'),
      expected: graph(
        { x: ref('shared'), y: ref('shared'), z: ref('shared') },
        { shared: dict({ n: 0 }) },
      ),
      hint: {
        js: 'Build the object once, then give it more names by assigning from a variable that already refers to it.',
        py: 'Build the dictionary once, then give it more names by assigning from a variable that already refers to it.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'Each literal builds a new container. Build it once, then assign y and z from x so that all three names share it.',
        },
      ],
      about: {
        js: 'Any number of variables can point to the same object. Each assignment from a variable that refers to it adds another alias.',
        py: 'Any number of variables can point to the same dictionary. Each assignment from a variable that refers to it adds another alias.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let x = { n: 0 };</code> creates one object. Then <code>let y = x;</code> and <code>let z = x;</code> each copy the reference from <code>x</code>. All three variables refer to that single object.</p>',
            py: '<p><code>x = {"n": 0}</code> creates one dictionary. Then <code>y = x</code> and <code>z = x</code> each copy the reference from <code>x</code>. All three variables refer to that single dictionary.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('shared'), z: ref('shared') },
            { shared: dict({ n: 0 }) },
          ),
          caption: {
            js: 'Three variables all pointing to one object.',
            py: 'Three variables all pointing to one dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y'), z: ref('z') },
            { x: dict({ n: 0 }), y: dict({ n: 0 }), z: dict({ n: 0 }) },
          ),
          caption: {
            js: 'Not correct: three separate objects instead of one shared object.',
            py: 'Not correct: three separate dictionaries instead of one shared dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let z = y;</code> instead of <code>let z = x;</code>. <code>y</code> already refers to the same object as <code>x</code>, so the picture is identical.</p>',
            py: '<p><strong>Also correct:</strong> <code>z = y</code> instead of <code>z = x</code>. <code>y</code> already refers to the same dictionary as <code>x</code>, so the picture is identical.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> writing <code>{ n: 0 }</code> three times. Each literal builds its own object, which gives the wrong picture above.</p>',
            py: '<p><strong>Not accepted:</strong> writing <code>{"n": 0}</code> three times. Each literal builds its own dictionary, which gives the wrong picture above.</p>',
          },
        },
      ],
    }),
    write({
      title: 'One alone, two together',
      js: lines('let a = { id: 1 };', 'let b = { id: 2 };', 'let c = b;'),
      ts: lines('let a: { id: number } = { id: 1 };', 'let b: { id: number } = { id: 2 };', 'let c: { id: number } = b;'),
      py: lines('a = {"id": 1}', 'b = {"id": 2}', 'c = b'),
      expected: graph(
        { a: ref('alone'), b: ref('pair'), c: ref('pair') },
        { alone: dict({ id: 1 }), pair: dict({ id: 2 }) },
      ),
      hint: {
        js: 'Build two objects, one for a and one for b. Then make c refer to the one b refers to.',
        py: 'Build two dictionaries, one for a and one for b. Then make c refer to the one b refers to.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'a and b must refer to two separate containers: one whose id is 1 and one whose id is 2.',
        },
        {
          variable: 'c',
          aliasing: 'separate',
          message: 'c must share the container that b refers to. Assign c from b instead of building a new one.',
        },
      ],
      about: {
        js: 'In one program, some objects can be shared by several variables while others have only one variable referring to them.',
        py: 'In one program, some dictionaries can be shared by several variables while others have only one variable referring to them.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>a</code> gets its own object with <code>id: 1</code>. <code>b</code> gets a second object with <code>id: 2</code>. Then <code>let c = b;</code> makes <code>c</code> share <code>b</code>\'s object. There are three variables but only two objects.</p>',
            py: '<p><code>a</code> gets its own dictionary with <code>"id": 1</code>. <code>b</code> gets a second dictionary with <code>"id": 2</code>. Then <code>c = b</code> makes <code>c</code> share <code>b</code>\'s dictionary. There are three variables but only two dictionaries.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('alone'), b: ref('pair'), c: ref('pair') },
            { alone: dict({ id: 1 }), pair: dict({ id: 2 }) },
          ),
          caption: {
            js: 'a has its own object; b and c share another.',
            py: 'a has its own dictionary; b and c share another.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('alone'), b: ref('b'), c: ref('c') },
            { alone: dict({ id: 1 }), b: dict({ id: 2 }), c: dict({ id: 2 }) },
          ),
          caption: {
            js: 'Not correct: a second { id: 2 } literal for c builds a third object. c must share b\'s object.',
            py: 'Not correct: a second {"id": 2} literal for c builds a third dictionary. c must share b\'s dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> creating <code>b</code> and <code>c</code> before <code>a</code>. The order of independent objects does not matter, as long as <code>c</code> is assigned after <code>b</code> exists.</p>',
            py: '<p><strong>Also correct:</strong> creating <code>b</code> and <code>c</code> before <code>a</code>. The order of independent dictionaries does not matter, as long as <code>c</code> is assigned after <code>b</code> exists.</p>',
          },
        },
      ],
    }),
  ],
  [
    write({
      title: { js: 'Same keys, different objects', py: 'Same keys, different dictionaries' },
      js: lines('let ann = { name: "Ann" };', 'let bob = { name: "Bob" };'),
      ts: lines('let ann: { name: string } = { name: "Ann" };', 'let bob: { name: string } = { name: "Bob" };'),
      py: lines('ann = {"name": "Ann"}', 'bob = {"name": "Bob"}'),
      expected: graph(
        { ann: ref('ann'), bob: ref('bob') },
        { ann: dict({ name: 'Ann' }), bob: dict({ name: 'Bob' }) },
      ),
      hint: {
        js: 'Each variable in the picture points to its own object, and each object has its own name key.',
        py: 'Each variable in the picture points to its own dictionary, and each dictionary has its own "name" key.',
      },
      hints: [
        {
          variable: 'bob',
          aliasing: 'shared',
          message: 'ann and bob must refer to two separate containers. One key can point to only one value at a time.',
        },
      ],
      about: {
        js: 'Two objects can have the same keys and still be separate, each key pointing to its own value.',
        py: 'Two dictionaries can have the same keys and still be separate, each key pointing to its own value.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>ann</code> and <code>bob</code> each point to a separate object. Both objects have a key named <code>name</code>, but one points to <code>"Ann"</code> and the other points to <code>"Bob"</code>.</p>',
            py: '<p><code>ann</code> and <code>bob</code> each point to a separate dictionary. Both dictionaries have a key named <code>"name"</code>, but one points to <code>"Ann"</code> and the other points to <code>"Bob"</code>.</p>',
          },
        },
        {
          diagram: graph(
            { ann: ref('ann'), bob: ref('bob') },
            { ann: dict({ name: 'Ann' }), bob: dict({ name: 'Bob' }) },
          ),
          caption: {
            js: 'Two separate objects with the same key.',
            py: 'Two separate dictionaries with the same key.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { ann: ref('shared'), bob: ref('shared') },
            { shared: dict({ name: 'Ann' }) },
          ),
          caption: {
            js: 'Not correct: one object has one name key, so it cannot hold both "Ann" and "Bob".',
            py: 'Not correct: one dictionary has one "name" key, so it cannot hold both "Ann" and "Bob".',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let bob = ann;</code>. That makes <code>bob</code> an alias for Ann\'s object, so there is no second object for <code>"Bob"</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>bob = ann</code>. That makes <code>bob</code> an alias for Ann\'s dictionary, so there is no second dictionary for <code>"Bob"</code>.</p>',
          },
        },
      ],
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
        js: 'Count the literals: each one builds its own object. Then follow each assignment to see which object every other name joins.',
        py: 'Count the literals: each one builds its own dictionary. Then follow each assignment to see which dictionary every other name joins.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b are built from separate literals, so they point to two separate containers even though both have on pointing to true.',
        },
        {
          variable: 'c',
          aliasing: 'separate',
          message: 'c = a copies a reference, so c shares the container that a refers to.',
        },
        {
          variable: 'd',
          aliasing: 'separate',
          message: 'd = b copies a reference, so d shares the container that b refers to.',
        },
      ],
      about: {
        js: 'Variables share an object only when one is assigned from another. Two matching literals create two separate objects, and each can gain its own aliases.',
        py: 'Variables share a dictionary only when one is assigned from another. Two matching literals create two separate dictionaries, and each can gain its own aliases.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>a</code> and <code>b</code> each evaluate <code>{ on: true }</code>, creating two separate objects in memory. Then <code>c = a</code> makes <code>c</code> an alias for <code>a</code>\'s object, and <code>d = b</code> makes <code>d</code> an alias for <code>b</code>\'s object. Four names point to two objects.</p>',
            py: '<p><code>a</code> and <code>b</code> each evaluate <code>{"on": True}</code>, creating two separate dictionaries in memory. Then <code>c = a</code> makes <code>c</code> an alias for <code>a</code>\'s dictionary, and <code>d = b</code> makes <code>d</code> an alias for <code>b</code>\'s dictionary. Four names point to two dictionaries.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('first'), b: ref('second'), c: ref('first'), d: ref('second') },
            { first: dict({ on: true }), second: dict({ on: true }) },
          ),
          caption: {
            js: 'Two pairs of aliases pointing to two separate objects.',
            py: 'Two pairs of aliases pointing to two separate dictionaries.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('all'), b: ref('all'), c: ref('all'), d: ref('all') },
            { all: dict({ on: true }) },
          ),
          caption: {
            js: 'Not correct: matching contents do not merge objects. a and b come from separate literals.',
            py: 'Not correct: matching contents do not merge dictionaries. a and b come from separate literals.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> both <code>on</code> keys pointing to one shared <code>true</code>. Booleans cannot change in place, so only the two objects need to be separate.</p>',
            py: '<p><strong>Also correct:</strong> both <code>"on"</code> keys pointing to one shared <code>True</code>. Booleans cannot change in place, so only the two dictionaries need to be separate.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Three kinds of value',
      js: 'let pet = { name: "Rex", owner: null, age: 3 };',
      py: 'pet = {"name": "Rex", "owner": None, "age": 3}',
      expected: graph({ pet: ref('pet') }, { pet: dict({ name: 'Rex', owner: null, age: 3 }) }),
      hint: {
        js: 'Every key written in the literal becomes a key in the object, whatever value it points to.',
        py: 'Every key written in the literal becomes a key in the dictionary, whatever value it points to.',
      },
      about: {
        js: 'Every key written in an object literal exists in the object, including a key that points to null.',
        py: 'Every key written in a dictionary literal exists in the dictionary, including a key that points to None.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>pet</code> refers to one object with three keys: <code>name</code> points to <code>"Rex"</code>, <code>owner</code> points to <code>null</code>, and <code>age</code> points to 3.</p>',
            py: '<p><code>pet</code> refers to one dictionary with three keys: <code>"name"</code> points to <code>"Rex"</code>, <code>"owner"</code> points to <code>None</code>, and <code>"age"</code> points to 3.</p>',
          },
        },
        {
          diagram: graph({ pet: ref('pet') }, { pet: dict({ name: 'Rex', owner: null, age: 3 }) }),
          caption: {
            js: 'One object with keys pointing to a string, null, and a number.',
            py: 'One dictionary with keys pointing to a string, None, and a number.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ pet: ref('pet') }, { pet: dict({ name: 'Rex', age: 3 }) }),
          caption: {
            js: 'Not correct: owner: null still creates a key. Its arrow points to null.',
            py: 'Not correct: "owner": None still creates a key. Its arrow points to None.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Settings under another name',
      js: lines('let config = { debug: false, name: "app", retries: 0 };', 'let settings = config;'),
      ts: lines(
        'let config: { debug: boolean; name: string; retries: number } = { debug: false, name: "app", retries: 0 };',
        'let settings: { debug: boolean; name: string; retries: number } = config;',
      ),
      py: lines('config = {"debug": False, "name": "app", "retries": 0}', 'settings = config'),
      expected: graph(
        { config: ref('shared'), settings: ref('shared') },
        { shared: dict({ debug: false, name: 'app', retries: 0 }) },
      ),
      hint: {
        js: 'There is only one object in the picture. Build it once, then give it a second name.',
        py: 'There is only one dictionary in the picture. Build it once, then give it a second name.',
      },
      hints: [
        {
          variable: 'settings',
          aliasing: 'separate',
          message:
            'settings must share the container that config refers to. Assign settings from config instead of building a second one.',
        },
      ],
      about: {
        js: 'Assigning an object to a second variable copies only the reference, however many keys the object has, so both variables refer to the same object.',
        py: 'Assigning a dictionary to a second variable copies only the reference, however many keys the dictionary has, so both variables refer to the same dictionary.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>config</code> is initialized with an object. Then <code>let settings = config;</code> gives <code>settings</code> a reference to that same object. No matter how many keys it has, assigning it to another variable copies only the reference, never the contents.</p>',
            py: '<p><code>config</code> is initialized with a dictionary. Then <code>settings = config</code> gives <code>settings</code> a reference to that same dictionary. No matter how many keys it has, assigning it to another variable copies only the reference, never the contents.</p>',
          },
        },
        {
          diagram: graph(
            { config: ref('shared'), settings: ref('shared') },
            { shared: dict({ debug: false, name: 'app', retries: 0 }) },
          ),
          caption: {
            js: 'Both config and settings refer to the same object.',
            py: 'Both config and settings refer to the same dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { config: ref('config'), settings: ref('settings') },
            {
              config: dict({ debug: false, name: 'app', retries: 0 }),
              settings: dict({ debug: false, name: 'app', retries: 0 }),
            },
          ),
          caption: {
            js: 'Not correct: retyping the literal for settings builds a second object with matching contents.',
            py: 'Not correct: retyping the literal for settings builds a second dictionary with matching contents.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> declaring <code>settings</code> first and <code>config</code> from it. Either name can build the object, as long as the other is assigned from it.</p>',
            py: '<p><strong>Also correct:</strong> creating <code>settings</code> first and assigning <code>config</code> from it. Either name can build the dictionary, as long as the other is assigned from it.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Two keys, same value',
      js: 'let p = { a: 0, b: 0 };',
      py: 'p = {"a": 0, "b": 0}',
      expected: graph({ p: ref('p') }, { p: dict({ a: 0, b: 0 }) }),
      hint: {
        js: 'Keys a and b both point to 0. Numbers cannot change in place, so one shared 0 or two separate 0s are both correct.',
        py: 'Keys "a" and "b" both point to 0. Numbers cannot change in place, so one shared 0 or two separate 0s are both correct.',
      },
      about: {
        js: 'Each key is its own arrow, so two keys can point to equal values, either to two separate 0s or to one shared 0.',
        py: 'Each key is its own arrow, so two keys can point to equal values, either to two separate 0s or to one shared 0.',
      },
      debrief: [
        {
          html: {
            js: '<p>The object has two keys, <code>a</code> and <code>b</code>. Each key is its own arrow, and both arrows point to 0. There are two equally correct ways to draw this.</p>',
            py: '<p>The dictionary has two keys, <code>"a"</code> and <code>"b"</code>. Each key is its own arrow, and both arrows point to 0. There are two equally correct ways to draw this.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ a: 0, b: 0 }) }),
          caption: 'Two separate 0s: each key points to its own value.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { p: ref('p') },
            {
              p: dict({ a: ref('zero'), b: ref('zero') }),
              zero: scalar(0),
            },
          ),
          caption: 'Also correct: both keys pointing to one shared 0.',
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('p') }, { p: dict({ a: 0 }) }),
          caption: {
            js: 'Not correct: equal values do not merge keys. a and b are two keys, each with its own arrow.',
            py: 'Not correct: equal values do not merge keys. "a" and "b" are two keys, each with its own arrow.',
          },
          verdict: 'incorrect',
        },
        {
          html: SHARING_REMINDER,
        },
      ],
    }),
  ],
)
