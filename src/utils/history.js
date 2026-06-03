/**
 * History Manager — Undo/Redo with snapshot capture
 *
 * Captures deep-cloned snapshots of workspace data state
 * (nodes, edges, workspaces) before every mutating action.
 *
 * Usage:
 *   history.pushSnapshot(getState())     // before mutation
 *   history.undo(getState, setState)     // restore previous
 *   history.redo(getState, setState)     // restore next
 */

const MAX_STEPS = 50

/**
 * Create a deep-cloned data snapshot from the current store state.
 * Only captures undoable fields (nodes, edges, workspaces).
 */
export function captureSnapshot(state) {
  return {
    nodes:          JSON.parse(JSON.stringify(state.nodes || [])),
    edges:          JSON.parse(JSON.stringify(state.edges || [])),
    workspaces:     JSON.parse(JSON.stringify(state.workspaces || [])),
    activeWorkspaceId: state.activeWorkspaceId,
  }
}

/**
 * Push a snapshot onto the undo stack.
 * Clears the redo stack (any new action invalidates redo history).
 */
export function pushSnapshot(undoStack, snapshot) {
  return {
    undoStack: [...undoStack.slice(-(MAX_STEPS - 1)), snapshot],
    redoStack: [],
  }
}

/**
 * Undo: restore the most recent snapshot from undoStack,
 * pushing the current state onto redoStack.
 * Returns { snapshot, undoStack, redoStack } or null if nothing to undo.
 */
export function performUndo(undoStack, redoStack, currentState) {
  if (undoStack.length === 0) return null

  const previous  = undoStack[undoStack.length - 1]
  const currentSnap = captureSnapshot(currentState)

  return {
    snapshot:   previous,
    undoStack:  undoStack.slice(0, -1),
    redoStack:  [...redoStack, currentSnap],
  }
}

/**
 * Redo: restore the most recent snapshot from redoStack,
 * pushing the current state onto undoStack.
 * Returns { snapshot, undoStack, redoStack } or null if nothing to redo.
 */
export function performRedo(undoStack, redoStack, currentState) {
  if (redoStack.length === 0) return null

  const next     = redoStack[redoStack.length - 1]
  const currentSnap = captureSnapshot(currentState)

  return {
    snapshot:   next,
    undoStack:  [...undoStack, currentSnap],
    redoStack:  redoStack.slice(0, -1),
  }
}

/**
 * Serialize the full workspace for export.
 */
export function serializeWorkspace(state) {
  return JSON.stringify({
    version:    2,
    exportedAt: Date.now(),
    app:        'cluster-canvas',
    workspace: {
      nodes:      state.nodes,
      edges:      state.edges,
      workspaces: state.workspaces?.map(ws => ({
        ...ws,
        nodes: ws.nodes || [],
        edges: ws.edges || [],
      })),
      activeWorkspaceId: state.activeWorkspaceId,
    },
  }, null, 2)
}

/**
 * Validate an imported workspace object.
 * Returns { valid, errors }.
 */
export function validateImportedWorkspace(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid file format'] }
  }

  if (data.version !== 2 && !data.workspace) {
    return { valid: false, errors: ['Unrecognized workspace format'] }
  }

  const ws = data.workspace
  if (!ws) {
    return { valid: false, errors: ['Missing workspace data'] }
  }

  // Validate nodes
  if (ws.nodes && Array.isArray(ws.nodes)) {
    ws.nodes.forEach((n, i) => {
      if (!n.id)   errors.push(`Node ${i}: missing id`)
      if (!n.type) errors.push(`Node ${i}: missing type`)
      if (!n.position || typeof n.position.x !== 'number') errors.push(`Node ${i}: invalid position`)
      if (!n.data)   errors.push(`Node ${i}: missing data`)
    })
  }

  // Validate edges
  if (ws.edges && Array.isArray(ws.edges)) {
    ws.edges.forEach((e, i) => {
      if (!e.id)     errors.push(`Edge ${i}: missing id`)
      if (!e.source) errors.push(`Edge ${i}: missing source`)
      if (!e.target) errors.push(`Edge ${i}: missing target`)
    })
  }

  return {
    valid: errors.length === 0,
    errors: errors.slice(0, 10), // limit to first 10 errors
  }
}
