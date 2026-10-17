import { describe, expect, it } from "vitest";
import type { Draft } from "./draft";
import { migrateV9ToV10 } from "./migrations";

const draft = { nodes: [], edges: [] };

describe("migrateV9ToV10", () => {
  it("moves progress for renumbered and relocated problems", () => {
    const migrated = migrateV9ToV10({
      completed: {
        "identity-4:python": true,
        "identity-5:javascript": true,
        "rebinding-5:python": true,
        "rebinding-4:python": true,
        "rebinding-6:javascript": true,
      },
      drafts: { "identity-9:python": draft },
      codeDrafts: { "identity-10:typescript": "b = a" },
      lastProblemId: "rebinding-7",
    });
    expect(migrated.completed).toEqual({
      "rebinding-1:python": true,
      "identity-3:javascript": true,
      "rebinding-3:python": true,
      "rebinding-5:python": true,
      "rebinding-7:javascript": true,
    });
    expect(Object.keys(migrated.drafts!)).toEqual(["rebinding-6:python"]);
    expect(migrated.codeDrafts).toEqual({ "identity-9:typescript": "y = x" });
    expect(migrated.lastProblemId).toBe("rebinding-10");
  });

  it("drops progress for removed problems and leaves other keys alone", () => {
    const migrated = migrateV9ToV10({
      completed: {
        "identity-3:python": true,
        "identity-15:python": true,
        "scalars-1:python": true,
      },
      drafts: { "rebinding-10:javascript": draft },
      lastProblemId: "identity-15",
    });
    expect(migrated.completed).toEqual({ "scalars-1:python": true });
    expect(migrated.drafts).toEqual({});
    expect(migrated.lastProblemId).toBeNull();
  });

  it("renames starter variables and string values in drafts and code", () => {
    const variable = (id: string, name: string) => ({
      id,
      type: "variable",
      position: { x: 0, y: 0 },
      data: { name },
    });
    const scalar = (id: string, text: string) => ({
      id,
      type: "scalar",
      position: { x: 0, y: 0 },
      data: { kind: "string", text },
    });
    const migrated = migrateV9ToV10({
      drafts: {
        "mutating-arrays-9:python": {
          nodes: [
            variable("v1", "a"),
            variable("v2", "b"),
            variable("v3", "tmp"),
            scalar("s1", '"x"'),
          ],
          edges: [],
        } as unknown as Draft,
        "scalars-1:python": {
          nodes: [variable("v1", "a")],
          edges: [],
        } as unknown as Draft,
      },
      codeDrafts: {
        "mutating-arrays-9:python":
          'a = ["x", "y"]\nb = a\nb.append("z")\nprint(a.copy())',
        "scalars-1:python": "a = 1",
      },
    });
    const names = migrated.drafts!["mutating-arrays-9:python"].nodes.map(
      (node) =>
        (node.data as { name?: string; text?: string }).name ??
        (node.data as { text?: string }).text,
    );
    expect(names).toEqual(["x", "y", "tmp", '"cat"']);
    expect(
      (migrated.drafts!["scalars-1:python"].nodes[0].data as { name: string })
        .name,
    ).toBe("a");
    expect(migrated.codeDrafts!["mutating-arrays-9:python"]).toBe(
      'x = ["cat", "dog"]\ny = x\ny.append("fox")\nprint(x.copy())',
    );
    expect(migrated.codeDrafts!["scalars-1:python"]).toBe("a = 1");
  });
});
