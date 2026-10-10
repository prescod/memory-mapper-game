import { describe, expect, it } from 'vitest'
import { entryHandle, slotHandle, VARIABLE_HANDLE } from '../canvas/types'
import { dict, graph, list, ref } from '../model/builders'
import { parseScalar } from '../model/scalar'
import { Diagram } from './testDiagram'
import { toGraph } from './toGraph'
import { CANNOT_REFER_TO_VARIABLES, verify } from './verify'

const expectations = {
  primitives: graph({ x: 10, y: 10 }),
  'reference-types': graph({ arr1: ref('list'), arr2: ref('list') }, { list: list(42) }),
  mutation: graph({ a: ref('record'), b: ref('record') }, { record: dict({ score: 200 }) }),
}

function check(name: keyof typeof expectations, diagram: Diagram) {
  return verify(toGraph(diagram.nodes, diagram.edges), expectations[name])
}

describe('primitives', () => {
  it('accepts separate scalars', () => {
    const d = new Diagram()
      .variable('vx', 'x', 'a')
      .variable('vy', 'y', 'b')
      .scalar('a', '10')
      .scalar('b', '10')
    expect(check('primitives', d).ok).toBe(true)
  })

  it('accepts a shared scalar, since immutable primitives cannot be told apart from copies', () => {
    const d = new Diagram()
      .variable('vx', 'x', 'a')
      .variable('vy', 'y', 'a')
      .scalar('a', '10')
    expect(check('primitives', d).ok).toBe(true)
  })

  it('rejects the wrong value', () => {
    const d = new Diagram()
      .variable('vx', 'x', 'a')
      .variable('vy', 'y', 'b')
      .scalar('a', '10')
      .scalar('b', '11')
    const result = check('primitives', d)
    expect(result.ok).toBe(false)
    expect(result.errors[0].nodeId).toBe('b')
  })

  it('uses a diagnostic hint when one matches a wrong scalar value', () => {
    const d = new Diagram()
      .variable('vx', 'x', 'a')
      .variable('vy', 'y', 'b')
      .scalar('a', '10')
      .scalar('b', '15')
    const hints = [
      {
        variable: 'y',
        value: '15',
        message: 'A targeted explanation for 15.',
      },
    ]
    const result = verify(toGraph(d.nodes, d.edges), expectations.primitives, hints)
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toBe('A targeted explanation for 15.')
    expect(result.errors[0].nodeId).toBe('b')
  })

  it('rejects a swapped variable name and reports the missing and unexpected ones', () => {
    const d = new Diagram()
      .variable('vx', 'x', 'a')
      .variable('vz', 'z', 'b')
      .scalar('a', '10')
      .scalar('b', '10')
    const messages = check('primitives', d).errors.map((e) => e.message)
    expect(messages).toContain('Missing the variable "y".')
    expect(messages).toContain('The variable "z" does not exist in this code.')
  })

  it('reports a variable that points to nothing', () => {
    const d = new Diagram().variable('vx', 'x').variable('vy', 'y', 'b').scalar('b', '10')
    const result = check('primitives', d)
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatchObject({ nodeId: 'vx', handle: VARIABLE_HANDLE })
  })
})

describe('shared array', () => {
  const correct = () =>
    new Diagram()
      .variable('v1', 'arr1', 'list')
      .variable('v2', 'arr2', 'list')
      .array('list', ['n'])
      .scalar('n', '42')

  it('accepts one shared array', () => {
    expect(check('reference-types', correct()).ok).toBe(true)
  })

  it('ignores coordinates and node ids', () => {
    const d = correct()
    d.nodes.forEach((node) => (node.position = { x: 999, y: -5 }))
    expect(check('reference-types', d).ok).toBe(true)
  })

  it('rejects two separate arrays where one is shared', () => {
    const d = new Diagram()
      .variable('v1', 'arr1', 'l1')
      .variable('v2', 'arr2', 'l2')
      .array('l1', ['n1'])
      .array('l2', ['n2'])
      .scalar('n1', '42')
      .scalar('n2', '42')
    const result = check('reference-types', d)
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toMatch(/share one array/)
  })

  it('rejects a scalar where an array is expected', () => {
    const d = new Diagram()
      .variable('v1', 'arr1', 'n')
      .variable('v2', 'arr2', 'n')
      .scalar('n', '42')
    expect(check('reference-types', d).ok).toBe(false)
  })

  it('rejects wrong array length and an empty slot', () => {
    const tooLong = new Diagram()
      .variable('v1', 'arr1', 'list')
      .variable('v2', 'arr2', 'list')
      .array('list', ['n', 'n'])
      .scalar('n', '42')
    expect(check('reference-types', tooLong).errors[0]).toMatchObject({ nodeId: 'list' })

    const empty = new Diagram()
      .variable('v1', 'arr1', 'list')
      .variable('v2', 'arr2', 'list')
      .array('list', [null])
    const result = check('reference-types', empty)
    expect(result.errors[0]).toMatchObject({ nodeId: 'list', handle: slotHandle('list-s0') })
  })
})

