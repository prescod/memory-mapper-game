import { graph, list, ref, withGarbage } from '../builders'
import { preserve, runtime } from '../process'
import type { Level } from '../types'
import { draw, L, level, lines, write } from './common'

export const mutatingArraysLevel: Level = level(
  'mutating-arrays',
  L('Changing Arrays', 'Changing Lists'),
  L(
    'Adding, removing or overwriting an item changes the array itself, so every variable that refers to it sees the change. Assigning a new array to a variable is different: it repoints only that variable and leaves the previous one as it was.',
    'Adding, removing or overwriting an item changes the list itself, so every variable that refers to it sees the change. Assigning a new list to a variable is different: it repoints only that variable and leaves the previous one as it was.',
  ),
  [
    draw({
      title: 'Adding to the end',
      js: lines('let a = [1];', 'a.push(2);'),
      py: lines('a = [1]', 'a.append(2)'),
      expected: graph({ a: ref('a') }, { a: list(1, 2) }),
      hint: {
        js: 'push adds a slot to the array a already refers to. It does not build a new array.',
        py: 'append adds a slot to the list a already refers to. It does not build a new list.',
      },
      about: {
        js: 'Adding an item with push changes the existing array in place. The variable still refers to the same array, which now has one more slot.',
        py: 'Adding an item with append changes the existing list in place. The variable still refers to the same list, which now has one more slot.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let a = [1];</code> creates an array with one slot and points <code>a</code> at it. Then <code>a.push(2);</code> adds a second slot holding 2 to that very same array in place.</p>',
            py: '<p><code>a = [1]</code> creates a list with one slot and points <code>a</code> at it. Then <code>a.append(2)</code> adds a second slot holding 2 to that very same list in place.</p>',
          },
        },
        {
          html: {
            js: '<p>No new array was created, and <code>a</code> was not reassigned. The variable still points to the same container in memory, but the container itself has grown.</p>',
            py: '<p>No new list was created, and <code>a</code> was not reassigned. The variable still points to the same container in memory, but the container itself has grown.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(1, 2) }),
          caption: {
            js: 'Correct: push adds a second slot to the existing array in place.',
            py: 'Correct: append adds a second slot to the existing list in place.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(1) }),
          caption: {
            js: 'Not correct: push is not like + on strings, which builds a new value. push changes the existing array, so a does not stay [1].',
            py: 'Not correct: append is not like + on strings, which builds a new value. append changes the existing list, so a does not stay [1].',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: { js: 'Grow an array', py: 'Grow a list' },
      given: { js: 'let a = [];', ts: 'let a: number[] = [];', py: 'a = []' },
      js: lines('a.push(3);', 'a.push(6);', 'a.push(9);'),
      py: lines('a.append(3)', 'a.append(6)', 'a.append(9)'),
      expected: graph({ a: ref('a') }, { a: list(3, 6, 9) }),
      hint: {
        js: 'Add 3, then 6, then 9 to the end of a, changing the same array in place.',
        py: 'Add 3, then 6, then 9 to the end of a, changing the same list in place.',
      },
      about: {
        js: 'You can grow an existing array one item at a time by calling push repeatedly. Change the starter array in place rather than assigning a new array.',
        py: 'You can grow an existing list one item at a time by calling append repeatedly. Change the starter list in place rather than assigning a new list.',
      },
      process: { runtime: runtime(preserve('a')) },
      debrief: [
        {
          html: {
            js: '<p>Calling <code>a.push(...)</code> three times appends 3, 6, and 9 in order. Each call adds a slot to the existing array, growing it from empty to <code>[3, 6, 9]</code>.</p>',
            py: '<p>Calling <code>a.append(...)</code> three times appends 3, 6, and 9 in order. Each call adds a slot to the existing list, growing it from empty to <code>[3, 6, 9]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(3, 6, 9) }),
          caption: {
            js: 'Correct: a grew to [3, 6, 9] in place.',
            py: 'Correct: a grew to [3, 6, 9] in place.',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list() }),
          caption: {
            js: 'Not correct: this is what a would show if push left the starter array alone. Each call changes it in place.',
            py: 'Not correct: this is what a would show if append left the starter list alone. Each call changes it in place.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>a.push(3, 6, 9);</code> adds all three items to the starter array in one call.</p>',
            py: '<p><strong>Also correct:</strong> <code>a.extend([3, 6, 9])</code> adds all three items to the starter list in one call.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>a = [3, 6, 9];</code> produces an array with the right numbers, but it creates a brand new array and discards the starter array. The rule requires changing what <code>a</code> already refers to.</p>',
            py: '<p><strong>Not accepted:</strong> <code>a = [3, 6, 9]</code> produces a list with the right numbers, but it creates a brand new list and discards the starter list. The rule requires changing what <code>a</code> already refers to.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Overwriting a slot',
      js: lines('let a = [1, 2, 3];', 'a[0] = 9;'),
      py: lines('a = [1, 2, 3]', 'a[0] = 9'),
      expected: graph({ a: ref('a') }, { a: list(9, 2, 3) }),
      hint: {
        js: 'a[0] = 9 repoints one slot of the array a already refers to. Think about how many slots the array has afterward.',
        py: 'a[0] = 9 repoints one slot of the list a already refers to. Think about how many slots the list has afterward.',
      },
      about: {
        js: 'Assigning to an index like a[0] = 9 repoints that one slot, changing the array in place. The array keeps its length, and the other slots are left alone.',
        py: 'Assigning to an index like a[0] = 9 repoints that one slot, changing the list in place. The list keeps its length, and the other slots are left alone.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let a = [1, 2, 3];</code> creates a three-slot array. <code>a[0] = 9;</code> repoints only slot 0, so it refers to 9. Slots 1 and 2 still refer to 2 and 3.</p>',
            py: '<p><code>a = [1, 2, 3]</code> creates a three-slot list. <code>a[0] = 9</code> repoints only slot 0, so it refers to 9. Slots 1 and 2 still refer to 2 and 3.</p>',
          },
        },
        {
          html: {
            js: '<p>The array itself is not replaced: <code>a</code> refers to the same array before and after, but the value in its first slot has changed.</p>',
            py: '<p>The list itself is not replaced: <code>a</code> refers to the same list before and after, but the value in its first slot has changed.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(9, 2, 3) }),
          caption: 'Correct: slot 0 is updated to 9 while slots 1 and 2 keep their values.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(9, 1, 2, 3) }),
          caption: 'Not correct: assigning to slot 0 replaces what that slot refers to. It does not insert a new slot at the front.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the old 1 on the canvas with nothing pointing to it. Repointing slot 0 leaves 1 as garbage, which the checker ignores.</p>',
        },
        {
          diagram: withGarbage(graph({ a: ref('a') }, { a: list(9, 2, 3) }), 1),
          caption: 'Also correct: the overwritten 1 left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
    draw({
      title: 'Removing the last item',
      js: lines('let a = [1, 2, 3];', 'a.pop();'),
      py: lines('a = [1, 2, 3]', 'a.pop()'),
      expected: graph({ a: ref('a') }, { a: list(1, 2) }),
      hint: {
        js: 'pop changes the array a already refers to. Think about which end it removes from.',
        py: 'pop changes the list a already refers to. Think about which end it removes from.',
      },
      about: {
        js: 'Calling a.pop() removes the last item from the array in place, shrinking it by one slot.',
        py: 'Calling a.pop() removes the last item from the list in place, shrinking it by one slot.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>a.pop();</code> removes the final slot from the array in place. The array shrinks from three slots to two, holding <code>[1, 2]</code>.</p>',
            py: '<p><code>a.pop()</code> removes the final slot from the list in place. The list shrinks from three slots to two, holding <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(1, 2) }),
          caption: 'Correct: pop() removes the last item, leaving [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(2, 3) }),
          caption: 'Not correct: pop() removes from the end, not the beginning.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the removed 3 on the canvas with nothing pointing to it. <code>pop</code> gives back the item it removes, but this code does not keep it in a variable, so 3 becomes garbage.</p>',
        },
        {
          diagram: withGarbage(graph({ a: ref('a') }, { a: list(1, 2) }), 3),
          caption: 'Also correct: the removed 3 left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
    write({
      title: 'Change the middle',
      given: { js: 'let a = [1, 2, 3];', py: 'a = [1, 2, 3]' },
      js: 'a[1] = 5;',
      py: 'a[1] = 5',
      expected: graph({ a: ref('a') }, { a: list(1, 5, 3) }),
      hint: {
        js: 'Indices start at 0. Repoint only the middle slot of the array a already refers to.',
        py: 'Indices start at 0. Repoint only the middle slot of the list a already refers to.',
      },
      about: {
        js: 'Indices start at 0, so the middle slot of a three-item array is at index 1. Overwrite only that slot in place using bracket notation.',
        py: 'Indices start at 0, so the middle slot of a three-item list is at index 1. Overwrite only that slot in place using bracket notation.',
      },
      process: { runtime: runtime(preserve('a')) },
      debrief: [
        {
          html: {
            js: '<p><code>a[1] = 5;</code> repoints slot 1 of the existing array to 5. Slot 0 still holds 1 and slot 2 still holds 3.</p>',
            py: '<p><code>a[1] = 5</code> repoints slot 1 of the existing list to 5. Slot 0 still holds 1 and slot 2 still holds 3.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(1, 5, 3) }),
          caption: 'Correct: slot 1 is changed to 5 in place.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(1, 2, 5) }),
          caption: 'Not correct: indices start at 0, so slot 1 is the middle item, not slot 2.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>a = [1, 5, 3];</code> produces the expected values, but creates a brand new array instead of modifying the existing one in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>a = [1, 5, 3]</code> produces the expected values, but creates a brand new list instead of modifying the existing one in place.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Mutating through an alias',
      js: lines('let a = [1];', 'let b = a;', 'b.push(2);'),
      py: lines('a = [1]', 'b = a', 'b.append(2)'),
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2) }),
      hint: {
        js: 'let b = a does not copy the array. Think about which array b.push(2) changes.',
        py: 'b = a does not copy the list. Think about which list b.append(2) changes.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'a and b should share one container. Assigning b from a made b an alias, not a copy, so adding 2 through b changes the container a refers to as well.',
        },
      ],
      about: {
        js: 'Assigning b = a gives b a reference to the same array as a. When you mutate the array through b, the change is visible through a as well.',
        py: 'Assigning b = a gives b a reference to the same list as a. When you mutate the list through b, the change is visible through a as well.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = a;</code> does not copy the array. It points <code>b</code> at the very same array <code>a</code> refers to: <code>b</code> is an <strong>alias</strong> for <code>a</code>.</p>',
            py: '<p><code>b = a</code> does not copy the list. It points <code>b</code> at the very same list <code>a</code> refers to: <code>b</code> is an <strong>alias</strong> for <code>a</code>.</p>',
          },
        },
        {
          html: {
            js: '<p>When <code>b.push(2);</code> runs, it adds 2 to that shared array in place. Because <code>a</code> points to that same array, looking through <code>a</code> reveals <code>[1, 2]</code> as well.</p>',
            py: '<p>When <code>b.append(2)</code> runs, it adds 2 to that shared list in place. Because <code>a</code> points to that same list, looking through <code>a</code> reveals <code>[1, 2]</code> as well.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2) }),
          caption: 'Correct: a and b share one container, which now holds [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2) }),
          caption: 'Not correct: this treats b as a separate copy. b is an alias, so a change made through b is seen through a too.',
          verdict: 'incorrect',
        },
      ],
    }),
    write({
      title: 'Empty it for both',
      given: { js: lines('let a = [4, 5];', 'let b = a;'), py: lines('a = [4, 5]', 'b = a') },
      js: lines('a.pop();', 'a.pop();'),
      py: lines('a.pop()', 'a.pop()'),
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list() }),
      hint: {
        js: 'Remove both items from a in place so a and b end sharing one empty array.',
        py: 'Remove both items from a in place so a and b end sharing one empty list.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'a and b should still share one container. Reassigning a to a new empty container moves only a\'s arrow and leaves b with [4, 5]. Remove the items from the shared container instead.',
        },
      ],
      about: {
        js: 'When two variables share an array, removing items through pop empties the shared array in place. Reassigning a = [] would point only a at a new array and leave b with the old one.',
        py: 'When two variables share a list, removing items through pop empties the shared list in place. Reassigning a = [] would point only a at a new list and leave b with the old one.',
      },
      process: { runtime: runtime(preserve('a')) },
      debrief: [
        {
          html: {
            js: '<p>Calling <code>a.pop();</code> twice removes 5 and then 4 from the shared array in place. Because <code>b</code> points to the same array, both variables now refer to one shared empty array.</p>',
            py: '<p>Calling <code>a.pop()</code> twice removes 5 and then 4 from the shared list in place. Because <code>b</code> points to the same list, both variables now refer to one shared empty list.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list() }),
          caption: 'Correct: a and b continue to share the original container, which is now empty.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(), b: list(4, 5) }),
          caption: 'Not correct: reassigning a = [] moves only a\'s arrow, leaving b with [4, 5].',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> calling <code>b.pop();</code> twice works just as well, because <code>a</code> and <code>b</code> refer to the same array.</p>',
            py: '<p><strong>Also correct:</strong> calling <code>b.pop()</code> twice works just as well, because <code>a</code> and <code>b</code> refer to the same list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>a.length = 0;</code> empties the shared array in place in one step.</p>',
            py: '<p><strong>Also correct:</strong> <code>a.clear()</code> empties the shared list in place in one step.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>a = [];</code>. Assigning a new array literal moves only <code>a</code>\'s arrow, breaking the alias and leaving <code>b</code> holding <code>[4, 5]</code>. The rule requires emptying the existing array in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>a = []</code>. Assigning a new list literal moves only <code>a</code>\'s arrow, breaking the alias and leaving <code>b</code> holding <code>[4, 5]</code>. The rule requires emptying the existing list in place.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Add for both',
      given: { js: lines('let a = ["x"];', 'let b = a;'), py: lines('a = ["x"]', 'b = a') },
      js: 'b.push("y");',
      py: 'b.append("y")',
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('x', 'y') }),
      hint: {
        js: 'Add "y" to the end of b in place; a shares the same array so both end holding ["x", "y"].',
        py: 'Add "y" to the end of b in place; a shares the same list so both end holding ["x", "y"].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'a and b should still share one container. Reassigning b to a new container moves only b\'s arrow and leaves a with ["x"]. Add to the shared container instead.',
        },
      ],
      about: {
        js: 'Because b refers to the same array as a, modifying b in place changes the array for both names without needing to touch a.',
        py: 'Because b refers to the same list as a, modifying b in place changes the list for both names without needing to touch a.',
      },
      process: { runtime: runtime(preserve('a')) },
      debrief: [
        {
          html: {
            js: '<p><code>b.push("y");</code> mutates the array referred to by <code>b</code>. Since <code>a</code> points to that very same array, the addition is visible through <code>a</code> as well.</p>',
            py: '<p><code>b.append("y")</code> mutates the list referred to by <code>b</code>. Since <code>a</code> points to that very same list, the addition is visible through <code>a</code> as well.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('x', 'y') }),
          caption: 'Correct: a and b share one container, which now holds ["x", "y"].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list('x'), b: list('x', 'y') }),
          caption: 'Not correct: reassigning b splits the alias, so a is left with ["x"]. Adding through b in place keeps one shared container.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>a.push("y");</code> builds the same picture, because both names refer to the same array.</p>',
            py: '<p><strong>Also correct:</strong> <code>a.append("y")</code> builds the same picture, because both names refer to the same list.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>b = ["x", "y"];</code>. Reassigning <code>b</code> points it at a new array, leaving <code>a</code> with <code>["x"]</code> instead of sharing.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b = ["x", "y"]</code>. Reassigning <code>b</code> points it at a new list, leaving <code>a</code> with <code>["x"]</code> instead of sharing.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Pointing a name elsewhere',
      js: lines('let a = [1, 2, 3];', 'let b = a;', 'a = [0];'),
      py: lines('a = [1, 2, 3]', 'b = a', 'a = [0]'),
      expected: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2, 3), new: list(0) }),
      hint: {
        js: 'Think about which arrow a = [0] moves, and whether it changes any existing array.',
        py: 'Think about which arrow a = [0] moves, and whether it changes any existing list.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. Reassigning a moves only a\'s arrow to the new container [0]; b still points to the original [1, 2, 3].',
        },
      ],
      about: {
        js: 'Reassigning a variable moves only its arrow to a new array. It does not modify the old array, and it leaves other variables that point to the old array unchanged.',
        py: 'Reassigning a variable moves only its arrow to a new list. It does not modify the old list, and it leaves other variables that point to the old list unchanged.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>let b = a;</code> made <code>a</code> and <code>b</code> share <code>[1, 2, 3]</code>. Then <code>a = [0];</code> points <code>a</code> at a brand new array. Only <code>a</code>\'s arrow moved; the original array was not modified, so <code>b</code> still refers to <code>[1, 2, 3]</code>.</p>',
            py: '<p><code>b = a</code> made <code>a</code> and <code>b</code> share <code>[1, 2, 3]</code>. Then <code>a = [0]</code> points <code>a</code> at a brand new list. Only <code>a</code>\'s arrow moved; the original list was not modified, so <code>b</code> still refers to <code>[1, 2, 3]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('new'), b: ref('old') }, { old: list(1, 2, 3), new: list(0) }),
          caption: 'Correct: a refers to the new [0], while b still refers to [1, 2, 3].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(0) }),
          caption: {
            js: 'Not correct: reassigning a does not change the array b points to.',
            py: 'Not correct: reassigning a does not change the list b points to.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>This is the key contrast in this level: <strong>mutating</strong> (like <code>push</code> or <code>pop</code>) changes what is inside an array, affecting every alias. <strong>Reassigning</strong> (like <code>a = [0]</code>) moves only one variable\'s arrow to a different container.</p>',
            py: '<p>This is the key contrast in this level: <strong>mutating</strong> (like <code>append</code> or <code>pop</code>) changes what is inside a list, affecting every alias. <strong>Reassigning</strong> (like <code>a = [0]</code>) moves only one variable\'s arrow to a different container.</p>',
          },
        },
      ],
    }),
    write({
      title: 'Split them apart',
      given: { js: lines('let a = [1];', 'let b = a;'), py: lines('a = [1]', 'b = a') },
      js: 'b = [1, 2];',
      py: 'b = [1, 2]',
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2) }),
      hint: {
        js: 'Give b an array of its own, so that a keeps referring to the original [1].',
        py: 'Give b a list of its own, so that a keeps referring to the original [1].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. While b is an alias for a, changing b in place changes a too. Reassigning b moves only b\'s arrow.',
        },
      ],
      about: {
        js: 'To give b new items without changing a, reassign b to a new array literal. That moves b\'s arrow and leaves a pointing to the original array.',
        py: 'To give b new items without changing a, reassign b to a new list literal. That moves b\'s arrow and leaves a pointing to the original list.',
      },
      process: { runtime: runtime(preserve('a')) },
      debrief: [
        {
          html: {
            js: '<p><code>b = [1, 2];</code> creates a new array and points <code>b</code> at it. Because <code>a</code> was neither reassigned nor mutated, it continues to refer to the original array <code>[1]</code>.</p>',
            py: '<p><code>b = [1, 2]</code> creates a new list and points <code>b</code> at it. Because <code>a</code> was neither reassigned nor mutated, it continues to refer to the original list <code>[1]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(1, 2) }),
          caption: 'Correct: a retains the original [1], and b points to a new [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(1, 2) }),
          caption: {
            js: 'Not correct: b.push(2) mutates the shared array, changing a as well.',
            py: 'Not correct: b.append(2) mutates the shared list, changing a as well.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>b = [1];</code> followed by <code>b.push(2);</code>. The first line gives <code>b</code> its own array, so the push changes only that one.</p>',
            py: '<p><strong>Also correct:</strong> <code>b = [1]</code> followed by <code>b.append(2)</code>. The first line gives <code>b</code> its own list, so the append changes only that one.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>b.push(2);</code> on its own. Pushing to <code>b</code> changes the shared array in place, making <code>a</code> hold <code>[1, 2]</code> as well.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b.append(2)</code> on its own. Appending to <code>b</code> changes the shared list in place, making <code>a</code> hold <code>[1, 2]</code> as well.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> rebuilding both arrays, as in <code>a = [1];</code> followed by <code>b = [1, 2];</code>. The picture matches, but the rule requires <code>a</code> to keep referring to the starter array.</p>',
            py: '<p><strong>Not accepted:</strong> rebuilding both lists, as in <code>a = [1]</code> followed by <code>b = [1, 2]</code>. The picture matches, but the rule requires <code>a</code> to keep referring to the starter list.</p>',
          },
        },
      ],
    }),
  ],
  [
    write({
      title: 'Peel one off',
      given: {
        js: lines('let a = [1];', 'let b = a;', 'let c = a;'),
        py: lines('a = [1]', 'b = a', 'c = a'),
      },
      js: lines('b = [];', 'c.push(2);'),
      py: lines('b = []', 'c.append(2)'),
      expected: graph(
        { a: ref('shared'), b: ref('alone'), c: ref('shared') },
        { shared: list(1, 2), alone: list() },
      ),
      hint: {
        js: 'Point b at a new empty array, then grow c in place so a and c share [1, 2].',
        py: 'Point b at a new empty list, then grow c in place so a and c share [1, 2].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'b should not share with a and c. Reassigning b moves only b\'s arrow, giving it its own empty container while a and c still share the original.',
        },
      ],
      about: {
        js: 'When three variables share an array, reassigning one variable detaches only that name. The remaining two variables still share the original array and see further mutations.',
        py: 'When three variables share a list, reassigning one variable detaches only that name. The remaining two variables still share the original list and see further mutations.',
      },
      process: { runtime: runtime(preserve('a')) },
      debrief: [
        {
          html: {
            js: '<p><code>b = [];</code> reassigns only <code>b</code> to a new empty array, detaching it from <code>a</code> and <code>c</code>. Then <code>c.push(2);</code> mutates the original array in place, so both <code>a</code> and <code>c</code> see <code>[1, 2]</code>.</p>',
            py: '<p><code>b = []</code> reassigns only <code>b</code> to a new empty list, detaching it from <code>a</code> and <code>c</code>. Then <code>c.append(2)</code> mutates the original list in place, so both <code>a</code> and <code>c</code> see <code>[1, 2]</code>.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('shared'), b: ref('alone'), c: ref('shared') },
            { shared: list(1, 2), alone: list() },
          ),
          caption: 'Correct: b is detached to its own [], while a and c still share [1, 2].',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('shared'), b: ref('shared'), c: ref('shared') },
            { shared: list(1, 2) },
          ),
          caption: {
            js: 'Not correct: while b is still an alias, it sees the push too. b must be reassigned to an array of its own.',
            py: 'Not correct: while b is still an alias, it sees the append too. b must be reassigned to a list of its own.',
          },
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> pushing through <code>a</code> instead of <code>c</code>, because <code>a</code> and <code>c</code> are aliases for the same array. The two lines can also run in either order: <code>b</code> is reassigned rather than changed, so it never holds the 2.</p>',
            py: '<p><strong>Also correct:</strong> appending through <code>a</code> instead of <code>c</code>, because <code>a</code> and <code>c</code> are aliases for the same list. The two lines can also run in either order: <code>b</code> is reassigned rather than changed, so it never holds the 2.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> Reassigning <code>a</code> or rebuilding the arrays from scratch. The starter array must be preserved under <code>a</code>.</p>',
            py: '<p><strong>Not accepted:</strong> Reassigning <code>a</code> or rebuilding the lists from scratch. The starter list must be preserved under <code>a</code>.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Grow once, pop twice',
      js: lines('let a = [4, 5];', 'a.push(6);', 'a.pop();', 'a.pop();'),
      py: lines('a = [4, 5]', 'a.append(6)', 'a.pop()', 'a.pop()'),
      expected: graph({ a: ref('a') }, { a: list(4) }),
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
            js: '<p>Trace the changes in order:</p><ol><li><code>let a = [4, 5];</code> starts with <code>[4, 5]</code>.</li><li><code>a.push(6);</code> adds 6 to the end: <code>[4, 5, 6]</code>.</li><li>The first <code>a.pop();</code> removes the last element (6): <code>[4, 5]</code>.</li><li>The second <code>a.pop();</code> removes the last element (5): <code>[4]</code>.</li></ol>',
            py: '<p>Trace the changes in order:</p><ol><li><code>a = [4, 5]</code> starts with <code>[4, 5]</code>.</li><li><code>a.append(6)</code> adds 6 to the end: <code>[4, 5, 6]</code>.</li><li>The first <code>a.pop()</code> removes the last element (6): <code>[4, 5]</code>.</li><li>The second <code>a.pop()</code> removes the last element (5): <code>[4]</code>.</li></ol>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(4) }),
          caption: 'Correct: after push and two pops, a ends holding [4].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(4, 5) }),
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
          diagram: withGarbage(graph({ a: ref('a') }, { a: list(4) }), 5, 6),
          caption: 'Also correct: the popped 5 and 6 left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
    write({
      title: 'Fill the ends',
      given: { js: 'let a = [0, 0, 0];', py: 'a = [0, 0, 0]' },
      js: lines('a[0] = 7;', 'a[2] = 8;'),
      py: lines('a[0] = 7', 'a[2] = 8'),
      expected: graph({ a: ref('a') }, { a: list(7, 0, 8) }),
      hint: {
        js: 'Set slot 0 to 7 and slot 2 to 8 in place, leaving slot 1 as 0.',
        py: 'Set slot 0 to 7 and slot 2 to 8 in place, leaving slot 1 as 0.',
      },
      about: {
        js: 'Assigning to specific indices like a[0] and a[2] modifies only those slots in place, leaving all other slots untouched.',
        py: 'Assigning to specific indices like a[0] and a[2] modifies only those slots in place, leaving all other slots untouched.',
      },
      process: { runtime: runtime(preserve('a')) },
      debrief: [
        {
          html: {
            js: '<p><code>a[0] = 7;</code> updates the first slot to 7, and <code>a[2] = 8;</code> updates the third slot to 8. Slot 1 is never assigned to, so it remains 0.</p>',
            py: '<p><code>a[0] = 7</code> updates the first slot to 7, and <code>a[2] = 8</code> updates the third slot to 8. Slot 1 is never assigned to, so it remains 0.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(7, 0, 8) }),
          caption: 'Correct: slots 0 and 2 are updated, leaving slot 1 at 0.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a') }, { a: list(0, 7, 8) }),
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
            js: '<p><strong>Not accepted:</strong> <code>a = [7, 0, 8];</code> replaces the array instead of modifying the existing one in place.</p>',
            py: '<p><strong>Not accepted:</strong> <code>a = [7, 0, 8]</code> replaces the list instead of modifying the existing one in place.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Repoint, then grow',
      js: lines('let a = [1];', 'let b = a;', 'b = [2];', 'b.push(3);'),
      py: lines('a = [1]', 'b = a', 'b = [2]', 'b.append(3)'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(2, 3) }),
      hint: {
        js: 'Assigning b = [2] repoints only b; growing b afterward leaves a holding [1] while b ends holding [2, 3].',
        py: 'Assigning b = [2] repoints only b; growing b afterward leaves a holding [1] while b ends holding [2, 3].',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should not share a container. b was repointed to a new container before it grew, so the growth reaches only b. a still refers to [1].',
        },
      ],
      about: {
        js: 'When an alias is reassigned to a new array, it no longer shares with the original. Mutating the new array afterward has no effect on the original array.',
        py: 'When an alias is reassigned to a new list, it no longer shares with the original. Mutating the new list afterward has no effect on the original list.',
      },
      debrief: [
        {
          html: {
            js: '<p>Trace the code line by line:</p><ol><li><code>let a = [1]; let b = a;</code> makes <code>a</code> and <code>b</code> share <code>[1]</code>.</li><li><code>b = [2];</code> breaks the connection: <code>b</code> now points to a fresh array <code>[2]</code>, while <code>a</code> still points to <code>[1]</code>.</li><li><code>b.push(3);</code> mutates only the new array, turning it into <code>[2, 3]</code>.</li></ol>',
            py: '<p>Trace the code line by line:</p><ol><li><code>a = [1]; b = a</code> makes <code>a</code> and <code>b</code> share <code>[1]</code>.</li><li><code>b = [2]</code> breaks the connection: <code>b</code> now points to a fresh list <code>[2]</code>, while <code>a</code> still points to <code>[1]</code>.</li><li><code>b.append(3)</code> mutates only the new list, turning it into <code>[2, 3]</code>.</li></ol>',
          },
        },
        {
          html: {
            js: '<p>Because <code>b</code> was repointed before it was grown, the push never touched the array <code>a</code> refers to.</p>',
            py: '<p>Because <code>b</code> was repointed before it was grown, the append never touched the list <code>a</code> refers to.</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1), b: list(2, 3) }),
          caption: 'Correct: a keeps [1] and b refers to the separate container [2, 3].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list(2, 3) }),
          caption: 'Not correct: b = [2] repoints b at a new container. It does not change the [1] that a refers to.',
          verdict: 'incorrect',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list(1, 3), b: list(2, 3) }),
          caption: {
            js: 'Not correct: once b points to the new array, b.push(3) reaches only that array. Nothing links b to a\'s array any more.',
            py: 'Not correct: once b points to the new list, b.append(3) reaches only that list. Nothing links b to a\'s list any more.',
          },
          verdict: 'incorrect',
        },
      ],
    }),
    draw({
      title: { js: 'Both hands on one array', py: 'Both hands on one list' },
      js: lines('let a = ["x", "y"];', 'let b = a;', 'b[0] = "z";', 'a.pop();'),
      py: lines('a = ["x", "y"]', 'b = a', 'b[0] = "z"', 'a.pop()'),
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('z') }),
      hint: {
        js: 'let b = a shares one array. Apply every change, through either name, to that one array in order.',
        py: 'b = a shares one list. Apply every change, through either name, to that one list in order.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'a and b should share one container. Assigning b from a made b an alias, so the change through b and the change through a both land on that single container.',
        },
      ],
      about: {
        js: 'When two variables refer to the same array, a change made through either name changes that one shared array in place.',
        py: 'When two variables refer to the same list, a change made through either name changes that one shared list in place.',
      },
      debrief: [
        {
          html: {
            js: '<p>Follow both changes to the shared array:</p><ol><li><code>let a = ["x", "y"]; let b = a;</code> points both names at the same two-slot array.</li><li><code>b[0] = "z";</code> overwrites slot 0 in place, making the array <code>["z", "y"]</code>.</li><li><code>a.pop();</code> removes the last slot in place, leaving <code>["z"]</code>.</li></ol>',
            py: '<p>Follow both changes to the shared list:</p><ol><li><code>a = ["x", "y"]; b = a</code> points both names at the same two-slot list.</li><li><code>b[0] = "z"</code> overwrites slot 0 in place, making the list <code>["z", "y"]</code>.</li><li><code>a.pop()</code> removes the last slot in place, leaving <code>["z"]</code>.</li></ol>',
          },
        },
        {
          html: {
            js: '<p>Both variables still point to that single array in memory, which now holds <code>["z"]</code>.</p>',
            py: '<p>Both variables still point to that single list in memory, which now holds <code>["z"]</code>.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: list('z') }),
          caption: 'Correct: a and b both point to one shared container holding ["z"].',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: list('x'), b: list('z', 'y') }),
          caption: 'Not correct: this treats b as a separate copy, so each change lands on only one name\'s container. Both changes land on the one container a and b share.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving the popped "y" on the canvas with nothing pointing to it.</p>',
        },
        {
          diagram: withGarbage(graph({ a: ref('shared'), b: ref('shared') }, { shared: list('z') }), 'y'),
          caption: 'Also correct: the popped "y" left behind as garbage.',
          verdict: 'correct',
        },
      ],
    }),
  ],
)
