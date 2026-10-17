import type { MemFlowNode } from "../canvas/types";
import type { Draft } from "./draft";
import type { AppState } from "./useAppStore";

/**
 * Problem ids that changed when the string puzzles left Level 2 and Level 9 was
 * trimmed (storage version 9 to 10). `null` means the problem was removed, so its
 * progress is dropped. Every id not listed here is unchanged.
 */
const PROBLEM_ID_REMAP_V9: Record<string, string | null> = {
  "identity-3": null, // Assigning from a string
  "identity-4": "rebinding-1", // Building a new string
  "identity-5": "identity-3", // Same label, separate objects
  "identity-9": "rebinding-6", // A full name
  "identity-10": "identity-9", // Same Pet as a
  "identity-15": null, // Clear one, keep the backup
  "rebinding-1": null, // Upper- and lower-casing a string
  "rebinding-3": "rebinding-4", // A string taken from an array
  "rebinding-4": "rebinding-5", // Dropping a reference
  "rebinding-5": "rebinding-3", // In place, then new
  "rebinding-6": "rebinding-7", // Upper and lower
  "rebinding-7": "rebinding-10", // Nobody points here
  "rebinding-10": null, // Shout the name, keep the backup
};

const remapId = (id: string): string | null =>
  Object.hasOwn(PROBLEM_ID_REMAP_V9, id) ? PROBLEM_ID_REMAP_V9[id] : id;

/** Remaps a `progressKey` (`<problemId>:<language>`); null when the problem no longer exists. */
function remapKey(key: string): string | null {
  const split = key.lastIndexOf(":");
  const id = remapId(key.slice(0, split));
  return id === null ? null : `${id}${key.slice(split)}`;
}

function remapRecord<T>(
  record: Record<string, T> | undefined,
): Record<string, T> {
  const remapped: Record<string, T> = {};
  for (const [key, value] of Object.entries(record ?? {})) {
    const next = remapKey(key);
    if (next !== null) remapped[next] = value;
  }
  return remapped;
}

/** Problems whose starter variables `a`, `b`, `c` became `x`, `y`, `z` in version 10. */
const RENAMED_VARIABLE_PROBLEMS = new Set([
  "arrays-5",
  "copies-1",
  "copies-10",
  "copies-12",
  "copies-14",
  "copies-15",
  "copies-3",
  "copies-4",
  "copies-7",
  "functions-1",
  "functions-11",
  "functions-13",
  "functions-14",
  "functions-2",
  "functions-3",
  "functions-5",
  "functions-6",
  "identity-1",
  "identity-10",
  "identity-11",
  "identity-12",
  "identity-13",
  "identity-14",
  "identity-15",
  "identity-2",
  "identity-3",
  "identity-4",
  "identity-5",
  "identity-6",
  "identity-8",
  "identity-9",
  "mutating-arrays-1",
  "mutating-arrays-10",
  "mutating-arrays-11",
  "mutating-arrays-12",
  "mutating-arrays-13",
  "mutating-arrays-14",
  "mutating-arrays-15",
  "mutating-arrays-2",
  "mutating-arrays-3",
  "mutating-arrays-4",
  "mutating-arrays-5",
  "mutating-arrays-6",
  "mutating-arrays-7",
  "mutating-arrays-8",
  "mutating-arrays-9",
  "mutating-objects-13",
  "mutating-objects-15",
  "mutating-objects-3",
  "mutating-objects-7",
  "nesting-10",
  "nesting-12",
  "nesting-14",
  "objects-10",
  "objects-12",
  "objects-4",
  "objects-5",
  "rebinding-10",
  "rebinding-11",
  "rebinding-13",
  "rebinding-15",
  "rebinding-2",
  "rebinding-3",
  "rebinding-5",
  "rebinding-8",
  "rebinding-9",
  "scalars-11",
  "scalars-12",
  "scalars-13",
  "scalars-14",
  "scalars-5",
  "scalars-6",
  "scalars-8",
]);

