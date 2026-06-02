/**
 * Persistence Layer — LocalStorage with Snapshot History & Auto-Recovery
 *
 * Features:
 * - Auto-save with debounce (500ms)
 * - Snapshot history (last 10 snapshots with timestamps)
 * - Crash detection & auto-recovery
 * - Workspace restore on first load
 */

const STORAGE_KEY     = 'cluster-canvas-workspace'
const SNAPSHOT_KEY    = 'cluster-canvas-snapshots'
const RECOVERY_KEY    = 'cluster-canvas-recovery'
const MAX_SNAPSHOTS   = 10
const RECOVERY_INTERVAL = 30000 // 30s between recovery saves

// ── Save / Load Main State ─────────────────────────────────────────────

export function saveState(state) {
  try {
    const snapshot = {
      nodes:            state.nodes,
      edges:            state.edges,
      workspaces:       state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId,
      viewMode:         state.viewMode,
      version:          2,
      savedAt:          Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return true
  } catch (err) {
    console.warn('Persistence: failed to save state', err)
    return false
  }
}

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
  localStorage.removeItem(SNAPSHOT_KEY)
  localStorage.removeItem(RECOVERY_KEY)
}

// ── Snapshot History (timelapse) ───────────────────────────────────────

/**
 * Save a named snapshot to the snapshot history list.
 * Keeps only the last MAX_SNAPSHOTS snapshots.
 */
export function saveNamedSnapshot(state, label) {
  try {
    const history = loadSnapshotHistory()
    const snapshot = {
      id:        `snap-${Date.now()}`,
      label:     label || `Snapshot ${history.length + 1}`,
      savedAt:   Date.now(),
      nodes:     state.nodes?.length || 0,
      edges:     state.edges?.length || 0,
      nodeCount: state.nodes?.length || 0,
      edgeCount: state.edges?.length || 0,
      data: {
        nodes:      state.nodes,
        edges:      state.edges,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        viewMode:   state.viewMode,
      },
    }

    const updated = [snapshot, ...history].slice(0, MAX_SNAPSHOTS)
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated))
    return true
  } catch (err) {
    console.warn('Persistence: failed to save snapshot', err)
    return false
  }
}

/**
 * Load the snapshot history list.
 */
export function loadSnapshotHistory() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/**
 * Restore a specific snapshot from history by id.
 */
export function restoreSnapshot(snapshotId) {
  const history = loadSnapshotHistory()
  const snap = history.find(s => s.id === snapshotId)
  if (!snap) return null
  return snap.data
}

/**
 * Delete a snapshot from history.
 */
export function deleteSnapshot(snapshotId) {
  const history = loadSnapshotHistory()
  const updated = history.filter(s => s.id !== snapshotId)
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated))
}

// ── Auto-Recovery ──────────────────────────────────────────────────────

let _lastRecoverySave = 0

export function saveRecovery(state) {
  const now = Date.now()
  if (now - _lastRecoverySave < RECOVERY_INTERVAL) return false
  _lastRecoverySave = now

  try {
    const recovery = {
      type:      'recovery',
      savedAt:   now,
      label:     `Auto-recovery ${new Date().toLocaleTimeString()}`,
      data: {
        nodes:      state.nodes,
        edges:      state.edges,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        viewMode:   state.viewMode,
      },
    }
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(recovery))
    return true
  } catch {
    return false
  }
}

export function loadRecovery() {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.type !== 'recovery' || !parsed.data) return null
    return parsed
  } catch {
    return null
  }
}

export function clearRecovery() {
  localStorage.removeItem(RECOVERY_KEY)
}

/**
 * Check if there's a pending recovery (crash detection).
 * A recovery exists if the app didn't clean up on last load.
 */
export function hasPendingRecovery() {
  return localStorage.getItem(RECOVERY_KEY) !== null
}

// ── Init ───────────────────────────────────────────────────────────────

let _timeoutId = null
let _snapshotTimeoutId = null
let _initCalled = false

/**
 * Subscribe to Zustand store and auto-save on changes.
 * Call once on app startup.
 */
export function initPersistence(store, options = {}) {
  const { debounceMs = 500, snapshotIntervalMs = 60000 } = options

  // Prevent double-init
  if (_initCalled) return
  _initCalled = true

  // Load saved state on init, if available
  const saved = loadState()
  if (saved) {
    const currentNodes = store.getState().nodes
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
        edges: saved.edges || [],
        workspaces: saved.workspaces || store.getState().workspaces,
        activeWorkspaceId: saved.activeWorkspaceId || 'default',
        viewMode: saved.viewMode || 'flex',
      })
      console.log(`Persistence: restored ${validNodes.length} nodes from localStorage`)
    }
  }

  // Subscribe to store changes
  store.subscribe((state) => {
    // Debounced auto-save
    if (_timeoutId) clearTimeout(_timeoutId)
    _timeoutId = setTimeout(() => {
      const fresh = store.getState()
      saveState(fresh)
      saveRecovery(fresh)
      _timeoutId = null
    }, debounceMs)

    // Periodic named snapshot
    if (_snapshotTimeoutId) clearTimeout(_snapshotTimeoutId)
    _snapshotTimeoutId = setTimeout(() => {
      const fresh = store.getState()
      if (fresh.nodes.length > 0) {
        saveNamedSnapshot(fresh, `Auto-snapshot ${new Date().toLocaleTimeString()}`)
      }
      _snapshotTimeoutId = null
    }, snapshotIntervalMs)
  })
}
