import { describe, expect, it } from 'vitest'
import { duplicateElements } from './duplicate'
import {
  TARGET_HANDLE,
  VARIABLE_HANDLE,
  entryHandle,
  newId,
  slotHandle,
  type ArrayFlowNode,
  type MemFlowEdge,
  type ObjectFlowNode,
  type ScalarFlowNode,
  type VariableFlowNode,
} from './types'

describe('duplicateElements', () => {
  it('returns unchanged nodes and edges when nothing is selected', () => {
    const node: VariableFlowNode = {
      id: 'v1',
      type: 'variable',
      position: { x: 10, y: 20 },
      data: { name: 'x' },
      selected: false,
    }
    const result = duplicateElements([node], [])
    expect(result.nodes).toEqual([node])
    expect(result.edges).toEqual([])
    expect(result.clonedNodes).toHaveLength(0)
    expect(result.clonedEdges).toHaveLength(0)
  })

  it('duplicates a scalar node with an offset position and marks copy selected', () => {
    const node: ScalarFlowNode = {
      id: 's1',
      type: 'scalar',
      position: { x: 50, y: 100 },
      data: { kind: 'number', text: '42' },
      selected: true,
    }

    const result = duplicateElements([node], [], { x: 20, y: 30 })

    expect(result.clonedNodes).toHaveLength(1)
    const cloned = result.clonedNodes[0] as ScalarFlowNode
    expect(cloned.id).not.toBe('s1')
    expect(cloned.position).toEqual({ x: 70, y: 130 })
    expect(cloned.data).toEqual({ kind: 'number', text: '42' })
    expect(cloned.selected).toBe(true)

    expect(result.nodes[0].selected).toBe(false)
    expect(result.nodes).toHaveLength(2)
  })

  it('duplicates an array node with fresh slot IDs and remaps slot edge handles', () => {
    const slot1 = newId()
    const slot2 = newId()
    const arrayNode: ArrayFlowNode = {
      id: 'arr1',
      type: 'array',
      position: { x: 0, y: 0 },
      data: { slots: [{ id: slot1 }, { id: slot2 }] },
      selected: true,
    }
    const scalarNode: ScalarFlowNode = {
      id: 's1',
      type: 'scalar',
      position: { x: 0, y: 200 },
      data: { kind: 'number', text: '1' },
      selected: false,
    }
    const edge: MemFlowEdge = {
      id: 'e1',
      source: 'arr1',
      target: 's1',
      sourceHandle: slotHandle(slot1),
      targetHandle: TARGET_HANDLE,
      selected: false,
    }

    const result = duplicateElements([arrayNode, scalarNode], [edge])

    expect(result.clonedNodes).toHaveLength(1)
    const clonedArray = result.clonedNodes[0] as ArrayFlowNode
    expect(clonedArray.id).not.toBe('arr1')
    expect(clonedArray.data.slots).toHaveLength(2)
    expect(clonedArray.data.slots[0].id).not.toBe(slot1)
    expect(clonedArray.data.slots[1].id).not.toBe(slot2)

    expect(result.clonedEdges).toHaveLength(1)
    const clonedEdge = result.clonedEdges[0]
    expect(clonedEdge.source).toBe(clonedArray.id)
    expect(clonedEdge.sourceHandle).toBe(slotHandle(clonedArray.data.slots[0].id))
    // Points to the unselected target as an alias
    expect(clonedEdge.target).toBe('s1')
    expect(clonedEdge.selected).toBe(true)
  })

  it('duplicates an object node with fresh entry IDs and remaps entry handles', () => {
    const entry1 = newId()
    const objNode: ObjectFlowNode = {
      id: 'obj1',
      type: 'object',
      position: { x: 10, y: 10 },
      data: { entries: [{ id: entry1, key: 'count' }] },
      selected: true,
    }
    const scalarNode: ScalarFlowNode = {
      id: 's1',
      type: 'scalar',
      position: { x: 10, y: 150 },
      data: { kind: 'number', text: '99' },
      selected: false,
    }
    const edge: MemFlowEdge = {
      id: 'e1',
      source: 'obj1',
      target: 's1',
      sourceHandle: entryHandle(entry1),
      targetHandle: TARGET_HANDLE,
    }

    const result = duplicateElements([objNode, scalarNode], [edge])

    const clonedObj = result.clonedNodes[0] as ObjectFlowNode
    expect(clonedObj.data.entries[0].key).toBe('count')
    expect(clonedObj.data.entries[0].id).not.toBe(entry1)

    const clonedEdge = result.clonedEdges[0]
    expect(clonedEdge.source).toBe(clonedObj.id)
    expect(clonedEdge.sourceHandle).toBe(entryHandle(clonedObj.data.entries[0].id))
    expect(clonedEdge.target).toBe('s1')
  })

  it('remaps internal edges between two selected nodes to connect their clones', () => {
    const varNode: VariableFlowNode = {
      id: 'v1',
      type: 'variable',
      position: { x: 0, y: 0 },
      data: { name: 'a' },
      selected: true,
    }
    const scalarNode: ScalarFlowNode = {
      id: 's1',
      type: 'scalar',
      position: { x: 0, y: 100 },
      data: { kind: 'number', text: '5' },
      selected: true,
    }
    const edge: MemFlowEdge = {
      id: 'e1',
      source: 'v1',
      target: 's1',
      sourceHandle: VARIABLE_HANDLE,
      targetHandle: TARGET_HANDLE,
      data: { bend: { x: 10, y: 50 } },
      selected: true,
    }

    const result = duplicateElements([varNode, scalarNode], [edge], { x: 50, y: 50 })

    expect(result.clonedNodes).toHaveLength(2)
    const clonedVar = result.clonedNodes.find((n) => n.type === 'variable')!
    const clonedScalar = result.clonedNodes.find((n) => n.type === 'scalar')!

    expect(result.clonedEdges).toHaveLength(1)
    const clonedEdge = result.clonedEdges[0]
    expect(clonedEdge.source).toBe(clonedVar.id)
    expect(clonedEdge.target).toBe(clonedScalar.id)
    expect(clonedEdge.data?.bend).toEqual({ x: 60, y: 100 })
    expect(clonedEdge.selected).toBe(true)
  })

  it('handles self-referential cycles within duplicated containers', () => {
    const slotId = newId()
    const arrayNode: ArrayFlowNode = {
      id: 'arr1',
      type: 'array',
      position: { x: 10, y: 10 },
      data: { slots: [{ id: slotId }] },
      selected: true,
    }
    const cycleEdge: MemFlowEdge = {
      id: 'e_cycle',
      source: 'arr1',
      target: 'arr1',
      sourceHandle: slotHandle(slotId),
      targetHandle: TARGET_HANDLE,
    }

    const result = duplicateElements([arrayNode], [cycleEdge])

    const clonedArray = result.clonedNodes[0] as ArrayFlowNode
    const clonedEdge = result.clonedEdges[0]
    expect(clonedEdge.source).toBe(clonedArray.id)
    expect(clonedEdge.target).toBe(clonedArray.id)
    expect(clonedEdge.sourceHandle).toBe(slotHandle(clonedArray.data.slots[0].id))
  })
})
