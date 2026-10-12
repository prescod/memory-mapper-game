# Style Guide: Levels and Puzzles

This guide is for anyone adding or revising content in `src/model/levels.ts`. It covers what makes a level hang together, what makes a single puzzle teach something, and how to write the text around it. Level 1 (`scalars`) is the reference: it is the only level so far with an `about` and a `debrief` on every puzzle, and new work should match it. What each level is for is described in [the curriculum goals](curriculum.md).

## What the game teaches

The game teaches the **data model**: names, values, references, identity, and change. Every puzzle should make the learner predict or build a picture of memory, and the picture should be what tells them whether their mental model is right.

It does not teach data types, syntax trivia, or algorithms. Negative numbers, decimals, string escapes, and operator precedence are distractions. Use small whole numbers, short strings, and the simplest operations that expose the idea.

The misconceptions worth targeting are the ones that cause real bugs:

- **A variable is not a spreadsheet cell.** `area = width * height` computes once. Changing `height` later does not update `area`.
- **Variables refer to values, never to other variables.** `b = a` looks up a's value; it does not link b to a.
- **Reassigning is not mutating.** Repointing a name leaves the old value alone. Changing a container in place is seen by every name that refers to it.
- **Same label is not same object.** Two `Pet("Milo")` calls build two Pets.
- **Copies are shallow.** The outer container is new; what is inside is shared.

## Anatomy of a level

A level is built with `level(id, title, description, tutorial, challenges)`.

- **One idea per level**, building only on earlier levels. If a puzzle needs an idea that has not been taught yet, it belongs in a later level, or that idea must be stated in the puzzle itself (see constraints, below).
- **Title and description** are given per language with `L(javascript, python)`, because the containers have different names (array/list, object/dictionary). The description states the level's rule in plain language. It is shown on any puzzle that has no `about` of its own.
- **Ten tutorial puzzles, then five challenge problems.** The tutorial puzzles are five drawing puzzles (code shown, learner draws memory) and five writing puzzles (picture shown, learner writes code), in teaching order. Interleave the two kinds so the learner cannot predict which comes next, but never at the cost of teaching order.
- **Ids are positional by kind**: drawing puzzles are `<level>-1` to `-5`, writing puzzles `-6` to `-10`, and challenge problems `-11` to `-15`, in the order listed. Progress and drafts are stored by id. Replacing a puzzle in place keeps its id, so anyone who solved the old puzzle will see the new one as solved.

### Teaching order within a level

1. Introduce the idea in its smallest form, as a drawing puzzle. Reading code before writing it is easier.
2. Add one complication at a time: a second variable, a later reassignment, a change through a second name.
3. Show the contrast case: the situation where the idea does *not* apply, or applies the opposite way. "Area after a change" is paired with "Area before a change", and "Two equal values" with "Two teams".
4. Move to writing puzzles once the learner has drawn the idea at least once.

### Concept dependencies and CI verification

A puzzle can declare concepts it introduces via `teaches: string[]` and concepts it depends upon via `reliesOn: string[]`.

Automated tests in `levels.test.ts` (`checkConceptDependencies`) validate that:
- Every concept in `reliesOn` was already declared in `teaches` by a strictly preceding puzzle in curriculum presentation order.
- No problem relies on an unknown or mistyped concept.
- Concepts cannot be self-satisfied within the same problem without a prior lesson.

### Challenge problems

Challenge problems retest the level with less support. They follow these rules:

- **No new ideas.** Everything a challenge problem needs was taught by this level's tutorial puzzles or by earlier levels.
- **Novel situations.** A challenge problem's picture must not appear in any other puzzle. A test enforces this.
- **Hidden until solved.** The title and the level description stay hidden, so the title must not be the only thing that makes the puzzle make sense, and it may name the idea freely because it is shown only after the learner has succeeded.

## Anatomy of a puzzle

Every puzzle is written once as a spec, with JavaScript and Python versions side by side.

| Field | Drawing | Writing | Purpose |
| --- | --- | --- | --- |
| `title` | yes | yes | Short name for the situation |
| `js` / `py` / `ts?` | the code shown | the reference answer | The same program in each language; `ts` falls back to `js` if omitted |
| `given` | no | usually | Starter code that runs before the learner's code |
| `then` | no | when needed | Starter code that runs after the learner's code |
| `expected` | yes | yes | The memory picture, built with `graph()`, `ref()`, `scalar()`, `list()`, `dict()`, `pet()` |
| `hint` | yes | yes | On-demand nudge |
| `hints` | optional | optional | Targeted explanations for predictable wrong answers |
| `about` | yes | yes | What this puzzle teaches |
| `debrief` | yes | yes | The lesson restated after a correct answer |
| `process` | no | when needed | Enforces *how* the picture is built |
| `constraints` | no | when needed | The boss's instructions that the picture cannot show |
| `opaquePrelude` | Pet levels | Pet levels | Defines `Pet` invisibly before the code runs |
| `teaches` | optional | optional | Concept strings introduced by this puzzle (e.g. `'array.push'`, `'string.toUpperCase'`) |
| `reliesOn` | optional | optional | Concept strings this puzzle requires; checked by CI to ensure strictly earlier teaching order |

