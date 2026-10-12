import { dict, graph, list, ref, scalar } from '../builders'
import { copiesFrom, copiesOrCombinesFrom, preserve, runtime } from '../process'
import type { UnnumberedLevel } from '../types'
import { draw, L, level, lines, write } from './common'

export const copiesLevel: UnnumberedLevel = level(
  'copies',
  L('Copies and Aliases', 'Copies and Aliases'),
  L(
    'Copying with spread makes a new outer array or object, but the arrays or objects inside it are shared with the original rather than copied. That is a shallow copy. Repeating an item, as with fill(), repeats the same reference.',
    'Copying with list() and dict() makes a new outer list or dictionary, but the lists or dictionaries inside it are shared with the original rather than copied. That is a shallow copy. Repeating an item with * repeats the same reference.',
  ),
  [
    draw({
      title: 'A copy of a list',
      js: lines('let a = [1, 2];', 'let b = [...a];'),
      py: lines('a = [1, 2]', 'b = list(a)'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2) }),
      teaches: ['copy.array'],
      hint: {
        js: '[...a] makes a new array holding the same values as a, so a and b point to different arrays.',
        py: 'list(a) makes a new list holding the same values as a, so a and b point to different lists.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'b must point to its own container: copying makes a new container rather than an alias for a.',
        },
      ],
      about: {
        js: 'Copying an array with spread creates a brand new array with the same slot values. The copy and the original are two separate arrays in memory.',
        py: 'Copying a list with list() creates a brand new list with the same slot values. The copy and the original are two separate lists in memory.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = [...a];</code> creates a <strong>new array</strong> in memory and fills its slots with the values from <code>a</code>. <code>a</code> and <code>b</code> refer to two separate arrays.</p>',
            py: '<p><code>b = list(a)</code> creates a <strong>new list</strong> in memory and fills its slots with the values from <code>a</code>. <code>a</code> and <code>b</code> refer to two separate lists.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2) }),
          caption: {
            js: 'Two separate arrays with matching slot values.',
            py: 'Two separate lists with matching slot values.',
          },
          verdict: 'correct',
        },
        {
          html: '<p><strong>Also correct:</strong> the slots of both copies pointing to the same <code>1</code> and <code>2</code>. Numbers cannot be changed in place, so sharing them or drawing separate ones makes no difference, and the checker accepts both.</p>',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: list(ref('one'), ref('two')), b: list(ref('one'), ref('two')), one: scalar(1), two: scalar(2) },
          ),
          caption: {
            js: 'Also correct: two separate arrays whose slots share the numbers.',
            py: 'Also correct: two separate lists whose slots share the numbers.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> <code>let b = a;</code> would make <code>b</code> an alias for <code>a</code>, pointing both variables at the same array.</p>',
            py: '<p><strong>Not correct:</strong> <code>b = a</code> would make <code>b</code> an alias for <code>a</code>, pointing both variables at the same list.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2) }),
          caption: {
            js: 'Not correct: an alias shares one array instead of making a copy.',
            py: 'Not correct: an alias shares one list instead of making a copy.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: 'A copy of an object',
      js: lines('let p = { n: 1 };', 'let q = { ...p };'),
      py: lines('p = {"n": 1}', 'q = dict(p)'),
      expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1 }) }),
      teaches: ['copy.object'],
      hint: {
        js: '{ ...p } makes a new object with the same keys as p, so p and q point to different objects.',
        py: 'dict(p) makes a new dictionary with the same keys as p, so p and q point to different dictionaries.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'shared',
          message: 'q must point to its own container: copying makes a new container rather than an alias for p.',
        },
      ],
      about: {
        js: 'Copying an object with spread creates a new object in memory with the same key-value pairs. The copy is a separate object from the original.',
        py: 'Copying a dictionary with dict() creates a new dictionary in memory with the same key-value pairs. The copy is a separate dictionary from the original.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let q = { ...p };</code> creates a <strong>new object</strong> in memory and gives it the same keys and values as <code>p</code>. <code>p</code> and <code>q</code> refer to two separate objects.</p>',
            py: '<p><code>q = dict(p)</code> creates a <strong>new dictionary</strong> in memory and gives it the same keys and values as <code>p</code>. <code>p</code> and <code>q</code> refer to two separate dictionaries.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1 }) }),
          caption: {
            js: 'Two separate objects with the same key and value.',
            py: 'Two separate dictionaries with the same key and value.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> <code>let q = p;</code> would make <code>q</code> an alias pointing to the same object as <code>p</code>.</p>',
            py: '<p><strong>Not correct:</strong> <code>q = p</code> would make <code>q</code> an alias pointing to the same dictionary as <code>p</code>.</p>',
          },
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 1 }) }),
          caption: {
            js: 'Not correct: an alias shares one object instead of making a copy.',
            py: 'Not correct: an alias shares one dictionary instead of making a copy.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Copy and add a key',
      given: { js: 'let p = { n: 1 };', ts: 'let p: { n: number } = { n: 1 };', py: 'p = {"n": 1}' },
      js: lines('let q = { ...p };', 'q.m = 2;'),
      ts: lines('let q: { n: number; m?: number } = { ...p };', 'q.m = 2;'),
      py: lines('q = dict(p)', 'q["m"] = 2'),
      expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1, m: 2 }) }),
      reliesOn: ['copy.object'],
      hint: {
        js: 'Declare q as a copy of p, then add key m holding 2 to q in place; p stays with only n.',
        py: 'Assign q as a copy of p, then add key m holding 2 to q in place; p stays with only n.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'shared',
          message: 'q must be a copy of p, not an alias. If p and q share one container, adding a key to q adds it to p as well.',
        },
      ],
      about: {
        js: 'Copying with spread makes a separate object, then you add key m to that copy in place. The special constraint says q must follow whatever p starts with, so build q by copying p instead of retyping its contents.',
        py: 'Copying with dict() makes a separate dictionary, then you add key m to that copy in place. The special constraint says q must follow whatever p starts with, so build q by copying p instead of retyping its contents.',
      },
      constraints: [
        {
          rule:
            'Your boss said that q must be built by copying p, so if another programmer updates what p starts with, q must still be a copy of that p with key m added and p left unchanged.',
          cases: [
            {
              change: 'p starts with { n: 4 }',
              given: { js: 'let p = { n: 4 };', ts: 'let p: { n: number } = { n: 4 };', py: 'p = {"n": 4}' },
              expected: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 4 }), q: dict({ n: 4, m: 2 }) }),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(preserve('p')),
        source: [copiesFrom('q', 'p')],
      },
      debrief: [
        {
          html: {
            js: '<p>First, <code>let q = { ...p };</code> creates a separate copy of <code>p</code>. Then <code>q.m = 2;</code> adds key <code>m</code> to <code>q</code> in place. Because <code>p</code> and <code>q</code> are separate objects, <code>p</code> still has only <code>n: 1</code>.</p>',
            py: '<p>First, <code>q = dict(p)</code> creates a separate copy of <code>p</code>. Then <code>q["m"] = 2</code> adds key <code>"m"</code> to <code>q</code> in place. Because <code>p</code> and <code>q</code> are separate dictionaries, <code>p</code> still has only <code>"n": 1</code>.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p'), q: ref('q') }, { p: dict({ n: 1 }), q: dict({ n: 1, m: 2 }) }),
          caption: 'q has the added key; p is unaffected.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let q = { ...p, m: 2 };</code> copies <code>p</code> and adds the new key in a single expression. <code>Object.assign({}, p)</code> is another way to make the copy.</p>',
            py: '<p><strong>Also correct:</strong> <code>q = p.copy()</code> is another way to make the copy before adding the key.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let q = { n: 1, m: 2 };</code> builds the right picture by retyping the contents of <code>p</code>, but it does not copy <code>p</code>, so it would be wrong if <code>p</code> held something else.</p>',
            py: '<p><strong>Not accepted:</strong> <code>q = {"n": 1, "m": 2}</code> builds the right picture by retyping the contents of <code>p</code>, but it does not copy <code>p</code>, so it would be wrong if <code>p</code> held something else.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> the alias <code>let q = p; q.m = 2;</code> changes the original object in place, giving <code>p</code> the key <code>m</code> too.</p>',
            py: '<p><strong>Not correct:</strong> the alias <code>q = p; q["m"] = 2</code> changes the original dictionary in place, giving <code>p</code> the key <code>"m"</code> too.</p>',
          },
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: dict({ n: 1, m: 2 }) }),
          caption: 'Not correct: if q were an alias, p would also have key m.',
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Copy, then grow the copy',
      given: { js: 'let a = [1, 2];', ts: 'let a: number[] = [1, 2];', py: 'a = [1, 2]' },
      js: lines('let b = [...a];', 'b.push(3);'),
      ts: lines('let b: number[] = [...a];', 'b.push(3);'),
      py: lines('b = list(a)', 'b.append(3)'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2, 3) }),
      reliesOn: ['copy.array', 'array.push'],
      hint: {
        js: 'Declare b as a copy of a, then grow b to [1, 2, 3] in place; a stays [1, 2].',
        py: 'Assign b as a copy of a, then grow b to [1, 2, 3] in place; a stays [1, 2].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'b must be a copy of a, not an alias. If a and b share one container, adding to b adds to a as well.',
        },
      ],
      about: {
        js: 'Adding an item to a copy changes only the copy, because the copy is a separate array from the original. The special constraint says b must follow whatever a starts with, so build b by copying a instead of retyping its contents.',
        py: 'Adding an item to a copy changes only the copy, because the copy is a separate list from the original. The special constraint says b must follow whatever a starts with, so build b by copying a instead of retyping its contents.',
      },
      constraints: [
        {
          rule:
            'Your boss said that b must be built by copying a, so if another programmer updates what a starts with, b must still be a separate copy with 3 added and a unchanged.',
          cases: [
            {
              change: 'a starts as [5, 6]',
              given: { js: 'let a = [5, 6];', ts: 'let a: number[] = [5, 6];', py: 'a = [5, 6]' },
              expected: graph({ a: ref('a'), b: ref('b') }, { a: list(5, 6), b: list(5, 6, 3) }),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(preserve('a')),
        source: [copiesOrCombinesFrom('b', 'a')],
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = [...a];</code> makes a new array holding <code>1</code> and <code>2</code>. Then <code>b.push(3);</code> grows <code>b</code> in place to three items. <code>a</code> is a separate array and remains <code>[1, 2]</code>.</p>',
            py: '<p><code>b = list(a)</code> makes a new list holding <code>1</code> and <code>2</code>. Then <code>b.append(3)</code> grows <code>b</code> in place to three items. <code>a</code> is a separate list and remains <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 2), b: list(1, 2, 3) }),
          caption: 'b has three items; a stays at two.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let b = [...a, 3];</code> copies <code>a</code> and includes the new item <code>3</code> in one line. <code>let b = a.concat([3]);</code> also builds a new array from <code>a</code>, leaving <code>a</code> alone.</p>',
            py: '<p><strong>Also correct:</strong> <code>b = a.copy()</code> or <code>b = a[:]</code> also copies <code>a</code> before the append. <code>b = a + [3]</code> builds the new list in one line, leaving <code>a</code> alone.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let b = [1, 2, 3];</code> builds the right picture by retyping the contents of <code>a</code>, but it does not copy <code>a</code>, so it would be wrong if <code>a</code> held something else.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b = [1, 2, 3]</code> builds the right picture by retyping the contents of <code>a</code>, but it does not copy <code>a</code>, so it would be wrong if <code>a</code> held something else.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> <code>let b = a; b.push(3);</code> would make <code>b</code> an alias for <code>a</code>, so pushing to <code>b</code> would change <code>a</code> as well.</p>',
            py: '<p><strong>Not correct:</strong> <code>b = a; b.append(3)</code> would make <code>b</code> an alias for <code>a</code>, so appending to <code>b</code> would change <code>a</code> as well.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2, 3) }),
          caption: {
            js: 'Not correct: through an alias, growing b grows the original array too.',
            py: 'Not correct: through an alias, growing b grows the original list too.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: 'A shallow copy',
      js: lines('let a = [[1]];', 'let b = [...a];'),
      py: lines('a = [[1]]', 'b = list(a)'),
      expected: graph(
        { a: ref('a'), b: ref('b') },
        { a: list(ref('inner')), b: list(ref('inner')), inner: list(1) },
      ),
      teaches: ['copy.shallow'],
      hint: {
        js: 'Copying makes a new outer array, but its one slot still points at the same inner array [1].',
        py: 'Copying makes a new outer list, but its one slot still points at the same inner list [1].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message: 'The copy is shallow: a and b are separate outer containers, but their slots point to the very same inner container.',
        },
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'a and b must be separate outer containers: copying makes a new outer container rather than an alias.',
        },
      ],
      about: {
        js: 'A copy made with spread is shallow: it creates a new outer array, but its slots receive the references from the original. Any nested containers are shared between the original and the copy.',
        py: 'A copy made with list() is shallow: it creates a new outer list, but its slots receive the references from the original. Any nested containers are shared between the original and the copy.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = [...a];</code> creates a new outer array for <code>b</code>. But each slot in <code>b</code> gets the reference from <code>a</code>\'s corresponding slot. Slot 0 in <code>a</code> points to an inner array <code>[1]</code>, so slot 0 in <code>b</code> points to that <strong>very same inner array</strong>.</p>',
            py: '<p><code>b = list(a)</code> creates a new outer list for <code>b</code>. But each slot in <code>b</code> gets the reference from <code>a</code>\'s corresponding slot. Slot 0 in <code>a</code> points to an inner list <code>[1]</code>, so slot 0 in <code>b</code> points to that <strong>very same inner list</strong>.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: list(ref('inner')), b: list(ref('inner')), inner: list(1) },
          ),
          caption: {
            js: 'Correct: a and b are separate outer arrays sharing one inner array.',
            py: 'Correct: a and b are separate outer lists sharing one inner list.',
          },
          verdict: 'correct',
        },
        {
          html: '<p>This is what makes a copy <strong>shallow</strong>: only the outermost container is new. Everything it points to is shared. The next puzzle shows what that means when the inner container changes.</p>',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: list(ref('innerA')), b: list(ref('innerB')), innerA: list(1), innerB: list(1) },
          ),
          caption: 'Not correct: this would be a deep copy, but copying only makes a new outer container.',
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: 'Mutating inside a shallow copy',
      js: lines('let a = [[1]];', 'let b = [...a];', 'b[0].push(2);'),
      py: lines('a = [[1]]', 'b = list(a)', 'b[0].append(2)'),
      expected: graph(
        { a: ref('a'), b: ref('b') },
        { a: list(ref('inner')), b: list(ref('inner')), inner: list(1, 2) },
      ),
      hint: {
        js: 'b shares the inner array with a, so growing that inner array to [1, 2] is visible through both outer arrays.',
        py: 'b shares the inner list with a, so growing that inner list to [1, 2] is visible through both outer lists.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message: 'Because the copy was shallow, a and b share the inner container. Growing it through b[0] changes what a[0] sees too.',
        },
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'a and b must be separate outer containers: copying makes a new outer container, even though the inner one is shared.',
        },
      ],
      about: {
        js: 'Because a shallow copy shares its inner arrays with the original, mutating an inner array through the copy changes what the original sees as well.',
        py: 'Because a shallow copy shares its inner lists with the original, mutating an inner list through the copy changes what the original sees as well.',
      },
      debrief: [
        {
          html: {
            js: '<p>Follow the lines in order:</p><ol><li><code>a</code> refers to an outer array whose slot 0 points to an inner array <code>[1]</code>.</li><li><code>b</code> gets a new outer array, but its slot 0 points to that same inner array.</li><li><code>b[0].push(2);</code> follows slot 0 to the inner array and adds <code>2</code> in place.</li></ol><p>Because the inner array is shared, both <code>a[0]</code> and <code>b[0]</code> now refer to <code>[1, 2]</code>.</p>',
            py: '<p>Follow the lines in order:</p><ol><li><code>a</code> refers to an outer list whose slot 0 points to an inner list <code>[1]</code>.</li><li><code>b</code> gets a new outer list, but its slot 0 points to that same inner list.</li><li><code>b[0].append(2)</code> follows slot 0 to the inner list and adds <code>2</code> in place.</li></ol><p>Because the inner list is shared, both <code>a[0]</code> and <code>b[0]</code> now refer to <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: list(ref('inner')), b: list(ref('inner')), inner: list(1, 2) },
          ),
          caption: {
            js: 'Correct: the shared inner array was changed in place to [1, 2].',
            py: 'Correct: the shared inner list was changed in place to [1, 2].',
          },
          verdict: 'correct',
        },
        {
          html: '<p>If you expected <code>a</code> to stay <code>[[1]]</code>, you were imagining a deep copy, independent all the way down. A shallow copy only creates a new outer container; anything inside remains shared.</p>',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: list(ref('innerA')), b: list(ref('innerB')), innerA: list(1), innerB: list(1, 2) },
          ),
          caption: {
            js: 'Not correct: a[0] does not stay [1], because the inner array was shared, not copied.',
            py: 'Not correct: a[0] does not stay [1], because the inner list was shared, not copied.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'A shallow object copy',
      given: { js: 'let p = { tags: ["x"] };', ts: 'let p: { tags: string[] } = { tags: ["x"] };', py: 'p = {"tags": ["x"]}' },
      js: lines('let q = { ...p };', 'q.tags.push("y");'),
      ts: lines('let q: { tags: string[] } = { ...p };', 'q.tags.push("y");'),
      py: lines('q = dict(p)', 'q["tags"].append("y")'),
      expected: graph(
        { p: ref('p'), q: ref('q') },
        {
          p: dict({ tags: ref('tags') }),
          q: dict({ tags: ref('tags') }),
          tags: list('x', 'y'),
        },
      ),
      reliesOn: ['copy.object', 'copy.shallow', 'array.push'],
      hint: {
        js: 'Declare q as a copy of p, then grow the shared tags array in place so both end with ["x", "y"].',
        py: 'Assign q as a copy of p, then grow the shared tags list in place so both end with ["x", "y"].',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'separate',
          message: 'q is a shallow copy of p, so the tags key of both must point to the very same tags container.',
        },
        {
          variable: 'q',
          aliasing: 'shared',
          message: 'p and q must be two separate containers: copying makes a new outer container rather than an alias.',
        },
      ],
      about: {
        js: 'Copying an object copies only its top-level keys. Any array held in a key is shared with the original object, so mutating that array through either object changes it for both. The special constraint says q must follow whatever p starts with, so build q by copying p instead of retyping its contents.',
        py: 'Copying a dictionary copies only its top-level keys. Any list held in a key is shared with the original dictionary, so mutating that list through either dictionary changes it for both. The special constraint says q must follow whatever p starts with, so build q by copying p instead of retyping its contents.',
      },
      constraints: [
        {
          rule: {
            js:
              'Your boss said that q must be built by copying p, so if another programmer updates what p starts with, q must still be a shallow copy of that p and the shared tags array must end with "y".',
            py:
              'Your boss said that q must be built by copying p, so if another programmer updates what p starts with, q must still be a shallow copy of that p and the shared tags list must end with "y".',
          },
          cases: [
            {
              change: 'p starts with { tags: ["z"] }',
              given: { js: 'let p = { tags: ["z"] };', ts: 'let p: { tags: string[] } = { tags: ["z"] };', py: 'p = {"tags": ["z"]}' },
              expected: graph(
                { p: ref('p'), q: ref('q') },
                {
                  p: dict({ tags: ref('tags') }),
                  q: dict({ tags: ref('tags') }),
                  tags: list('z', 'y'),
                },
              ),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(preserve('p'), preserve('p', 'tags')),
        source: [copiesFrom('q', 'p')],
      },
      debrief: [
        {
          html: {
            js: '<p><code>let q = { ...p };</code> creates a new object <code>q</code>. Its <code>tags</code> property receives the reference from <code>p.tags</code>. When <code>q.tags.push("y");</code> changes that array in place, <code>p.tags</code> sees the change too because both point to the same array.</p>',
            py: '<p><code>q = dict(p)</code> creates a new dictionary <code>q</code>. Its <code>"tags"</code> key receives the reference from <code>p["tags"]</code>. When <code>q["tags"].append("y")</code> changes that list in place, <code>p["tags"]</code> sees the change too because both point to the same list.</p>',
          },
        },
        {
          diagram: graph(
            { p: ref('p'), q: ref('q') },
            {
              p: dict({ tags: ref('tags') }),
              q: dict({ tags: ref('tags') }),
              tags: list('x', 'y'),
            },
          ),
          caption: {
            js: 'p and q are separate objects pointing to the same changed tags array.',
            py: 'p and q are separate dictionaries pointing to the same changed tags list.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>p.tags.push("y");</code> after the copy builds the same picture, because <code>p.tags</code> and <code>q.tags</code> are one array.</p>',
            py: '<p><strong>Also correct:</strong> <code>p["tags"].append("y")</code> after the copy builds the same picture, because <code>p["tags"]</code> and <code>q["tags"]</code> are one list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let q = { tags: p.tags };</code> shares the array correctly but builds <code>q</code> by hand instead of copying <code>p</code>. And <code>let q = { tags: [...p.tags, "y"] };</code> gives <code>q</code> its own array, leaving <code>p.tags</code> as <code>["x"]</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>q = {"tags": p["tags"]}</code> shares the list correctly but builds <code>q</code> by hand instead of copying <code>p</code>. And <code>q = {"tags": p["tags"] + ["y"]}</code> gives <code>q</code> its own list, leaving <code>p["tags"]</code> as <code>["x"]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { p: ref('p'), q: ref('q') },
            {
              p: dict({ tags: ref('pTags') }),
              q: dict({ tags: ref('qTags') }),
              pTags: list('x'),
              qTags: list('x', 'y'),
            },
          ),
          caption: {
            js: 'Not correct: copying p does not copy the tags array; both objects share it.',
            py: 'Not correct: copying p does not copy the tags list; both dictionaries share it.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: 'Repeating one list',
      js: lines('let row = [0];', 'let grid = Array(2).fill(row);'),
      py: lines('row = [0]', 'grid = [row] * 2'),
      expected: graph(
        { row: ref('row'), grid: ref('grid') },
        { row: list(0), grid: list(ref('row'), ref('row')) },
      ),
      hint: {
        js: 'Array(2).fill(row) repeats the same row reference twice: both slots of grid point at the one row array.',
        py: '[row] * 2 repeats the same row reference twice: both slots of grid point at the one row list.',
      },
      hints: [
        {
          variable: 'grid',
          aliasing: 'separate',
          message: 'Repeating repeats the reference, not the container: both slots of grid must point to the same row container.',
        },
      ],
      about: {
        js: 'Repeating an item with fill() repeats the reference, not the container itself. Both slots of the outer array point to the single inner array.',
        py: 'Repeating an item with * repeats the reference, not the container itself. Both slots of the outer list point to the single inner list.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>Array(2).fill(row)</code> does not make two copies of <code>row</code>. It evaluates <code>row</code> once and places that <strong>same reference</strong> into every slot of <code>grid</code>.</p>',
            py: '<p><code>[row] * 2</code> does not make two copies of <code>row</code>. It evaluates <code>row</code> once and places that <strong>same reference</strong> into every slot of <code>grid</code>.</p>',
          },
        },
        {
          diagram: graph(
            { row: ref('row'), grid: ref('grid') },
            { row: list(0), grid: list(ref('row'), ref('row')) },
          ),
          caption: {
            js: 'Both slots of grid refer to the one row array.',
            py: 'Both slots of grid refer to the one row list.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p>This is a famous trap: anyone writing <code>Array(2).fill(row)</code> hoping for separate rows gets one shared row instead. A later puzzle builds a grid whose rows really are separate.</p>',
            py: '<p>This is a famous trap: anyone writing <code>[row] * 2</code> hoping for separate rows gets one shared row instead. A later puzzle builds a grid whose rows really are separate.</p>',
          },
        },
        {
          diagram: graph(
            { row: ref('row'), grid: ref('grid') },
            { row: list(0), grid: list(ref('r0'), ref('r1')), r0: list(0), r1: list(0) },
          ),
          caption: {
            js: 'Not correct: repeating does not create new inner arrays.',
            py: 'Not correct: repeating does not create new inner lists.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Rows that don\'t share',
      js: 'let grid = [[0], [0], [0]];',
      ts: 'let grid: number[][] = [[0], [0], [0]];',
      py: 'grid = [[0], [0], [0]]',
      expected: graph(
        { grid: ref('grid') },
        {
          grid: list(ref('row0'), ref('row1'), ref('row2')),
          row0: list(0),
          row1: list(0),
          row2: list(0),
        },
      ),
      hint: {
        js: 'Declare grid as an array of three separate inner arrays, each holding [0].',
        py: 'Assign grid a list of three separate inner lists, each holding [0].',
      },
      hints: [
        {
          variable: 'grid',
          aliasing: 'shared',
          message: 'Each row must be its own container. Repeating one row puts the same reference in every slot, so changing one row would change them all.',
        },
      ],
      about: {
        js: 'To build a grid whose rows are separate, create each row with its own array literal. Repeating one row would share one array across all slots.',
        py: 'To build a grid whose rows are separate, create each row with its own list literal. Repeating one row would share one list across all slots.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let grid = [[0], [0], [0]];</code> evaluates three separate array literals <code>[0]</code>. Each one creates its own array in memory, so no two slots share an array.</p>',
            py: '<p><code>grid = [[0], [0], [0]]</code> evaluates three separate list literals <code>[0]</code>. Each one creates its own list in memory, so no two slots share a list.</p>',
          },
        },
        {
          diagram: graph(
            { grid: ref('grid') },
            {
              grid: list(ref('row0'), ref('row1'), ref('row2')),
              row0: list(0),
              row1: list(0),
              row2: list(0),
            },
          ),
          caption: {
            js: 'Three separate inner arrays; changing one will not affect any other.',
            py: 'Three separate inner lists; changing one will not affect any other.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let grid = Array.from({ length: 3 }, () => [0]);</code> runs the function once per slot, so each run creates a new <code>[0]</code>.</p>',
            py: '<p><strong>Also correct:</strong> <code>grid = [[0] for _ in range(3)]</code> evaluates <code>[0]</code> once per pass of the loop, so each pass creates a new list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> <code>let grid = Array(3).fill([0]);</code> evaluates <code>[0]</code> only once and fills all three slots with references to that single array.</p>',
            py: '<p><strong>Not correct:</strong> <code>grid = [[0]] * 3</code> evaluates <code>[0]</code> only once and fills all three slots with references to that single list.</p>',
          },
        },
        {
          diagram: graph(
            { grid: ref('grid') },
            { grid: list(ref('shared'), ref('shared'), ref('shared')), shared: list(0) },
          ),
          caption: {
            js: 'Not correct: repeating puts the same inner array into all three slots.',
            py: 'Not correct: repeating puts the same inner list into all three slots.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'A copy that shares nothing',
      given: { js: 'let a = [[1], [2]];', ts: 'let a: number[][] = [[1], [2]];', py: 'a = [[1], [2]]' },
      js: 'let b = [[...a[0]], [...a[1]]];',
      ts: 'let b: number[][] = [[...a[0]], [...a[1]]];',
      py: 'b = [list(a[0]), list(a[1])]',
      expected: graph(
        { a: ref('a'), b: ref('b') },
        {
          a: list(ref('a0'), ref('a1')),
          b: list(ref('b0'), ref('b1')),
          a0: list(1),
          a1: list(2),
          b0: list(1),
          b1: list(2),
        },
      ),
      reliesOn: ['copy.shallow', 'copy.array'],
      hint: {
        js: 'Declare b as a new outer array holding copies of each inner array, so no inner array is shared with a.',
        py: 'Assign b a new outer list holding copies of each inner list, so no inner list is shared with a.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'b should share nothing with a: each slot of b must point to its own copy of the matching inner container of a.',
        },
      ],
      about: {
        js: 'To copy a nested array without sharing inner arrays, copy one level deeper by hand: create a new outer array holding copies of each inner array. The special constraint says b must follow whatever a starts with, so build b from a instead of retyping its contents.',
        py: 'To copy a nested list without sharing inner lists, copy one level deeper by hand: create a new outer list holding copies of each inner list. The special constraint says b must follow whatever a starts with, so build b from a instead of retyping its contents.',
      },
      constraints: [
        {
          rule:
            'Your boss said that b must be built from a, so if another programmer updates what a starts with, b must still be a separate copy that shares nothing with a.',
          cases: [
            {
              change: 'a starts as [[3], [4]]',
              given: { js: 'let a = [[3], [4]];', ts: 'let a: number[][] = [[3], [4]];', py: 'a = [[3], [4]]' },
              expected: graph(
                { a: ref('a'), b: ref('b') },
                {
                  a: list(ref('a0'), ref('a1')),
                  b: list(ref('b0'), ref('b1')),
                  a0: list(3),
                  a1: list(4),
                  b0: list(3),
                  b1: list(4),
                },
              ),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(preserve('a'), preserve('a', 0), preserve('a', 1)),
      },
      debrief: [
        {
          html: {
            js: '<p>A plain shallow copy <code>let b = [...a];</code> would leave <code>b[0]</code> and <code>b[1]</code> pointing to the same inner arrays as <code>a[0]</code> and <code>a[1]</code>. To make <code>b</code> share nothing, copy each inner array too: <code>let b = [[...a[0]], [...a[1]]];</code> builds a new outer array whose slots point to two new inner arrays.</p>',
            py: '<p>A plain shallow copy <code>b = list(a)</code> would leave <code>b[0]</code> and <code>b[1]</code> pointing to the same inner lists as <code>a[0]</code> and <code>a[1]</code>. To make <code>b</code> share nothing, copy each inner list too: <code>b = [list(a[0]), list(a[1])]</code> builds a new outer list whose slots point to two new inner lists.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            {
              a: list(ref('a0'), ref('a1')),
              b: list(ref('b0'), ref('b1')),
              a0: list(1),
              a1: list(2),
              b0: list(1),
              b1: list(2),
            },
          ),
          caption: {
            js: 'b shares nothing with a: its outer array and both inner arrays are new.',
            py: 'b shares nothing with a: its outer list and both inner lists are new.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let b = a.map((row) => [...row]);</code> copies every inner array, however many there are.</p>',
            py: '<p><strong>Also correct:</strong> <code>b = [list(row) for row in a]</code> copies every inner list, however many there are.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let b = [[1], [2]];</code> builds the right picture by retyping the contents of <code>a</code>, so it would be wrong if <code>a</code> started with other values.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b = [[1], [2]]</code> builds the right picture by retyping the contents of <code>a</code>, so it would be wrong if <code>a</code> started with other values.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> <code>let b = [...a];</code> leaves the inner arrays shared between <code>a</code> and <code>b</code>.</p>',
            py: '<p><strong>Not correct:</strong> <code>b = list(a)</code> leaves the inner lists shared between <code>a</code> and <code>b</code>.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: list(ref('a0'), ref('a1')), b: list(ref('a0'), ref('a1')), a0: list(1), a1: list(2) },
          ),
          caption: {
            js: 'Not correct: a shallow copy shares the inner arrays with a.',
            py: 'Not correct: a shallow copy shares the inner lists with a.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
  ],
  [
    write({
      title: 'A shallow copy, changed twice',
      given: { js: 'let p = { tags: ["a"] };', ts: 'let p: { tags: string[] } = { tags: ["a"] };', py: 'p = {"tags": ["a"]}' },
      js: lines('let q = { ...p };', 'q.extra = true;', 'q.tags.push("b");'),
      ts: lines('let q: { tags: string[]; extra?: boolean } = { ...p };', 'q.extra = true;', 'q.tags.push("b");'),
      py: lines('q = dict(p)', 'q["extra"] = True', 'q["tags"].append("b")'),
      expected: graph(
        { p: ref('p'), q: ref('q') },
        {
          p: dict({ tags: ref('tags') }),
          q: dict({ tags: ref('tags'), extra: true }),
          tags: list('a', 'b'),
        },
      ),
      reliesOn: ['copy.object', 'copy.shallow', 'array.push'],
      hint: {
        js: 'Declare q as a copy of p, then add extra holding true to q and grow the shared tags array to ["a", "b"].',
        py: 'Assign q as a copy of p, then add extra holding True to q and grow the shared tags list to ["a", "b"].',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'separate',
          message: 'tags must be shared: copying p makes a shallow copy, so the tags key of p and of q point to the same container.',
        },
        {
          variable: 'q',
          aliasing: 'shared',
          message: 'p and q must be two separate containers, not aliases: only q gets the extra key.',
        },
      ],
      about: {
        js: 'A shallow copy creates a new outer object, but inner arrays remain shared. Adding a top-level property affects only the copy, while mutating an inner array affects both. The special constraint says q must follow whatever p starts with, so build q by copying p instead of retyping its contents.',
        py: 'A shallow copy creates a new outer dictionary, but inner lists remain shared. Adding a top-level key affects only the copy, while mutating an inner list affects both. The special constraint says q must follow whatever p starts with, so build q by copying p instead of retyping its contents.',
      },
      constraints: [
        {
          rule: {
            js:
              'Your boss said that q must be built by copying p, so if another programmer updates what p starts with, q must still be a shallow copy of that p with extra added and the shared tags array ending with "b".',
            py:
              'Your boss said that q must be built by copying p, so if another programmer updates what p starts with, q must still be a shallow copy of that p with extra added and the shared tags list ending with "b".',
          },
          cases: [
            {
              change: 'p starts with { tags: ["c"] }',
              given: { js: 'let p = { tags: ["c"] };', ts: 'let p: { tags: string[] } = { tags: ["c"] };', py: 'p = {"tags": ["c"]}' },
              expected: graph(
                { p: ref('p'), q: ref('q') },
                {
                  p: dict({ tags: ref('tags') }),
                  q: dict({ tags: ref('tags'), extra: true }),
                  tags: list('c', 'b'),
                },
              ),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(preserve('p'), preserve('p', 'tags')),
        source: [copiesFrom('q', 'p')],
      },
      debrief: [
        {
          html: {
            js: '<p><code>let q = { ...p };</code> creates a new outer object whose <code>tags</code> property points to the same array as <code>p.tags</code>. Setting <code>q.extra = true;</code> adds <code>extra</code> only to <code>q</code>. But <code>q.tags.push("b");</code> changes the shared array in place, so both <code>p</code> and <code>q</code> see <code>tags: ["a", "b"]</code>.</p>',
            py: '<p><code>q = dict(p)</code> creates a new outer dictionary whose <code>"tags"</code> key points to the same list as <code>p["tags"]</code>. Setting <code>q["extra"] = True</code> adds <code>"extra"</code> only to <code>q</code>. But <code>q["tags"].append("b")</code> changes the shared list in place, so both <code>p</code> and <code>q</code> see <code>"tags": ["a", "b"]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { p: ref('p'), q: ref('q') },
            {
              p: dict({ tags: ref('tags') }),
              q: dict({ tags: ref('tags'), extra: true }),
              tags: list('a', 'b'),
            },
          ),
          caption: 'extra belongs only to q, while tags is shared and changed for both.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let q = { ...p, extra: true };</code> copies <code>p</code> and adds <code>extra</code> in one expression.</p>',
            py: '<p><strong>Also correct:</strong> <code>q = p.copy()</code> makes the same shallow copy as <code>dict(p)</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>Properties added to a shallow copy belong only to that copy, but a change to a shared inner array is seen through both objects.</p>',
            py: '<p>Keys added to a shallow copy belong only to that copy, but a change to a shared inner list is seen through both dictionaries.</p>',
          },
        },
        {
          diagram: graph(
            { p: ref('p'), q: ref('q') },
            {
              p: dict({ tags: ref('pTags') }),
              q: dict({ tags: ref('qTags'), extra: true }),
              pTags: list('a'),
              qTags: list('a', 'b'),
            },
          ),
          caption: {
            js: 'Not correct: tags is shared, so pushing to it through q changes p.tags as well.',
            py: 'Not correct: tags is shared, so appending to it through q changes p["tags"] as well.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: 'Replacing a shared inner object',
      js: lines('let a = { inner: { n: 1 } };', 'let b = { ...a };', 'b.inner = { n: 2 };'),
      py: lines('a = {"inner": {"n": 1}}', 'b = dict(a)', 'b["inner"] = {"n": 2}'),
      expected: graph(
        { a: ref('a'), b: ref('b') },
        {
          a: dict({ inner: ref('old') }),
          b: dict({ inner: ref('new') }),
          old: dict({ n: 1 }),
          new: dict({ n: 2 }),
        },
      ),
      hint: {
        js: 'Copying shares the inner object at first; assigning b.inner a new object repoints only b.inner, leaving a with the original.',
        py: 'Copying shares the inner dictionary at first; assigning b["inner"] a new dictionary repoints only b["inner"], leaving a with the original.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'The last line gives b a brand new inner container, so a and b no longer share one. Reassigning a key repoints only that key of b.',
        },
        {
          variable: 'a',
          value: 2,
          message: "a's inner container still holds n: 1. Reassigning b's inner key repoints b's arrow; it does not change the container a points to.",
        },
      ],
      about: {
        js: 'Reassigning a property of a copy repoints only the copy\'s arrow. The inner object it used to share is not changed, so the original still points to it.',
        py: 'Reassigning a key of a copy repoints only the copy\'s arrow. The inner dictionary it used to share is not changed, so the original still points to it.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = { ...a };</code> at first points <code>b.inner</code> at the same object as <code>a.inner</code>. But <code>b.inner = { n: 2 };</code> creates a <strong>brand new object</strong> and repoints <code>b.inner</code> at it. Nothing changed the old object, so <code>a.inner</code> still refers to <code>{ n: 1 }</code>.</p>',
            py: '<p><code>b = dict(a)</code> at first points <code>b["inner"]</code> at the same dictionary as <code>a["inner"]</code>. But <code>b["inner"] = {"n": 2}</code> creates a <strong>brand new dictionary</strong> and repoints <code>b["inner"]</code> at it. Nothing changed the old dictionary, so <code>a["inner"]</code> still refers to <code>{"n": 1}</code>.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            {
              a: dict({ inner: ref('old') }),
              b: dict({ inner: ref('new') }),
              old: dict({ n: 1 }),
              new: dict({ n: 2 }),
            },
          ),
          caption: {
            js: 'b.inner repointed to a new object; a.inner keeps the original { n: 1 }.',
            py: 'b["inner"] repointed to a new dictionary; a["inner"] keeps the original {"n": 1}.',
          },
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Contrast with mutation:</strong> if the code had written <code>b.inner.n = 2;</code>, it would have changed the shared object in place, and <code>a.inner</code> would see <code>n: 2</code> too. Reassigning <code>b.inner = ...</code> ends the sharing instead.</p>',
            py: '<p><strong>Contrast with mutation:</strong> if the code had written <code>b["inner"]["n"] = 2</code>, it would have changed the shared dictionary in place, and <code>a["inner"]</code> would see <code>"n": 2</code> too. Reassigning <code>b["inner"] = ...</code> ends the sharing instead.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: dict({ inner: ref('shared') }), b: dict({ inner: ref('shared') }), shared: dict({ n: 2 }) },
          ),
          caption: {
            js: 'Not correct: reassigning b.inner does not change the old inner object in place.',
            py: 'Not correct: reassigning b["inner"] does not change the old inner dictionary in place.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: 'Changing the repeated row',
      js: lines('let row = [0];', 'let grid = Array(3).fill(row);', 'row.push(1);'),
      py: lines('row = [0]', 'grid = [row] * 3', 'row.append(1)'),
      expected: graph(
        { row: ref('row'), grid: ref('grid') },
        { row: list(0, 1), grid: list(ref('row'), ref('row'), ref('row')) },
      ),
      hint: {
        js: 'All three slots of grid point at the same row array, so growing row to [0, 1] is visible through every slot.',
        py: 'All three slots of grid point at the same row list, so growing row to [0, 1] is visible through every slot.',
      },
      hints: [
        {
          variable: 'grid',
          aliasing: 'separate',
          message: 'All three slots of grid point to the one row container. Growing row changes what every slot of grid sees.',
        },
      ],
      about: {
        js: 'When an array is built by repeating a single row reference, every slot points to that same row. Mutating the row in place changes what is seen through every slot of the grid.',
        py: 'When a list is built by repeating a single row reference, every slot points to that same row. Mutating the row in place changes what is seen through every slot of the grid.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>Array(3).fill(row)</code> puts the reference to <code>row</code> into all three slots of <code>grid</code>. When <code>row.push(1);</code> changes the array in place to <code>[0, 1]</code>, every slot in <code>grid</code> reflects that change because all three slots point to that single array.</p>',
            py: '<p><code>[row] * 3</code> puts the reference to <code>row</code> into all three slots of <code>grid</code>. When <code>row.append(1)</code> changes the list in place to <code>[0, 1]</code>, every slot in <code>grid</code> reflects that change because all three slots point to that single list.</p>',
          },
        },
        {
          diagram: graph(
            { row: ref('row'), grid: ref('grid') },
            { row: list(0, 1), grid: list(ref('row'), ref('row'), ref('row')) },
          ),
          caption: 'Correct: all three slots of grid share row, so all three show [0, 1].',
          verdict: 'correct',
        },
        {
          html: '<p>A change to a shared container is visible through every reference to it. Because <code>grid</code> holds three references to <code>row</code>, growing <code>row</code> is seen in all three positions at once.</p>',
        },
        {
          diagram: graph(
            { row: ref('row'), grid: ref('grid') },
            { row: list(0, 1), grid: list(ref('r0'), ref('r1'), ref('r2')), r0: list(0), r1: list(0), r2: list(0) },
          ),
          caption: 'Not correct: grid does not hold three separate copies of row.',
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Copy, then add a row',
      given: { js: 'let a = [[1], [2]];', ts: 'let a: number[][] = [[1], [2]];', py: 'a = [[1], [2]]' },
      js: lines('let b = [...a];', 'b.push([3]);'),
      ts: lines('let b: number[][] = [...a];', 'b.push([3]);'),
      py: lines('b = list(a)', 'b.append([3])'),
      expected: graph(
        { a: ref('a'), b: ref('b') },
        {
          a: list(ref('r1'), ref('r2')),
          b: list(ref('r1'), ref('r2'), ref('r3')),
          r1: list(1),
          r2: list(2),
          r3: list(3),
        },
      ),
      hint: {
        js: 'Declare b as a copy of a, then add a new row [3] to b in place; a stays with two rows.',
        py: 'Assign b as a copy of a, then add a new row [3] to b in place; a stays with two rows.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message: 'b should be a shallow copy of a: its first two slots must point to the same inner containers as the slots of a.',
        },
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'b must be a new outer container, not an alias of a; a should still have only two rows.',
        },
      ],
      reliesOn: ['copy.shallow', 'copy.array', 'array.push'],
      about: {
        js: 'Adding a row to a shallow copy gives only the copy an extra slot. The rows it got from the original are still shared with the original array. The special constraint says b must follow whatever a starts with, so build b by copying a instead of retyping its contents.',
        py: 'Adding a row to a shallow copy gives only the copy an extra slot. The rows it got from the original are still shared with the original list. The special constraint says b must follow whatever a starts with, so build b by copying a instead of retyping its contents.',
      },
      constraints: [
        {
          rule:
            'Your boss said that b must be built from a, so if another programmer updates what a starts with, b must still be a shallow copy of that a with the new row [3] added.',
          cases: [
            {
              change: 'a starts as [[5], [6]]',
              given: { js: 'let a = [[5], [6]];', ts: 'let a: number[][] = [[5], [6]];', py: 'a = [[5], [6]]' },
              expected: graph(
                { a: ref('a'), b: ref('b') },
                {
                  a: list(ref('r1'), ref('r2')),
                  b: list(ref('r1'), ref('r2'), ref('r3')),
                  r1: list(5),
                  r2: list(6),
                  r3: list(3),
                },
              ),
            },
          ],
        },
      ],
      process: {
        runtime: runtime(preserve('a'), preserve('a', 0), preserve('a', 1)),
        source: [copiesOrCombinesFrom('b', 'a')],
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = [...a];</code> creates a new outer array whose two slots point to the same <code>[1]</code> and <code>[2]</code> as <code>a</code>. Then <code>b.push([3]);</code> adds a third slot pointing to a new row <code>[3]</code>. <code>a</code> is left with its original two rows.</p>',
            py: '<p><code>b = list(a)</code> creates a new outer list whose two slots point to the same <code>[1]</code> and <code>[2]</code> as <code>a</code>. Then <code>b.append([3])</code> adds a third slot pointing to a new row <code>[3]</code>. <code>a</code> is left with its original two rows.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            {
              a: list(ref('r1'), ref('r2')),
              b: list(ref('r1'), ref('r2'), ref('r3')),
              r1: list(1),
              r2: list(2),
              r3: list(3),
            },
          ),
          caption: 'b has three rows; the first two are shared with a.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let b = [...a, [3]];</code> or <code>let b = a.concat([[3]]);</code> builds this same picture directly.</p>',
            py: '<p><strong>Also correct:</strong> <code>b = a + [[3]]</code> builds this same picture directly.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> copying each row as well, as in <code>let b = [[...a[0]], [...a[1]], [3]];</code>, gives <code>b</code> its own rows. A shallow copy shares them.</p>',
            py: '<p><strong>Not correct:</strong> copying each row as well, as in <code>b = [list(a[0]), list(a[1]), [3]]</code>, gives <code>b</code> its own rows. A shallow copy shares them.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b') },
            { a: list(ref('r1'), ref('r2')), b: list(ref('br1'), ref('br2'), ref('r3')), r1: list(1), r2: list(2), br1: list(1), br2: list(2), r3: list(3) },
          ),
          caption: {
            js: 'Not correct: a shallow copy shares the existing inner arrays with a instead of creating new ones.',
            py: 'Not correct: a shallow copy shares the existing inner lists with a instead of creating new ones.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let b = [[1], [2], [3]];</code>. The checker reruns your code from another starting array to make sure you built <code>b</code> from <code>a</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b = [[1], [2], [3]]</code>. The checker reruns your code from another starting list to make sure you built <code>b</code> from <code>a</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Changing the original after copying',
      js: lines('let a = [1, 2];', 'let b = [...a];', 'a[0] = 9;'),
      py: lines('a = [1, 2]', 'b = list(a)', 'a[0] = 9'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(9, 2), b: list(1, 2) }),
      hint: 'Copying captures the slot values: changing slot 0 of a to 9 afterward leaves b holding [1, 2].',
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message: 'a and b are separate containers. Reassigning slot 0 of a changes only a, not b.',
        },
        {
          variable: 'b',
          value: 9,
          message: 'b was copied before a[0] was changed to 9, so b[0] is still 1.',
        },
      ],
      about: {
        js: 'Copying an array copies the values in its slots at that moment. Reassigning a slot in the original array later changes only that array; the copy is unaffected.',
        py: 'Copying a list copies the values in its slots at that moment. Reassigning a slot in the original list later changes only that list; the copy is unaffected.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = [...a];</code> gives <code>b</code> its own slots, pointing to <code>1</code> and <code>2</code>. When <code>a[0] = 9;</code> runs afterward, it repoints slot 0 of <code>a</code>. <code>b</code> is a separate array, so its slot 0 still points to <code>1</code>.</p>',
            py: '<p><code>b = list(a)</code> gives <code>b</code> its own slots, pointing to <code>1</code> and <code>2</code>. When <code>a[0] = 9</code> runs afterward, it repoints slot 0 of <code>a</code>. <code>b</code> is a separate list, so its slot 0 still points to <code>1</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(9, 2), b: list(1, 2) }),
          caption: 'Correct: a[0] is 9; b[0] remains 1.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Not correct:</strong> if you gave <code>b[0]</code> the value <code>9</code>, you were treating the copy as if it still followed <code>a</code>. The copy\'s slots are its own, so repointing a slot of <code>a</code> leaves <code>b</code> alone. Only an alias (<code>let b = a;</code>) would see the change.</p>',
            py: '<p><strong>Not correct:</strong> if you gave <code>b[0]</code> the value <code>9</code>, you were treating the copy as if it still followed <code>a</code>. The copy\'s slots are its own, so repointing a slot of <code>a</code> leaves <code>b</code> alone. Only an alias (<code>b = a</code>) would see the change.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(9, 2), b: list(9, 2) }),
          caption: {
            js: 'Not correct: b is a separate array, so repointing a slot of a does not change b.',
            py: 'Not correct: b is a separate list, so repointing a slot of a does not change b.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
  ],
)
