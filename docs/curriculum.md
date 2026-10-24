# Curriculum Goals

This document states what each level of the game is for: the idea it teaches, what a learner can do after finishing it, the misconceptions it is designed to catch, and what it deliberately leaves for later. It is the reference for deciding whether a new or revised puzzle belongs in a level. For how to write the puzzles themselves, see [the style guide](puzzle_style_guide.md).

Where a level's goals are not yet fully served by its puzzles, a **Gaps** note says so.

## The arc

Level 0 teaches how to play. The ten levels after it build one mental model in stages. Each stage adds one kind of thing to the picture or one way the picture can change.

1. **Names and values** (Level 1). A variable is a name with an arrow to a value. Assignment moves arrows; it never links variables to each other.
2. **Identity** (Level 2). Some values are separate things in memory. Two names can refer to the same one, and two equal-looking ones can be separate.
3. **Structure** (Levels 3 and 4). Containers have slots or keys, and each slot or key is itself an arrow.
4. **Change** (Levels 5 and 6). Containers can be changed in place, and every name that refers to one sees the change. Reassigning a name is a different operation that changes nothing else.
5. **Composition** (Levels 7 and 8). Containers can hold other containers, the same inner container can be reachable from several places, and references can form loops. Copies are shallow.
6. **Building new values** (Level 9). Operations that build new values versus operations that change old ones, and dropping references.
7. **Functions** (Level 10). What a function can and cannot do to its caller's variables and containers, and how returned references work.

Every level is taught in both JavaScript and Python with the same pictures. Where the two languages name things differently (array/list, object/dictionary, `push`/`append`, spread/`list()`), the level uses each language's own spelling, and the goal is the same.

---

## Level 0: Getting Started (`tutorial`)

**Big idea.** A variable is a name and a value is a piece of data; assigning points the name at the value with an arrow. Every puzzle is either drawing that picture for some code or writing code for a picture.

**By the end, a learner can:**

- add variable and primitive blocks, name a variable, type a value, and connect them with an arrow, by tapping or dragging;
- select and delete blocks and arrows, and use Check, Hint, Answer, Reset, and the lesson after a correct answer;
- tell a string (quoted) from a number (unquoted), and a variable's name from a value;
- write a line of code for a picture, including after starter code that is already in place.

**Misconceptions it targets:**

- *The value lives inside the name*: the name only points at the value ("Your first variable").
- *Quotes do not matter*: `"3"` is a string, not the number 3 ("Your first variable", "A word and a number").

**Sets up** everything. Level 1 starts from the picture this level teaches and adds reassignment, assigning from another variable, and special constraints.

**How the level checks it.** Pictures alone. Each puzzle has a `coach`: steps shown above the puzzle that ring the part of the screen they talk about and move on as the learner does what they ask. "Fixing a picture" opens with a wrong picture already on the canvas (`start`).

**Out of scope.** Reassignment, sharing, constraints, and every kind of value but numbers and strings. There are no challenge problems: the level teaches the game, and Level 1 tests the ideas.

---

## Level 1: Variables and Primitives (`scalars`)

**Big idea.** A variable holds a value as of the moment it was assigned. It is not a formula and not a link to another variable.

**By the end, a learner can:**

- draw a variable, a value, and the arrow between them, and read such a picture;
- predict the result of reassignment: the arrow moves, and the old value is left behind;
- predict that `y = x` gives y x's current value, and that later reassigning either one leaves the other alone;
- trace a short sequence of assignments in order, including a swap with a temporary variable;
- decide, from what the code is for, whether a new variable should be assigned from an existing one or given its own value (the constraints in "Two equal values" and "Two teams");
- recognize numbers, strings, booleans, and `null`/`None` as values that get arrows like any other.

**Misconceptions it targets:**

- *Spreadsheet thinking*: changing `height` should update `area` ("Area after a change", and the contrast "Area before a change").
- *Variables point at variables*: `y = x` makes y follow x (the canvas allows the arrow and always marks it wrong).
- *Reassignment travels*: changing y after `y = x` changes x too ("Reassigning the second variable", "Reassigning the original leaves the other unchanged", "A chain of assignments").
- *Swaps are two assignments*: `x = y; y = x` loses a value ("Swapped", "Rotate left").

**Sets up.** The idea that sharing a value can matter. Level 1 says explicitly that sharing a number and keeping two equal numbers are both correct, because numbers cannot change; Level 2 introduces values where the difference is visible.

**How the level checks it.** Pictures do most of the work. Writing puzzles whose answer depends on referring versus retyping use special constraints, so a retyped literal fails with a message that names the boss's instruction.

