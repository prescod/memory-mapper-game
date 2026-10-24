import { describe, expect, it } from 'vitest'
import { TARGET_HANDLE, VARIABLE_HANDLE, slotHandle } from '../canvas/types'
import { Diagram } from '../verify/testDiagram'
import { dropConnection, tapConnection } from './tapConnect'

const { nodes } = new Diagram()
  .variable('v', 'a')
  .scalar('s', '1')
  .array('arr', [null])

describe('tapConnection', () => {
  it('connects an outgoing handle to the tapped node', () => {
    expect(tapConnection({ nodeId: 'v', id: VARIABLE_HANDLE, type: 'source' }, 's', nodes)).toEqual({
      source: 'v',
      sourceHandle: VARIABLE_HANDLE,
      target: 's',
      targetHandle: TARGET_HANDLE,
    })
  })

  it('lets a container slot point at its own container', () => {
    const pending = { nodeId: 'arr', id: slotHandle('arr-s0'), type: 'source' as const }
    expect(tapConnection(pending, 'arr', nodes)).toMatchObject({ source: 'arr', target: 'arr' })
  })

  it('cannot finish a reference started from an incoming handle', () => {
    expect(tapConnection({ nodeId: 's', id: TARGET_HANDLE, type: 'target' }, 'v', nodes)).toBeNull()
  })

  it('rejects targets that are not on the canvas', () => {
    expect(
      tapConnection({ nodeId: 'v', id: VARIABLE_HANDLE, type: 'source' }, 'ghost', nodes),
    ).toBeNull()
  })
})

describe('dropConnection', () => {
  const fromHandle = { nodeId: 'v', id: VARIABLE_HANDLE, type: 'source' as const }

  it('connects a drag dropped on a block body', () => {
    expect(dropConnection({ isValid: false, fromHandle }, 's', nodes)).toMatchObject({
      source: 'v',
      target: 's',
      targetHandle: TARGET_HANDLE,
    })
  })

  it('leaves a drop React Flow already connected alone', () => {
    expect(dropConnection({ isValid: true, fromHandle }, 's', nodes)).toBeNull()
  })

  it('ignores drops off any block', () => {
    expect(dropConnection({ isValid: false, fromHandle }, null, nodes)).toBeNull()
  })

  it('ignores drops back on the starting block', () => {
    const slot = { nodeId: 'arr', id: slotHandle('arr-s0'), type: 'source' as const }
    expect(dropConnection({ isValid: false, fromHandle: slot }, 'arr', nodes)).toBeNull()
  })
})