describe('mutated dictionary', () => {
  const correct = () =>
    new Diagram()
      .variable('va', 'a', 'dict')
      .variable('vb', 'b', 'dict')
      .object('dict', { score: 'new' })
      .scalar('new', '200')

  it('accepts the mutated dictionary', () => {
    expect(check('mutation', correct()).ok).toBe(true)
  })

  it('ignores the orphaned old value', () => {
    const d = correct().scalar('old', '100')
    expect(check('mutation', d).ok).toBe(true)
  })

  it('rejects the stale value', () => {
    const d = new Diagram()
      .variable('va', 'a', 'dict')
      .variable('vb', 'b', 'dict')
      .object('dict', { score: 'old' })
      .scalar('old', '100')
    expect(check('mutation', d).errors[0]).toMatchObject({ nodeId: 'old' })
  })

  it('rejects a missing key and an extra key', () => {
    const missing = new Diagram()
      .variable('va', 'a', 'dict')
      .variable('vb', 'b', 'dict')
      .object('dict', {})
    expect(check('mutation', missing).errors[0].message).toMatch(/missing the key "score"/)

    const extra = correct().scalar('x', '1')
    const dict = extra.nodes.find((n) => n.id === 'dict')!
    if (dict.type === 'object') dict.data.entries.push({ id: 'extra', key: 'bonus' })
    extra.link('dict', entryHandle('extra'), 'x')
    const result = check('mutation', extra)
    expect(result.errors).toEqual([
      expect.objectContaining({ nodeId: 'dict', handle: entryHandle('extra') }),
    ])
  })

  it('rejects a duplicated key', () => {
    const d = correct()
    const dict = d.nodes.find((n) => n.id === 'dict')!
    if (dict.type === 'object') dict.data.entries.push({ id: 'dup', key: 'score' })
    expect(check('mutation', d).ok).toBe(false)
  })

  it('treats unquoted and quoted strings as the same string', () => {
    expect(parseScalar('hi')).toEqual(parseScalar("'hi'"))
    expect(parseScalar('None')).toEqual(parseScalar('null'))
    expect(parseScalar('True')).toEqual(parseScalar('true'))
    expect(parseScalar('1.0')).toEqual(parseScalar('1'))
    expect(parseScalar('"1"').kind).toBe('string')
  })
})

describe('cycles', () => {
  it('terminates on a self-referencing array', () => {
    const user = new Diagram().variable('v', 'a', 'list').array('list', ['list'])
    const expected = new Diagram().variable('v', 'a', 'list').array('list', ['list'])
    const result = verify(
      toGraph(user.nodes, user.edges),
      toGraph(expected.nodes, expected.edges),
    )
    expect(result.ok).toBe(true)
  })
})

describe('variable references', () => {
  it('rejects a variable pointing to another variable', () => {
    const d = new Diagram()
      .variable('vx', 'x', 'vy')
      .variable('vy', 'y', 's')
      .scalar('s', '10')
    const result = check('primitives', d)
    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: CANNOT_REFER_TO_VARIABLES,
        nodeId: 'vx',
        handle: VARIABLE_HANDLE,
      }),
    )
  })

  it('rejects a variable cycle', () => {
    const d = new Diagram().variable('vx', 'x', 'vy').variable('vy', 'y', 'vx')
    const result = check('primitives', d)
    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: CANNOT_REFER_TO_VARIABLES,
        nodeId: 'vx',
        handle: VARIABLE_HANDLE,
      }),
    )
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: CANNOT_REFER_TO_VARIABLES,
        nodeId: 'vy',
        handle: VARIABLE_HANDLE,
      }),
    )
  })

  it('rejects a variable pointing to itself', () => {
    const d = new Diagram()
      .variable('vx', 'x', 'vx')
      .variable('vy', 'y', 's')
      .scalar('s', '10')
    const result = check('primitives', d)
    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: CANNOT_REFER_TO_VARIABLES,
        nodeId: 'vx',
        handle: VARIABLE_HANDLE,
      }),
    )
  })

  it('rejects an array slot pointing to a variable', () => {
    const d = new Diagram()
      .variable('v1', 'arr1', 'list')
      .variable('v2', 'arr2', 'list')
      .array('list', ['v1'])
    const result = check('reference-types', d)
    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: CANNOT_REFER_TO_VARIABLES,
        nodeId: 'list',
        handle: slotHandle('list-s0'),
      }),
    )
  })

  it('rejects an object entry pointing to a variable', () => {
    const d = new Diagram()
      .variable('va', 'a', 'dict')
      .variable('vb', 'b', 'dict')
      .object('dict', { score: 'va' })
    const result = check('mutation', d)
    expect(result.ok).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: CANNOT_REFER_TO_VARIABLES,
        nodeId: 'dict',
        handle: entryHandle('dict-e0'),
      }),
    )
  })
})