**Out of scope.** Number formats (negatives, decimals), string operations, and arithmetic beyond one multiplication. `undefined` appears only as the reason `let nickname;` is wrong.

**Challenge problems** retest reassignment order, chains, rotation, and the spreadsheet contrast with no hints.

---

## Level 2: Objects with Identity and Multiple References (`identity`)

**Big idea.** A Pet is a separate thing in memory, and a variable holds a reference to it. Identity, not the name on the label, decides whether two variables refer to the same Pet. The payoff: renaming a Pet through one variable is seen through every variable that shares it, and by no other Pet.

**By the end, a learner can:**

- draw several names referring to one Pet, and several Pets with names of their own;
- tell from code whether two variables share a Pet (`y = x`) or refer to separate Pets (two `Pet(...)` calls), even when the Pets have the same name;
- write code that shares an existing Pet rather than building a look-alike;
- predict which variables see a Pet's new name after `y.name = "Lola"`, and rename a shared Pet in place rather than replacing it.

**Misconceptions it targets:**

- *Same label means same object*: two `Pet("Milo")` calls share ("Same label, separate objects", "Which names share?").
- *Assignment copies objects*: `y = x` makes a second Pet, so renaming through y leaves x alone ("Renaming through a second name").
- *A change reaches every look-alike*: renaming one of two `Pet("Ginger")`s renames both ("Renaming one of two look-alikes").

**Builds on** Level 1's assignment rules, now applied to values with identity. **Sets up** containers, which have identity in the same way and can also change.

**How the level checks it.** The checker compares sharing exactly for Pets: merging two names onto one Pet, or splitting one Pet into two, is an error, and "Same label, separate objects" explains the specific mistake. Hidden alternate starters reject answers that rebuild the starter Pets instead of using the existing ones. The checker compares each Pet's name as well as its sharing, and "Rename the shared Pet" uses a `preserve` rule, so building a new Pet with the new name fails even though the picture matches.

**Out of scope.** Anything inside a Pet besides its name. A Pet has an identity and one changeable field, `name`, set with `p.name = "Rex"` in every language; no other fields are shown or compared. `Pet` is defined invisibly by the game; learners never see or write its definition. Changing containers in place (`push`, keys) belongs to Levels 5 and 6: Level 2 renames a Pet only to show what identity is for.

**Challenge problems** retest chains of names, pairs, same-name Pets, and a rename after a repoint.

---

## Level 3: Arrays / Lists (`arrays`)

**Big idea.** An array (list) is a separate thing in memory with numbered slots, and each slot is an arrow to a value.

**By the end, a learner can:**

- draw an array with the right number of slots, each pointing to its value, including the empty array;
- read and build arrays holding mixed kinds of values, including `null`/`None`;
- predict that two array literals build two separate arrays even when their contents match.

**Misconceptions it targets:**

- *Values live inside the slots*: slots are arrows, which is what makes nested and shared contents possible later.
- *Equal contents mean the same array* ("Same contents, separate lists", "Two lists from literals").

**Builds on** Level 2: arrays have identity just as Pets do. The level description tells learners that sharing rules carry over, so the focus here is slot structure. **Sets up** changing arrays in Level 5.

**How the level checks it.** Pictures alone: slot count, slot targets, and which arrays are separate.

**Out of scope.** Changing an array after it is built, indexing expressions beyond literals, and array methods.

**Challenge problems** retest every kind of value in slots and separate arrays with equal contents.

**Gaps.** "A list from a variable" (`row = [n]`) accepts `[5]` typed out, because nothing checks that the slot came from `n`. A constraint like Level 1's would make the point. No `about` or `debrief` text yet.

---

## Level 4: Objects / Dictionaries (`objects`)

**Big idea.** An object (dictionary) stores arrows under named keys. Like an array, it is a separate thing in memory.

**By the end, a learner can:**

- draw objects with keys pointing to values of any kind, including an empty object and a key holding `null`/`None`;
- tell aliasing (`y = x`) from two equal but separate objects;
- write code that builds several objects and shares some of them.

**Misconceptions it targets:**

- *Equal keys and values mean the same object* ("Equal but separate", "Two pairs of names").
- *A key stores its value*: keys hold arrows, so two keys can point at equal values independently ("Two keys, same value").

**Builds on** Levels 2 and 3: identity and slots, now with names instead of numbers. **Sets up** changing objects in Level 6.

**How the level checks it.** Pictures alone: keys, their targets, and which objects are shared.

**Out of scope.** Adding, changing, or removing keys after creation, and nested objects.

**Challenge problems** retest separate objects with matching keys, aliasing, and mixed value kinds.

**Gaps.** No `about` or `debrief` text yet.

---

## Level 5: Changing Arrays / Changing Lists (`mutating-arrays`)

