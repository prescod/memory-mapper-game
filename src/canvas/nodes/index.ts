import { ArrayNode } from './ArrayNode'
import { ObjectNode } from './ObjectNode'
import { PetNode } from './PetNode'
import { ScalarNode } from './ScalarNode'
import { VariableNode } from './VariableNode'

export const nodeTypes = {
  variable: VariableNode,
  scalar: ScalarNode,
  array: ArrayNode,
  object: ObjectNode,
  pet: PetNode,
}
