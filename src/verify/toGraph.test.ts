import { describe, expect, it } from 'vitest'
import { Diagram } from './testDiagram'
import { toGraph } from './toGraph'
import { verify } from './verify'
import { graph, pet, ref } from '../model/builders'

describe('toGraph variable names', () => {
  it('strips surrounding quotes from a variable name', () => {
    const { nodes, edges } = new Diagram().variable('v', '"a"')
    const user = toGraph(nodes, edges, 'javascript')
    expect(user.variables[0].name).toBe('a')
  })

  it('accepts a quoted variable name when the answer uses the bare name', () => {
    const expected = graph({ a: 1 })
    const { nodes, edges } = new Diagram().variable('v', "'a'").scalar('s', '1').link('v', 'out', 's')
    const result = verify(toGraph(nodes, edges, 'javascript'), expected)
    expect(result.ok).toBe(true)
  })
})

describe('toGraph pet labels', () => {
  it('strips surrounding quotes from a Pet label', () => {
    const { nodes, edges } = new Diagram()
      .variable('v', 'a')
      .pet('p', '"Milo"')
      .link('v', 'out', 'p')
    const user = toGraph(nodes, edges, 'javascript')
    expect(user.nodes.p).toMatchObject({ type: 'instance', label: 'Milo' })
  })

  it('accepts a quoted Pet label when the answer uses the unquoted tag', () => {
    const expected = graph({ a: ref('p') }, { p: pet('Milo') })
    const { nodes, edges } = new Diagram()
      .variable('v', 'a')
      .pet('p', "'Milo'")
      .link('v', 'out', 'p')
    const result = verify(toGraph(nodes, edges, 'javascript'), expected)
    expect(result.ok).toBe(true)
  })
})
