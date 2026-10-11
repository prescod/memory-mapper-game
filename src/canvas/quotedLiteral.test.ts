import { describe, expect, it } from 'vitest'
import { Diagram } from '../verify/testDiagram'
import { quotedLiteralErrors, quotedLiteralFieldError } from './quotedLiteral'

describe('quotedLiteralFieldError', () => {
  it('allows empty input', () => {
    expect(quotedLiteralFieldError('', 'javascript')).toBeUndefined()
    expect(quotedLiteralFieldError('   ', 'javascript')).toBeUndefined()
  })

  it('allows a quoted literal', () => {
    expect(quotedLiteralFieldError('"Ada"', 'javascript')).toBeUndefined()
    expect(quotedLiteralFieldError("'Ada'", 'javascript')).toBeUndefined()
    expect(quotedLiteralFieldError('"Ada"', 'python')).toBeUndefined()
    expect(quotedLiteralFieldError("'Ada'", 'python')).toBeUndefined()
  })

  it('rejects bare text', () => {
    expect(quotedLiteralFieldError('Ada', 'javascript')).toMatch(/Surround the value with " quotes/)
    expect(quotedLiteralFieldError('Ada', 'python')).toMatch(/Surround the value with " quotes/)
  })
})

describe('quotedLiteralErrors', () => {
  it('flags string scalars and Pet labels without quotes', () => {
    const { nodes } = new Diagram()
      .scalar('s', 'hi', 'string')
      .pet('p', 'Milo')
    const errors = quotedLiteralErrors(nodes, 'javascript')
    expect(errors).toHaveLength(2)
    expect(errors.map((error) => error.nodeId).sort()).toEqual(['p', 's'])
  })

  it('accepts quoted string scalars and Pet labels', () => {
    const { nodes } = new Diagram()
      .scalar('s', '"hi"', 'string')
      .pet('p', '"Milo"')
    expect(quotedLiteralErrors(nodes, 'javascript')).toEqual([])
  })
})
