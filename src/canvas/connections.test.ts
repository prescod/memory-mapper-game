import { describe, expect, it } from 'vitest'
import { Diagram } from '../verify/testDiagram'
import { connectReplacing, isValidConnection, removeEdgesFromHandle } from './connections'
import { TARGET_HANDLE, VARIABLE_HANDLE, slotHandle } from './types'

const diagram = () =>
  new Diagram()
    .variable('v', 'a')
    .scalar('s', '1')
    .array('arr', [null, null])
    .object('obj', { k: null })

const conn = (
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string = TARGET_HANDLE,
) => ({ source, sourceHandle, target, targetHandle })

describe('isValidConnection', () => {
  const { nodes } = diagram()

  it('allows variables, array slots and object entries to reference scalars and containers', () => {
    expect(isValidConnection(conn('v', VARIABLE_HANDLE, 's'), nodes)).toBe(true)
    expect(isValidConnection(conn('v', VARIABLE_HANDLE, 'arr'), nodes)).toBe(true)
    expect(isValidConnection(conn('arr', slotHandle('arr-s0'), 'obj'), nodes)).toBe(true)
    expect(isValidConnection(conn('obj', 'entry-obj-e0', 's'), nodes)).toBe(true)
  })

  it('allows a container to reference itself', () => {
    expect(isValidConnection(conn('arr', slotHandle('arr-s0'), 'arr'), nodes)).toBe(true)
  })

  it('allows pointing at a variable', () => {
    expect(isValidConnection(conn('v', VARIABLE_HANDLE, 'v'), nodes)).toBe(true)
    expect(isValidConnection(conn('arr', slotHandle('arr-s0'), 'v'), nodes)).toBe(true)
    expect(isValidConnection(conn('obj', 'entry-obj-e0', 'v'), nodes)).toBe(true)
  })

  it('forbids scalars from having outgoing references', () => {
    expect(isValidConnection(conn('s', 'out', 'arr'), nodes)).toBe(false)
  })

  it('forbids starting from a target handle or ending on a source handle', () => {
    expect(isValidConnection(conn('arr', TARGET_HANDLE, 's'), nodes)).toBe(false)
    expect(isValidConnection(conn('v', VARIABLE_HANDLE, 'arr', 'slot-x'), nodes)).toBe(false)
  })

  it('forbids unknown nodes', () => {
    expect(isValidConnection(conn('v', VARIABLE_HANDLE, 'ghost'), nodes)).toBe(false)
  })
})

describe('connectReplacing', () => {
  it('keeps one outgoing edge per source handle', () => {
    const first = connectReplacing([], conn('v', VARIABLE_HANDLE, 's'), 'e1')
    const second = connectReplacing(first, conn('v', VARIABLE_HANDLE, 'arr'), 'e2')
    expect(second).toHaveLength(1)
    expect(second[0]).toMatchObject({ id: 'e2', target: 'arr' })
  })

  it('allows many references to one target and one edge per slot', () => {
    let edges = connectReplacing([], conn('v', VARIABLE_HANDLE, 'arr'), 'e1')
    edges = connectReplacing(edges, conn('arr', slotHandle('arr-s0'), 's'), 'e2')
    edges = connectReplacing(edges, conn('arr', slotHandle('arr-s1'), 's'), 'e3')
    expect(edges).toHaveLength(3)
  })
})

describe('removeEdgesFromHandle', () => {
  it('drops only the edge leaving that handle', () => {
    let edges = connectReplacing([], conn('arr', slotHandle('arr-s0'), 's'), 'e1')
    edges = connectReplacing(edges, conn('arr', slotHandle('arr-s1'), 's'), 'e2')
    const remaining = removeEdgesFromHandle(edges, 'arr', slotHandle('arr-s0'))
    expect(remaining.map((edge) => edge.id)).toEqual(['e2'])
  })
})
