/**
 * Node Registry System
 *
 * Central registry for all node type definitions.
 * Each node type specifies:
 *   - type:        unique identifier
 *   - component:   React renderer
 *   - defaultSize: { width, height }
 *   - defaultData: default data payload
 *   - capabilities: array of capability strings
 *
 * Usage:
 *   import { getNodeTypes, getDefaultSize, getDefaultData } from './nodeRegistry'
 *   getNodeTypes()       → { todo: TodoNode, notes: NotesNode, ... }
 *   getDefaultSize(type) → { width: 280, height: 240 }
 *   getDefaultData(type) → { title: 'New Note', content: '...' }
 */

import { nanoid } from 'nanoid'

// Will be populated lazily to avoid circular deps
const _registry = new Map()

/**
 * Register a node type definition.
 */
export function registerNodeType(definition) {
  const { type } = definition
  if (!type) {
    console.error('registerNodeType: definition must have a "type" field')
    return
  }
  if (_registry.has(type)) {
    console.warn(`Node type "${type}" already registered — overwriting`)
  }
  _registry.set(type, {
    component: null,
    defaultSize: { width: 280, height: 220 },
    defaultData: { title: 'Node' },
    capabilities: [],
    ...definition,
  })
}

/**
 * Get a definition by type.
 */
export function getNodeDefinition(type) {
  return _registry.get(type) || null
}

/**
 * Get React Flow-compatible nodeTypes map.
 * { typeName: Component, ... }
 */
export function getNodeTypes() {
  const types = {}
  for (const [type, def] of _registry) {
    if (def.component) {
      types[type] = def.component
    }
  }
  return types
}

/**
 * Get default dimensions for a node type.
 */
export function getDefaultSize(type) {
  const def = _registry.get(type)
  return def?.defaultSize || { width: 280, height: 220 }
}

/**
 * Get default data template for a node type.
 * Returns a shallow clone so callers can safely extend.
 */
export function getDefaultData(type) {
  const def = _registry.get(type)
  const template = def?.defaultData || { title: 'Node' }
  // Deep clone to avoid mutation leaks
  return JSON.parse(JSON.stringify(template))
}

/**
 * Get capabilities for a node type.
 */
export function getCapabilities(type) {
  const def = _registry.get(type)
  return def?.capabilities || []
}

/**
 * Check if a node type has a specific capability.
 */
export function hasCapability(type, capability) {
  const def = _registry.get(type)
  return def?.capabilities?.includes(capability) || false
}

/**
 * Get all registered definitions as an array.
 */
export function getAllDefinitions() {
  return Array.from(_registry.values())
}

/**
 * Get all registered type names.
 */
export function getAllTypes() {
  return Array.from(_registry.keys())
}

/**
 * Initialize all built-in node types with their definitions and components.
 */
export function initRegistry() {
  const builtInDefs = [
    { type: 'notes',   component: null, defaultSize: { width: 280, height: 220 }, defaultData: { title: 'New Note', content: 'Start writing...' }, capabilities: ['editable', 'resizable'] },
    { type: 'todo',    component: null, defaultSize: { width: 280, height: 240 }, defaultData: { title: 'To-Do List', tasks: [{ id: nanoid(), text: 'New task', done: false }] }, capabilities: ['editable', 'resizable'] },
    { type: 'website', component: null, defaultSize: { width: 400, height: 300 }, defaultData: { title: 'Website', url: 'https://vercel.com' }, capabilities: ['editable', 'resizable'] },
    { type: 'draw',    component: null, defaultSize: { width: 360, height: 300 }, defaultData: { title: 'Sketch' }, capabilities: ['editable', 'resizable'] },
    { type: 'group',   component: null, defaultSize: { width: 360, height: 300 }, defaultData: { title: 'New Group' }, capabilities: ['container', 'resizable'] },
    { type: 'entity',  component: null, defaultSize: { width: 360, height: 380 }, defaultData: { title: 'New Entity', status: 'draft', description: '', tags: [], properties: [], references: [], color: '' }, capabilities: ['editable', 'resizable'] },
    { type: 'context', component: null, defaultSize: { width: 400, height: 340 }, defaultData: { title: 'New Context', content: '', references: [] }, capabilities: ['editable', 'resizable'] },
    { type: 'collection', component: null, defaultSize: { width: 360, height: 340 }, defaultData: { title: 'New Collection', filters: [], matchMode: 'all' }, capabilities: ['editable', 'resizable'] },
    { type: 'portal', component: null, defaultSize: { width: 340, height: 320 }, defaultData: { title: 'New Portal', links: [] }, capabilities: ['editable', 'resizable'] },
    { type: 'relation', component: null, defaultSize: { width: 340, height: 320 }, defaultData: { title: 'New Relation', targetId: '' }, capabilities: ['editable', 'resizable'] },
  ]

  builtInDefs.forEach(def => {
    // Register definition first (without component)
    _registry.set(def.type, {
      component: null,
      defaultSize: { width: 280, height: 220 },
      defaultData: { title: 'Node' },
      capabilities: [],
      ...def,
    })
  })
}

/**
 * Set the component for a node type.
 * Called after React components are available to avoid circular deps.
 */
export function setNodeComponent(type, Component) {
  const def = _registry.get(type)
  if (def) {
    def.component = Component
  }
}