## What makes an excellent puzzle

### It teaches exactly one thing

Before writing anything, finish this sentence: "A learner who solves this now knows that ___." If the sentence needs an "and", split the puzzle. That sentence becomes the `about`.

### The wrong mental model gives the wrong picture

This is the most important test. Imagine a learner who holds the misconception the puzzle targets, and draw the picture they would produce. If it matches `expected`, the puzzle cannot catch the misconception and teaches nothing.

"Area after a change" works because the spreadsheet model gives `area: 15` and the correct model gives `area: 12`. A puzzle that only declares variables and never reassigns them would pass a learner with either model.

When you know the wrong picture, add a diagnostic `hints` entry for it (see "Diagnostic hints", below).

### The code is plausible and the title is honest

The code should look like something a programmer might write, at the smallest size that shows the idea. Prefer meaningful names (`width`, `players`, `scores`) when the meaning helps the lesson, and plain names (`a`, `b`, `x`) when it would only distract.

The title must describe what the code actually does. A puzzle called "Width times height" with no multiplication in it is wrong. For drawing puzzles, avoid titles that announce the answer ("b stays 3"). Name the situation instead: "Reassigning the second variable" says what the code does and leaves the learner to work out what follows.

### It works across languages

All versions must build **the same memory picture** with code that is idiomatic in each language. If an idea has no natural spelling in one language, redesign the puzzle rather than forcing it: a Python learner has no reason to know a function called `concat`, so the Python version uses `+`, and its text says so.

The game distinguishes between **Language** (`javascript`, `typescript`, `python`) and **Runtime** (`javascript`, `python`):
- JavaScript and TypeScript share the `javascript` runtime, memory model, container names (`array`/`object`), and keywords (`true`/`false`/`null`).
- Python runs on the `python` runtime (`list`/`dict`, `True`/`False`/`None`).
- Every snippet accepts an optional `ts` field. If omitted, TypeScript mode falls back to `js` automatically.
- **The TypeScript annotation rule:** Annotate only where TypeScript cannot infer a useful type (function parameters and return types, and empty `[]` or `{}` collections, using inline object types like `{ seen?: boolean }`). Everything else stays identical to the JavaScript version and falls back automatically—never write a `ts` override identical to `js`.

Bugs that exist in only one language are left out of the game, however famous. Python's mutable default arguments (`def f(items=[])`) and the different results of `a = a.sort()` (`None` in Python, the same array in JavaScript) cannot be one puzzle with one picture, so neither appears.

- Spell keywords per language: `true`/`True`, `null`/`None`, `push`/`append`.
- Name functions the way each language does: `addMilk` in JavaScript/TypeScript, `add_milk` in Python. `call` rules take the JavaScript name and the grader converts it for Python. The in-browser Python engine is MicroPython, which does not support `{**d}`; use `dict(d)` for copies.
- `let` exists only in JavaScript and TypeScript. Python writes the same line whether the name is new or not.
- Use `{ js, py, ts? }` or `L(javascript, python, typescript?)` for any title, hint, about, or debrief text that mentions code, types, or container names. A plain string is fine only when the text is truly language-neutral.

### Values are chosen with care

- Use small whole numbers and short strings.
- Avoid accidental coincidences. If two values are equal by coincidence, a learner may assume they are linked. Make values equal only when the puzzle is about equality or sharing.
- Pets get real pet names (`Max`, `Bella`, `Rocky`), different names within a puzzle. Reusing a name for two separate Pets demonstrates that a label is not identity; do it a couple of times late in the identity level, not as a habit.

### Scalars: sharing and copying are both correct

Numbers, strings, booleans, and `null`/`None` cannot be changed in place, so no program can tell a shared value from two equal ones. The checker accepts both pictures, and the text must never claim otherwise. Do not say "y gets a copy of the number" as the only truth; JavaScript describes it that way and Python describes it as sharing, and both are right. Level 1 debriefs show both pictures and end with `SHARING_LATER` or `SHARING_REMINDER`.

### Drawing puzzles

- Every variable the code creates must be in `expected`, including temporaries such as `t` in a swap. A test enforces this for JavaScript declarations.
- Values that nothing refers to are garbage and are never checked, so do not put them in `expected`. A debrief may show them as "Also correct".

### Writing puzzles

