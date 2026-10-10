import type { MemFlowEdge, MemFlowNode } from '../canvas/types'

export interface Draft {
  nodes: MemFlowNode[]
  edges: MemFlowEdge[]
}

/**
 * Keeps only what must survive a reload. Transient React Flow fields such as
 * `selected` and measured sizes are recomputed on load, so storing them would
 * only restore stale selection and dimensions.
 */
export function toPersistableDraft({ nodes, edges }: Draft): Draft {
  return {
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data }) as MemFlowNode),
    edges: edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
    })),
  }
}
