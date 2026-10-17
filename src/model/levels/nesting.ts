import { dict, graph, list, ref } from '../builders'
import type { UnnumberedLevel } from '../types'
import { draw, L, level, lines, write } from './common'

export const nestingLevel: UnnumberedLevel = level(
  'nesting',
  L('Nested Arrays and Objects', 'Nested Lists and Dictionaries'),
  L(
    'Arrays and objects can hold references to other arrays and objects. Each inner array or object is a separate container in memory, and the same one can be referred to from several places. An inner container can even be the outer one, or lead back to it, so references can form loops.',
    'Lists and dictionaries can hold references to other lists and dictionaries. Each inner list or dictionary is a separate container in memory, and the same one can be referred to from several places. An inner container can even be the outer one, or lead back to it, so references can form loops.',
  ),
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
      hint: {
        js: 'Each pair of square brackets creates its own array. Count them, then decide what each slot of the outer array points to.',
        py: 'Each pair of square brackets creates its own list. Count them, then decide what each slot of the outer list points to.',
      },
      hints: [
        {
          variable: 'grid',
          aliasing: 'shared',
          message:
            'Each pair of square brackets creates its own separate container. The two slots of grid should point to two separate inner containers, not share one.',
        },
      ],
      about: {
        js: 'An array can hold arrows to other arrays. Each inner pair of square brackets builds a separate array in memory, and the outer array points to it rather than holding its numbers directly.',
        py: 'A list can hold arrows to other lists. Each inner pair of square brackets builds a separate list in memory, and the outer list points to it rather than holding its numbers directly.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>[[1, 2], [3, 4]]</code> creates three separate arrays: an inner array holding <code>1</code> and <code>2</code>, another inner array holding <code>3</code> and <code>4</code>, and an outer array whose two slots point to them. <code>grid</code> refers to the outer array.</p>',
            py: '<p><code>[[1, 2], [3, 4]]</code> creates three separate lists: an inner list holding <code>1</code> and <code>2</code>, another inner list holding <code>3</code> and <code>4</code>, and an outer list whose two slots point to them. <code>grid</code> refers to the outer list.</p>',
          },
        },
        {
          diagram: graph(
            { grid: ref('grid') },
            {
              grid: list(ref('row0'), ref('row1')),
              row0: list(1, 2),
              row1: list(3, 4),
            },
          ),
          caption: {
            js: 'Correct: grid has two slots, each pointing to a separate inner array.',
            py: 'Correct: grid has two slots, each pointing to a separate inner list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ grid: ref('grid') }, { grid: list(1, 2, 3, 4) }),
          caption: {
            js: 'Not correct: this pours the inner arrays into grid as if they were part of it. grid has only two slots, and each points to an inner array.',
            py: 'Not correct: this pours the inner lists into grid as if they were part of it. grid has only two slots, and each points to an inner list.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>The outer array does not hold the numbers directly. It holds arrows to the inner arrays, which in turn hold arrows to the numbers.</p>',
            py: '<p>The outer list does not hold the numbers directly. It holds arrows to the inner lists, which in turn hold arrows to the numbers.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> both slots pointing to one inner array. Two separate pairs of brackets always build two separate arrays.</p>',
            py: '<p><strong>Not accepted:</strong> both slots pointing to one inner list. Two separate pairs of brackets always build two separate lists.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'An object that holds itself', py: 'A dictionary that holds itself' },
      js: lines('let o = {};', 'o.self = o;'),
      ts: lines('let o: { self?: unknown } = {};', 'o.self = o;'),
      py: lines('o = {}', 'o["self"] = o'),
      expected: graph({ o: ref('o') }, { o: dict({ self: ref('o') }) }),
      hint: {
        js: 'Create the empty object first, then set its self property to o.',
        py: 'Create the empty dictionary first, then set its "self" key to o.',
      },
      hints: [
        {
          variable: 'o',
          aliasing: 'separate',
          message:
            'self should point back to o itself. There is only one container here, and its arrow loops back to it.',
        },
      ],
      about: {
        js: 'An object can point to itself. Create the object first, then point one of its properties back at it: the result is one object whose arrow loops back, not an endless nest of objects.',
        py: 'A dictionary can point to itself. Create the dictionary first, then point one of its keys back at it: the result is one dictionary whose arrow loops back, not an endless nest of dictionaries.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let o = {};</code> creates an empty object. Then <code>o.self = o;</code> adds a property named <code>self</code> whose arrow points back to that same object.</p>',
            py: '<p><code>o = {}</code> creates an empty dictionary. Then <code>o["self"] = o</code> adds a key named <code>self</code> whose arrow points back to that same dictionary.</p>',
          },
        },
        {
          diagram: graph({ o: ref('o') }, { o: dict({ self: ref('o') }) }),
          caption: {
            js: 'Correct: one object whose self property points back to itself.',
            py: 'Correct: one dictionary whose self key points back to itself.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { o: ref('o') },
            {
              o: dict({ self: ref('inner') }),
              inner: dict({ self: ref('innermost') }),
              innermost: dict({}),
            },
          ),
          caption: {
            js: 'Not correct: o does not contain an endless chain of copies of itself. There is only one object, and its self arrow loops back to it.',
            py: 'Not correct: o does not contain an endless chain of copies of itself. There is only one dictionary, and its self arrow loops back to it.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>A container that refers to itself takes no more memory than any other. It is one box with one arrow that happens to point back at the box.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let o = { self: o };</code>. The object literal is built before <code>o</code> exists, so the program stops with an error. Create the container first, then connect the arrow.</p>',
            py: '<p><strong>Not accepted:</strong> <code>o = {"self": o}</code>. The dictionary literal is built before <code>o</code> exists, so the program stops with an error. Create the container first, then connect the arrow.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'An object holding an array', py: 'A dictionary holding a list' },
      js: 'let person = { name: "Ada", langs: ["js", "py"] };',
      py: 'person = {"name": "Ada", "langs": ["js", "py"]}',
      expected: graph(
        { person: ref('person') },
        {
          person: dict({ name: 'Ada', langs: ref('langs') }),
          langs: list('js', 'py'),
        },
      ),
      hint: {
        js: 'The square brackets create an array of their own. Draw it as a separate box and point the langs property at it.',
        py: 'The square brackets create a list of their own. Draw it as a separate box and point the langs key at it.',
      },
      about: {
        js: 'A property of an object can point to an array. The array is a separate container in memory, and the object holds only an arrow to it.',
        py: 'A key of a dictionary can point to a list. The list is a separate container in memory, and the dictionary holds only an arrow to it.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>person</code> refers to an object with two properties. <code>name</code> points to the string <code>"Ada"</code>, and <code>langs</code> points to a separate array holding <code>"js"</code> and <code>"py"</code>.</p>',
            py: '<p><code>person</code> refers to a dictionary with two keys. <code>name</code> points to the string <code>"Ada"</code>, and <code>langs</code> points to a separate list holding <code>"js"</code> and <code>"py"</code>.</p>',
          },
        },
        {
          diagram: graph(
            { person: ref('person') },
            {
              person: dict({ name: 'Ada', langs: ref('langs') }),
              langs: list('js', 'py'),
            },
          ),
          caption: {
            js: 'Correct: person.langs points to a separate array.',
            py: 'Correct: person["langs"] points to a separate list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { person: ref('person'), langs: ref('langs') },
            {
              person: dict({ name: 'Ada', langs: ref('langs') }),
              langs: list('js', 'py'),
            },
          ),
          caption: {
            js: 'Not correct: langs is a property of person, not a variable. The only variable is person, and the array is reached through person.langs.',
            py: 'Not correct: langs is a key of person, not a variable. The only variable is person, and the list is reached through person["langs"].',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>The array does not live "inside" the object box. The object holds only an arrow to the array.</p>',
            py: '<p>The list does not live "inside" the dictionary box. The dictionary holds only an arrow to the list.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'An object holding an object', py: 'A dictionary holding a dictionary' },
      js: 'let home = { address: { city: "Oslo" } };',
      ts: 'let home: { address: { city: string } } = { address: { city: "Oslo" } };',
      py: 'home = {"address": {"city": "Oslo"}}',
      expected: graph(
        { home: ref('home') },
        { home: dict({ address: ref('address') }), address: dict({ city: 'Oslo' }) },
      ),
      hint: {
        js: 'Declare home as an object whose address property points to a second object holding city "Oslo".',
        py: 'Assign home a dictionary whose "address" key points to a second dictionary holding "city": "Oslo".',
      },
      about: {
        js: 'An object can point to another object. Each pair of curly braces builds a separate object, and the outer one holds an arrow to the inner one.',
        py: 'A dictionary can point to another dictionary. Each pair of curly braces builds a separate dictionary, and the outer one holds an arrow to the inner one.',
      },
      debrief: [
        {
          html: {
            js: '<p>The code creates two objects: the inner one holding <code>city</code>, and the outer one that <code>home</code> refers to. <code>home.address</code> points to the inner object, whose <code>city</code> points to <code>"Oslo"</code>.</p>',
            py: '<p>The code creates two dictionaries: the inner one holding <code>"city"</code>, and the outer one that <code>home</code> refers to. <code>home["address"]</code> points to the inner dictionary, whose <code>"city"</code> points to <code>"Oslo"</code>.</p>',
          },
        },
        {
          diagram: graph(
            { home: ref('home') },
            { home: dict({ address: ref('address') }), address: dict({ city: 'Oslo' }) },
          ),
          caption: {
            js: 'Correct: home points to an object whose address property points to another object.',
            py: 'Correct: home points to a dictionary whose address key points to another dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ home: ref('home') }, { home: dict({ city: 'Oslo' }) }),
          caption: {
            js: 'Not correct: city sits directly on home instead of on a separate address object.',
            py: 'Not correct: city sits directly on home instead of on a separate address dictionary.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> building it in steps, such as <code>let address = { city: "Oslo" };</code> followed by <code>let home = { address: address };</code>. Only <code>home</code> is in the picture, so an extra variable pointing at the inner object does no harm.</p>',
            py: '<p><strong>Also correct:</strong> building it in steps, such as <code>address = {"city": "Oslo"}</code> followed by <code>home = {"address": address}</code>. Only <code>home</code> is in the picture, so an extra variable pointing at the inner dictionary does no harm.</p>',
          },
        },
        {
          html: {
            js: '<p>Each pair of curly braces creates a brand new object. Nested braces build separate objects joined by arrows.</p>',
            py: '<p>Each pair of curly braces creates a brand new dictionary. Nested braces build separate dictionaries joined by arrows.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'An array of objects', py: 'A list of dictionaries' },
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
      hint: {
        js: 'Each pair of curly braces creates its own object. Count them, then point each slot of users at one of them.',
        py: 'Each pair of curly braces creates its own dictionary. Count them, then point each slot of users at one of them.',
      },
      hints: [
        {
          variable: 'users',
          aliasing: 'shared',
          message:
            'Each pair of curly braces creates its own separate container. The two slots of users should point to two separate containers, not share one.',
        },
      ],
      about: {
        js: 'An array can point to objects. Each object literal in the array builds a separate object with its own identity.',
        py: 'A list can point to dictionaries. Each dictionary literal in the list builds a separate dictionary with its own identity.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>users</code> refers to an array with two slots. Each slot points to a separate object built by its own <code>{ id: ... }</code> literal.</p>',
            py: '<p><code>users</code> refers to a list with two slots. Each slot points to a separate dictionary built by its own <code>{"id": ...}</code> literal.</p>',
          },
        },
        {
          diagram: graph(
            { users: ref('users') },
            {
              users: list(ref('first'), ref('second')),
              first: dict({ id: 1 }),
              second: dict({ id: 2 }),
            },
          ),
          caption: {
            js: 'Correct: two slots pointing to two separate objects.',
            py: 'Correct: two slots pointing to two separate dictionaries.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { users: ref('users') },
            {
              users: list(ref('shared'), ref('shared')),
              shared: dict({ id: 1 }),
            },
          ),
          caption: {
            js: 'Not correct: one object reached twice. Two object literals always build two separate objects.',
            py: 'Not correct: one dictionary reached twice. Two dictionary literals always build two separate dictionaries.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Because the objects are separate, running <code>users[0].id = 5;</code> would change only the first one. <code>users[1].id</code> would still be <code>2</code>.</p>',
            py: '<p>Because the dictionaries are separate, running <code>users[0]["id"] = 5</code> would change only the first one. <code>users[1]["id"]</code> would still be <code>2</code>.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Parent and child',
      js: lines('let parent = { kids: [] };', 'let kid = { parent: parent };', 'parent.kids.push(kid);'),
      ts: lines(
        'let parent: { kids: unknown[] } = { kids: [] };',
        'let kid: { parent: unknown } = { parent: parent };',
        'parent.kids.push(kid);',
      ),
      py: lines('parent = {"kids": []}', 'kid = {"parent": parent}', 'parent["kids"].append(kid)'),
      expected: graph(
        { parent: ref('parent'), kid: ref('kid') },
        {
          parent: dict({ kids: ref('kids') }),
          kids: list(ref('kid')),
          kid: dict({ parent: ref('parent') }),
        },
      ),
      hint: {
        js: 'Declare parent with an empty kids array, declare kid pointing at parent, then push kid into parent.kids.',
        py: 'Assign parent with an empty kids list, assign kid pointing at parent, then append kid to parent["kids"].',
      },
      hints: [
        {
          variable: 'kid',
          aliasing: 'separate',
          message:
            "kid's parent arrow should point back to the container that parent refers to, not to a separate one.",
        },
      ],
      about:
        'Containers can refer to each other in a loop. Build the loop in steps: create the containers first, then add the arrow that closes the loop.',
      debrief: [
        {
          html: {
            js: '<p>First, <code>parent</code> is created with an empty <code>kids</code> array. Next, <code>kid</code> is created with a <code>parent</code> property pointing at the existing <code>parent</code> object. Finally, <code>parent.kids.push(kid)</code> changes the <code>kids</code> array in place, adding an arrow to <code>kid</code>. That last arrow closes the loop: from <code>parent</code>, the arrows lead to <code>kids</code>, then to <code>kid</code>, and back to <code>parent</code>.</p>',
            py: '<p>First, <code>parent</code> is created with an empty <code>"kids"</code> list. Next, <code>kid</code> is created with a <code>"parent"</code> key pointing at the existing <code>parent</code> dictionary. Finally, <code>parent["kids"].append(kid)</code> changes the kids list in place, adding an arrow to <code>kid</code>. That last arrow closes the loop: from <code>parent</code>, the arrows lead to the kids list, then to <code>kid</code>, and back to <code>parent</code>.</p>',
          },
        },
        {
          diagram: graph(
            { parent: ref('parent'), kid: ref('kid') },
            {
              parent: dict({ kids: ref('kids') }),
              kids: list(ref('kid')),
              kid: dict({ parent: ref('parent') }),
            },
          ),
          caption: 'Correct: parent and kid refer to each other in a loop.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { parent: ref('parent'), kid: ref('kid') },
            {
              parent: dict({ kids: ref('kids') }),
              kids: list(ref('kid')),
              kid: dict({ parent: ref('otherParent') }),
              otherParent: dict({ kids: ref('otherKids') }),
              otherKids: list(),
            },
          ),
          caption: {
            js: 'Not correct: kid.parent points to a separate parent object. There is only one parent, and kid points back to it.',
            py: 'Not correct: kid["parent"] points to a separate parent dictionary. There is only one parent, and kid points back to it.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> building everything in one literal, as in <code>let parent = { kids: [{ parent: parent }] };</code>. The inner literal is built before <code>parent</code> exists, so the program stops with an error.</p>',
            py: '<p><strong>Not accepted:</strong> building everything in one literal, as in <code>parent = {"kids": [{"parent": parent}]}</code>. The inner literal is built before <code>parent</code> exists, so the program stops with an error.</p>',
          },
        },
        {
          html: '<p>Arrows can point in any direction, so containers that refer to each other are common: a child points to its parent while the parent points to its children.</p>',
        },
      ],
    }),
    draw({
      title: { js: 'The same inner array twice', py: 'The same inner list twice' },
      js: lines('let inner = [1];', 'let outer = [inner, inner];'),
      py: lines('inner = [1]', 'outer = [inner, inner]'),
      expected: graph(
        { inner: ref('inner'), outer: ref('outer') },
        { inner: list(1), outer: list(ref('inner'), ref('inner')) },
      ),
      hint: {
        js: 'Count how many arrays this code creates. Only square brackets create an array; writing the name inner does not.',
        py: 'Count how many lists this code creates. Only square brackets create a list; writing the name inner does not.',
      },
      hints: [
        {
          variable: 'outer',
          aliasing: 'separate',
          message:
            'Both slots of outer should point to the one container that inner refers to. Writing a variable inside brackets adds another arrow to its container; it does not make a copy.',
        },
      ],
      about: {
        js: 'An array can hold several arrows to one inner array. Putting a variable inside an array literal adds another arrow to the array it refers to; it never builds a new one.',
        py: 'A list can hold several arrows to one inner list. Putting a variable inside a list literal adds another arrow to the list it refers to; it never builds a new one.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let inner = [1];</code> creates one array. When <code>[inner, inner]</code> is evaluated, slot 0 and slot 1 each get an arrow to that one array. No copy is made.</p>',
            py: '<p><code>inner = [1]</code> creates one list. When <code>[inner, inner]</code> is evaluated, slot 0 and slot 1 each get an arrow to that one list. No copy is made.</p>',
          },
        },
        {
          diagram: graph(
            { inner: ref('inner'), outer: ref('outer') },
            { inner: list(1), outer: list(ref('inner'), ref('inner')) },
          ),
          caption: {
            js: 'Correct: outer has two arrows pointing to the one inner array.',
            py: 'Correct: outer has two arrows pointing to the one inner list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { inner: ref('inner'), outer: ref('outer') },
            {
              inner: list(1),
              outer: list(ref('inner'), ref('copy')),
              copy: list(1),
            },
          ),
          caption: {
            js: 'Not correct: this treats each slot as owning its own copy of inner. Only one inner array was ever created.',
            py: 'Not correct: this treats each slot as owning its own copy of inner. Only one inner list was ever created.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Compare this with the grid: there, two separate pairs of brackets built two separate inner arrays. Here there is one pair, so there is one inner array.</p>',
            py: '<p>Compare this with the grid: there, two separate pairs of brackets built two separate inner lists. Here there is one pair, so there is one inner list.</p>',
          },
        },
        {
          html: {
            js: '<p>Because both slots point to one array, changing it in place with <code>outer[0].push(2)</code> would also be seen through <code>outer[1]</code> and <code>inner</code>.</p>',
            py: '<p>Because both slots point to one list, changing it in place with <code>outer[0].append(2)</code> would also be seen through <code>outer[1]</code> and <code>inner</code>.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Two properties, one array', py: 'Two keys, one list' },
      js: lines('let nums = [0];', 'let box = { left: nums, right: nums };'),
      ts: lines(
        'let nums: number[] = [0];',
        'let box: { left: number[]; right: number[] } = { left: nums, right: nums };',
      ),
      py: lines('nums = [0]', 'box = {"left": nums, "right": nums}'),
      expected: graph(
        { box: ref('box') },
        { box: dict({ left: ref('shared'), right: ref('shared') }), shared: list(0) },
      ),
      hint: {
        js: 'Create the array once, then point both left and right at it.',
        py: 'Create the list once, then point both "left" and "right" at it.',
      },
      hints: [
        {
          variable: 'box',
          aliasing: 'separate',
          message:
            'left and right should point to one shared container, not two separate containers.',
        },
      ],
      about: {
        js: 'Two properties of one object can point to the same array. Create the array once, then use it for both properties.',
        py: 'Two keys of one dictionary can point to the same list. Create the list once, then use it for both keys.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let nums = [0];</code> creates a single array. Then <code>box</code> is created with both <code>left</code> and <code>right</code> pointing at the array <code>nums</code> refers to.</p>',
            py: '<p><code>nums = [0]</code> creates a single list. Then <code>box</code> is created with both <code>"left"</code> and <code>"right"</code> pointing at the list <code>nums</code> refers to.</p>',
          },
        },
        {
          diagram: graph(
            { box: ref('box') },
            { box: dict({ left: ref('shared'), right: ref('shared') }), shared: list(0) },
          ),
          caption: {
            js: 'Correct: left and right point to one shared array.',
            py: 'Correct: left and right point to one shared list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { box: ref('box') },
            {
              box: dict({ left: ref('l1'), right: ref('l2') }),
              l1: list(0),
              l2: list(0),
            },
          ),
          caption: {
            js: 'Not correct: two separate arrays that merely hold equal contents.',
            py: 'Not correct: two separate lists that merely hold equal contents.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let box = { left: [0] };</code> followed by <code>box.right = box.left;</code>. Any code that creates one array and points both properties at it builds this picture.</p>',
            py: '<p><strong>Also correct:</strong> <code>box = {"left": [0]}</code> followed by <code>box["right"] = box["left"]</code>. Any code that creates one list and points both keys at it builds this picture.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let box = { left: [0], right: [0] };</code>. Two literals build two separate arrays, even though their contents are equal.</p>',
            py: '<p><strong>Not accepted:</strong> <code>box = {"left": [0], "right": [0]}</code>. Two literals build two separate lists, even though their contents are equal.</p>',
          },
        },
        {
          html: {
            js: '<p><code>box.left</code> and <code>box.right</code> are aliases for one array. Changing it in place with <code>box.left.push(1)</code> would be seen through <code>box.right</code> as well.</p>',
            py: '<p><code>box["left"]</code> and <code>box["right"]</code> are aliases for one list. Changing it in place with <code>box["left"].append(1)</code> would be seen through <code>box["right"]</code> as well.</p>',
          },
        },
      ],
    }),
    write({
      title: { js: 'Two arrays, one object', py: 'Two lists, one dictionary' },
      js: lines('let o = { v: 1 };', 'let x = [o];', 'let y = [o];'),
      ts: lines(
        'let o: { v: number } = { v: 1 };',
        'let x: { v: number }[] = [o];',
        'let y: { v: number }[] = [o];',
      ),
      py: lines('o = {"v": 1}', 'x = [o]', 'y = [o]'),
      expected: graph(
        { x: ref('x'), y: ref('y') },
        { x: list(ref('shared')), y: list(ref('shared')), shared: dict({ v: 1 }) },
      ),
      hint: {
        js: 'Create the object once, then put it into two separate arrays x and y.',
        py: 'Create the dictionary once, then put it into two separate lists x and y.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'The slots of x and y should point to one shared container, not two separate containers.',
        },
        {
          variable: 'y',
          aliasing: 'shared',
          message: 'x and y should be two separate containers. Only the container their slots point to is shared.',
        },
      ],
      about: {
        js: 'Two separate arrays can point to one shared object. The arrays have their own identities, but their slots lead to the same object.',
        py: 'Two separate lists can point to one shared dictionary. The lists have their own identities, but their slots lead to the same dictionary.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let o = { v: 1 };</code> creates one object. Then <code>let x = [o];</code> and <code>let y = [o];</code> create two separate arrays whose slots point to that one object.</p>',
            py: '<p><code>o = {"v": 1}</code> creates one dictionary. Then <code>x = [o]</code> and <code>y = [o]</code> create two separate lists whose slots point to that one dictionary.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y') },
            { x: list(ref('shared')), y: list(ref('shared')), shared: dict({ v: 1 }) },
          ),
          caption: {
            js: 'Correct: x and y are separate arrays sharing one inner object.',
            py: 'Correct: x and y are separate lists sharing one inner dictionary.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y') },
            {
              x: list(ref('o1')),
              y: list(ref('o2')),
              o1: dict({ v: 1 }),
              o2: dict({ v: 1 }),
            },
          ),
          caption: {
            js: 'Not correct: two separate objects with equal contents. The picture shows one object that both arrays point to.',
            py: 'Not correct: two separate dictionaries with equal contents. The picture shows one dictionary that both lists point to.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let y = x;</code>. That makes <code>y</code> an alias for the array <code>x</code> refers to, but the picture shows two separate arrays.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y = x</code>. That makes <code>y</code> an alias for the list <code>x</code> refers to, but the picture shows two separate lists.</p>',
          },
        },
        {
          html: {
            js: '<p>Because <code>x[0]</code> and <code>y[0]</code> lead to one object, running <code>x[0].v = 2;</code> would change what <code>y[0].v</code> shows as well.</p>',
            py: '<p>Because <code>x[0]</code> and <code>y[0]</code> lead to one dictionary, running <code>x[0]["v"] = 2</code> would change what <code>y[0]["v"]</code> shows as well.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'Changing a nested array', py: 'Changing a nested list' },
      js: lines('let inner = [1];', 'let outer = [inner];', 'inner.push(2);'),
      py: lines('inner = [1]', 'outer = [inner]', 'inner.append(2)'),
      expected: graph(
        { inner: ref('inner'), outer: ref('outer') },
        { inner: list(1, 2), outer: list(ref('inner')) },
      ),
      hint: {
        js: 'First decide whether outer holds its own copy of inner or an arrow to the same array. Then apply the last line.',
        py: 'First decide whether outer holds its own copy of inner or an arrow to the same list. Then apply the last line.',
      },
      hints: [
        {
          variable: 'outer',
          aliasing: 'separate',
          message:
            'outer holds an arrow to inner, not a frozen copy. When inner changes in place to [1, 2], outer sees that change too.',
        },
      ],
      about: {
        js: 'An outer array holds an arrow to an inner array, not a copy. Changing the inner array in place is visible from the outer array.',
        py: 'An outer list holds an arrow to an inner list, not a copy. Changing the inner list in place is visible from the outer list.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>outer[0]</code> points to the array <code>inner</code> refers to. <code>inner.push(2)</code> changes that array in place, and <code>outer[0]</code> still points to it, so <code>outer[0]</code> now shows <code>[1, 2]</code>.</p>',
            py: '<p><code>outer[0]</code> points to the list <code>inner</code> refers to. <code>inner.append(2)</code> changes that list in place, and <code>outer[0]</code> still points to it, so <code>outer[0]</code> now shows <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { inner: ref('inner'), outer: ref('outer') },
            { inner: list(1, 2), outer: list(ref('inner')) },
          ),
          caption: 'Correct: inner has grown to [1, 2], and outer points to it.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { inner: ref('inner'), outer: ref('outer') },
            {
              inner: list(1, 2),
              outer: list(ref('old')),
              old: list(1),
            },
          ),
          caption: 'Not correct: outer does not keep a frozen copy of [1]. It points to the same container as inner.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Putting a container inside another does not take a snapshot of it. The outer container holds an arrow to the live inner one, which can be changed at any time.</p>',
        },
        {
          html: {
            js: '<p>Changing in place is what matters. If the last line were <code>inner = [1, 2];</code> instead, <code>inner</code> would be repointed at a brand new array, and <code>outer[0]</code> would still point to the old <code>[1]</code>.</p>',
            py: '<p>Changing in place is what matters. If the last line were <code>inner = [1, 2]</code> instead, <code>inner</code> would be repointed at a brand new list, and <code>outer[0]</code> would still point to the old <code>[1]</code>.</p>',
          },
        },
      ],
    }),
  ],
  [
    write({
      title: 'One row, used twice',
      js: lines('let row = [null, null];', 'let board = [row, row];'),
      ts: lines('let row: null[] = [null, null];', 'let board: null[][] = [row, row];'),
      py: lines('row = [None, None]', 'board = [row, row]'),
      expected: graph(
        { board: ref('board') },
        { board: list(ref('row'), ref('row')), row: list(null, null) },
      ),
      hint: {
        js: 'Count how many row arrays the picture shows, and how many arrows lead to them.',
        py: 'Count how many row lists the picture shows, and how many arrows lead to them.',
      },
      hints: [
        {
          variable: 'board',
          aliasing: 'separate',
          message:
            'Both slots of board should point to one shared row, not two separate rows.',
        },
      ],
      about: {
        js: 'Putting one row array into a grid twice makes both rows aliases for one array in memory.',
        py: 'Putting one row list into a grid twice makes both rows aliases for one list in memory.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let row = [null, null];</code> creates one array. <code>let board = [row, row];</code> puts two arrows to that one array into <code>board</code>.</p>',
            py: '<p><code>row = [None, None]</code> creates one list. <code>board = [row, row]</code> puts two arrows to that one list into <code>board</code>.</p>',
          },
        },
        {
          diagram: graph(
            { board: ref('board') },
            { board: list(ref('row'), ref('row')), row: list(null, null) },
          ),
          caption: {
            js: 'Correct: board has two slots pointing to the one row array.',
            py: 'Correct: board has two slots pointing to the one row list.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { board: ref('board') },
            {
              board: list(ref('r1'), ref('r2')),
              r1: list(null, null),
              r2: list(null, null),
            },
          ),
          caption: 'Not correct: two separate rows with equal contents. The picture shows one row reached twice.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let board = [[null, null], [null, null]];</code>. The two inner literals build two separate rows.</p>',
            py: '<p><strong>Not accepted:</strong> <code>board = [[None, None], [None, None]]</code>. The two inner literals build two separate rows.</p>',
          },
        },
        {
          html: {
            js: '<p>This is a common trap when building grids: running <code>board[0][0] = "X";</code> would also change what <code>board[1][0]</code> shows, because both rows are one array.</p>',
            py: '<p>This is a common trap when building grids: running <code>board[0][0] = "X"</code> would also change what <code>board[1][0]</code> shows, because both rows are one list.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Pointing at each other',
      js: lines('let x = { n: 1 };', 'let y = { n: 2 };', 'x.other = y;', 'y.other = x;'),
      py: lines('x = {"n": 1}', 'y = {"n": 2}', 'x["other"] = y', 'y["other"] = x'),
      expected: graph(
        { x: ref('x'), y: ref('y') },
        {
          x: dict({ n: 1, other: ref('y') }),
          y: dict({ n: 2, other: ref('x') }),
        },
      ),
      hint: {
        js: 'Draw both objects first. Then add the arrow set by each of the last two lines, in order.',
        py: 'Draw both dictionaries first. Then add the arrow set by each of the last two lines, in order.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            "y's other arrow should point back to the container x refers to, not to a separate copy of it.",
        },
      ],
      about: {
        js: 'Two objects can hold arrows to each other, forming a loop in memory.',
        py: 'Two dictionaries can hold arrows to each other, forming a loop in memory.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>x</code> and <code>y</code> are created as two separate objects. Then <code>x.other = y;</code> points <code>x.other</code> at the object <code>y</code> refers to, and <code>y.other = x;</code> points <code>y.other</code> back at the object <code>x</code> refers to, closing the loop.</p>',
            py: '<p><code>x</code> and <code>y</code> are created as two separate dictionaries. Then <code>x["other"] = y</code> points <code>x["other"]</code> at the dictionary <code>y</code> refers to, and <code>y["other"] = x</code> points <code>y["other"]</code> back at the dictionary <code>x</code> refers to, closing the loop.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y') },
            {
              x: dict({ n: 1, other: ref('y') }),
              y: dict({ n: 2, other: ref('x') }),
            },
          ),
          caption: 'Correct: x and y refer to each other.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y') },
            {
              x: dict({ n: 1, other: ref('y') }),
              y: dict({ n: 2, other: ref('copyA') }),
              copyA: dict({ n: 1 }),
            },
          ),
          caption: {
            js: 'Not correct: y.other points to a snapshot of x. Assigning never copies, so y.other points to x itself.',
            py: 'Not correct: y["other"] points to a snapshot of x. Assigning never copies, so y["other"] points to x itself.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p>Loops like this are common in data structures such as doubly linked lists and graphs, where nodes point to each other in both directions.</p>',
        },
      ],
    }),
    write({
      title: 'Two points in a line',
      js: 'let line = { start: { x: 0, y: 0 }, end: { x: 3, y: 4 } };',
      ts: 'let line: { start: { x: number; y: number }; end: { x: number; y: number } } = { start: { x: 0, y: 0 }, end: { x: 3, y: 4 } };',
      py: 'line = {"start": {"x": 0, "y": 0}, "end": {"x": 3, "y": 4}}',
      expected: graph(
        { line: ref('line') },
        {
          line: dict({ start: ref('start'), end: ref('end') }),
          start: dict({ x: 0, y: 0 }),
          end: dict({ x: 3, y: 4 }),
        },
      ),
      hint: {
        js: 'Each point in the picture is its own object. Give each one its own pair of curly braces.',
        py: 'Each point in the picture is its own dictionary. Give each one its own pair of curly braces.',
      },
      hints: [
        {
          variable: 'line',
          aliasing: 'shared',
          message: 'start and end should point to two separate containers, not share one.',
        },
      ],
      about: {
        js: 'An object can point to several separate objects under different properties. Each nested object has its own identity.',
        py: 'A dictionary can point to several separate dictionaries under different keys. Each nested dictionary has its own identity.',
      },
      debrief: [
        {
          html: {
            js: '<p>The code creates three objects: two separate point objects, <code>{ x: 0, y: 0 }</code> and <code>{ x: 3, y: 4 }</code>, and the outer object that <code>line</code> refers to, whose <code>start</code> and <code>end</code> point to them.</p>',
            py: '<p>The code creates three dictionaries: two separate point dictionaries, <code>{"x": 0, "y": 0}</code> and <code>{"x": 3, "y": 4}</code>, and the outer dictionary that <code>line</code> refers to, whose <code>"start"</code> and <code>"end"</code> point to them.</p>',
          },
        },
        {
          diagram: graph(
            { line: ref('line') },
            {
              line: dict({ start: ref('start'), end: ref('end') }),
              start: dict({ x: 0, y: 0 }),
              end: dict({ x: 3, y: 4 }),
            },
          ),
          caption: {
            js: 'Correct: start and end point to two separate point objects.',
            py: 'Correct: start and end point to two separate point dictionaries.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { line: ref('line') },
            {
              line: dict({ start: ref('shared'), end: ref('shared') }),
              shared: dict({ x: 0, y: 0 }),
            },
          ),
          caption: {
            js: 'Not correct: start and end share one object, so they cannot have different coordinates.',
            py: 'Not correct: start and end share one dictionary, so they cannot have different coordinates.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> building the points first, such as <code>let start = { x: 0, y: 0 };</code> and <code>let end = { x: 3, y: 4 };</code>, then <code>let line = { start: start, end: end };</code>. Only <code>line</code> is in the picture.</p>',
            py: '<p><strong>Also correct:</strong> building the points first, such as <code>start = {"x": 0, "y": 0}</code> and <code>end = {"x": 3, "y": 4}</code>, then <code>line = {"start": start, "end": end}</code>. Only <code>line</code> is in the picture.</p>',
          },
        },
        {
          html: {
            js: '<p>Because the points are separate objects, changing <code>line.start.x</code> would not affect <code>line.end.x</code>.</p>',
            py: '<p>Because the points are separate dictionaries, changing <code>line["start"]["x"]</code> would not affect <code>line["end"]["x"]</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'One array in two objects', py: 'One list in two dictionaries' },
      js: lines('let labels = ["new"];', 'let x = { tags: labels };', 'let y = { tags: labels };'),
      py: lines('labels = ["new"]', 'x = {"tags": labels}', 'y = {"tags": labels}'),
      expected: graph(
        { labels: ref('labels'), x: ref('x'), y: ref('y') },
        { labels: list('new'), x: dict({ tags: ref('labels') }), y: dict({ tags: ref('labels') }) },
      ),
      hint: {
        js: 'Count how many arrays the code creates, then follow where each tags property points.',
        py: 'Count how many lists the code creates, then follow where each "tags" key points.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'The tags of x and y should both point to the one container that labels refers to, not to separate containers.',
        },
      ],
      about: {
        js: 'Separate objects can point to one shared array. A change made to that array through one object is seen through the other.',
        py: 'Separate dictionaries can point to one shared list. A change made to that list through one dictionary is seen through the other.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let labels = ["new"];</code> creates a single array. When <code>x</code> and <code>y</code> are created with <code>tags: labels</code>, both objects point their <code>tags</code> property at that one array.</p>',
            py: '<p><code>labels = ["new"]</code> creates a single list. When <code>x</code> and <code>y</code> are created with <code>"tags": labels</code>, both dictionaries point their <code>"tags"</code> key at that one list.</p>',
          },
        },
        {
          diagram: graph(
            { labels: ref('labels'), x: ref('x'), y: ref('y') },
            { labels: list('new'), x: dict({ tags: ref('labels') }), y: dict({ tags: ref('labels') }) },
          ),
          caption: {
            js: 'Correct: x.tags and y.tags point to the one array labels refers to.',
            py: 'Correct: x["tags"] and y["tags"] point to the one list labels refers to.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph(
            { labels: ref('labels'), x: ref('x'), y: ref('y') },
            {
              labels: list('new'),
              x: dict({ tags: ref('labels') }),
              y: dict({ tags: ref('copy') }),
              copy: list('new'),
            },
          ),
          caption: {
            js: 'Not correct: y.tags points to a separate copy of the array. Using labels in a literal adds an arrow to it; it does not copy it.',
            py: 'Not correct: y["tags"] points to a separate copy of the list. Using labels in a literal adds an arrow to it; it does not copy it.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>If code later runs <code>x.tags.push("sale");</code>, the change is seen through <code>y.tags</code> and <code>labels</code> as well, because all three lead to one array.</p>',
            py: '<p>If code later runs <code>x["tags"].append("sale")</code>, the change is seen through <code>y["tags"]</code> and <code>labels</code> as well, because all three lead to one list.</p>',
          },
        },
      ],
    }),
    draw({
      title: { js: 'Changing an object inside an array', py: 'Changing a dictionary inside a list' },
      js: lines('let inner = { n: 1 };', 'let outer = [inner];', 'inner.n = 2;'),
      py: lines('inner = {"n": 1}', 'outer = [inner]', 'inner["n"] = 2'),
      expected: graph(
        { inner: ref('inner'), outer: ref('outer') },
        { inner: dict({ n: 2 }), outer: list(ref('inner')) },
      ),
      hint: {
        js: 'Decide whether outer holds a copy of inner or an arrow to it. Then apply the last line.',
        py: 'Decide whether outer holds a copy of inner or an arrow to it. Then apply the last line.',
      },
      hints: [
        {
          variable: 'outer',
          aliasing: 'separate',
          message:
            "outer's slot points to the container inner refers to, not to a snapshot of it. Changing n through inner changes what outer sees.",
        },
      ],
      about: {
        js: 'An array holds an arrow to an object, not a snapshot. Changing a property of the object in place is visible through the array.',
        py: 'A list holds an arrow to a dictionary, not a snapshot. Changing a key of the dictionary in place is visible through the list.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>outer[0]</code> points to the object <code>inner</code> refers to. <code>inner.n = 2;</code> changes that object in place, and <code>outer[0]</code> still points to it, so <code>outer[0].n</code> is now <code>2</code>.</p>',
            py: '<p><code>outer[0]</code> points to the dictionary <code>inner</code> refers to. <code>inner["n"] = 2</code> changes that dictionary in place, and <code>outer[0]</code> still points to it, so <code>outer[0]["n"]</code> is now <code>2</code>.</p>',
          },
        },
        {
          diagram: graph(
            { inner: ref('inner'), outer: ref('outer') },
            { inner: dict({ n: 2 }), outer: list(ref('inner')) },
          ),
          caption: 'Correct: inner has n set to 2, and outer points to it.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { inner: ref('inner'), outer: ref('outer') },
            {
              inner: dict({ n: 2 }),
              outer: list(ref('old')),
              old: dict({ n: 1 }),
            },
          ),
          caption: {
            js: 'Not correct: outer does not keep a frozen copy of { n: 1 }. It points to the same object as inner.',
            py: 'Not correct: outer does not keep a frozen copy of {"n": 1}. It points to the same dictionary as inner.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Putting an object into an array never copies it. There is only one object, and a change to it is seen from everywhere that refers to it.</p>',
            py: '<p>Putting a dictionary into a list never copies it. There is only one dictionary, and a change to it is seen from everywhere that refers to it.</p>',
          },
        },
      ],
    }),
  ],
)
