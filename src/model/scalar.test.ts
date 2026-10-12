import { describe, expect, it } from 'vitest'
import { formatScalar, parseScalar } from './scalar'

describe('parseScalar in TypeScript mode', () => {
  it('accepts null, true, and false as its own keyword spellings', () => {
    expect(parseScalar('null', 'typescript')).toEqual({ type: 'scalar', kind: 'null', value: 'null' })
    expect(parseScalar('true', 'typescript')).toEqual({ type: 'scalar', kind: 'boolean', value: 'true' })
    expect(parseScalar('false', 'typescript')).toEqual({ type: 'scalar', kind: 'boolean', value: 'false' })
  })

  it('identifies Python keywords as foreign spellings from another language', () => {
    expect(parseScalar('None', 'typescript')).toEqual({
      type: 'scalar',
      kind: 'string',
      value: 'None',
      otherLanguageValue: { kind: 'null', value: 'null' },
    })
    expect(parseScalar('True', 'typescript')).toEqual({
      type: 'scalar',
      kind: 'string',
      value: 'True',
      otherLanguageValue: { kind: 'boolean', value: 'true' },
    })
    expect(parseScalar('False', 'typescript')).toEqual({
      type: 'scalar',
      kind: 'string',
      value: 'False',
      otherLanguageValue: { kind: 'boolean', value: 'false' },
    })
  })

  it('formats scalars using TypeScript keywords', () => {
    expect(formatScalar({ kind: 'null', value: 'null' }, 'typescript')).toBe('null')
    expect(formatScalar({ kind: 'boolean', value: 'true' }, 'typescript')).toBe('true')
    expect(formatScalar({ kind: 'boolean', value: 'false' }, 'typescript')).toBe('false')
    expect(formatScalar({ kind: 'number', value: '42' }, 'typescript')).toBe('42')
    expect(formatScalar({ kind: 'string', value: 'hello' }, 'typescript')).toBe('"hello"')
  })
})
