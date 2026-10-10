/** A problem in the learner's code that they can act on, as opposed to a bug in the app. */
export class UserCodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserCodeError'
  }
}

export function describeError(error: unknown): string {
  if (error instanceof UserCodeError) return error.message
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error)
}