/** Problems whose string values `a`/`x`, `b`/`y`, `c`/`z` became `cat`, `dog`, `fox`. */
const RENAMED_STRING_PROBLEMS = new Set([
  "mutating-arrays-9",
  "mutating-arrays-15",
  "copies-8",
  "copies-11",
]);

/** The object keys `x` and `y` became `left` and `right` in this problem. */
const RENAMED_KEY_PROBLEM = "mutating-objects-13";

const VARIABLE_NAMES: Record<string, string> = { a: "x", b: "y", c: "z" };
const STRING_VALUES: Record<string, string> = {
  a: "cat",
  x: "cat",
  b: "dog",
  y: "dog",
  c: "fox",
  z: "fox",
};
const KEY_NAMES: Record<string, string> = { x: "left", y: "right" };

const problemOf = (key: string): string => key.slice(0, key.lastIndexOf(":"));

/** Renames identifiers in learner code, leaving string literals and property names alone. */
function renameCode(problemId: string, code: string): string {
  const renameStrings = RENAMED_STRING_PROBLEMS.has(problemId);
  return code.replace(
    /("[^"\n]*"|'[^'\n]*')|(?<![.\w])([abc])(?!\w)/g,
    (match, literal, name) => {
      if (name) return VARIABLE_NAMES[name];
      const inner = literal.slice(1, -1);
      return renameStrings && Object.hasOwn(STRING_VALUES, inner)
        ? `${literal[0]}${STRING_VALUES[inner]}${literal[0]}`
        : match;
    },
  );
}

function renameNode(problemId: string, node: MemFlowNode): MemFlowNode {
  if (
    node.type === "variable" &&
    Object.hasOwn(VARIABLE_NAMES, node.data.name)
  ) {
    return {
      ...node,
      data: { ...node.data, name: VARIABLE_NAMES[node.data.name] },
    };
  }
  if (node.type === "scalar" && RENAMED_STRING_PROBLEMS.has(problemId)) {
    const quote = /^(["'])(.*)\1$/.exec(node.data.text);
    const inner = quote ? quote[2] : node.data.text;
    if (Object.hasOwn(STRING_VALUES, inner)) {
      const text = STRING_VALUES[inner];
      return {
        ...node,
        data: {
          ...node.data,
          text: quote ? `${quote[1]}${text}${quote[1]}` : text,
        },
      };
    }
  }
  if (node.type === "object" && problemId === RENAMED_KEY_PROBLEM) {
    const entries = node.data.entries.map((entry) =>
      Object.hasOwn(KEY_NAMES, entry.key)
        ? { ...entry, key: KEY_NAMES[entry.key] }
        : entry,
    );
    return { ...node, data: { ...node.data, entries } };
  }
  return node;
}

function renameDraft(problemId: string, draft: Draft): Draft {
  return {
    ...draft,
    nodes: draft.nodes.map((node) => renameNode(problemId, node)),
  };
}

/** Applies the version 10 renames to drafts and code drafts keyed by `progressKey`. */
function renameRecord<T>(
  record: Record<string, T>,
  rename: (problemId: string, value: T) => T,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      const problemId = problemOf(key);
      const renamed =
        RENAMED_VARIABLE_PROBLEMS.has(problemId) ||
        problemId === RENAMED_KEY_PROBLEM
          ? rename(problemId, value)
          : value;
      return [key, renamed];
    }),
  );
}

/** Carries version 9 progress, drafts, and the resume point across the renumbering and renamed variables. */
export function migrateV9ToV10(
  persisted: Partial<AppState>,
): Partial<AppState> {
  return {
    ...persisted,
    completed: remapRecord(persisted.completed),
    drafts: renameRecord(remapRecord(persisted.drafts), renameDraft),
    codeDrafts: renameRecord(remapRecord(persisted.codeDrafts), renameCode),
    lastProblemId: persisted.lastProblemId
      ? remapId(persisted.lastProblemId)
      : null,
  };
}
