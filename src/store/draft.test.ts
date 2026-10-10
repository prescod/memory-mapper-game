import { describe, expect, it } from 'vitest'
import { Diagram } from '../verify/testDiagram'
import { toPersistableDraft } from './draft'

describe('toPersistableDraft', () => {
  it('drops transient React Flow state but keeps content', () => {
    const d = new Diagram().variable('v', 'x', 's').scalar('s', '1')
    const noisy = {
      nodes: d.nodes.map((node) => ({ ...node, selected: true, measured: { width: 1, height: 2 } })),
      edges: d.edges.map((edge) => ({ ...edge, selected: true })),
    }

    const saved = toPersistableDraft(noisy)

    expect(saved.nodes[0]).toEqual({
      id: 'v',
      type: 'variable',
      position: d.nodes[0].position,
      data: { name: 'x' },
    })
    expect(saved.edges[0]).not.toHaveProperty('selected')
    expect(saved.edges[0]).toMatchObject({ source: 'v', target: 's' })
  })
})
