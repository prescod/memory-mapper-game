import { graph, pet, ref, scalar, withGarbage } from '../builders'
import type { Level } from '../types'
import { draw, L, level, lines, write } from './common'

export const identityLevel: Level = level(
  'identity',
  L(
    'Objects with Identity and Multiple References',
    'Objects with Identity and Multiple References',
  ),
  L(
    'Unlike numbers and strings, a Pet has an identity: it is a separate thing in memory, and a variable refers to it with an arrow. Two variables can share one Pet, while two Pet("Milo") calls always build two separate Pets, even with the same name. Pet is built in for this level: call Pet("name") with no new. On the canvas, Add Pet draws one Pet: name it and connect variables to it.',
    'Unlike numbers and strings, a Pet has an identity: it is a separate thing in memory, and a variable refers to it with an arrow. Two variables can share one Pet, while two Pet("Milo") calls always build two separate Pets, even with the same name. Pet is built in for this level: call Pet("name"). On the canvas, Add Pet draws one Pet: name it and connect variables to it.',
  ),
  [
    draw({
      title: 'One Pet',
      js: 'let a = Pet("Buddy");',
      py: 'a = Pet("Buddy")',
      expected: graph({ a: ref('o') }, { o: pet('Buddy') }),
      hint: 'Add a variable named a and a Pet named "Buddy", then connect a to the Pet.',
      about:
        'A Pet is a separate thing in memory from the variable that refers to it. Calling Pet creates the Pet, and assigning points the variable\'s arrow at it.',
      debrief: [
        {
          html: {
            js: '<p><code>let a = Pet("Buddy");</code> creates two things: a variable named <code>a</code> and a Pet named "Buddy". The arrow means "a currently refers to that Pet."</p>',
            py: '<p><code>a = Pet("Buddy")</code> creates two things: a variable named <code>a</code> and a Pet named "Buddy". The arrow means "a currently refers to that Pet."</p>',
          },
        },
        {
          html: '<p>"Buddy" is only the label on the Pet. The Pet itself is a separate thing in memory with an identity of its own, and variables connect to it with arrows.</p>',
        },
        {
          diagram: graph({ a: ref('o') }, { o: pet('Buddy') }),
          caption: 'One variable pointing to one Pet.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: 'Buddy' }),
          caption: 'Not correct: a refers to a Pet, not to the string "Buddy".',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Not accepted:</strong> pointing a at a string "Buddy". The name is written on the Pet, but the Pet is more than its name.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Assigning from a Pet',
      js: lines('let a = Pet("Max");', 'let b = a;'),
      py: lines('a = Pet("Max")', 'b = a'),
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Max') }),
      hint: 'Assigning b = a makes both names refer to the same Pet, not a second copy.',
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'b = a copies the reference, not the Pet. Both variables refer to the same Pet in memory.',
        },
      ],
      about:
        'Assigning one variable to another copies the reference, not the object. Both variables point to the same Pet in memory.',
      debrief: [
        {
          html: {
            js: '<p><code>let a = Pet("Max");</code> creates one Pet. Then <code>let b = a;</code> copies the reference from <code>a</code> to <code>b</code>. It does not call <code>Pet()</code> again, so no second Pet is created.</p>',
            py: '<p><code>a = Pet("Max")</code> creates one Pet. Then <code>b = a</code> copies the reference from <code>a</code> to <code>b</code>. It does not call <code>Pet()</code> again, so no second Pet is created.</p>',
          },
        },
        {
          html: '<p>Both <code>a</code> and <code>b</code> now refer to the very same Pet in memory. Having multiple names for one object is called <strong>aliasing</strong>.</p>',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Max') }),
          caption: 'Correct: a and b refer to the same Pet.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: pet('Max'), b: pet('Max') }),
          caption: 'Not correct: b = a copies the reference, not the Pet.',
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
      js: lines('let a = Pet("Rex");', 'let b = a;', 'let c = a;'),
      py: lines('a = Pet("Rex")', 'b = a', 'c = a'),
      expected: graph(
        { a: ref('shared'), b: ref('shared'), c: ref('shared') },
        { shared: pet('Rex') },
      ),
      hint: 'Each assignment from a adds another name for the same Pet.',
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'All three variables should share one Pet. Assign b from an existing variable instead of calling Pet again.',
        },
        {
          variable: 'c',
          aliasing: 'separate',
          message:
            'All three variables should share one Pet. Assign c from an existing variable instead of calling Pet again.',
        },
      ],
      about:
        'Multiple variables can refer to a single Pet. Call Pet once to create it, then assign from an existing variable to create additional references.',
      debrief: [
        {
          html: {
            js: '<p><code>let a = Pet("Rex");</code> creates the Pet. Each later assignment, <code>let b = a;</code> and <code>let c = a;</code>, points another variable at that same Pet.</p>',
            py: '<p><code>a = Pet("Rex")</code> creates the Pet. Each later assignment, <code>b = a</code> and <code>c = a</code>, points another variable at that same Pet.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('shared'), b: ref('shared'), c: ref('shared') },
            { shared: pet('Rex') },
          ),
          caption: 'Three names pointing to one shared Pet.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b'), c: ref('c') },
            { a: pet('Rex'), b: pet('Rex'), c: pet('Rex') },
          ),
          caption: 'Not correct: three separate Pets that happen to share a name.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> writing <code>let c = b;</code> instead of <code>let c = a;</code>. Because <code>b</code> already refers to Rex, assigning <code>c</code> from <code>b</code> points <code>c</code> at the exact same Pet.</p>',
            py: '<p><strong>Also correct:</strong> writing <code>c = b</code> instead of <code>c = a</code>. Because <code>b</code> already refers to Rex, assigning <code>c</code> from <code>b</code> points <code>c</code> at the exact same Pet.</p>',
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
    draw({
      title: 'Assigning from a string',
      js: lines('let s = "hi";', 'let t = s;'),
      py: lines('s = "hi"', 't = s'),
      expected: graph({ s: 'hi', t: 'hi' }),
      hint:
        'Assigning t from s gives t the value "hi". Strings cannot change in place, so one shared string scalar node or two separate nodes are both correct.',
      hints: [
        {
          variable: 't',
          value: 's',
          message:
            'The value "s" is not correct. Assigning from s looks up the value s refers to, "hi", rather than using its name as text.',
        },
      ],
      about:
        'Assigning a string from another variable works just as it does for a number. A string cannot be changed in place, so drawing one shared string or two equal strings is equally correct.',
      debrief: [
        {
          html: {
            js: '<p><code>let t = s;</code> looks up the value <code>s</code> refers to, <code>"hi"</code>, and points <code>t</code> at that value.</p>',
            py: '<p><code>t = s</code> looks up the value <code>s</code> refers to, <code>"hi"</code>, and points <code>t</code> at that value.</p>',
          },
        },
        {
          html: '<p>There are two equally correct ways to draw this:</p>',
        },
        {
          diagram: graph({ s: 'hi', t: 'hi' }),
          caption: 'Two separate "hi" strings.',
          verdict: 'correct',
        },
        {
          diagram: graph({ s: ref('shared'), t: ref('shared') }, { shared: scalar('hi') }),
          caption: 'One "hi" string shared by both.',
          verdict: 'correct',
        },
        {
          diagram: graph({ s: 'hi', t: 's' }),
          caption: 'Not correct: t gets the value s refers to, "hi", not the text "s".',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>JavaScript describes <code>let t = s;</code> as copying the string into t, which matches the first picture.</p>',
            py: '<p>In Python, t now refers to the very same string object as s, which matches the second picture.</p>',
          },
        },
        {
          html: '<p>Either way, a string can never be changed in place, so no program can tell the two pictures apart, and the checker accepts both.</p>',
        },
        {
          html: '<p>A Pet is different. Each <code>Pet()</code> call builds a Pet with its own identity, so the checker always cares which Pet a variable refers to.</p>',
        },
      ],
    }),
    write({
      title: "Two share, one doesn't",
      js: lines('let a = Pet("Bella");', 'let b = a;', 'let c = Pet("Daisy");'),
      py: lines('a = Pet("Bella")', 'b = a', 'c = Pet("Daisy")'),
      expected: graph(
        { a: ref('shared'), b: ref('shared'), c: ref('alone') },
        { shared: pet('Bella'), alone: pet('Daisy') },
      ),
      hint: 'b = a shares one Pet; c = Pet("Daisy") creates a second, separate Pet.',
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'b should share one Pet with a. Assign b from a instead of calling Pet again.',
        },
        {
          variable: 'c',
          aliasing: 'shared',
          message:
            'c must refer to its own separate Pet. Call Pet("Daisy") instead of assigning from a or b.',
        },
      ],
      about:
        'A program can have some variables that share an object and others that refer to separate objects. Use assignment to share an existing Pet, and Pet() to create a new one.',
      debrief: [
        {
          html: {
            js: '<p><code>let a = Pet("Bella");</code> creates Bella. <code>let b = a;</code> makes <code>b</code> an alias for that same Pet. Then <code>let c = Pet("Daisy");</code> calls <code>Pet()</code> again, creating a separate Pet named Daisy.</p>',
            py: '<p><code>a = Pet("Bella")</code> creates Bella. <code>b = a</code> makes <code>b</code> an alias for that same Pet. Then <code>c = Pet("Daisy")</code> calls <code>Pet()</code> again, creating a separate Pet named Daisy.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('shared'), b: ref('shared'), c: ref('alone') },
            { shared: pet('Bella'), alone: pet('Daisy') },
          ),
          caption: 'a and b share Bella; c refers to Daisy.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('a'), b: ref('b'), c: ref('c') },
            { a: pet('Bella'), b: pet('Bella'), c: pet('Daisy') },
          ),
          caption: 'Not correct: a and b point to two separate Bellas instead of sharing one.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let b = Pet("Bella");</code> would give <code>b</code> a Pet with the same label, but it would be a separate object in memory rather than sharing with <code>a</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b = Pet("Bella")</code> would give <code>b</code> a Pet with the same label, but it would be a separate object in memory rather than sharing with <code>a</code>.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'A full name',
      given: {
        js: lines('let first = "Ada";', 'let last = "Lovelace";'),
        py: lines('first = "Ada"', 'last = "Lovelace"'),
      },
      js: 'let full = first + " " + last;',
      py: 'full = first + " " + last',
      expected: graph({ first: 'Ada', last: 'Lovelace', full: 'Ada Lovelace' }),
      hint: {
        js: 'Declare full by joining first, a space " ", and last.',
        py: 'Assign full by joining first, a space " ", and last.',
      },
      hints: [
        {
          variable: 'full',
          value: 'AdaLovelace',
          message: 'Remember to include a space " " between first and last.',
        },
      ],
      process: {
        hidden: [
          {
            given: {
              js: lines('let first = "Grace";', 'let last = "Hopper";'),
              py: lines('first = "Grace"', 'last = "Hopper"'),
            },
            expected: graph({ first: 'Grace', last: 'Hopper', full: 'Grace Hopper' }),
          },
        ],
      },
      about:
        'Combining strings with + builds a new string value. It reads the values of existing variables without changing them.',
      debrief: [
        {
          html: {
            js: '<p><code>let full = first + " " + last;</code> joins the three strings and points <code>full</code> at the new string <code>"Ada Lovelace"</code>. Neither <code>first</code> nor <code>last</code> is changed.</p>',
            py: '<p><code>full = first + " " + last</code> joins the three strings and points <code>full</code> at the new string <code>"Ada Lovelace"</code>. Neither <code>first</code> nor <code>last</code> is changed.</p>',
          },
        },
        {
          diagram: graph({ first: 'Ada', last: 'Lovelace', full: 'Ada Lovelace' }),
          caption: 'first and last unchanged, full refers to the joined string.',
          verdict: 'correct',
        },
        {
          diagram: graph({ first: 'Ada', last: 'Lovelace', full: 'AdaLovelace' }),
          caption: 'Not correct: missing the space between first and last.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> a template literal, <code>let full = `${first} ${last}`;</code>, builds the same new string from the same parts.</p>',
            py: '<p><strong>Also correct:</strong> an f-string, <code>full = f"{first} {last}"</code>, builds the same new string from the same parts.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let full = "Ada Lovelace";</code> produces the right picture for these names, but retypes the result. The checker also runs your code with other starting names, and a retyped result is wrong for them.</p>',
            py: '<p><strong>Not accepted:</strong> <code>full = "Ada Lovelace"</code> produces the right picture for these names, but retypes the result. The checker also runs your code with other starting names, and a retyped result is wrong for them.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Building a new string',
      js: lines('let s = "hi";', 'let t = s;', 's = s + "!";'),
      py: lines('s = "hi"', 't = s', 's = s + "!"'),
      expected: graph({ s: 'hi!', t: 'hi' }),
      hint: 'Adding "!" builds a new string. Trace which variable is reassigned to it.',
      hints: [
        {
          variable: 't',
          value: 'hi!',
          message:
            'The value "hi!" for t is not correct. s = s + "!" builds a new string and moves only s\'s arrow. The string "hi" that t refers to cannot change.',
        },
        {
          variable: 's',
          value: 'hi',
          message:
            'The value "hi" for s is not correct. s = s + "!" builds "hi!" and moves s\'s arrow to that new string.',
        },
        {
          variable: 's',
          value: '!',
          message:
            'The value "!" for s is not correct. s = s + "!" joins the old value of s, "hi", with "!", producing "hi!".',
        },
      ],
      about:
        'A string cannot be changed in place. Adding to a string builds a new string, and reassigning moves only that one variable\'s arrow to it.',
      debrief: [
        {
          html: {
            js: '<p>After <code>let t = s;</code> both variables refer to <code>"hi"</code>. Then <code>s = s + "!";</code> does not change that string. It builds a brand new string, <code>"hi!"</code>, and moves only <code>s</code>\'s arrow to it, so <code>t</code> still refers to <code>"hi"</code>.</p>',
            py: '<p>After <code>t = s</code> both variables refer to <code>"hi"</code>. Then <code>s = s + "!"</code> does not change that string. It builds a brand new string, <code>"hi!"</code>, and moves only <code>s</code>\'s arrow to it, so <code>t</code> still refers to <code>"hi"</code>.</p>',
          },
        },
        {
          diagram: graph({ s: 'hi!', t: 'hi' }),
          caption: 'Correct: s refers to the new "hi!", and t still refers to "hi".',
          verdict: 'correct',
        },
        {
          diagram: graph({ s: 'hi!', t: 'hi!' }),
          caption: 'Not correct: this is what would happen if strings changed in place.',
          verdict: 'incorrect',
        },
        {
          html: '<p><strong>Also correct:</strong> leaving a second "hi" on the canvas with nothing referring to it, if you first drew s and t with separate strings. As with numbers, unreferenced values are garbage-collected.</p>',
        },
        {
          diagram: withGarbage(graph({ s: 'hi!', t: 'hi' }), 'hi'),
          caption: 'Also correct: an old "hi" left behind with nothing pointing to it.',
          verdict: 'correct',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>s += "!";</code> is a shorter way to write the last line. It also builds a new string and moves only s\'s arrow.</p>',
            py: '<p><strong>Also correct:</strong> <code>s += "!"</code> is a shorter way to write the last line. It also builds a new string and moves only s\'s arrow.</p>',
          },
        },
        {
          html: {
            js: '<p>Later levels introduce arrays and objects, which can be changed in place. A change made through one name is then seen through every name that shares the array or object. Strings never work that way.</p>',
            py: '<p>Later levels introduce lists and dictionaries, which can be changed in place. A change made through one name is then seen through every name that shares the list or dictionary. Strings never work that way.</p>',
          },
        },
      ],
    }),
    draw({
      title: 'Same label, separate objects',
      js: lines('let a = Pet("Milo");', 'let b = Pet("Milo");'),
      py: lines('a = Pet("Milo")', 'b = Pet("Milo")'),
      expected: graph({ a: ref('a'), b: ref('b') }, { a: pet('Milo'), b: pet('Milo') }),
      hint: 'Two Pet calls with the same name still build two separate Pets in memory.',
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b are built from separate Pet calls, so they refer to two separate Pets even though both are named Milo.',
        },
      ],
      about:
        'Calling Pet creates a brand new object every time. Two Pets can share the same name label while being separate objects in memory.',
      debrief: [
        {
          html: {
            js: '<p>Each call to <code>Pet()</code> constructs a separate object in memory. <code>let a = Pet("Milo");</code> and <code>let b = Pet("Milo");</code> create two different Pets, even though both have the label "Milo".</p>',
            py: '<p>Each call to <code>Pet()</code> constructs a separate object in memory. <code>a = Pet("Milo")</code> and <code>b = Pet("Milo")</code> create two different Pets, even though both have the label "Milo".</p>',
          },
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: pet('Milo'), b: pet('Milo') }),
          caption: 'Correct: two separate Pets, each named Milo.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Milo') }),
          caption: 'Not correct: two Pet calls build two separate Pets, not one shared Pet.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Identity is not determined by the text on the label. Think of two dogs who both answer to "Milo": they are still two independent dogs.</p>',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> one Milo shared by a and b. Sharing comes only from assigning one variable from another, as <code>let b = a;</code> would.</p>',
            py: '<p><strong>Not accepted:</strong> one Milo shared by a and b. Sharing comes only from assigning one variable from another, as <code>b = a</code> would.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'Same Pet as a',
      given: { js: 'let a = Pet("Duke");', py: 'a = Pet("Duke")' },
      js: 'let b = a;',
      py: 'b = a',
      expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Duke') }),
      process: {
        hidden: [
          {
            given: { js: 'let a = Pet("Rex");', py: 'a = Pet("Rex")' },
            expected: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Rex') }),
          },
        ],
      },
      hint: {
        js: 'Declare b and assign it from a instead of calling Pet again.',
        py: 'Set b from a instead of calling Pet again.',
      },
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message:
            'These references should share one Pet, but they point to different ones. Assign b from a instead of calling Pet again.',
        },
      ],
      about:
        'To make b refer to the same Pet as a, assign it directly from a. Calling Pet again would construct a second, separate Pet.',
      debrief: [
        {
          html: {
            js: '<p><code>let b = a;</code> copies the reference from <code>a</code> to <code>b</code>, making both variables refer to Duke.</p>',
            py: '<p><code>b = a</code> copies the reference from <code>a</code> to <code>b</code>, making both variables refer to Duke.</p>',
          },
        },
        {
          diagram: graph({ a: ref('shared'), b: ref('shared') }, { shared: pet('Duke') }),
          caption: 'a and b sharing Duke.',
          verdict: 'correct',
        },
        {
          diagram: graph({ a: ref('a'), b: ref('b') }, { a: pet('Duke'), b: pet('Duke') }),
          caption: 'Not correct: calling Pet again creates a separate Pet.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let b = Pet("Duke");</code> creates a second Pet in memory that happens to have the same name, so a and b no longer share one Pet.</p>',
            py: '<p><strong>Not accepted:</strong> <code>b = Pet("Duke")</code> creates a second Pet in memory that happens to have the same name, so a and b no longer share one Pet.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
  ],
  [
    draw({
      title: 'Repointing the start of a chain',
      js: lines('let a = Pet("Olive");', 'let b = a;', 'let c = b;', 'a = Pet("Toby");'),
      py: lines('a = Pet("Olive")', 'b = a', 'c = b', 'a = Pet("Toby")'),
      expected: graph(
        { a: ref('toby'), b: ref('olive'), c: ref('olive') },
        { olive: pet('Olive'), toby: pet('Toby') },
      ),
      hint: 'Trace the lines in order, and remember that a variable never refers to another variable.',
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'a and b should refer to separate Pets. b = a gave b the Pet a referred to at that moment, Olive, and reassigning a afterward moves only a\'s arrow.',
        },
        {
          variable: 'c',
          aliasing: 'shared',
          message:
            'a and c should refer to separate Pets. c = b gave c the Pet b referred to, Olive, and reassigning a afterward moves only a\'s arrow.',
        },
        {
          variable: 'c',
          aliasing: 'separate',
          message: 'c was assigned from b (c = b), so it shares Olive with b rather than having an Olive of its own.',
        },
      ],
      about:
        'Each assignment from a variable copies its reference at that moment. Reassigning the first name in a chain moves only its own arrow, and the others keep the Pet they were given.',
      debrief: [
        {
          html: {
            js: '<p><code>let b = a;</code> and <code>let c = b;</code> point b and c at Olive. The last line calls <code>Pet()</code> again, building a new Pet named Toby, and moves only <code>a</code>\'s arrow to it. b and c still share Olive.</p>',
            py: '<p><code>b = a</code> and <code>c = b</code> point b and c at Olive. The last line calls <code>Pet()</code> again, building a new Pet named Toby, and moves only <code>a</code>\'s arrow to it. b and c still share Olive.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('toby'), b: ref('olive'), c: ref('olive') },
            { olive: pet('Olive'), toby: pet('Toby') },
          ),
          caption: 'Correct: a refers to Toby; b and c still share Olive.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('toby'), b: ref('toby'), c: ref('toby') },
            { toby: pet('Toby') },
          ),
          caption: 'Not correct: b and c do not follow a. Variables refer to Pets, never to other variables.',
          verdict: 'incorrect',
        },
        {
          diagram: graph(
            { a: ref('toby'), b: ref('b'), c: ref('c') },
            { toby: pet('Toby'), b: pet('Olive'), c: pet('Olive') },
          ),
          caption: 'Not correct: assigning from a variable never creates a new Pet.',
          verdict: 'incorrect',
        },
        {
          html: '<p>This is the same rule you met with numbers: reassigning one variable never changes any other. With Pets, it also matters which Pet the others share, and here b and c still share the one original Olive.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'Join the right Pet',
      given: {
        js: lines('let a = Pet("Rocky");', 'let b = Pet("Pepper");'),
        py: lines('a = Pet("Rocky")', 'b = Pet("Pepper")'),
      },
      js: lines('let c = b;', 'let d = a;', 'let e = c;'),
      py: lines('c = b', 'd = a', 'e = c'),
      expected: graph(
        { a: ref('rocky'), b: ref('pepper'), c: ref('pepper'), d: ref('rocky'), e: ref('pepper') },
        { rocky: pet('Rocky'), pepper: pet('Pepper') },
      ),
      process: {
        hidden: [
          {
            given: {
              js: lines('let a = Pet("Max");', 'let b = Pet("Nala");'),
              py: lines('a = Pet("Max")', 'b = Pet("Nala")'),
            },
            expected: graph(
              { a: ref('max'), b: ref('nala'), c: ref('nala'), d: ref('max'), e: ref('nala') },
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
          variable: 'c',
          aliasing: 'separate',
          message: 'c must share Pepper with b. Assign c from b instead of calling Pet.',
        },
        {
          variable: 'd',
          aliasing: 'separate',
          message: 'd must share Rocky with a. Assign d from a instead of calling Pet.',
        },
        {
          variable: 'e',
          aliasing: 'separate',
          message: 'e must share Pepper with b and c. Assign e from b or c instead of calling Pet.',
        },
      ],
      about:
        'When multiple objects already exist, assign each new variable from the variable that refers to the object you want it to share.',
      debrief: [
        {
          html: {
            js: '<p><code>let c = b;</code> points c at Pepper, <code>let d = a;</code> points d at Rocky, and <code>let e = c;</code> points e at whatever c refers to, which is Pepper.</p>',
            py: '<p><code>c = b</code> points c at Pepper, <code>d = a</code> points d at Rocky, and <code>e = c</code> points e at whatever c refers to, which is Pepper.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('rocky'), b: ref('pepper'), c: ref('pepper'), d: ref('rocky'), e: ref('pepper') },
            { rocky: pet('Rocky'), pepper: pet('Pepper') },
          ),
          caption: 'a and d share Rocky; b, c, and e share Pepper.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('rocky'), b: ref('pepper'), c: ref('c'), d: ref('rocky'), e: ref('e') },
            { rocky: pet('Rocky'), pepper: pet('Pepper'), c: pet('Pepper'), e: pet('Pepper') },
          ),
          caption: 'Not correct: c and e refer to new Pets instead of sharing Pepper.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p><strong>Also correct:</strong> <code>let e = b;</code>. Since <code>b</code> and <code>c</code> refer to the same Pet, assigning from either one has the same result.</p>',
            py: '<p><strong>Also correct:</strong> <code>e = b</code>. Since <code>b</code> and <code>c</code> refer to the same Pet, assigning from either one has the same result.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>let c = Pet("Pepper");</code>, which builds a look-alike instead of sharing b\'s Pet. Rebuilding a and b with new <code>Pet()</code> calls fails too: the checker also runs your code with other starting Pets.</p>',
            py: '<p><strong>Not accepted:</strong> <code>c = Pet("Pepper")</code>, which builds a look-alike instead of sharing b\'s Pet. Rebuilding a and b with new <code>Pet()</code> calls fails too: the checker also runs your code with other starting Pets.</p>',
          },
        },
      ],
      opaquePrelude: true,
    }),
    draw({
      title: 'Two pairs',
      js: lines(
        'let a = Pet("Scout");',
        'let b = a;',
        'let c = Pet("Rosie");',
        'let d = c;',
      ),
      py: lines(
        'a = Pet("Scout")',
        'b = a',
        'c = Pet("Rosie")',
        'd = c',
      ),
      expected: graph(
        { a: ref('first'), b: ref('first'), c: ref('second'), d: ref('second') },
        { first: pet('Scout'), second: pet('Rosie') },
      ),
      hint: 'a and b share Scout; c and d share a different Pet, Rosie.',
      hints: [
        {
          variable: 'b',
          aliasing: 'separate',
          message: 'b was assigned from a (b = a), so it shares Scout with a.',
        },
        {
          variable: 'd',
          aliasing: 'separate',
          message: 'd was assigned from c (d = c), so it shares Rosie with c.',
        },
      ],
      about:
        'Multiple variables can form distinct alias groups. Each call to Pet creates a new object, and assignments share that specific object.',
      debrief: [
        {
          html: {
            js: '<p><code>let a = Pet("Scout");</code> creates Scout, and <code>let b = a;</code> makes <code>b</code> an alias for Scout. Then <code>let c = Pet("Rosie");</code> creates Rosie, and <code>let d = c;</code> makes <code>d</code> an alias for Rosie.</p>',
            py: '<p><code>a = Pet("Scout")</code> creates Scout, and <code>b = a</code> makes <code>b</code> an alias for Scout. Then <code>c = Pet("Rosie")</code> creates Rosie, and <code>d = c</code> makes <code>d</code> an alias for Rosie.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('first'), b: ref('first'), c: ref('second'), d: ref('second') },
            { first: pet('Scout'), second: pet('Rosie') },
          ),
          caption: 'Two separate pairs of references.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('first'), b: ref('b'), c: ref('second'), d: ref('second') },
            { first: pet('Scout'), b: pet('Scout'), second: pet('Rosie') },
          ),
          caption: 'Not correct: b was assigned from a, so it must share Scout.',
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
      js: lines('let a = Pet("Charlie");', 'let b = Pet("Charlie");', 'let c = a;'),
      py: lines('a = Pet("Charlie")', 'b = Pet("Charlie")', 'c = a'),
      expected: graph(
        { a: ref('shared'), b: ref('alone'), c: ref('shared') },
        { shared: pet('Charlie'), alone: pet('Charlie') },
      ),
      hint: "c = a joins c with a's Pet; b keeps its own Pet, also named Charlie.",
      hints: [
        {
          variable: 'b',
          aliasing: 'shared',
          message:
            'b was created by its own Pet("Charlie") call. It is a separate Pet from a and c, even though they share the same label.',
        },
        {
          variable: 'c',
          aliasing: 'separate',
          message:
            'c was assigned from a (c = a), so c must share the very same Pet as a.',
        },
      ],
      about:
        'Sharing is created by assignment, not matching labels. Two variables share an object when one is assigned from the other, even if another object happens to have the same label.',
      debrief: [
        {
          html: {
            js: '<p><code>let a = Pet("Charlie");</code> and <code>let b = Pet("Charlie");</code> each call <code>Pet()</code>, creating two separate Pets in memory that happen to have the same name. Then <code>let c = a;</code> points <code>c</code> at <code>a</code>\'s Pet.</p>',
            py: '<p><code>a = Pet("Charlie")</code> and <code>b = Pet("Charlie")</code> each call <code>Pet()</code>, creating two separate Pets in memory that happen to have the same name. Then <code>c = a</code> points <code>c</code> at <code>a</code>\'s Pet.</p>',
          },
        },
        {
          diagram: graph(
            { a: ref('shared'), b: ref('alone'), c: ref('shared') },
            { shared: pet('Charlie'), alone: pet('Charlie') },
          ),
          caption: 'Correct: a and c share one Charlie; b has a separate Charlie.',
          verdict: 'correct',
        },
        {
          diagram: graph(
            { a: ref('shared'), b: ref('shared'), c: ref('shared') },
            { shared: pet('Charlie') },
          ),
          caption: 'Not correct: having the same label does not make b the same Pet as a.',
          verdict: 'incorrect',
        },
        {
          html: '<p>Two Pets never merge just because their labels match. Only assigning one variable from another creates sharing.</p>',
        },
      ],
      opaquePrelude: true,
    }),
    write({
      title: 'Clear one, keep the backup',
      given: {
        js: lines('let name = "Ada";', 'let backup = name;'),
        py: lines('name = "Ada"', 'backup = name'),
      },
      js: 'name = null;',
      py: 'name = None',
      expected: graph({ name: null, backup: 'Ada' }),
      hint: {
        js: 'Reassign name to null. The backup variable will keep its value.',
        py: 'Reassign name to None. The backup variable will keep its value.',
      },
      hints: [
        {
          variable: 'backup',
          value: null,
          message:
            'Reassigning name does not affect backup. backup still refers to "Ada".',
        },
      ],
      about: {
        js: 'Reassigning a variable moves only its own arrow. Reassigning name to null leaves backup pointing to the original value.',
        py: 'Reassigning a variable moves only its own arrow. Reassigning name to None leaves backup pointing to the original value.',
      },
      debrief: [
        {
          html: {
            js: '<p><code>name = null;</code> moves only <code>name</code>\'s arrow to <code>null</code>. <code>backup</code> continues to refer to <code>"Ada"</code>.</p>',
            py: '<p><code>name = None</code> moves only <code>name</code>\'s arrow to <code>None</code>. <code>backup</code> continues to refer to <code>"Ada"</code>.</p>',
          },
        },
        {
          diagram: graph({ name: null, backup: 'Ada' }),
          caption: {
            js: 'name refers to null; backup keeps "Ada".',
            py: 'name refers to None; backup keeps "Ada".',
          },
          verdict: 'correct',
        },
        {
          diagram: graph({ name: null, backup: null }),
          caption: 'Not correct: reassigning name does not change backup.',
          verdict: 'incorrect',
        },
        {
          html: {
            js: '<p>Variables never point to other variables. When <code>let backup = name;</code> ran, it gave backup the value name referred to, <code>"Ada"</code>. Reassigning <code>name</code> later leaves <code>backup</code> untouched.</p>',
            py: '<p>Variables never point to other variables. When <code>backup = name</code> ran, it gave backup the value name referred to, <code>"Ada"</code>. Reassigning <code>name</code> later leaves <code>backup</code> untouched.</p>',
          },
        },
        {
          html: {
            js: '<p><strong>Not accepted:</strong> <code>name = "";</code>. An empty string is still a string, not <code>null</code>.</p>',
            py: '<p><strong>Not accepted:</strong> <code>name = ""</code>. An empty string is still a string, not <code>None</code>.</p>',
          },
        },
      ],
    }),
  ],
)
