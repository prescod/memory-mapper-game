import { describe, expect, it } from 'vitest'
import { problems } from '../model/levels'
import { verify } from '../verify/verify'
import { toGraph } from '../verify/toGraph'
import { toFlow } from './layout'

describe('toFlow', () => {
  it.each(problems.map((problem) => [problem.id, problem.expected] as const))(
    'draws %s so that reading the diagram back gives the same graph',
    (_id, expected) => {
      const { nodes, edges } = toFlow(expected)
      const readBack = toGraph(nodes, edges)
      expect(verify(readBack, expected).errors).toEqual([])
      expect(verify(expected, readBack).errors).toEqual([])
    },
  )

  it('places every node once, with unique ids, even when references form a cycle', () => {
    const cyclic = problems.find((problem) => problem.id === 'cycles-8')!
    const { nodes } = toFlow(cyclic.expected)
    const ids = nodes.map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(nodes).toHaveLength(cyclic.expected.variables.length + Object.keys(cyclic.expected.nodes).length)
  })

  it('puts variables in the first column and what they point to further right', () => {
    const { nodes } = toFlow(problems.find((problem) => problem.id === 'arrays-1')!.expected)
    const variable = nodes.find((node) => node.type === 'variable')!
    const array = nodes.find((node) => node.type === 'array')!
    expect(variable.position.x).toBeLessThan(array.position.x)
  })
})