**Big idea.** Adding, removing, or overwriting an item changes the array itself, so every name that refers to it sees the change. Assigning a new array to a name only moves that name's arrow.

**By the end, a learner can:**

- predict the effect of `push`/`append`, `pop`, and slot assignment on an array;
- predict that a change made through one name is visible through every alias;
- tell mutating an array apart from repointing a name at a new array, and predict both in one program;
- write code that changes an existing array in place rather than building a replacement.

**Misconceptions it targets:**

- *Changing through y leaves x alone* ("Mutating through an alias", "Add for both").
- *Reassigning x changes the array y still refers to* ("Pointing a name elsewhere", "Split them apart").
- *Repointing and then mutating affects the old array* ("Repoint, then grow").

**Builds on** Level 3's slots and Level 2's aliasing. **Sets up** Level 6, which applies the same distinction to objects, and Level 9, which adds operations that build new arrays.

**How the level checks it.** Writing puzzles require that the starter array is still the same array afterward (`preserve`), so rebuilding it as a literal fails with "Change what "x" already refers to instead of creating a new one."
**Out of scope.** Methods that insert or remove in the middle, sorting, and methods that return new arrays.

**Challenge problems** retest sequences of changes, mixed mutation and repointing, and changes from two names to one array.

**Gaps.** No `about` or `debrief` text yet.

---

## Level 6: Changing Objects / Changing Dictionaries (`mutating-objects`)

**Big idea.** Adding, changing, or deleting a key changes the object itself, and every alias sees it. Assigning a brand new object to a name leaves the old object untouched.

**By the end, a learner can:**

- predict the effect of adding, changing, and deleting keys (`delete` in JavaScript, `del` in Python);
- predict changes made through aliases, and changes made after one alias has been repointed;
- write code that edits an existing object in place, including renaming a key and swapping two values inside an object.

**Misconceptions it targets:**

- *A new object replaces the old one everywhere* ("A brand new object", "The alias kept the original object").
- *Deleting through an alias only affects that alias* ("Deleting through an alias").

**Builds on** Level 5's distinction between mutating and repointing. **Sets up** nested containers, where a change deep inside can be seen from several places.

**How the level checks it.** `preserve` rules require the starter object to survive, and identity rules check which object a name refers to afterward. Hidden alternate starters make sure key renaming and in-object swaps work from any starting values.

**Out of scope.** Iterating over keys, and key order.

**Challenge problems** retest two names making two changes, swapping inside an object, deleting through an alias, and changing an object after an alias was repointed.

**Gaps.** No `about` or `debrief` text yet.

---

## Level 7: Nested Arrays and Objects / Nested Lists and Dictionaries (`nesting`)

**Big idea.** Containers can hold arrows to other containers. Each inner container is a separate thing in memory, and the same one can be reachable from several places. An inner container can even be the outer one, or lead back to it, so references can form loops.

**By the end, a learner can:**

- draw grids, objects holding lists, lists of objects, and small trees;
- tell an inner container that appears twice (one container, two arrows) from two equal inner containers;
- predict that changing a shared inner container is visible from every place that refers to it;
- build a structure that refers back to itself by creating the containers first and connecting them afterward.

**Misconceptions it targets:**

- *Nested means contained*: an inner list "belongs" to its outer list, so `[inner, inner]` holds two copies ("The same inner list twice", "One row, used twice").
- *Changing the inner value does not affect the outer container* ("Changing a nested list", "Changing an object inside a list").
- *A container that contains itself is infinite*: it is one container with an arrow to itself ("An object that holds itself").

**Builds on** Levels 3 to 6. **Sets up** shallow copies in Level 8, which depend on seeing inner containers as shared arrows.

**How the level checks it.** Pictures alone: the checker compares sharing at every depth.

**Out of scope.** Copying nested structures (Level 8).

**Challenge problems** retest repeated rows, pairs, nested objects, changes to a shared inner container, and mutual references.

**Gaps.** No `about` or `debrief` text yet.

---

## Level 8: Copies and Aliases (`copies`)

**Big idea.** Copying with spread (JavaScript) or `list()`/`dict()` (Python) makes a new outer container, but the inner containers are shared with the original: a shallow copy. Repeating an item with `fill()` or `*` repeats the same reference.

**By the end, a learner can:**

- predict that a copy is a separate outer container whose slots or keys point to the same values as the original's;
- predict which changes after copying affect both the original and the copy (changes to shared inner containers) and which affect only one (changes to the outer container);
- explain why repeating a row builds a grid whose rows are all one row, and build a grid whose rows are separate;
- copy one level deeper by hand when the inner containers must be separate too.

**Misconceptions it targets:**

