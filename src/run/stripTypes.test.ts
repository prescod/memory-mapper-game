import { describe, expect, it } from 'vitest'
import { UserCodeError } from './errors'
import { stripTypes } from './stripTypes'

describe('stripTypes', () => {
  it('strips type annotations from variable declarations and function signatures', () => {
    const ts = 'let a: number[] = [1, 2];\nfunction f(x: string): void { console.log(x); }'
    const js = stripTypes(ts)
    expect(js).toBe('let a = [1, 2];\nfunction f(x) { console.log(x); }')
  })

  it('preserves line numbers', () => {
    const ts = 'let a: number = 1;\n\nlet b: string = "hello";\nlet c: boolean = true;'
    const js = stripTypes(ts)
    expect(js.split('\n')).toHaveLength(ts.split('\n').length)
  })

  it('throws a UserCodeError on invalid TypeScript syntax', () => {
    expect(() => stripTypes('let a: = 1;')).toThrow(UserCodeError)
    expect(() => stripTypes('let a: = 1;')).toThrow(/TypeScript syntax error/)
  })
})
