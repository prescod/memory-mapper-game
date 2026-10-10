import type { SyntaxNode } from '@lezer/common'
import { parser as javascriptParser } from '@lezer/javascript'
import { parser as pythonParser } from '@lezer/python'
import type { SourceRule } from '../model/process'
import type { Language } from '../model/types'

/**
 * Checks that variables are built the way a puzzle teaches, by reading the
 * learner's source rather than running it. Each rule judges the last
 * assignment to its target, so the same operation applied to some other
 * variable, or an earlier assignment that is later overwritten, does not count.
 * Whether the result is right is the job of the picture and the process rules;
 * this only answers whether the intended operation was used.
 */
export function checkSource(language: Language, code: string, rules: SourceRule[]): string[] {
  const parser = language === 'javascript' ? javascriptParser : pythonParser
  const root = parser.parse(code).topNode
  const read = (node: SyntaxNode) => code.slice(node.from, node.to)
  const assignments = assignmentsIn(root, read)

  return rules
    .filter((rule) => {
      const last = assignments.filter((assignment) => assignment.target === rule.target).pop()
      return !last || !holds(rule, language, last.rhs, read)
    })
    .map((rule) => explain(rule, language))
}

interface Assignment {
  target: string
  rhs: SyntaxNode
}

const TARGETS = new Set(['VariableName', 'VariableDefinition'])

function children(node: SyntaxNode): SyntaxNode[] {
  const result: SyntaxNode[] = []
  for (let child = node.firstChild; child; child = child.nextSibling) result.push(child)
  return result
}

function* descendants(node: SyntaxNode): Generator<SyntaxNode> {
  yield node
  for (const child of children(node)) yield* descendants(child)
}

/** Every `name = value` in the program, however deeply nested. */
function assignmentsIn(root: SyntaxNode, read: (node: SyntaxNode) => string): Assignment[] {
  const found: Assignment[] = []

  for (const node of descendants(root)) {
    const parts = children(node).filter((child) => child.name !== 'TypeDef')
    const isEquals = (child: SyntaxNode) => (child.name === 'Equals' || child.name === 'AssignOp') && read(child) === '='

    if (node.name === 'VariableDeclaration') {
      parts.forEach((part, index) => {
        if (part.name === 'VariableDefinition' && parts[index + 1] && isEquals(parts[index + 1]) && parts[index + 2]) {
          found.push({ target: read(part), rhs: parts[index + 2] })
        }
      })
    } else if (node.name === 'AssignmentExpression' || node.name === 'AssignStatement') {
      // `a = b = value` assigns the last part to every name before an `=`.
      const rhs = parts[parts.length - 1]
      parts.forEach((part, index) => {
        if (isEquals(part) && index > 0 && TARGETS.has(parts[index - 1].name) && index < parts.length - 1) {
          found.push({ target: read(parts[index - 1]), rhs })
        }
      })
    }
  }
  return found
}

function mentions(node: SyntaxNode | null, name: string, read: (node: SyntaxNode) => string): boolean {
  if (!node) return false
  for (const inner of descendants(node)) {
    if (inner.name === 'VariableName' && read(inner) === name) return true
  }
  return false
}

/** The `receiver.method(...)` calls inside `rhs`. */
function* methodCalls(rhs: SyntaxNode, read: (node: SyntaxNode) => string) {
  for (const node of descendants(rhs)) {
    const callee = node.name === 'CallExpression' ? node.firstChild : null
    if (callee?.name !== 'MemberExpression') continue
    const property = children(callee).find((child) => child.name === 'PropertyName')
    if (property) yield { call: node, receiver: callee.firstChild, method: read(property), callee }
  }
}

function holds(
  rule: SourceRule,
  language: Language,
  rhs: SyntaxNode,
  read: (node: SyntaxNode) => string,
): boolean {
  switch (rule.kind) {
    case 'multiply':
      return [...descendants(rhs)].some(
        (node) =>
          node.name === 'BinaryExpression' &&
          children(node).some((child) => child.name === 'ArithOp' && read(child) === '*') &&
          rule.operands.every((operand) => mentions(node, operand, read)),
      )

    case 'method':
      return [...methodCalls(rhs, read)].some(
        ({ receiver, method }) =>
          receiver?.name === 'VariableName' && read(receiver) === rule.receiver && method === rule.method[language],
      )

    case 'copy':
      return language === 'javascript'
        ? copiesInJavaScript(rhs, rule.source, read)
        : copiesInPython(rhs, rule.source, read)

    case 'combine':
      return language === 'javascript'
        ? [...methodCalls(rhs, read)].some(
            ({ callee, method }) => method === 'concat' && mentions(callee, rule.source, read),
          )
        : [...descendants(rhs)].some(
            (node) =>
              node.name === 'BinaryExpression' &&
              children(node).some((child) => child.name === 'ArithOp' && read(child) === '+') &&
              mentions(node, rule.source, read),
          )
  }
}

