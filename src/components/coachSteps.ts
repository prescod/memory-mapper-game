import { scalarFromData } from '../canvas/scalarData'
import type { MemFlowEdge, MemFlowNode } from '../canvas/types'
import { formatScalar } from '../model/scalar'
import type { CoachCondition, CoachStep, CoachTarget, Language, VerifyResult } from '../model/types'

/** Everything on the problem screen a coach step can wait for. */
export interface CoachState {
  nodes: MemFlowNode[]
  edges: MemFlowEdge[]
  result: VerifyResult | null
  hint: boolean
  answer: boolean
  code: string
  language: Language
}

/** Where each `CoachTarget` is on screen. */
export const COACH_TARGETS: Record<CoachTarget, string> = {
  'add-variable': '.toolbar-variable',
  'add-primitive': '.toolbar-scalar',
  'variable-name': '.variable-node input',
  'primitive-value': '.scalar-node .mem-input',
  'variable-dot': '.react-flow__node-variable .react-flow__handle.source',
  delete: '.canvas-delete',
  canvas: '.workspace .canvas',
  check: '.action-primary',
  hint: '.hint-button',
  answer: '.answer-button',
  reset: '.reset-button',
  next: '.action-primary',
  code: '.code-editor',
  given: '.given-code',
  picture: '.workspace .canvas',
}

/** A primitive as the learner would write it in code: `3`, `"red"`. */
function written(node: MemFlowNode, language: Language): string | undefined {
  return node.type === 'scalar' ? formatScalar(scalarFromData(node.data, language), language) : undefined
}

function variableNamed(node: MemFlowNode, name: string | undefined): boolean {
  return node.type === 'variable' && (name === undefined || node.data.name.trim() === name)
}

function hasArrow(state: CoachState, from: string | undefined, to: string | undefined): boolean {
  const byId = new Map(state.nodes.map((node) => [node.id, node]))
  return state.edges.some((edge) => {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    if (!source || !target) return false
    if (from !== undefined && !variableNamed(source, from)) return false
    if (to !== undefined && written(target, state.language) !== to) return false
    return true
  })
}

const squash = (text: string) => text.replace(/\s+/g, '')

/** Whether `condition` holds now. `read` and `end` never hold by themselves. */
export function coachConditionMet(condition: CoachCondition, state: CoachState): boolean {
  if ('variable' in condition) return state.nodes.some((node) => variableNamed(node, condition.name))
  if ('primitive' in condition) {
    return state.nodes.some(
      (node) =>
        node.type === 'scalar' &&
        (condition.text === undefined || written(node, state.language) === condition.text),
    )
  }
  if ('arrow' in condition) return hasArrow(state, condition.from, condition.to)
  if ('noArrowTo' in condition) return !hasArrow(state, undefined, condition.noArrowTo)
  if ('selected' in condition) {
    return state.nodes.some((node) => node.selected) || state.edges.some((edge) => edge.selected)
  }
  if ('checked' in condition) return state.result !== null
  if ('failed' in condition) return state.result !== null && !state.result.ok
  if ('passed' in condition) return state.result?.ok === true
  if ('hint' in condition) return state.hint
  if ('answer' in condition) return state.answer
  if ('typed' in condition) {
    return condition.text === undefined
      ? state.code.trim() !== ''
      : squash(state.code).includes(squash(condition.text))
  }
  return false
}

/**
 * The step the learner is on, given the step they were on before. Steps only
 * move forward, and several move at once when the learner has already done
 * what they ask. While the answer is showing, the canvas holds the answer
 * rather than the learner's work, so nothing on it counts. A learner who
 * solves the puzzle without following the steps skips straight past the
 * last step that waits for a correct answer.
 */
export function nextCoachIndex(steps: CoachStep[], current: number, state: CoachState): number {
  let index = current
  if (state.result?.ok === true) {
    steps.forEach((step, position) => {
      if ('passed' in step.done) index = Math.max(index, position + 1)
    })
  }
  while (index < steps.length) {
    const condition = steps[index].done
    if (state.answer && !('answer' in condition)) break
    if (!coachConditionMet(condition, state)) break
    index++
  }
  return index
}
