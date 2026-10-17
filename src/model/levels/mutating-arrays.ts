import { graph, list, ref, withGarbage } from '../builders'
import { preserve, runtime } from '../process'
import type { UnnumberedLevel } from '../types'
import { draw, L, level, lines, write } from './common'

export const mutatingArraysLevel: UnnumberedLevel = level(
  'mutating-arrays',
  L('Changing Arrays', 'Changing Lists'),
  L(
    'Adding, removing or overwriting an item changes the array itself, so every variable that refers to it sees the change. Assigning a new array to a variable is different: it repoints only that variable and leaves the previous one as it was.',
    'Adding, removing or overwriting an item changes the list itself, so every variable that refers to it sees the change. Assigning a new list to a variable is different: it repoints only that variable and leaves the previous one as it was.',
  ),
  [
    draw({
      title: 'Adding to the end',
      js: lines('let x = [1];', 'x.push(2);'),
      py: lines('x = [1]', 'x.append(2)'),
      expected: graph({ x: ref('x') }, { x: list(1, 2) }),
      teaches: ['array.push'],
      hint: {
        js: 'push adds a slot to the array x already refers to. It does not build a new array.',
        py: 'append adds a slot to the list x already refers to. It does not build a new list.',
      },
      about: {
        js: 'Adding an item with push changes the existing array in place. The variable still refers to the same array, which now has one more slot.',
        py: 'Adding an item with append changes the existing list in place. The variable still refers to the same list, which now has one more slot.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let x = [1];</code> creates an array with one slot and points <code>x</code> at it. Then <code>x.push(2);</code> adds a second slot holding 2 to that very same array in place.</p>',
            py: '<p><code>x = [1]</code> creates a list with one slot and points <code>x</code> at it. Then <code>x.append(2)</code> adds a second slot holding 2 to that very same list in place.</p>',
          },
        },
        {
          html: {
            js: '<p>No new array was created, and <code>x</code> was not reassigned. The variable still points to the same container in memory, but the container itself has grown.</p>',
            py: '<p>No new list was created, and <code>x</code> was not reassigned. The variable still points to the same container in memory, but the container itself has grown.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(1, 2) }),
          caption: {
            js: 'Correct: push adds a second slot to the existing array in place.',
            py: 'Correct: append adds a second slot to the existing list in place.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(1) }),
          caption: {
            js: 'Not correct: push is not like + on strings, which builds a new value. push changes the existing array, so x does not stay [1].',
            py: 'Not correct: append is not like + on strings, which builds a new value. append changes the existing list, so x does not stay [1].',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: { js: 'Grow an array', py: 'Grow a list' },
      given: { js: 'let x = [];', ts: 'let x: number[] = [];', py: 'x = []' },
      js: lines('x.push(3);', 'x.push(6);', 'x.push(9);'),
      py: lines('x.append(3)', 'x.append(6)', 'x.append(9)'),
      expected: graph({ x: ref('x') }, { x: list(3, 6, 9) }),
      reliesOn: ['array.push'],
      hint: {
        js: 'Add 3, then 6, then 9 to the end of x, changing the same array in place.',
        py: 'Add 3, then 6, then 9 to the end of x, changing the same list in place.',
      },
      about: {
        js: 'You can grow an existing array one item at a time by calling push repeatedly. Change the starter array in place rather than assigning a new array.',
        py: 'You can grow an existing list one item at a time by calling append repeatedly. Change the starter list in place rather than assigning a new list.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p>Calling <code>x.push(...)</code> three times appends 3, 6, and 9 in order. Each call adds a slot to the existing array, growing it from empty to <code>[3, 6, 9]</code>.</p>',
            py: '<p>Calling <code>x.append(...)</code> three times appends 3, 6, and 9 in order. Each call adds a slot to the existing list, growing it from empty to <code>[3, 6, 9]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(3, 6, 9) }),
          caption: {
            js: 'Correct: x grew to [3, 6, 9] in place.',
            py: 'Correct: x grew to [3, 6, 9] in place.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x') }, { x: list() }),
          caption: {
            js: 'Not correct: this is what x would show if push left the starter array alone. Each call changes it in place.',
            py: 'Not correct: this is what x would show if append left the starter list alone. Each call changes it in place.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>x.push(3, 6, 9);</code> adds all three items to the starter array in one call.</p>',
            py: '<p><strong>Also correct:</strong> <code>x.extend([3, 6, 9])</code> adds all three items to the starter list in one call.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = [3, 6, 9];</code> produces an array with the right numbers, but it creates a brand new array and discards the starter array. The rule requires changing what <code>x</code> already refers to.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = [3, 6, 9]</code> produces a list with the right numbers, but it creates a brand new list and discards the starter list. The rule requires changing what <code>x</code> already refers to.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Overwriting a slot',
      js: lines('let x = [1, 2, 3];', 'x[0] = 9;'),
      py: lines('x = [1, 2, 3]', 'x[0] = 9'),
      expected: graph({ x: ref('x') }, { x: list(9, 2, 3) }),
      hint: {
        js: 'x[0] = 9 repoints one slot of the array x already refers to. Think about how many slots the array has afterward.',
        py: 'x[0] = 9 repoints one slot of the list x already refers to. Think about how many slots the list has afterward.',
      },
      about: {
        js: 'Assigning to an index like x[0] = 9 repoints that one slot, changing the array in place. The array keeps its length, and the other slots are left alone.',
        py: 'Assigning to an index like x[0] = 9 repoints that one slot, changing the list in place. The list keeps its length, and the other slots are left alone.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let x = [1, 2, 3];</code> creates a three-slot array. <code>x[0] = 9;</code> repoints only slot 0, so it refers to 9. Slots 1 and 2 still refer to 2 and 3.</p>',
            py: '<p><code>x = [1, 2, 3]</code> creates a three-slot list. <code>x[0] = 9</code> repoints only slot 0, so it refers to 9. Slots 1 and 2 still refer to 2 and 3.</p>',
          },
        },
        {
          html: {
            js: '<p>The array itself is not replaced: <code>x</code> refers to the same array before and after, but the value in its first slot has changed.</p>',
            py: '<p>The list itself is not replaced: <code>x</code> refers to the same list before and after, but the value in its first slot has changed.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(9, 2, 3) }),
          caption: 'Correct: slot 0 is updated to 9 while slots 1 and 2 keep their values.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(9, 1, 2, 3) }),
          caption: 'Not correct: assigning to slot 0 replaces what that slot refers to. It does not insert a new slot at the front.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the old 1 on the canvas with nothing pointing to it. Repointing slot 0 leaves 1 as garbage, which the checker ignores.</p>',
        },
        {
          diagram: withGarbage(graph({ x: ref('x') }, { x: list(9, 2, 3) }), 1),
          caption: 'Also correct: the overwritten 1 left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
    draw({
      title: 'Removing the last item',
      js: lines('let x = [1, 2, 3];', 'x.pop();'),
      py: lines('x = [1, 2, 3]', 'x.pop()'),
      expected: graph({ x: ref('x') }, { x: list(1, 2) }),
      teaches: ['array.pop'],
      hint: {
        js: 'pop changes the array x already refers to. Think about which end it removes from.',
        py: 'pop changes the list x already refers to. Think about which end it removes from.',
      },
      about: {
        js: 'Calling x.pop() removes the last item from the array in place, shrinking it by one slot.',
        py: 'Calling x.pop() removes the last item from the list in place, shrinking it by one slot.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>x.pop();</code> removes the final slot from the array in place. The array shrinks from three slots to two, holding <code>[1, 2]</code>.</p>',
            py: '<p><code>x.pop()</code> removes the final slot from the list in place. The list shrinks from three slots to two, holding <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(1, 2) }),
          caption: 'Correct: pop() removes the last item, leaving [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(2, 3) }),
          caption: 'Not correct: pop() removes from the end, not the beginning.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the removed 3 on the canvas with nothing pointing to it. <code>pop</code> gives back the item it removes, but this code does not keep it in a variable, so 3 becomes garbage.</p>',
        },
        {
          diagram: withGarbage(graph({ x: ref('x') }, { x: list(1, 2) }), 3),
          caption: 'Also correct: the removed 3 left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
    write({
      title: 'Change the middle',
      given: { js: 'let x = [1, 2, 3];', ts: 'let x: number[] = [1, 2, 3];', py: 'x = [1, 2, 3]' },
      js: 'x[1] = 5;',
      py: 'x[1] = 5',
      expected: graph({ x: ref('x') }, { x: list(1, 5, 3) }),
      hint: {
        js: 'Indices start at 0. Repoint only the middle slot of the array x already refers to.',
        py: 'Indices start at 0. Repoint only the middle slot of the list x already refers to.',
      },
      about: {
        js: 'Indices start at 0, so the middle slot of a three-item array is at index 1. Overwrite only that slot in place using bracket notation.',
        py: 'Indices start at 0, so the middle slot of a three-item list is at index 1. Overwrite only that slot in place using bracket notation.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p><code>x[1] = 5;</code> repoints slot 1 of the existing array to 5. Slot 0 still holds 1 and slot 2 still holds 3.</p>',
            py: '<p><code>x[1] = 5</code> repoints slot 1 of the existing list to 5. Slot 0 still holds 1 and slot 2 still holds 3.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(1, 5, 3) }),
          caption: 'Correct: slot 1 is changed to 5 in place.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(1, 2, 5) }),
          caption: 'Not correct: indices start at 0, so slot 1 is the middle item, not slot 2.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = [1, 5, 3];</code> produces the expected values, but creates a brand new array instead of modifying the existing one in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = [1, 5, 3]</code> produces the expected values, but creates a brand new list instead of modifying the existing one in place.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Mutating through an alias',
      js: lines('let x = [1];', 'let y = x;', 'y.push(2);'),
      py: lines('x = [1]', 'y = x', 'y.append(2)'),
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(1, 2) }),
      hint: {
        js: 'let y = x does not copy the array. Think about which array y.push(2) changes.',
        py: 'y = x does not copy the list. Think about which list y.append(2) changes.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y should share one container. Assigning y from x made y an alias, not a copy, so adding 2 through y changes the container x refers to as well.',
        },
      ],
      about: {
        js: 'Assigning y = x gives y a reference to the same array as x. When you mutate the array through y, the change is visible through x as well.',
        py: 'Assigning y = x gives y a reference to the same list as x. When you mutate the list through y, the change is visible through x as well.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> does not copy the array. It points <code>y</code> at the very same array <code>x</code> refers to: <code>y</code> is an <strong>alias</strong> for <code>x</code>.</p>',
            py: '<p><code>y = x</code> does not copy the list. It points <code>y</code> at the very same list <code>x</code> refers to: <code>y</code> is an <strong>alias</strong> for <code>x</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>When <code>y.push(2);</code> runs, it adds 2 to that shared array in place. Because <code>x</code> points to that same array, looking through <code>x</code> reveals <code>[1, 2]</code> as well.</p>',
            py: '<p>When <code>y.append(2)</code> runs, it adds 2 to that shared list in place. Because <code>x</code> points to that same list, looking through <code>x</code> reveals <code>[1, 2]</code> as well.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(1, 2) }),
          caption: 'Correct: x and y share one container, which now holds [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(1), y: list(1, 2) }),
          caption: 'Not correct: this treats y as a separate copy. y is an alias, so a change made through y is seen through x too.',
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Empty it for both',
      given: {
        js: lines('let x = [4, 5];', 'let y = x;'),
        ts: lines('let x: number[] = [4, 5];', 'let y: number[] = x;'),
        py: lines('x = [4, 5]', 'y = x'),
      },
      js: lines('x.pop();', 'x.pop();'),
      py: lines('x.pop()', 'x.pop()'),
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: list() }),
      reliesOn: ['array.pop'],
      hint: {
        js: 'Remove both items from x in place so x and y end sharing one empty array.',
        py: 'Remove both items from x in place so x and y end sharing one empty list.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y should still share one container. Reassigning x to a new empty container moves only x\'s arrow and leaves y with [4, 5]. Remove the items from the shared container instead.',
        },
      ],
      about: {
        js: 'When two variables share an array, removing items through pop empties the shared array in place. Reassigning x = [] would point only x at a new array and leave y with the old one.',
        py: 'When two variables share a list, removing items through pop empties the shared list in place. Reassigning x = [] would point only x at a new list and leave y with the old one.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p>Calling <code>x.pop();</code> twice removes 5 and then 4 from the shared array in place. Because <code>y</code> points to the same array, both variables now refer to one shared empty array.</p>',
            py: '<p>Calling <code>x.pop()</code> twice removes 5 and then 4 from the shared list in place. Because <code>y</code> points to the same list, both variables now refer to one shared empty list.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list() }),
          caption: 'Correct: x and y continue to share the original container, which is now empty.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(), y: list(4, 5) }),
          caption: 'Not correct: reassigning x = [] moves only x\'s arrow, leaving y with [4, 5].',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> calling <code>y.pop();</code> twice works just as well, because <code>x</code> and <code>y</code> refer to the same array.</p>',
            py: '<p><strong>Also correct:</strong> calling <code>y.pop()</code> twice works just as well, because <code>x</code> and <code>y</code> refer to the same list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>x.length = 0;</code> empties the shared array in place in one step.</p>',
            py: '<p><strong>Also correct:</strong> <code>x.clear()</code> empties the shared list in place in one step.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = [];</code>. Assigning a new array literal moves only <code>x</code>\'s arrow, breaking the alias and leaving <code>y</code> holding <code>[4, 5]</code>. The rule requires emptying the existing array in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = []</code>. Assigning a new list literal moves only <code>x</code>\'s arrow, breaking the alias and leaving <code>y</code> holding <code>[4, 5]</code>. The rule requires emptying the existing list in place.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Add for both',
      given: {
        js: lines('let x = ["cat"];', 'let y = x;'),
        ts: lines('let x: string[] = ["cat"];', 'let y: string[] = x;'),
        py: lines('x = ["cat"]', 'y = x'),
      },
      js: 'y.push("dog");',
      py: 'y.append("dog")',
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: list('cat', 'dog') }),
      hint: {
        js: 'Add "dog" to the end of y in place; x shares the same array so both end holding ["cat", "dog"].',
        py: 'Add "dog" to the end of y in place; x shares the same list so both end holding ["cat", "dog"].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y should still share one container. Reassigning y to a new container moves only y\'s arrow and leaves x with ["cat"]. Add to the shared container instead.',
        },
      ],
      about: {
        js: 'Because y refers to the same array as x, modifying y in place changes the array for both names without needing to touch x.',
        py: 'Because y refers to the same list as x, modifying y in place changes the list for both names without needing to touch x.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p><code>y.push("dog");</code> mutates the array referred to by <code>y</code>. Since <code>x</code> points to that very same array, the addition is visible through <code>x</code> as well.</p>',
            py: '<p><code>y.append("dog")</code> mutates the list referred to by <code>y</code>. Since <code>x</code> points to that very same list, the addition is visible through <code>x</code> as well.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list('cat', 'dog') }),
          caption: 'Correct: x and y share one container, which now holds ["cat", "dog"].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list('cat'), y: list('cat', 'dog') }),
          caption: 'Not correct: reassigning y splits the alias, so x is left with ["cat"]. Adding through y in place keeps one shared container.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>x.push("dog");</code> builds the same picture, because both names refer to the same array.</p>',
            py: '<p><strong>Also correct:</strong> <code>x.append("dog")</code> builds the same picture, because both names refer to the same list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>y = ["cat", "dog"];</code>. Reassigning <code>y</code> points it at a new array, leaving <code>x</code> with <code>["cat"]</code> instead of sharing.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y = ["cat", "dog"]</code>. Reassigning <code>y</code> points it at a new list, leaving <code>x</code> with <code>["cat"]</code> instead of sharing.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Pointing a name elsewhere',
      js: lines('let x = [1, 2, 3];', 'let y = x;', 'x = [0];'),
      py: lines('x = [1, 2, 3]', 'y = x', 'x = [0]'),
      expected: graph({ x: ref('new'), y: ref('old') }, { old: list(1, 2, 3), new: list(0) }),
      hint: {
        js: 'Think about which arrow x = [0] moves, and whether it changes any existing array.',
        py: 'Think about which arrow x = [0] moves, and whether it changes any existing list.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should not share a container. Reassigning x moves only x\'s arrow to the new container [0]; y still points to the original [1, 2, 3].',
        },
      ],
      about: {
        js: 'Reassigning a variable moves only its arrow to a new array. It does not modify the old array, and it leaves other variables that point to the old array unchanged.',
        py: 'Reassigning a variable moves only its arrow to a new list. It does not modify the old list, and it leaves other variables that point to the old list unchanged.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> made <code>x</code> and <code>y</code> share <code>[1, 2, 3]</code>. Then <code>x = [0];</code> points <code>x</code> at a brand new array. Only <code>x</code>\'s arrow moved; the original array was not modified, so <code>y</code> still refers to <code>[1, 2, 3]</code>.</p>',
            py: '<p><code>y = x</code> made <code>x</code> and <code>y</code> share <code>[1, 2, 3]</code>. Then <code>x = [0]</code> points <code>x</code> at a brand new list. Only <code>x</code>\'s arrow moved; the original list was not modified, so <code>y</code> still refers to <code>[1, 2, 3]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('new'), y: ref('old') }, { old: list(1, 2, 3), new: list(0) }),
          caption: 'Correct: x refers to the new [0], while y still refers to [1, 2, 3].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(0) }),
          caption: {
            js: 'Not correct: reassigning x does not change the array y points to.',
            py: 'Not correct: reassigning x does not change the list y points to.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>This is the key contrast in this level: <strong>mutating</strong> (like <code>push</code> or <code>pop</code>) changes what is inside an array, affecting every alias. <strong>Reassigning</strong> (like <code>x = [0]</code>) moves only one variable\'s arrow to a different container.</p>',
            py: '<p>This is the key contrast in this level: <strong>mutating</strong> (like <code>append</code> or <code>pop</code>) changes what is inside a list, affecting every alias. <strong>Reassigning</strong> (like <code>x = [0]</code>) moves only one variable\'s arrow to a different container.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Split them apart',
      given: {
        js: lines('let x = [1];', 'let y = x;'),
        ts: lines('let x: number[] = [1];', 'let y: number[] = x;'),
        py: lines('x = [1]', 'y = x'),
      },
      js: 'y = [1, 2];',
      py: 'y = [1, 2]',
      expected: graph({ x: ref('x'), y: ref('y') }, { x: list(1), y: list(1, 2) }),
      hint: {
        js: 'Give y an array of its own, so that x keeps referring to the original [1].',
        py: 'Give y a list of its own, so that x keeps referring to the original [1].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should not share a container. While y is an alias for x, changing y in place changes x too. Reassigning y moves only y\'s arrow.',
        },
      ],
      about: {
        js: 'To give y new items without changing x, reassign y to a new array literal. That moves y\'s arrow and leaves x pointing to the original array.',
        py: 'To give y new items without changing x, reassign y to a new list literal. That moves y\'s arrow and leaves x pointing to the original list.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p><code>y = [1, 2];</code> creates a new array and points <code>y</code> at it. Because <code>x</code> was neither reassigned nor mutated, it continues to refer to the original array <code>[1]</code>.</p>',
            py: '<p><code>y = [1, 2]</code> creates a new list and points <code>y</code> at it. Because <code>x</code> was neither reassigned nor mutated, it continues to refer to the original list <code>[1]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(1), y: list(1, 2) }),
          caption: 'Correct: x retains the original [1], and y points to a new [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(1, 2) }),
          caption: {
            js: 'Not correct: y.push(2) mutates the shared array, changing x as well.',
            py: 'Not correct: y.append(2) mutates the shared list, changing x as well.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>y = [1];</code> followed by <code>y.push(2);</code>. The first line gives <code>y</code> its own array, so the push changes only that one.</p>',
            py: '<p><strong>Also correct:</strong> <code>y = [1]</code> followed by <code>y.append(2)</code>. The first line gives <code>y</code> its own list, so the append changes only that one.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>y.push(2);</code> on its own. Pushing to <code>y</code> changes the shared array in place, making <code>x</code> hold <code>[1, 2]</code> as well.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y.append(2)</code> on its own. Appending to <code>y</code> changes the shared list in place, making <code>x</code> hold <code>[1, 2]</code> as well.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> rebuilding both arrays, as in <code>x = [1];</code> followed by <code>y = [1, 2];</code>. The picture matches, but the rule requires <code>x</code> to keep referring to the starter array.</p>',
            py: '<p><strong>Not accepted:</strong> rebuilding both lists, as in <code>x = [1]</code> followed by <code>y = [1, 2]</code>. The picture matches, but the rule requires <code>x</code> to keep referring to the starter list.</p>',
          },
        },
      ],
    }),
  ],
  [
    write({
      title: 'Peel one off',
      given: {
        js: lines('let x = [1];', 'let y = x;', 'let z = x;'),
        ts: lines('let x: number[] = [1];', 'let y: number[] = x;', 'let z: number[] = x;'),
        py: lines('x = [1]', 'y = x', 'z = x'),
      },
      js: lines('y = [];', 'z.push(2);'),
      py: lines('y = []', 'z.append(2)'),
      expected: graph(
        { x: ref('shared'), y: ref('alone'), z: ref('shared') },
        { shared: list(1, 2), alone: list() },
      ),
      hint: {
        js: 'Point y at a new empty array, then grow z in place so x and z share [1, 2].',
        py: 'Point y at a new empty list, then grow z in place so x and z share [1, 2].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'y should not share with x and z. Reassigning y moves only y\'s arrow, giving it its own empty container while x and z still share the original.',
        },
      ],
      about: {
        js: 'When three variables share an array, reassigning one variable detaches only that name. The remaining two variables still share the original array and see further mutations.',
        py: 'When three variables share a list, reassigning one variable detaches only that name. The remaining two variables still share the original list and see further mutations.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p><code>y = [];</code> reassigns only <code>y</code> to a new empty array, detaching it from <code>x</code> and <code>z</code>. Then <code>z.push(2);</code> mutates the original array in place, so both <code>x</code> and <code>z</code> see <code>[1, 2]</code>.</p>',
            py: '<p><code>y = []</code> reassigns only <code>y</code> to a new empty list, detaching it from <code>x</code> and <code>z</code>. Then <code>z.append(2)</code> mutates the original list in place, so both <code>x</code> and <code>z</code> see <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('alone'), z: ref('shared') },
            { shared: list(1, 2), alone: list() },
          ),
          caption: 'Correct: y is detached to its own [], while x and z still share [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('shared'), z: ref('shared') },
            { shared: list(1, 2) },
          ),
          caption: {
            js: 'Not correct: while y is still an alias, it sees the push too. y must be reassigned to an array of its own.',
            py: 'Not correct: while y is still an alias, it sees the append too. y must be reassigned to a list of its own.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> pushing through <code>x</code> instead of <code>z</code>, because <code>x</code> and <code>z</code> are aliases for the same array. The two lines can also run in either order: <code>y</code> is reassigned rather than changed, so it never holds the 2.</p>',
            py: '<p><strong>Also correct:</strong> appending through <code>x</code> instead of <code>z</code>, because <code>x</code> and <code>z</code> are aliases for the same list. The two lines can also run in either order: <code>y</code> is reassigned rather than changed, so it never holds the 2.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> Reassigning <code>x</code> or rebuilding the arrays from scratch. The starter array must be preserved under <code>x</code>.</p>',
            py: '<p><strong>Not accepted:</strong> Reassigning <code>x</code> or rebuilding the lists from scratch. The starter list must be preserved under <code>x</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Grow once, pop twice',
      js: lines('let x = [4, 5];', 'x.push(6);', 'x.pop();', 'x.pop();'),
      py: lines('x = [4, 5]', 'x.append(6)', 'x.pop()', 'x.pop()'),
      expected: graph({ x: ref('x') }, { x: list(4) }),
      hint: {
        js: 'Each change applies to the same array in order: grow to [4, 5, 6], then remove twice to end at [4].',
        py: 'Each change applies to the same list in order: grow to [4, 5, 6], then remove twice to end at [4].',
      },
      about: {
        js: 'Mutating methods run one after another in order. Each push or pop modifies the existing array in place.',
        py: 'Mutating methods run one after another in order. Each append or pop modifies the existing list in place.',
      },
      debrief: [
        {
          html: {
            js: '<p>Trace the changes in order:</p><ol><li><code>let x = [4, 5];</code> starts with <code>[4, 5]</code>.</li><li><code>x.push(6);</code> adds 6 to the end: <code>[4, 5, 6]</code>.</li><li>The first <code>x.pop();</code> removes the last element (6): <code>[4, 5]</code>.</li><li>The second <code>x.pop();</code> removes the last element (5): <code>[4]</code>.</li></ol>',
            py: '<p>Trace the changes in order:</p><ol><li><code>x = [4, 5]</code> starts with <code>[4, 5]</code>.</li><li><code>x.append(6)</code> adds 6 to the end: <code>[4, 5, 6]</code>.</li><li>The first <code>x.pop()</code> removes the last element (6): <code>[4, 5]</code>.</li><li>The second <code>x.pop()</code> removes the last element (5): <code>[4]</code>.</li></ol>',
          },
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(4) }),
          caption: 'Correct: after push and two pops, x ends holding [4].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(4, 5) }),
          caption: {
            js: 'Not correct: this stops after the first pop. The second pop changes the same array again and removes 5.',
            py: 'Not correct: this stops after the first pop. The second pop changes the same list again and removes 5.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the popped numbers 5 and 6 on the canvas with nothing pointing to them.</p>',
        },
        {
          diagram: withGarbage(graph({ x: ref('x') }, { x: list(4) }), 5, 6),
          caption: 'Also correct: the popped 5 and 6 left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
    write({
      title: 'Fill the ends',
      given: { js: 'let x = [0, 0, 0];', ts: 'let x: number[] = [0, 0, 0];', py: 'x = [0, 0, 0]' },
      js: lines('x[0] = 7;', 'x[2] = 8;'),
      py: lines('x[0] = 7', 'x[2] = 8'),
      expected: graph({ x: ref('x') }, { x: list(7, 0, 8) }),
      hint: {
        js: 'Set slot 0 to 7 and slot 2 to 8 in place, leaving slot 1 as 0.',
        py: 'Set slot 0 to 7 and slot 2 to 8 in place, leaving slot 1 as 0.',
      },
      about: {
        js: 'Assigning to specific indices like x[0] and x[2] modifies only those slots in place, leaving all other slots untouched.',
        py: 'Assigning to specific indices like x[0] and x[2] modifies only those slots in place, leaving all other slots untouched.',
      },
      process: { runtime: runtime(preserve('x')) },
      debrief: [
        {
          html: {
            js: '<p><code>x[0] = 7;</code> updates the first slot to 7, and <code>x[2] = 8;</code> updates the third slot to 8. Slot 1 is never assigned to, so it remains 0.</p>',
            py: '<p><code>x[0] = 7</code> updates the first slot to 7, and <code>x[2] = 8</code> updates the third slot to 8. Slot 1 is never assigned to, so it remains 0.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(7, 0, 8) }),
          caption: 'Correct: slots 0 and 2 are updated, leaving slot 1 at 0.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x') }, { x: list(0, 7, 8) }),
          caption: {
            js: 'Not correct: this sets slots 1 and 2. Indices start at 0, so the two ends of a three-slot array are slots 0 and 2.',
            py: 'Not correct: this sets slots 1 and 2. Indices start at 0, so the two ends of a three-slot list are slots 0 and 2.',
          },
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> setting slot 2 before slot 0. The two assignments repoint different slots, so their order does not matter.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = [7, 0, 8];</code> replaces the array instead of modifying the existing one in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = [7, 0, 8]</code> replaces the list instead of modifying the existing one in place.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Repoint, then grow',
      js: lines('let x = [1];', 'let y = x;', 'y = [2];', 'y.push(3);'),
      py: lines('x = [1]', 'y = x', 'y = [2]', 'y.append(3)'),
      expected: graph({ x: ref('x'), y: ref('y') }, { x: list(1), y: list(2, 3) }),
      hint: {
        js: 'Assigning y = [2] repoints only y; growing y afterward leaves x holding [1] while y ends holding [2, 3].',
        py: 'Assigning y = [2] repoints only y; growing y afterward leaves x holding [1] while y ends holding [2, 3].',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should not share a container. y was repointed to a new container before it grew, so the growth reaches only y. x still refers to [1].',
        },
      ],
      about: {
        js: 'When an alias is reassigned to a new array, it no longer shares with the original. Mutating the new array afterward has no effect on the original array.',
        py: 'When an alias is reassigned to a new list, it no longer shares with the original. Mutating the new list afterward has no effect on the original list.',
      },
      debrief: [
        {
          html: {
            js: '<p>Trace the code line by line:</p><ol><li><code>let x = [1]; let y = x;</code> makes <code>x</code> and <code>y</code> share <code>[1]</code>.</li><li><code>y = [2];</code> breaks the connection: <code>y</code> now points to a fresh array <code>[2]</code>, while <code>x</code> still points to <code>[1]</code>.</li><li><code>y.push(3);</code> mutates only the new array, turning it into <code>[2, 3]</code>.</li></ol>',
            py: '<p>Trace the code line by line:</p><ol><li><code>x = [1]; y = x</code> makes <code>x</code> and <code>y</code> share <code>[1]</code>.</li><li><code>y = [2]</code> breaks the connection: <code>y</code> now points to a fresh list <code>[2]</code>, while <code>x</code> still points to <code>[1]</code>.</li><li><code>y.append(3)</code> mutates only the new list, turning it into <code>[2, 3]</code>.</li></ol>',
          },
        },
        {
          html: {
            js: '<p>Because <code>y</code> was repointed before it was grown, the push never touched the array <code>x</code> refers to.</p>',
            py: '<p>Because <code>y</code> was repointed before it was grown, the append never touched the list <code>x</code> refers to.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(1), y: list(2, 3) }),
          caption: 'Correct: x keeps [1] and y refers to the separate container [2, 3].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list(2, 3) }),
          caption: 'Not correct: y = [2] repoints y at a new container. It does not change the [1] that x refers to.',
          verdict: 'incorrect',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list(1, 3), y: list(2, 3) }),
          caption: {
            js: 'Not correct: once y points to the new array, y.push(3) reaches only that array. Nothing links y to x\'s array any more.',
            py: 'Not correct: once y points to the new list, y.append(3) reaches only that list. Nothing links y to x\'s list any more.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: { js: 'Both hands on one array', py: 'Both hands on one list' },
      js: lines('let x = ["cat", "dog"];', 'let y = x;', 'y[0] = "fox";', 'x.pop();'),
      py: lines('x = ["cat", "dog"]', 'y = x', 'y[0] = "fox"', 'x.pop()'),
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: list('fox') }),
      hint: {
        js: 'let y = x shares one array. Apply every change, through either name, to that one array in order.',
        py: 'y = x shares one list. Apply every change, through either name, to that one list in order.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y should share one container. Assigning y from x made y an alias, so the change through y and the change through x both land on that single container.',
        },
      ],
      about: {
        js: 'When two variables refer to the same array, a change made through either name changes that one shared array in place.',
        py: 'When two variables refer to the same list, a change made through either name changes that one shared list in place.',
      },
      debrief: [
        {
          html: {
            js: '<p>Follow both changes to the shared array:</p><ol><li><code>let x = ["cat", "dog"]; let y = x;</code> points both names at the same two-slot array.</li><li><code>y[0] = "fox";</code> overwrites slot 0 in place, making the array <code>["fox", "dog"]</code>.</li><li><code>x.pop();</code> removes the last slot in place, leaving <code>["fox"]</code>.</li></ol>',
            py: '<p>Follow both changes to the shared list:</p><ol><li><code>x = ["cat", "dog"]; y = x</code> points both names at the same two-slot list.</li><li><code>y[0] = "fox"</code> overwrites slot 0 in place, making the list <code>["fox", "dog"]</code>.</li><li><code>x.pop()</code> removes the last slot in place, leaving <code>["fox"]</code>.</li></ol>',
          },
        },
        {
          html: {
            js: '<p>Both variables still point to that single array in memory, which now holds <code>["fox"]</code>.</p>',
            py: '<p>Both variables still point to that single list in memory, which now holds <code>["fox"]</code>.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: list('fox') }),
          caption: 'Correct: x and y both point to one shared container holding ["fox"].',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: list('cat'), y: list('fox', 'dog') }),
          caption: 'Not correct: this treats y as a separate copy, so each change lands on only one name\'s container. Both changes land on the one container x and y share.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the popped "dog" on the canvas with nothing pointing to it.</p>',
        },
        {
          diagram: withGarbage(graph({ x: ref('shared'), y: ref('shared') }, { shared: list('fox') }), 'dog'),
          caption: 'Also correct: the popped "dog" left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
  ],
)
