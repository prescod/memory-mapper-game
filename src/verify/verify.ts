import { formatScalar } from '../model/scalar'
import {
  CONTAINER_NAMES,
  LANGUAGE_LABELS,
  textIn,
  type DiagnosticHint,
  type Language,
  type MemNode,
  type MemoryGraph,
  type NodeId,
  type Slot,
  type VerifyError,
  type VerifyResult,
} from '../model/types'

/** The place a reference starts from, used to attach feedback to the right edge. */
interface Origin {
  nodeId?: NodeId
  handle?: string
}

export const CANNOT_REFER_TO_VARIABLES =
  'Variables can NEVER refer to variables. Variables can only refer to values.'

/**
 * Compares the learner's graph to the expected one by walking outward from the
 * named variables. Variable names make every walk deterministic, so a pair of
 * id maps is enough to check that aliasing matches in both directions; a general
 * graph-isomorphism search is never needed. Nodes unreachable from a variable
 * (garbage) are never inspected.
 *
 * Only arrays, objects, and instances have identity. Scalars are immutable, so a program
 * cannot distinguish a copied value from a shared one and either diagram is
 * accepted; only the scalar's type and value are compared.
 *
 * `language` only affects wording: values and containers are named the way
 * that language names them.
 */
export function verify(
  user: MemoryGraph,
  expected: MemoryGraph,
  hints?: DiagnosticHint[],
  language: Language = 'javascript',
): VerifyResult {
  const errors: VerifyError[] = []
  const report = (message: string, origin: Origin = {}) => errors.push({ message, ...origin })
  const name = (type: MemNode['type']) =>
    type === 'scalar' ? 'primitive' : type === 'instance' ? 'Pet' : CONTAINER_NAMES[language][type]

  const isVariableTarget = (target: NodeId | null): boolean => {
    if (target === null) return false
    return user.variables.some((v) => v.nodeId === target || (!v.nodeId && v.name === target))
  }

  for (const variable of user.variables) {
    if (isVariableTarget(variable.slot.target)) {
      report(CANNOT_REFER_TO_VARIABLES, {
        nodeId: variable.nodeId,
        handle: variable.slot.handle,
      })
    }
  }

  for (const [nodeId, node] of Object.entries(user.nodes)) {
    if (node.type === 'array') {
      for (const slot of node.slots) {
        if (isVariableTarget(slot.target)) {
          report(CANNOT_REFER_TO_VARIABLES, { nodeId, handle: slot.handle })
        }
      }
    } else if (node.type === 'object') {
      for (const entry of node.entries) {
        if (isVariableTarget(entry.slot.target)) {
          report(CANNOT_REFER_TO_VARIABLES, { nodeId, handle: entry.slot.handle })
        }
      }
    }
  }

  /** user node -> expected node, and the reverse; both must stay one-to-one. */
  const userToExpected = new Map<NodeId, NodeId>()
  const expectedToUser = new Map<NodeId, NodeId>()

  const say = (hint: DiagnosticHint | undefined): string | undefined =>
    hint && textIn(hint.message, language)

  const aliasMessage = (kind: 'shared' | 'separate', variableName?: string): string | undefined => {
    const exact = hints?.find(
      (candidate) => candidate.aliasing === kind && (!variableName || candidate.variable === variableName),
    )
    return say(exact) ?? say(hints?.find((candidate) => candidate.aliasing === kind))
  }

  const checkTarget = (
    slot: Slot,
    expectedTarget: NodeId | null,
    origin: Origin,
    label: string,
    variableName?: string,
  ) => {
    if (expectedTarget === null) return
    if (slot.target === null) {
      report(`${label} does not point to anything yet.`, origin)
      return
    }
    if (isVariableTarget(slot.target)) return
    compare(slot.target, expectedTarget, origin, variableName)
  }

  const compare = (
    userId: NodeId,
    expectedId: NodeId,
    origin: Origin,
    variableName?: string,
  ) => {
    const userNode = user.nodes[userId]
    const expectedNode = expected.nodes[expectedId]
    if (!userNode || !expectedNode) {
      report('This reference points to something that is not part of the diagram.', origin)
      return
    }

    if (userNode.type !== expectedNode.type) {
      report(`This should point to ${article(name(expectedNode.type))}, not ${article(name(userNode.type))}.`, origin)
      return
    }

    if (userNode.type !== 'scalar') {
      const mappedExpected = userToExpected.get(userId)
      const mappedUser = expectedToUser.get(expectedId)
      if (mappedExpected !== undefined && mappedExpected !== expectedId) {
        report(
          aliasMessage('shared', variableName) ??
            `These references should point to different ${name(userNode.type)}s, but they share one.`,
          origin,
        )
        return
      }
      if (mappedUser !== undefined && mappedUser !== userId) {
        report(
          aliasMessage('separate', variableName) ??
            `These references should share one ${name(userNode.type)}, but they point to different ones.`,
          origin,
        )
        return
      }
      if (mappedExpected === expectedId) return
      userToExpected.set(userId, expectedId)
      expectedToUser.set(expectedId, userId)
    }

    compareContents(userId, expectedId, variableName)
  }

  const compareContents = (userId: NodeId, expectedId: NodeId, variableName?: string) => {
    const userNode = user.nodes[userId]
    const expectedNode = expected.nodes[expectedId]

    if (userNode.type === 'scalar' && expectedNode.type === 'scalar') {
      if (userNode.kind !== expectedNode.kind || userNode.value !== expectedNode.value) {
        const meant = userNode.otherLanguageValue
        if (meant && meant.kind === expectedNode.kind && meant.value === expectedNode.value) {
          report(
            `In ${LANGUAGE_LABELS[language]}, write ${formatScalar(expectedNode, language)}, not ${userNode.value}.`,
            { nodeId: userId },
          )
          return
        }
        const hint = hints?.find((candidate) => {
          if (variableName && candidate.variable !== variableName) return false
          if (candidate.value === undefined) return false
          if (Array.isArray(candidate.value)) {
            return candidate.value.some((val) => String(val) === userNode.value)
          }
          return String(candidate.value) === userNode.value
        })
        if (hint) {
          report(say(hint)!, { nodeId: userId })
        } else {
          report(`The value ${formatScalar(userNode, language)} is not correct here.`, { nodeId: userId })
        }
      }
      return
    }

    if (userNode.type === 'array' && expectedNode.type === 'array') {
      if (userNode.slots.length !== expectedNode.slots.length) {
        const hint = hints?.find(
          (candidate) =>
            candidate.length === userNode.slots.length && (!variableName || candidate.variable === variableName),
        )
        report(
          say(hint) ??
            `This ${name('array')} has ${plural(userNode.slots.length, 'slot')} but should have ${expectedNode.slots.length}.`,
          { nodeId: userId },
        )
        return
      }
      expectedNode.slots.forEach((expectedSlot, index) => {
        const slot = userNode.slots[index]
        checkTarget(slot, expectedSlot.target, { nodeId: userId, handle: slot.handle }, `Slot ${index}`)
      })
      return
    }

    if (userNode.type === 'instance' && expectedNode.type === 'instance') {
      if (userNode.className !== expectedNode.className || userNode.label !== expectedNode.label) {
        report(
          `This ${userNode.className} is tagged "${userNode.label}" but should be tagged "${expectedNode.label}".`,
          { nodeId: userId },
        )
      }
      return
    }

    if (userNode.type === 'object' && expectedNode.type === 'object') {
      const seen = new Set<string>()
      for (const entry of userNode.entries) {
        if (seen.has(entry.key)) {
          report(`The key "${entry.key}" appears more than once.`, {
            nodeId: userId,
            handle: entry.slot.handle,
          })
        }
        seen.add(entry.key)
      }

      for (const entry of userNode.entries) {
        if (!expectedNode.entries.some((candidate) => candidate.key === entry.key)) {
          report(`The key "${entry.key}" does not belong in this ${name('object')}.`, {
            nodeId: userId,
            handle: entry.slot.handle,
          })
        }
      }

      for (const expectedEntry of expectedNode.entries) {
        const entry = userNode.entries.find((candidate) => candidate.key === expectedEntry.key)
        if (!entry) {
          const hint = hints?.find(
            (candidate) =>
              candidate.missingKey === expectedEntry.key && (!variableName || candidate.variable === variableName),
          )
          report(say(hint) ?? `This ${name('object')} is missing the key "${expectedEntry.key}".`, {
            nodeId: userId,
          })
          continue
        }
        checkTarget(
          entry.slot,
          expectedEntry.slot.target,
          { nodeId: userId, handle: entry.slot.handle },
          `The key "${entry.key}"`,
        )
      }
    }
  }

  const userVariables = new Map<string, (typeof user.variables)[number]>()
  for (const variable of user.variables) {
    if (variable.name === '') {
      report('This variable has no name.', { nodeId: variable.nodeId })
    } else if (userVariables.has(variable.name)) {
      report(`The variable "${variable.name}" appears more than once.`, { nodeId: variable.nodeId })
    } else {
      userVariables.set(variable.name, variable)
    }
  }

  for (const expectedVariable of expected.variables) {
    const variable = userVariables.get(expectedVariable.name)
    if (!variable) {
      report(`Missing the variable "${expectedVariable.name}".`)
      continue
    }
    checkTarget(
      variable.slot,
      expectedVariable.slot.target,
      { nodeId: variable.nodeId, handle: variable.slot.handle },
      `The variable "${variable.name}"`,
      expectedVariable.name,
    )
  }

  for (const [name, variable] of userVariables) {
    if (!expected.variables.some((candidate) => candidate.name === name)) {
      report(`The variable "${name}" does not exist in this code.`, { nodeId: variable.nodeId })
    }
  }

  return { ok: errors.length === 0, errors }
}

function article(noun: string): string {
  return `${/^[aeiou]/.test(noun) ? 'an' : 'a'} ${noun}`
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}