- **The picture must be new.** It must not match any drawing puzzle's picture or any other writing puzzle's picture. Tests enforce this.
- **Use `given` to make the learner work with what exists.** "Change what is already there" is a different skill from "type the result". Starter code must not already produce the expected picture; a test enforces that too.
- **The `js`/`py` answer must be the natural one.** It is never shown unless the learner asks for the answer, and tests prove it passes every rule.
- **Enforce the point of the puzzle, or don't claim it.** If the puzzle is about mutating in place, about calling a function, or about building from an existing variable, the picture alone will not catch a learner who retypes the result. Enforce it with:
  - `process.runtime`: `preserve('a')` (a must still be the same container afterward), `sameObject`, `differentObject`, and `call` (a starter function must be called with particular arguments);
  - `process.source`: the variable must be built by a particular operation (`multiplies`, `callsMethod`, `copiesFrom`, `combines`);
  - `process.hidden`: rerun the learner's code from other starting values. A case may also replace the trailing `then` code (an empty string leaves it out) and carry its own `message`. Running a function-writing puzzle with `then: ''` shows whether the work really happens inside the function, because an empty function must leave the starting containers alone;
  - `constraints`: when the purpose of the code decides the answer (next section).

  Never put a rule in a hint, about, or debrief that the checker does not enforce. If the text says "refer to a by name", typing the number must fail.
- **Accept every equally good answer.** Enforcement should reject shortcuts that skip the idea, not alternative spellings of it. `[a, b] = [b, a]` is a real swap and must pass. When you add a rule, list the alternatives you thought of in a test.

### Constraints

Sometimes two answers build the same picture and the only difference is what the code *means*: should `b` follow `a` if someone edits a's starting value, or should it stay put? The picture cannot say, and it is not a hidden rule of the game; it is a design decision. A constraint states that decision as an instruction from the learner's boss:

> Your boss said that if another programmer updates the code so that a starts at a different number, b must also use that different number.

Guidelines:

- **State the purpose, not the code.** "The game always has exactly 2 teams, no matter how many players there are" lets the learner work out that `teams = 2` is right. "Do not use players" just hands them the answer.
- **Use both directions within a level.** If one puzzle says "b must follow a", another should say "teams must stay 2 even if players changes". Seeing both is what shows the learner that the choice is theirs.
- **Each case describes the edit** (`change: 'a starts at 3'`) so the error message reads naturally: "This breaks the special constraint. If another programmer changes the code so that a starts at 3, b should become 3, but your code makes it 8."
- Variable and function names in plain `rule`, `hint`, `about`, diagnostic `message`, and diagram `caption` strings are wrapped in `<code>` at display time from the puzzle's identifiers. Use explicit `<code>` in `debrief` HTML blocks (and in `rule` only when you need markup beyond identifiers).
- **Pick case values that differ from the shown ones and from each other**, so a retyped literal cannot pass by luck.
- Prefer a constraint over a silent `process.hidden` case whenever the learner needs to understand *why* retyping is wrong. Silent hidden cases are fine when the reason is already obvious from the level, such as building a string from its parts.
- **Copying and alternate starters:** When a writing puzzle uses `copiesFrom` or `copiesOrCombinesFrom` along with alternate starting values, define explicit `constraints` with a boss rule explaining that the copy must track the original. Place alternate starters in `constraints.cases` rather than duplicating them in `process.hidden`. This is enforced by the `explicit special constraints` test suite in `src/model/levels.test.ts`.
- **Method calls and alternate starters:** When a writing puzzle requires calling a specific method (`callsMethod`), define explicit `constraints` with a boss rule explaining that the value must be transformed using methods so it works when the starting value changes. Place alternate starters in `constraints.cases` rather than in silent `process.hidden`. This is enforced by CI.

## Writing the text

### Voice

Write plain, complete sentences for a beginner who is reading carefully. Be precise rather than chatty. Prefer the active voice and present tense: "b refers to 3", not "b will have been set to 3".

Use the same words for the same things everywhere:

| Say | Avoid |
| --- | --- |
| a variable *refers to* (or *points to*) a value | a variable *contains* or *stores* a value |
| *reassign*, *repoint* | *overwrite the variable* |
| *changes the list in place* | *updates the list* (ambiguous) |
| *shared* / *separate* | *the same* (ambiguous between equal and identical) |
| *alias* for a second name for one container | *copy* when nothing was copied |
| *value*, *number*, *string* | *primitive* (except in the JavaScript level title) |
| array/object in JavaScript, list/dictionary in Python | mixing the two in one language's text |

### `title`

A short noun phrase, two to six words. Capitalize only the first word and proper names. Localize it (`{ js, py }`) when it names a container or keyword.

### `hint`

The hint is the learner's first request for help. It should move them forward without becoming the answer, which is a separate button.

