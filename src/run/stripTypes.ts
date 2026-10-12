import { transform } from 'sucrase'
import { UserCodeError } from './errors'

/**
 * Strips TypeScript type annotations using Sucrase without transforming modern JS syntax,
 * preserving line numbers so error locations remain accurate.
 */
export function stripTypes(source: string): string {
  try {
    return transform(source, {
      transforms: ['typescript'],
      disableESTransforms: true,
    }).code
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new UserCodeError(`TypeScript syntax error: ${message}`)
  }
}
