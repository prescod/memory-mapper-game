# Technical Specification: Memory Model Visualizer

## 1. Overview
The **Memory Model Visualizer** is a browser-based, stateful educational tool. It presents a user with a short snippet of code (in JavaScript or Python) and provides a drag-and-drop canvas. The user must assemble a node-link diagram representing the state of memory (variables, scalars, arrays, objects, and references) exactly as it would look after the code executes.

## 2. Core Concepts & Data Model
The app unifies the Python ("names bound to objects") and JavaScript ("variables holding primitives/references") mental models into a single visual language. 

The user will interact with the following "building blocks" (Nodes) and "pointers" (Edges):

### 2.1 Nodes (Memory Entities)
*   **Variable Node:** Represents a variable name (e.g., `x`, `myList`). Visually distinct (e.g., a sticky note or label). It cannot contain data, it can only have exactly *one* outgoing connecting line (a reference).
*   **Scalar Node:** Represents primitive values (Numbers, Strings, Booleans, Null/None). Visually represented as a solid, un-splittable block with the value written inside.
*   **Array / List Node:** Represents an ordered list. Visually represented as a sequence of slots (indices 0, 1, 2...). Each slot acts as a connection point for an outgoing line.
*   **Object / Dictionary Node:** Represents key-value pairs. Visually represented as a table of slots labelled with string keys. Each key acts as a connection point for an outgoing line.

### 2.2 Edges (References)
*   **Reference Line:** A directional arrow indicating that a Variable, Array index, or Object key points to a specific memory entity (Scalar, Array, or Object).

## 3. User Flow & Experience

1.  **Level Selection:** The user lands on a dashboard showing a list of levels (persisted in browser state).
2.  **The Challenge:** 
    *   The left sidebar displays a code snippet (e.g., `let a = [1]; let b = a;`).
    *   A toolbar offers draggable nodes: [Add Variable], [Add Scalar], [Add Array], [Add Object].
3.  **Assembly (The Canvas):**
    *   The user drags nodes onto the main canvas.
    *   The user configures the nodes (e.g., types "a" into a Variable node, types "1" into a Scalar node, adds a slot to an Array node).
    *   The user drags lines between the nodes to establish relationships.
4.  **Verification:** The user clicks "Check Answer".
    *   The system evaluates the user's graph against the expected answer graph.
    *   If correct, success animations play, and the level is marked "Completed" in local state.
    *   If incorrect, the system highlights the missing or incorrect edges/nodes.

## 4. Example Levels / Curriculum

**Level 1: Basic Primitives**
```javascript
let x = 10;
let y = x;
```
*Expected Graph:* Variable `x` points to Scalar `10`. Variable `y` points to a *separate* Scalar `10` (JS) OR the same Scalar `10` (Python small int caching, though usually taught as pointing to the same value). *Note: The app should configure rules per language mode.*

**Level 2: Reference Types**
```javascript
let arr1 = [42];
let arr2 = arr1;
```
*Expected Graph:* Variable `arr1` and Variable `arr2` both point to the *exact same* Array node. The Array node's `0` slot points to a Scalar `42`.

**Level 3: Mutation**
```python
a = {'score': 100}
b = a
b['score'] = 200
```
*Expected Graph:* Variables `a` and `b` point to the same Dictionary node. The Dictionary's `score` slot points to a Scalar `200` (the 100 scalar should be either absent or shown as garbage collected/disconnected).

## 5. Technical Architecture

### 5.1 Frontend Stack
*   **Framework:** React (TypeScript recommended for strict data modeling).
*   **Canvas/Graphing Library:** **React Flow** is highly recommended here. It supports custom HTML nodes (perfect for Arrays with dynamic slots) and handles the drag-and-drop edge routing natively.
*   **State Management:** Zustand or Redux Toolkit.
*   **Browser Storage:** `localStorage` (via Redux Persist or Zustand middleware) to save:
    *   Level completion status.
    *   The current draft state of the canvas for the active level (so users don't lose work on refresh).

### 5.2 Verification Engine (Graph Isomorphism)
Validating the user's graph is the most complex technical requirement. We cannot simply compare X/Y coordinates. We must compare the *topology* of the graph.

**Algorithm:**
1.  **Extract Expected State:** Each level contains a JSON representation of the expected final state (e.g., `Variables: {a: ref1, b: ref1}, Memory: {ref1: Array([ref2]), ref2: Scalar(42)}`).
2.  **Extract User State:** Translate the React Flow nodes/edges into a similar internal JSON structure.
3.  **Traverse & Compare:**
    *   Start at the Variable nodes (the "roots").
    *   Follow the edges. Check if the type of node being pointed to matches the expected type.
    *   Ensure identity checks pass (e.g., if `a` and `b` are supposed to point to the *same* array, check that `userGraph.a.targetNodeId === userGraph.b.targetNodeId`).
    *   Check contents (Array lengths, Object keys, Scalar values).

## 6. MVP (Minimum Viable Product) Milestones
1.  **Phase 1:** Setup React Flow canvas, create the 4 custom node types (Variable, Scalar, Array, Object) with editable text fields.
2.  **Phase 2:** Implement the connection logic (ensuring Variables can only have 1 outgoing line, Arrays can have 1 per index, etc.).
3.  **Phase 3:** Write the Verification Engine and implement 3 hardcoded levels.
4.  **Phase 4:** Add `localStorage` persistence and basic success/failure visual feedback.