import { describe, expect, it } from 'vitest'
import { activeStrobingSource } from './connectMode'

describe('activeStrobingSource', () => {
  it('prefers tap-waiting handle over drag state', () => {
    const result = activeStrobingSource(
      { nodeId: 'a', id: 'out', type: 'source' },
      {
        inProgress: true,
        fromHandle: { nodeId: 'b', id: 'slot-1', type: 'source' },
      },
    )
    expect(result).toEqual({ nodeId: 'a', sourceHandle: 'out' })
  })

  it('returns drag source while connecting', () => {
    const result = activeStrobingSource(null, {
      inProgress: true,
      fromHandle: { nodeId: 'list', id: 'slot-s0', type: 'source' },
    })
    expect(result).toEqual({ nodeId: 'list', sourceHandle: 'slot-s0' })
  })

  it('returns null when idle', () => {
    expect(activeStrobingSource(null, { inProgress: false, fromHandle: null })).toBeNull()
  })
})
