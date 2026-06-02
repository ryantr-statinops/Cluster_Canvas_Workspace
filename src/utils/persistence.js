/**
 * Persistence Layer — LocalStorage
 *
 * Saves and restores workspace state (nodes, workspaces, viewport) 
 * to/from localStorage. Uses a simple debounce to avoid writing on every keystroke.
 *
 * Usage:
 *   
 *   initPersistence(store)  // subscribes to store changes
 */

const STORAGE_KEY = 'cluster-canvas-workspace'

/**
 * Save state snapshot to localStorage.
 */
export function saveState(state) {
  try {
    const snapshot = {
      nodes: state.nodes,
      workspaces: state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId,
      viewMode: state.viewMode,
      version: 1,
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (err) {
    console.warn('Persistence: failed to save state', err)
  }
}

/**
 * Load state from localStorage.
 * Returns null if no saved state exists or on error.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.version) return null
    return parsed
  } catch (err) {
    console.warn('Persistence: failed to load state', err)
    return null
  }
}

export function hasSavedState() {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY)
}

let _timeoutId = null

/**
 * Subscribe to Zustand store and auto-save on changes.
 * Uses a debounce (500ms) to batch rapid changes.
 *
 * Call once on app startup.
 */
export function initPersistence(store, options = {}) {
  const { debounceMs = 500 } = options

  // Load saved state on init, if available
  const saved = loadState()
  if (saved) {
    const currentNodes = store.getState().nodes
    // Only restore if workspace is empty (first load)
    if (currentNodes.length === 0) {
      // Validate and sanitize loaded nodes
      const validNodes = (saved.nodes || []).filter(n => {
        return n && n.id && n.type && n.position && typeof n.position.x === 'number'
      })
      if (validNodes.length !== (saved.nodes || []).length) {
        console.warn(`Persistence: filtered out ${(saved.nodes || []).length - validNodes.length} invalid nodes`)
      }

      store.setState({
        nodes: validNodes,
        workspaces: saved.workspaces || store.getState().workspaces,
        activeWorkspaceId: saved.activeWorkspaceId || 'default',
        viewMode: saved.viewMode || 'flex',
      })
      console.log(`Persistence: restored ${validNodes.length} nodes from localStorage`)
    }
  }

  // Subscribe to store changes
  store.subscribe((state) => {
    if (_timeoutId) clearTimeout(_timeoutId)
    _timeoutId = setTimeout(() => {
      saveState(store.getState())
      _timeoutId = null
    }, debounceMs)
  })
}
