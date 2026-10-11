import type { Edge, Node } from '@xyflow/react'
import type { ScalarKind } from '../model/types'

export type VariableData = { name: string }
/**
 * With kind `'auto'`, `text` is whatever the learner typed and the kind is read
 * from it. With an explicit kind, `text` holds a number, `true`/`false`, or a
 * quoted string literal; it is unused for null.
 */
export type ScalarData = { kind: ScalarKind | 'auto'; text: string }
export type ArrayData = { slots: { id: string }[] }
export type ObjectData = { entries: { id: string; key: string }[] }
/** An opaque `Pet`: a label with no slots or entries to edit. */
export type PetData = { label: string }

export type VariableFlowNode = Node<VariableData, 'variable'>
export type ScalarFlowNode = Node<ScalarData, 'scalar'>
export type ArrayFlowNode = Node<ArrayData, 'array'>
export type ObjectFlowNode = Node<ObjectData, 'object'>
export type PetFlowNode = Node<PetData, 'pet'>

export type MemFlowNode = VariableFlowNode | ScalarFlowNode | ArrayFlowNode | ObjectFlowNode | PetFlowNode
export type MemFlowEdge = Edge

export type MemNodeType = MemFlowNode['type']

/** Handle on every node that can be the target of a reference. */
export const TARGET_HANDLE = 'in'
/** The single outgoing handle of a Variable node. */
export const VARIABLE_HANDLE = 'out'

export const slotHandle = (slotId: string) => `slot-${slotId}`
export const entryHandle = (entryId: string) => `entry-${entryId}`

export function newId(): string {
  return crypto.randomUUID()
}

export function createNode(type: MemNodeType, position: { x: number; y: number }): MemFlowNode {
  const id = newId()
  switch (type) {
    case 'variable':
      return { id, type, position, data: { name: '' } }
    case 'scalar':
      return { id, type, position, data: { kind: 'auto', text: '' } }
    case 'array':
      return { id, type, position, data: { slots: [{ id: newId() }] } }
    case 'object':
      return { id, type, position, data: { entries: [{ id: newId(), key: '' }] } }
    case 'pet':
      return { id, type, position, data: { label: '' } }
  }
}