- *A copy is independent all the way down* ("A shallow copy", "Mutating inside a shallow copy").
- *Changing the copy's outer container changes the original* ("Changing the original after copying", "Replacing a shared inner object").
- *Repeating a row makes separate rows* ("Repeating one list", "Changing the repeated row").

**Builds on** Level 7's shared inner containers. **Sets up** Level 9's operations that build new containers.

**How the level checks it.** Source rules require the copy to be made by copying, not by writing the contents out again. Runtime rules require the original, and where it matters its inner containers, to still be the same objects afterward, so the learner cannot rebuild them. Special constraints and alternate starters reject answers that retype the original's contents.

**Out of scope.** Library deep-copy functions such as `structuredClone` and `copy.deepcopy`.

**Challenge problems** retest changing a shallow copy twice, replacing a shared inner object, the repeated-row trap, and adding to a copy.

**Gaps.** No `about` or `debrief` text yet.

---

## Level 9: Building New Values (`rebinding`)

**Big idea.** Some operations change a value in place; others build a new value and leave the old one alone. Assigning the result to a name only moves that name's arrow. Setting a name to `null`/`None` drops one reference; a value nothing refers to is gone for good.

**By the end, a learner can:**

- predict that joining strings with `+` and string methods return new strings and never change the original, the same way numbers behave;
- tell an operation that builds a new array or list from one that changes the existing one in place, and predict which names see the result;
- predict that setting a name to `null`/`None` drops one reference, and that a value nothing refers to is garbage;
- predict that repointing a variable initialized from a container slot leaves the container untouched;
- combine values into a new container without altering the inputs.

**Misconceptions it targets:**

- *Strings change in place*: `s = s + "!"` or `s.toUpperCase()` alters the old string ("Building a new string", "Upper and lower", "Upper case through an alias").
- *Combining creates changes in the original* ("Combine without changing the original", "In place, then new").
- *Dropping one reference destroys the underlying value when another reference exists* ("Let it go").
- *Assigning from a slot links the variable to the slot* ("A string taken from a list").

**Builds on** Levels 5 and 6. **Sets up** Level 10, which applies reference and rebinding rules across function boundaries.

**How the level checks it.** Source rules require the named operations (string methods, `concat`/`+`); "A full name" pairs with "Combine without changing the original" as the string and array versions of the same idea. Runtime rules enforce preservation of original containers and verify identity. Hidden alternate starters prevent hardcoding literals.

**Out of scope.** Regular expressions, advanced string manipulation, and library immutability helpers.

**Challenge problems** retest combining followed by growing, uppercase through an alias, dropping a reference while another remains, repointing an inner reference, and combining alongside in-place mutation.

**Gaps.** No `about` or `debrief` text yet.

---

## Level 10: Functions and Parameters (`functions`)

**Big idea.** A parameter is a new name for whatever the caller passed in. Through it, a function can change the caller's container, but reassigning the parameter never changes the caller's variable. Whatever a function returns, the caller gets a reference to: possibly a new container, possibly the very one it passed in.

**By the end, a learner can:**

- predict what a function call does to the caller's containers, whether the function changes its parameter, repoints it, or both in either order;
- predict whether a returned container is new or is the argument itself, and draw the aliasing that results;
- predict that a function which stores its argument somewhere creates sharing the caller cannot see from the call alone;
- write a helper that returns a new container and leaves its argument alone, and a helper that changes its argument in place, and choose between them from what the program needs;
- pass nested containers to functions and predict how mutating the parameter affects the outer structure.

**Misconceptions it targets:**

- *Reassigning a parameter changes the caller's variable* ("Changing a parameter, then reassigning it", "Moving a finished task", "Restocking a shelf", "Tagging in place").
- *A function works on its own copy of what it was given* ("A function that changes an array", "Change it for everyone", "Copying a parameter before changing it").
- *A returned list is always a new list* ("Changes it and hands it back").
- *Passing a slot passes a copy of the inner list* ("Passing an inner list").

**Builds on** all previous levels, especially Levels 6, 7, 8, and 9. This is the culmination of the core memory model.

**How the level checks it.** `call` rules require starter functions to be invoked with the expected arguments and call counts rather than simulated by hand. Puzzles where learners write functions use `then` starter code and constraints to verify functions work generally for any caller argument rather than hardcoding literals, and hidden cases that leave out the trailing call to verify the work happens inside the function rather than before it.

**Out of scope.** Closures, default arguments, methods and `this`/`self`, and recursion.

**Challenge problems** retest functions that change aliases, functions that mutate and rebind, functions that store or tag items, and functions operating on nested containers.

**Gaps.** No `about` or `debrief` text yet.
