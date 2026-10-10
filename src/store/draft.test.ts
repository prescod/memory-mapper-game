import { describe, expect, it } from 'vitest'
import { Diagram } from '../verify/testDiagram'
import { toPersistableDraft, withScalarKinds } from './draft'

describe('withScalarKinds', () => {
  it('reads scalars saved without a kind as auto, keeping their text', () => {
    const d = new Diagram().variable('v', 'x', 's').scalar('s', 'None')
    const old = d.nodes.map((node) => (node.type === 'scalar' ? { ...node, data: { text: node.data.text } } : node))
    const [upgraded] = Object.values(withScalarKinds({ k: { nodes: old as typeof d.nodes, edges: d.edges } }))
    expect(upgraded.nodes[1].data).toEqual({ kind: 'auto', text: 'None' })
    expect(upgraded.nodes[0]).toBe(d.nodes[0])
  })
})

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