function copiesInJavaScript(rhs: SyntaxNode, source: string, read: (node: SyntaxNode) => string): boolean {
  const spread = [...descendants(rhs)].some((node) => node.name === 'Spread' && mentions(node.nextSibling, source, read))
  const calls = [...methodCalls(rhs, read)].some(({ call, callee, method }) => {
    const owner = callee.firstChild ? read(callee.firstChild) : ''
    if (method === 'slice') return mentions(callee, source, read)
    const builtIn = (owner === 'Object' && method === 'assign') || (owner === 'Array' && method === 'from')
    return builtIn && mentions(call, source, read)
  })
  return spread || calls
}

function copiesInPython(rhs: SyntaxNode, source: string, read: (node: SyntaxNode) => string): boolean {
  const copyingSyntax = [...descendants(rhs)].some((node) => {
    switch (node.name) {
      case 'CallExpression': {
        const callee = node.firstChild
        return callee?.name === 'VariableName' && ['list', 'dict'].includes(read(callee)) && mentions(node, source, read)
      }
      case 'MemberExpression':
        return children(node).some((child) => child.name === ':') && mentions(node, source, read)
      case 'ArrayExpression':
      case 'DictionaryExpression':
        return children(node).some(
          (child) => (child.name === '*' || child.name === '**') && mentions(child.nextSibling, source, read),
        )
      default:
        return false
    }
  })
  const copyMethod = [...methodCalls(rhs, read)].some(
    ({ callee, method }) => method === 'copy' && mentions(callee, source, read),
  )
  return copyingSyntax || copyMethod
}

function explain(rule: SourceRule, language: Language): string {
  const target = `"${rule.target}"`
  switch (rule.kind) {
    case 'multiply':
      return `Build ${target} by multiplying ${rule.operands.map((operand) => `"${operand}"`).join(' and ')}.`
    case 'method':
      return `Build ${target} by calling ${rule.receiver}.${rule.method[language]}().`
    case 'copy':
      return `Build ${target} by copying "${rule.source}" instead of writing its contents out again.`
    case 'combine':
      return language === 'javascript'
        ? `Build ${target} by calling concat on "${rule.source}".`
        : `Build ${target} by adding to "${rule.source}" with +.`
  }
}

/**
 * Checks whether an answer that failed alternate starting values hardcoded a
 * literal value that belongs to one of the starter variables.
 */
export function findLiteralReusedHint(
  given: string | undefined,
  language: Language,
  code: string,
): string | undefined {
  if (!given) return undefined

  const parser = language === 'javascript' ? javascriptParser : pythonParser
  const readGiven = (node: SyntaxNode) => given.slice(node.from, node.to)
  const readCode = (node: SyntaxNode) => code.slice(node.from, node.to)

  const givenAssignments = assignmentsIn(parser.parse(given).topNode, readGiven)
  const codeAssignments = assignmentsIn(parser.parse(code).topNode, readCode)

  const matches: { target: string; from: string; value: string }[] = []

  for (const assignment of codeAssignments) {
    const mentionsVar = [...descendants(assignment.rhs)].some((n) => n.name === 'VariableName')
    if (mentionsVar) continue

    const val = readCode(assignment.rhs).trim()
    for (const givenAssignment of givenAssignments) {
      const givenVal = readGiven(givenAssignment.rhs).trim()
      if (val === givenVal) {
        matches.push({ target: assignment.target, from: givenAssignment.target, value: val })
      }
    }
  }

  if (matches.length === 1) {
    const { target, from, value } = matches[0]
    return `You assigned ${value} directly instead of referencing "${from}". Build the result from "${from}" (e.g. ${target} = ${from}) — your code builds the right picture here, but not when the starting values change.`
  }

  if (matches.length > 1) {
    return 'You assigned literal values instead of referencing the existing variables. Build the result from what is already there — your code builds the right picture here, but not when the starting values change.'
  }

  return undefined
}
