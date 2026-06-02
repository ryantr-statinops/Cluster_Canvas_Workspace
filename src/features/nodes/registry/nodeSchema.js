/**
 * Unified Node Schema
 *
 * Every node in the system follows this base structure.
 * All node creation MUST go through createBaseNode() to ensure consistency.
 */

export const NODE_SHAPE = {
  id: null,       // string — unique identifier
  type: null,     // string — node type (e.g. 'notes', 'todo')
  position: null, // { x: number, y: number }
  data: null,     // object — arbitrary per-type data
  style: null,    // object — visual presentation
  selected: false, // boolean
  parentNode: undefined, // string — optional parent group ID
  extent: undefined,     // 'parent' | undefined
}

export const DEFAULT_STYLE = {
  zIndex: 1,
  opacity: 1,
  locked: false,
  outline: '#88c0d0',
  background: '',
}

/**
 * Create a base node object with defaults applied.
 * Every node in the system should be created through this function.
 */
export function createBaseNode({ id, type, position, data = {}, style = {}, parentNode, extent }) {
  if (!type) {
    console.error('createBaseNode: type is required')
    return null
  }

  return {
    id: id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    position: position || { x: 100, y: 100 },
    data: { ...data },
    style: { ...DEFAULT_STYLE, ...style },
    selected: false,
    ...(parentNode ? { parentNode, extent: extent || 'parent' } : {}),
  }
}

/**
 * Validate that an object conforms to the base node shape.
 * Returns an array of error messages (empty = valid).
 */
export function validateNode(node) {
  const errors = []
  if (!node) return ['Node is null/undefined']
  if (!node.id) errors.push('Missing id')
  if (!node.type) errors.push('Missing type')
  if (!node.position || typeof node.position.x !== 'number') errors.push('Missing/invalid position')
  if (!node.data) errors.push('Missing data')
  return errors
}

/**
 * Deep clone a node (safe for serialization).
 */
export function cloneNode(node) {
  if (!node) return null
  return JSON.parse(JSON.stringify(node))
}