- One or two sentences.
- Say what to do or what to look at: "Declare b and assign it from a instead of typing 8 again."
- When noticing something is the whole point, point at it without explaining it: "Pay careful attention to the order of assignments."
- It must be correct in both languages. Read it once as a JavaScript learner and once as a Python learner. A wrong hint is worse than no hint.

### Diagnostic hints (`hints`)

When a predictable wrong answer has a predictable cause, explain the cause at the moment the learner makes the mistake:

```ts
hints: [
  {
    variable: 'area',
    value: 15,
    message:
      'The value 15 is not correct here. Changing height later does not update area — variables hold static values, not live formulas.',
  },
],
```

- Write them only for mistakes that come from the misconception the puzzle targets. Every typo does not need one.
- Start by saying what is wrong, then give the rule.
- `aliasing: 'shared'` / `'separate'` entries explain when a learner merged two names onto one container that should be separate, or the reverse.
- `length` entries explain when a variable's array or list has the wrong number of slots, such as a list that should have been emptied in place.
- `missingKey` entries explain when an object or dictionary lacks a key that the puzzle expects.
- `message` may be `{ js, py }` when it names a container or a function, as for every other piece of text.

### `about`

One to three sentences stating the rule this puzzle teaches, in general terms. It is shown before the learner starts, so it may explain the idea but should not walk through this puzzle's specific answer. If the puzzle has a constraint, the about can mention that the constraint decides how to write it.

### `debrief`

The debrief appears after a correct answer. Its job is to turn "I got it right" into "I know why", and to show what else would have been right. A good debrief:

1. **Walks through the code** in a sentence or two, naming what each important line does to memory.
2. **Shows the correct picture** as a `diagram` with `verdict: 'correct'`.
3. **Shows the misconception's picture** with `verdict: 'incorrect'` and a caption saying what wrong idea it represents ("Not correct: this is what a spreadsheet would show.").
4. **Lists alternatives** with a bold lead-in:
   - **Also correct:** answers or pictures the checker accepts that the learner may not have thought of (a one-line swap, a shared scalar, garbage left behind).
   - **Not accepted:** tempting answers the checker rejects, and why, in terms the learner can check against the puzzle (the constraint, the rule it breaks).
5. **Ends with what carries forward**, where that helps: a sharing note, or a pointer to the contrasting puzzle.

Debrief text is HTML. Use `<p>`, `<code>`, `<strong>`, and `<ol>`; keep each block to one idea. Diagram verdicts are checked against the grader by a test, so a diagram marked "correct" must actually pass.

### Error messages

Messages written in `src/verify/` follow the same voice. They say what is wrong and where, using the learner's language's names (`list` in Python), and they name the rule being broken: the special constraint, "Variables can NEVER refer to variables", or the call that should have happened. Never describe the checker's internals ("hidden case 2 failed").

## Tests

`src/model/levels.test.ts` checks most structural rules automatically for every puzzle:

- each expected picture matches what JavaScript, CPython, and MicroPython actually build, including hidden and constraint cases;
- drawing puzzles include every declared variable;
- challenge problems and writing puzzles show pictures no other puzzle shows;
- writing puzzles are not already solved by their starter code;
- every reference answer passes every process rule and constraint;
- every debrief diagram's verdict agrees with the grader.

These run with `npm test`. When you add behavior they cannot see, add a test for it: a shortcut that must now be rejected (with the message it should give), an alternative answer that must be accepted, a diagnostic hint that must fire, or a constraint that must catch a retyped literal. Do not add tests that only restate configuration, such as "this puzzle has this hint".

## Checklist

Before a puzzle is done:

- [ ] I can finish "a learner who solves this now knows that ___" in one clause.
- [ ] The misconception it targets produces a different picture, and a diagnostic hint explains that picture.
- [ ] The title describes what the code does; for challenge problems, the puzzle makes sense without it.
- [ ] JavaScript and Python versions are both idiomatic and build the same picture.
- [ ] Values are small, unremarkable, and equal only on purpose. Pet names are real and distinct.
- [ ] Nothing in the text claims a rule the checker does not enforce, and nothing calls a shared scalar wrong.
- [ ] For writing puzzles: the picture is new, the starter code matters, the point is enforced, and every equally good answer passes.
- [ ] If the answer depends on what the code means, a constraint says so, and the level has an example of the opposite decision.
- [ ] `hint`, `about`, and `debrief` are written, read correctly in both languages, and use the shared vocabulary.
- [ ] `npm test` passes, with new tests for any new shortcut, alternative, diagnostic, or constraint.

Before a level is done:

- [ ] It teaches one idea that depends only on earlier levels.
- [ ] The description states that idea in plain language, in both languages.
- [ ] Tutorial puzzles go from smallest case to complications to the contrast case, with drawing and writing interleaved.
- [ ] The five challenge problems use no new ideas and repeat no pictures.
