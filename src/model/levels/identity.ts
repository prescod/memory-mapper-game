import { graph, pet, ref } from '../builders'
import { preserve, runtime } from '../process'
import type { UnnumberedLevel } from '../types'
import { draw, L, level, lines, write } from './common'

export const identityLevel: UnnumberedLevel = level(
  'identity',
  L(
    'Objects with Identity and Multiple References',
    'Objects with Identity and Multiple References',
  ),
  L(
    'Unlike numbers and strings, x Pet has an identity: it is a separate thing in memory, and a variable refers to it with an arrow. Two variables can share one Pet, while two Pet("Milo") calls always build two separate Pets, even with the same name. A Pet\'s name can change, as in y.name = "Rex": the Pet itself changes, so every variable that shares it sees the new name. Pet is built in for this level: call Pet("name") with no new. On the canvas, Add Pet draws one Pet: name it and connect variables to it.',
    'Unlike numbers and strings, x Pet has an identity: it is a separate thing in memory, and a variable refers to it with an arrow. Two variables can share one Pet, while two Pet("Milo") calls always build two separate Pets, even with the same name. A Pet\'s name can change, as in y.name = "Rex": the Pet itself changes, so every variable that shares it sees the new name. Pet is built in for this level: call Pet("name"). On the canvas, Add Pet draws one Pet: name it and connect variables to it.',
  ),
  [
    draw({
      title: 'One Pet',
      js: 'let x = Pet("Buddy");',
      py: 'x = Pet("Buddy")',
      expected: graph({ x: ref('o') }, { o: pet('Buddy') }),
      hint: 'Add a variable named x and a Pet named "Buddy", then connect x to the Pet.',
      about:
        'A Pet is a separate thing in memory from the variable that refers to it. Calling Pet creates the Pet, and assigning points the variable\'s arrow at it.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = Pet("Buddy");</code> creates two things: a variable named <code>x</code> and a Pet named "Buddy". The arrow means "x currently refers to that Pet."</p>',
            py: '<p><code>x = Pet("Buddy")</code> creates two things: a variable named <code>x</code> and a Pet named "Buddy". The arrow means "x currently refers to that Pet."</p>',
          },
        },
        {
          html: '<p>"Buddy" is only the label on the Pet. The Pet itself is a separate thing in memory with an identity of its own, and variables connect to it with arrows.</p>',
        },
        {
          diagram: graph({ x: ref('o') }, { o: pet('Buddy') }),
          caption: 'One variable pointing to one Pet.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: 'Buddy' }),
          caption: 'Not correct: x refers to a Pet, not to the string "Buddy".',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Not accepted:</strong> pointing x at a string "Buddy". The name is written on the Pet, but the Pet is more than its name.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Assigning from a Pet',
      js: lines('let x = Pet("Max");', 'let y = x;'),
      py: lines('x = Pet("Max")', 'y = x'),
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Max') }),
      hint: 'Assigning y = x makes both names refer to the same Pet, not a second copy.',
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'y = x copies the reference, not the Pet. Both variables refer to the same Pet in memory.',
        },
      ],
      about:
        'Assigning one variable to another copies the reference, not the object. Both variables point to the same Pet in memory.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = Pet("Max");</code> creates one Pet. Then <code>let y = x;</code> copies the reference from <code>x</code> to <code>y</code>. It does not call <code>Pet()</code> again, so no second Pet is created.</p>',
            py: '<p><code>x = Pet("Max")</code> creates one Pet. Then <code>y = x</code> copies the reference from <code>x</code> to <code>y</code>. It does not call <code>Pet()</code> again, so no second Pet is created.</p>',
          },
        },
        {
          html: '<p>Both <code>x</code> and <code>y</code> now refer to the very same Pet in memory. Having multiple names for one object is called <strong>aliasing</strong>.</p>',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Max') }),
          caption: 'Correct: x and y refer to the same Pet.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: pet('Max'), y: pet('Max') }),
          caption: 'Not correct: y = x copies the reference, not the Pet.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Not accepted:</strong> drawing a second Max. Only a call to <code>Pet()</code> creates a Pet, and this code calls it once.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'Three names, one object',
      js: lines('let x = Pet("Rex");', 'let y = x;', 'let z = x;'),
      ts: lines('let x: Pet = Pet("Rex");', 'let y: Pet = x;', 'let z: Pet = x;'),
      py: lines('x = Pet("Rex")', 'y = x', 'z = x'),
      expected: graph(
        { x: ref('shared'), y: ref('shared'), z: ref('shared') },
        { shared: pet('Rex') },
      ),
      hint: 'Each assignment from x adds another name for the same Pet.',
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'All three variables should share one Pet. Assign y from an existing variable instead of calling Pet again.',
        },
        {
          variable: 'z',
          aliasing: 'separate',
          message:
            'All three variables should share one Pet. Assign z from an existing variable instead of calling Pet again.',
        },
      ],
      about:
        'Multiple variables can refer to a single Pet. Call Pet once to create it, then assign from an existing variable to create additional references.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = Pet("Rex");</code> creates the Pet. Each later assignment, <code>let y = x;</code> and <code>let z = x;</code>, points another variable at that same Pet.</p>',
            py: '<p><code>x = Pet("Rex")</code> creates the Pet. Each later assignment, <code>y = x</code> and <code>z = x</code>, points another variable at that same Pet.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('shared'), z: ref('shared') },
            { shared: pet('Rex') },
          ),
          caption: 'Three names pointing to one shared Pet.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y'), z: ref('z') },
            { x: pet('Rex'), y: pet('Rex'), z: pet('Rex') },
          ),
          caption: 'Not correct: three separate Pets that happen to share a name.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> writing <code>let z = y;</code> instead of <code>let z = x;</code>. Because <code>y</code> already refers to Rex, assigning <code>z</code> from <code>y</code> points <code>z</code> at the exact same Pet.</p>',
            py: '<p><strong>Also correct:</strong> writing <code>z = y</code> instead of <code>z = x</code>. Because <code>y</code> already refers to Rex, assigning <code>z</code> from <code>y</code> points <code>z</code> at the exact same Pet.</p>',
          },
        },
        {
          html: '<p><strong>Not accepted:</strong> calling <code>Pet("Rex")</code> three times. That would construct three separate Pets in memory, rather than three references to one Pet.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'Two fresh objects',
      js: lines('let p = Pet("Luna");', 'let q = Pet("Coco");'),
      ts: lines('let p: Pet = Pet("Luna");', 'let q: Pet = Pet("Coco");'),
      py: lines('p = Pet("Luna")', 'q = Pet("Coco")'),
      expected: graph({ p: ref('p'), q: ref('q') }, { p: pet('Luna'), q: pet('Coco') }),
      hint: {
        js: 'Declare two variables, each with its own Pet call.',
        py: 'Create two variables, each with its own Pet call.',
      },
      hints: [
        {
          variable: 'q',
          aliasing: 'shared',
          message: 'p and q must refer to two separate Pets. Call Pet separately for each one.',
        },
      ],
      about:
        'Each call to Pet creates a distinct new object in memory with its own identity. To have two separate Pets, call Pet twice.',
      debrief: [
        {
          html: {
            js: '<p>Each call to <code>Pet()</code> constructs a new object in memory. <code>let p = Pet("Luna");</code> and <code>let q = Pet("Coco");</code> make two distinct Pets.</p>',
            py: '<p>Each call to <code>Pet()</code> constructs a new object in memory. <code>p = Pet("Luna")</code> and <code>q = Pet("Coco")</code> make two distinct Pets.</p>',
          },
        },
        {
          diagram: graph({ p: ref('p'), q: ref('q') }, { p: pet('Luna'), q: pet('Coco') }),
          caption: 'Two separate variables pointing to two separate Pets.',
          verdict: 'correct',
        },
        {
          diagram: graph({ p: ref('shared'), q: ref('shared') }, { shared: pet('Luna') }),
          caption: 'Not correct: p and q refer to separate Pets with different names.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Because each variable was initialized from its own <code>Pet()</code> call, they refer to different objects in memory.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: "Two share, one doesn't",
      js: lines('let x = Pet("Bella");', 'let y = x;', 'let z = Pet("Daisy");'),
      ts: lines('let x: Pet = Pet("Bella");', 'let y: Pet = x;', 'let z: Pet = Pet("Daisy");'),
      py: lines('x = Pet("Bella")', 'y = x', 'z = Pet("Daisy")'),
      expected: graph(
        { x: ref('shared'), y: ref('shared'), z: ref('alone') },
        { shared: pet('Bella'), alone: pet('Daisy') },
      ),
      hint: 'y = x shares one Pet; z = Pet("Daisy") creates a second, separate Pet.',
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'y should share one Pet with x. Assign y from x instead of calling Pet again.',
        },
        {
          variable: 'z',
          aliasing: 'shared',
          message:
            'z must refer to its own separate Pet. Call Pet("Daisy") instead of assigning from x or y.',
        },
      ],
      about:
        'A program can have some variables that share an object and others that refer to separate objects. Use assignment to share an existing Pet, and Pet() to create a new one.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = Pet("Bella");</code> creates Bella. <code>let y = x;</code> makes <code>y</code> an alias for that same Pet. Then <code>let z = Pet("Daisy");</code> calls <code>Pet()</code> again, creating a separate Pet named Daisy.</p>',
            py: '<p><code>x = Pet("Bella")</code> creates Bella. <code>y = x</code> makes <code>y</code> an alias for that same Pet. Then <code>z = Pet("Daisy")</code> calls <code>Pet()</code> again, creating a separate Pet named Daisy.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('shared'), z: ref('alone') },
            { shared: pet('Bella'), alone: pet('Daisy') },
          ),
          caption: 'x and y share Bella; z refers to Daisy.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('x'), y: ref('y'), z: ref('z') },
            { x: pet('Bella'), y: pet('Bella'), z: pet('Daisy') },
          ),
          caption: 'Not correct: x and y point to two separate Bellas instead of sharing one.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let y = Pet("Bella");</code> would give <code>y</code> a Pet with the same label, but it would be a separate object in memory rather than sharing with <code>x</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y = Pet("Bella")</code> would give <code>y</code> a Pet with the same label, but it would be a separate object in memory rather than sharing with <code>x</code>.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Same label, separate objects',
      js: lines('let x = Pet("Milo");', 'let y = Pet("Milo");'),
      py: lines('x = Pet("Milo")', 'y = Pet("Milo")'),
      expected: graph({ x: ref('x'), y: ref('y') }, { x: pet('Milo'), y: pet('Milo') }),
      hint: 'Two Pet calls with the same name still build two separate Pets in memory.',
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y are built from separate Pet calls, so they refer to two separate Pets even though both are named Milo.',
        },
      ],
      about:
        'Calling Pet creates a brand new object every time. Two Pets can share the same name label while being separate objects in memory.',
      debrief: [
        {
          html: {
            js: '<p>Each call to <code>Pet()</code> constructs a separate object in memory. <code>let x = Pet("Milo");</code> and <code>let y = Pet("Milo");</code> create two different Pets, even though both have the label "Milo".</p>',
            py: '<p>Each call to <code>Pet()</code> constructs a separate object in memory. <code>x = Pet("Milo")</code> and <code>y = Pet("Milo")</code> create two different Pets, even though both have the label "Milo".</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: pet('Milo'), y: pet('Milo') }),
          caption: 'Correct: two separate Pets, each named Milo.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Milo') }),
          caption: 'Not correct: two Pet calls build two separate Pets, not one shared Pet.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Identity is not determined by the text on the label. Think of two dogs who both answer to "Milo": they are still two independent dogs.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> one Milo shared by x and y. Sharing comes only from assigning one variable from another, as <code>let y = x;</code> would.</p>',
            py: '<p><strong>Not accepted:</strong> one Milo shared by x and y. Sharing comes only from assigning one variable from another, as <code>y = x</code> would.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'Same Pet as x',
      given: { js: 'let x = Pet("Duke");', ts: 'let x: Pet = Pet("Duke");', py: 'x = Pet("Duke")' },
      js: 'let y = x;',
      ts: 'let y: Pet = x;',
      py: 'y = x',
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Duke') }),
      process: {
        hidden: [
          {
            given: { js: 'let x = Pet("Rex");', ts: 'let x: Pet = Pet("Rex");', py: 'x = Pet("Rex")' },
            expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Rex') }),
          },
        ],
      },
      hint: {
        js: 'Declare y and assign it from x instead of calling Pet again.',
        py: 'Set y from x instead of calling Pet again.',
      },
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'These references should share one Pet, but they point to different ones. Assign y from x instead of calling Pet again.',
        },
      ],
      about:
        'To make y refer to the same Pet as x, assign it directly from x. Calling Pet again would construct a second, separate Pet.',
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> copies the reference from <code>x</code> to <code>y</code>, making both variables refer to Duke.</p>',
            py: '<p><code>y = x</code> copies the reference from <code>x</code> to <code>y</code>, making both variables refer to Duke.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Duke') }),
          caption: 'x and y sharing Duke.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: pet('Duke'), y: pet('Duke') }),
          caption: 'Not correct: calling Pet again creates a separate Pet.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let y = Pet("Duke");</code> creates a second Pet in memory that happens to have the same name, so x and y no longer share one Pet.</p>',
            py: '<p><strong>Not accepted:</strong> <code>y = Pet("Duke")</code> creates a second Pet in memory that happens to have the same name, so x and y no longer share one Pet.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Renaming through a second name',
      js: lines('let x = Pet("Lucy");', 'let y = x;', 'y.name = "Lola";'),
      py: lines('x = Pet("Lucy")', 'y = x', 'y.name = "Lola"'),
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Lola') }),
      hint: 'Work out how many Pets this code builds before you think about the new name.',
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'y = x did not build another Pet, so there is only one Pet to rename. x and y both refer to it, and both see its new name.',
        },
      ],
      about:
        'A Pet\'s name can change after it is built. Changing it through one variable changes the Pet itself, so every variable that refers to that Pet sees the new name.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = Pet("Lucy");</code> builds one Pet, and <code>let y = x;</code> points y at that same Pet. <code>y.name = "Lola";</code> follows y\'s arrow and changes the name written on the Pet. No variable is reassigned.</p>',
            py: '<p><code>x = Pet("Lucy")</code> builds one Pet, and <code>y = x</code> points y at that same Pet. <code>y.name = "Lola"</code> follows y\'s arrow and changes the name written on the Pet. No variable is reassigned.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Lola') }),
          caption: 'Correct: one Pet, now named Lola, shared by x and y.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: pet('Lucy'), y: pet('Lola') }),
          caption: 'Not correct: this is what would happen if y = x copied the Pet.',
          verdict: 'incorrect',
        },
        {
          html: '<p>This is the payoff of identity. Because x and y share one Pet, a change made through either name is a change to the one thing they both refer to.</p>',
        },
      ],
      opaquePrelude: true,
      teaches: ['pet.name'],
    }),
    draw({
      title: 'Renaming one of two look-alikes',
      js: lines('let x = Pet("Ginger");', 'let y = Pet("Ginger");', 'y.name = "Honey";'),
      py: lines('x = Pet("Ginger")', 'y = Pet("Ginger")', 'y.name = "Honey"'),
      expected: graph({ x: ref('x'), y: ref('y') }, { x: pet('Ginger'), y: pet('Honey') }),
      hint: 'Count the Pet calls. A new name goes only on the Pet that y refers to.',
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y come from separate Pet calls, so they refer to two separate Pets even though both started as Ginger. Renaming y\'s Pet leaves x\'s Pet alone.',
        },
      ],
      about:
        'Changing one Pet\'s name changes only that Pet. Another Pet that happened to have the same name is separate in memory and keeps its own name.',
      debrief: [
        {
          html: {
            js: '<p>The two <code>Pet("Ginger")</code> calls build two separate Pets. <code>y.name = "Honey";</code> follows y\'s arrow to its own Pet and renames that one. x still refers to a Pet named Ginger.</p>',
            py: '<p>The two <code>Pet("Ginger")</code> calls build two separate Pets. <code>y.name = "Honey"</code> follows y\'s arrow to its own Pet and renames that one. x still refers to a Pet named Ginger.</p>',
          },
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: pet('Ginger'), y: pet('Honey') }),
          caption: 'Correct: only y\'s Pet is renamed.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Honey') }),
          caption: 'Not correct: matching names never made these one Pet.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Compare this with "Renaming through a second name". There, a change through y showed up in x because they shared one Pet. Here they never shared, so nothing y does to its Pet can reach x.</p>',
        },
      ],
      opaquePrelude: true,
      reliesOn: ['pet.name'],
    }),
    write({
      title: 'Rename the shared Pet',
      given: {
        js: lines('let x = Pet("Teddy");', 'let y = x;'),
        ts: lines('let x: Pet = Pet("Teddy");', 'let y: Pet = x;'),
        py: lines('x = Pet("Teddy")', 'y = x'),
      },
      js: 'x.name = "Bear";',
      py: 'x.name = "Bear"',
      expected: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Bear') }),
      process: { runtime: runtime(preserve('x')) },
      hint: 'x and y already share one Pet. Change that Pet\'s name instead of building another.',
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message:
            'x and y should still share one Pet. Rename the Pet they already share instead of calling Pet again.',
        },
      ],
      about:
        'To change something that several variables share, change it in place through any one of them. Building another Pet would leave the old one, and anything else that refers to it, unchanged.',
      debrief: [
        {
          html: {
            js: '<p><code>x.name = "Bear";</code> renames the Pet that x refers to. y refers to the same Pet, so y sees the new name too, and nothing else had to change.</p>',
            py: '<p><code>x.name = "Bear"</code> renames the Pet that x refers to. y refers to the same Pet, so y sees the new name too, and nothing else had to change.</p>',
          },
        },
        {
          diagram: graph({ x: ref('shared'), y: ref('shared') }, { shared: pet('Bear') }),
          caption: 'Correct: the original Pet, renamed Bear, still shared by x and y.',
          verdict: 'correct',
        },
        {
          diagram: graph({ x: ref('x'), y: ref('y') }, { x: pet('Bear'), y: pet('Teddy') }),
          caption: 'Not correct: renaming one Pet never splits it in two.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>y.name = "Bear";</code>. Either name reaches the same Pet.</p>',
            py: '<p><strong>Also correct:</strong> <code>y.name = "Bear"</code>. Either name reaches the same Pet.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>x = Pet("Bear");</code> followed by <code>y = x;</code>. The picture looks the same, but it builds a new Pet and moves both arrows to it. The Pet the starter code built is still named Teddy, so the checker rejects it.</p>',
            py: '<p><strong>Not accepted:</strong> <code>x = Pet("Bear")</code> followed by <code>y = x</code>. The picture looks the same, but it builds a new Pet and moves both arrows to it. The Pet the starter code built is still named Teddy, so the checker rejects it.</p>',
          },
        },
      ],
      opaquePrelude: true,
      reliesOn: ['pet.name'],
    }),
  ],
  [
    draw({
      title: 'Repointing the start of a chain',
      js: lines('let x = Pet("Olive");', 'let y = x;', 'let z = y;', 'x = Pet("Toby");'),
      py: lines('x = Pet("Olive")', 'y = x', 'z = y', 'x = Pet("Toby")'),
      expected: graph(
        { x: ref('toby'), y: ref('olive'), z: ref('olive') },
        { olive: pet('Olive'), toby: pet('Toby') },
      ),
      hint: 'Trace the lines in order, and remember that a variable never refers to another variable.',
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'x and y should refer to separate Pets. y = x gave y the Pet x referred to at that moment, Olive, and reassigning x afterward moves only x\'s arrow.',
        },
        {
          variable: 'z',
          aliasing: 'shared',
          message:
            'x and z should refer to separate Pets. z = y gave z the Pet y referred to, Olive, and reassigning x afterward moves only x\'s arrow.',
        },
        {
          variable: 'z',
          aliasing: 'separate',
          message: 'z was assigned from y (z = y), so it shares Olive with y rather than having an Olive of its own.',
        },
      ],
      about:
        'Each assignment from a variable copies its reference at that moment. Reassigning the first name in a chain moves only its own arrow, and the others keep the Pet they were given.',
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> and <code>let z = y;</code> point y and z at Olive. The last line calls <code>Pet()</code> again, building a new Pet named Toby, and moves only <code>x</code>\'s arrow to it. y and z still share Olive.</p>',
            py: '<p><code>y = x</code> and <code>z = y</code> point y and z at Olive. The last line calls <code>Pet()</code> again, building a new Pet named Toby, and moves only <code>x</code>\'s arrow to it. y and z still share Olive.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('toby'), y: ref('olive'), z: ref('olive') },
            { olive: pet('Olive'), toby: pet('Toby') },
          ),
          caption: 'Correct: x refers to Toby; y and z still share Olive.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('toby'), y: ref('toby'), z: ref('toby') },
            { toby: pet('Toby') },
          ),
          caption: 'Not correct: y and z do not follow x. Variables refer to Pets, never to other variables.',
          verdict: 'incorrect',
        },
        {
          diagram: graph(
            { x: ref('toby'), y: ref('y'), z: ref('z') },
            { toby: pet('Toby'), y: pet('Olive'), z: pet('Olive') },
          ),
          caption: 'Not correct: assigning from a variable never creates a new Pet.',
          verdict: 'incorrect',
        },
        {
          html: '<p>This is the same rule you met with numbers: reassigning one variable never changes any other. With Pets, it also matters which Pet the others share, and here y and z still share the one original Olive.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'Join the right Pet',
      given: {
        js: lines('let x = Pet("Rocky");', 'let y = Pet("Pepper");'),
        ts: lines('let x: Pet = Pet("Rocky");', 'let y: Pet = Pet("Pepper");'),
        py: lines('x = Pet("Rocky")', 'y = Pet("Pepper")'),
      },
      js: lines('let z = y;', 'let d = x;', 'let e = z;'),
      ts: lines('let z: Pet = y;', 'let d: Pet = x;', 'let e: Pet = z;'),
      py: lines('z = y', 'd = x', 'e = z'),
      expected: graph(
        { x: ref('rocky'), y: ref('pepper'), z: ref('pepper'), d: ref('rocky'), e: ref('pepper') },
        { rocky: pet('Rocky'), pepper: pet('Pepper') },
      ),
      process: {
        hidden: [
          {
            given: {
              js: lines('let x = Pet("Max");', 'let y = Pet("Nala");'),
              ts: lines('let x: Pet = Pet("Max");', 'let y: Pet = Pet("Nala");'),
              py: lines('x = Pet("Max")', 'y = Pet("Nala")'),
            },
            expected: graph(
              { x: ref('max'), y: ref('nala'), z: ref('nala'), d: ref('max'), e: ref('nala') },
              { max: pet('Max'), nala: pet('Nala') },
            ),
          },
        ],
      },
      hint: {
        js: 'Declare each new variable from an existing one that already refers to the Pet it should share.',
        py: 'Set each new variable from an existing one that already refers to the Pet it should share.',
      },
      hints: [
        {
          variable: 'z',
          aliasing: 'separate',
          message: 'z must share Pepper with y. Assign z from y instead of calling Pet.',
        },
        {
          variable: 'd',
          aliasing: 'separate',
          message: 'd must share Rocky with x. Assign d from x instead of calling Pet.',
        },
        {
          variable: 'e',
          aliasing: 'separate',
          message: 'e must share Pepper with y and z. Assign e from y or z instead of calling Pet.',
        },
      ],
      about:
        'When multiple objects already exist, assign each new variable from the variable that refers to the object you want it to share.',
      debrief: [
        {
          html: {
            js: '<p><code>let z = y;</code> points z at Pepper, <code>let d = x;</code> points d at Rocky, and <code>let e = z;</code> points e at whatever z refers to, which is Pepper.</p>',
            py: '<p><code>z = y</code> points z at Pepper, <code>d = x</code> points d at Rocky, and <code>e = z</code> points e at whatever z refers to, which is Pepper.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('rocky'), y: ref('pepper'), z: ref('pepper'), d: ref('rocky'), e: ref('pepper') },
            { rocky: pet('Rocky'), pepper: pet('Pepper') },
          ),
          caption: 'x and d share Rocky; y, z, and e share Pepper.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('rocky'), y: ref('pepper'), z: ref('z'), d: ref('rocky'), e: ref('e') },
            { rocky: pet('Rocky'), pepper: pet('Pepper'), z: pet('Pepper'), e: pet('Pepper') },
          ),
          caption: 'Not correct: z and e refer to new Pets instead of sharing Pepper.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let e = y;</code>. Since <code>y</code> and <code>z</code> refer to the same Pet, assigning from either one has the same result.</p>',
            py: '<p><strong>Also correct:</strong> <code>e = y</code>. Since <code>y</code> and <code>z</code> refer to the same Pet, assigning from either one has the same result.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let z = Pet("Pepper");</code>, which builds a look-alike instead of sharing y\'s Pet. Rebuilding x and y with new <code>Pet()</code> calls fails too: the checker also runs your code with other starting Pets.</p>',
            py: '<p><strong>Not accepted:</strong> <code>z = Pet("Pepper")</code>, which builds a look-alike instead of sharing y\'s Pet. Rebuilding x and y with new <code>Pet()</code> calls fails too: the checker also runs your code with other starting Pets.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Two pairs',
      js: lines(
        'let x = Pet("Scout");',
        'let y = x;',
        'let z = Pet("Rosie");',
        'let d = z;',
      ),
      py: lines(
        'x = Pet("Scout")',
        'y = x',
        'z = Pet("Rosie")',
        'd = z',
      ),
      expected: graph(
        { x: ref('first'), y: ref('first'), z: ref('second'), d: ref('second') },
        { first: pet('Scout'), second: pet('Rosie') },
      ),
      hint: 'x and y share Scout; z and d share a different Pet, Rosie.',
      hints: [
        {
          variable: 'y',
          aliasing: 'separate',
          message: 'y was assigned from x (y = x), so it shares Scout with x.',
        },
        {
          variable: 'd',
          aliasing: 'separate',
          message: 'd was assigned from z (d = z), so it shares Rosie with z.',
        },
      ],
      about:
        'Multiple variables can form distinct alias groups. Each call to Pet creates a new object, and assignments share that specific object.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = Pet("Scout");</code> creates Scout, and <code>let y = x;</code> makes <code>y</code> an alias for Scout. Then <code>let z = Pet("Rosie");</code> creates Rosie, and <code>let d = z;</code> makes <code>d</code> an alias for Rosie.</p>',
            py: '<p><code>x = Pet("Scout")</code> creates Scout, and <code>y = x</code> makes <code>y</code> an alias for Scout. Then <code>z = Pet("Rosie")</code> creates Rosie, and <code>d = z</code> makes <code>d</code> an alias for Rosie.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('first'), y: ref('first'), z: ref('second'), d: ref('second') },
            { first: pet('Scout'), second: pet('Rosie') },
          ),
          caption: 'Two separate pairs of references.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('first'), y: ref('y'), z: ref('second'), d: ref('second') },
            { first: pet('Scout'), y: pet('Scout'), second: pet('Rosie') },
          ),
          caption: 'Not correct: y was assigned from x, so it must share Scout.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Memory holds exactly two Pets, each with two names pointing to it.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Which names share?',
      js: lines('let x = Pet("Charlie");', 'let y = Pet("Charlie");', 'let z = x;'),
      py: lines('x = Pet("Charlie")', 'y = Pet("Charlie")', 'z = x'),
      expected: graph(
        { x: ref('shared'), y: ref('alone'), z: ref('shared') },
        { shared: pet('Charlie'), alone: pet('Charlie') },
      ),
      hint: "z = x joins z with x's Pet; y keeps its own Pet, also named Charlie.",
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'y was created by its own Pet("Charlie") call. It is a separate Pet from x and z, even though they share the same label.',
        },
        {
          variable: 'z',
          aliasing: 'separate',
          message:
            'z was assigned from x (z = x), so z must share the very same Pet as x.',
        },
      ],
      about:
        'Sharing is created by assignment, not matching labels. Two variables share an object when one is assigned from the other, even if another object happens to have the same label.',
      debrief: [
        {
          html: {
            js: '<p><code>let x = Pet("Charlie");</code> and <code>let y = Pet("Charlie");</code> each call <code>Pet()</code>, creating two separate Pets in memory that happen to have the same name. Then <code>let z = x;</code> points <code>z</code> at <code>x</code>\'s Pet.</p>',
            py: '<p><code>x = Pet("Charlie")</code> and <code>y = Pet("Charlie")</code> each call <code>Pet()</code>, creating two separate Pets in memory that happen to have the same name. Then <code>z = x</code> points <code>z</code> at <code>x</code>\'s Pet.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('alone'), z: ref('shared') },
            { shared: pet('Charlie'), alone: pet('Charlie') },
          ),
          caption: 'Correct: x and z share one Charlie; y has a separate Charlie.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('shared'), y: ref('shared'), z: ref('shared') },
            { shared: pet('Charlie') },
          ),
          caption: 'Not correct: having the same label does not make y the same Pet as x.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Two Pets never merge just because their labels match. Only assigning one variable from another creates sharing.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Renaming after a repoint',
      js: lines('let x = Pet("Oscar");', 'let y = x;', 'let z = Pet("Penny");', 'x = z;', 'y.name = "Jack";'),
      py: lines('x = Pet("Oscar")', 'y = x', 'z = Pet("Penny")', 'x = z', 'y.name = "Jack"'),
      expected: graph(
        { x: ref('penny'), y: ref('oscar'), z: ref('penny') },
        { oscar: pet('Jack'), penny: pet('Penny') },
      ),
      hint: 'Trace the lines in order. Before the last line, find which Pet y refers to.',
      hints: [
        {
          variable: 'y',
          aliasing: 'shared',
          message:
            'y should not share its Pet with x. y = x gave y the first Pet, and x = z moved only x\'s arrow, so y still refers to that first Pet.',
        },
        {
          variable: 'x',
          aliasing: 'separate',
          message: 'x = z points x at the Pet z refers to, so x and z share one Pet.',
        },
      ],
      about:
        'A change made through one variable reaches whichever Pet that variable refers to at that moment. Earlier repointing decides which Pet that is.',
      debrief: [
        {
          html: {
            js: '<p><code>let y = x;</code> points y at the first Pet, Oscar. <code>x = z;</code> moves only x\'s arrow, to Penny. So when <code>y.name = "Jack";</code> runs, y still refers to the first Pet, and that Pet becomes Jack. Penny is untouched.</p>',
            py: '<p><code>y = x</code> points y at the first Pet, Oscar. <code>x = z</code> moves only x\'s arrow, to Penny. So when <code>y.name = "Jack"</code> runs, y still refers to the first Pet, and that Pet becomes Jack. Penny is untouched.</p>',
          },
        },
        {
          diagram: graph(
            { x: ref('penny'), y: ref('oscar'), z: ref('penny') },
            { oscar: pet('Jack'), penny: pet('Penny') },
          ),
          caption: 'Correct: y\'s Pet is renamed Jack; x and z share Penny.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { x: ref('penny'), y: ref('penny'), z: ref('penny') },
            { penny: pet('Jack') },
          ),
          caption: 'Not correct: y never followed x to Penny. Variables refer to Pets, never to other variables.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Renaming and repointing are different. Repointing moves one variable\'s arrow; renaming changes a Pet, and everyone pointing at that Pet sees it.</p>',
        },
      ],
      opaquePrelude: true,
      reliesOn: ['pet.name'],
    }),
  ],
)
