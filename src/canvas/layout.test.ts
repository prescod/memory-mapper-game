import { describe, expect, it } from 'vitest'
import { graph, withGarbage } from '../model/builders'
import { problems } from '../model/levels'
import { LANGUAGES } from '../model/types'
import { verify } from '../verify/verify'
import { toGraph } from '../verify/toGraph'
import { findOverlappingFlowNodePairs } from './nodeGeometry'
import { toFlow } from './layout'

describe('toFlow', () => {
  it.each(
    problems.flatMap((problem) => LANGUAGES.map((language) => [problem.id, language, problem.expected] as const)),
  )('draws %s so that reading the diagram back in %s gives the same graph', (_id, language, expected) => {
    const { nodes, edges } = toFlow(expected)
    const readBack = toGraph(nodes, edges, language)
    expect(verify(readBack, expected).errors).toEqual([])
    expect(verify(expected, readBack).errors).toEqual([])
  })

  it('gives every scalar its explicit kind, so it is spelled for whichever language is shown', () => {
    const { nodes } = toFlow(graph({ a: null, b: true, c: 'hi', d: 3 }))
    const scalars = nodes.flatMap((node) => (node.type === 'scalar' ? [node.data] : []))
    expect(scalars).toEqual([
      { kind: 'null', text: '' },
      { kind: 'boolean', text: 'true' },
      { kind: 'string', text: 'hi' },
      { kind: 'number', text: '3' },
    ])
  })

  it('places every node once, with unique ids, even when references form a cycle', () => {
    const cyclic = problems.find((problem) => problem.id === 'nesting-12')!
    const { nodes } = toFlow(cyclic.expected)
    const ids = nodes.map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(nodes).toHaveLength(cyclic.expected.variables.length + Object.keys(cyclic.expected.nodes).length)
  })

  it('puts variables in the top row and what they point to further down', () => {
    const { nodes } = toFlow(problems.find((problem) => problem.id === 'arrays-1')!.expected)
    const variable = nodes.find((node) => node.type === 'variable')!
    const array = nodes.find((node) => node.type === 'array')!
    expect(variable.position.y).toBeLessThan(array.position.y)
  })

  it('places unreached nodes in a row after the reachable ones', () => {
    const memory = withGarbage(graph({ x: 7 }), 5)
    const { nodes } = toFlow(memory)
    const variable = nodes.find((node) => node.type === 'variable')!
    const seven = nodes.find((node) => node.type === 'scalar' && node.data.text === '7')!
    const five = nodes.find((node) => node.type === 'scalar' && node.data.text === '5')!
    expect(variable.position.y).toBe(0)
    expect(seven.position.y).toBeLessThan(five.position.y)
  })

  it.each(problems.map((problem) => problem.id))(
    'lays out %s without overlapping node boxes (horizontal or vertical)',
    (problemId) => {
      const problem = problems.find((candidate) => candidate.id === problemId)!
      const { nodes } = toFlow(problem.expected)
      expect(findOverlappingFlowNodePairs(nodes)).toEqual([])
    },
  )

  it('layers outer containers before inner containers when an outer container references an inner one', () => {
    const pairingProblem = problems.find((problem) => problem.id === 'functions-7')!
    const { nodes } = toFlow(pairingProblem.expected)
    const gridNode = nodes.find((node) => node.id === 'container:grid')!
    const rowNode = nodes.find((node) => node.id === 'container:row')!
    const scalarNode = nodes.find((node) => node.id === 'scalar:0')!

    expect(gridNode.position.y).toBeLessThan(rowNode.position.y)
    expect(rowNode.position.y).toBeLessThan(scalarNode.position.y)
  })
})
