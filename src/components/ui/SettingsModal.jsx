import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Upload, Clock, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { exportWorkspace, importWorkspace } from '../../utils/workspaceIO'
import { loadSnapshotHistory, restoreSnapshot, deleteSnapshot, clearSavedState, hasPendingRecovery, loadRecovery, clearRecovery } from '../../utils/persistence'

const Toggle = ({ label, value, onChange, description }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--bg-border)',
  }}>
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</p>
      {description && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: value ? 'var(--accent)' : 'var(--bg-elevated)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: value ? 21 : 3,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  </div>
)

const SettingsModal = () => {
  const { closeModal, nodes, edges, setNodes, setEdges, workspaces, activeWorkspaceId, pushSnapshot } = useWorkspaceStore()
  const [activeTab, setActiveTab] = useState('canvas')
  const [settings, setSettings] = useState({
    snapToGrid: false,
    allowOverlap: true,
    showMinimap: true,
    showGrid: true,
    animations: true,
    reducedMotion: false,
  })
  const [snapshots, setSnapshots] = useState([])
  const [importStatus, setImportStatus] = useState(null)
  const [showRecovery, setShowRecovery] = useState(false)

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))

  // Load snapshots on mount
  useEffect(() => {
    setSnapshots(loadSnapshotHistory())
    if (hasPendingRecovery()) {
      setShowRecovery(true)
    }
  }, [])

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    exportWorkspace(useWorkspaceStore.getState)
  }, [])

  // ── Import ──────────────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    try {
      const ws = await importWorkspace()
      pushSnapshot()
      setNodes(ws.nodes || [])
      setEdges(ws.edges || [])
      setImportStatus({ type: 'success', message: `Imported ${ws.nodes?.length || 0} nodes` })
      setTimeout(() => setImportStatus(null), 3000)
    } catch (err) {
      setImportStatus({ type: 'error', message: err.message })
      setTimeout(() => setImportStatus(null), 5000)
    }
  }, [pushSnapshot, setNodes, setEdges])

  // ── Snapshot restore ──────────────────────────────────────────────────────
  const handleRestoreSnapshot = useCallback((snapId) => {
    const data = restoreSnapshot(snapId)
    if (!data) return
    pushSnapshot()
    setNodes(data.nodes || [])
    setEdges(data.edges || [])
    setSnapshots(loadSnapshotHistory())
    setImportStatus({ type: 'success', message: 'Snapshot restored' })
    setTimeout(() => setImportStatus(null), 3000)
  }, [pushSnapshot, setNodes, setEdges])

  const handleDeleteSnapshot = useCallback((snapId) => {
    deleteSnapshot(snapId)
    setSnapshots(loadSnapshotHistory())
  }, [])

  // ── Recovery ──────────────────────────────────────────────────────────────
  const handleRestoreRecovery = useCallback(() => {
    const recovery = loadRecovery()
    if (!recovery || !recovery.data) return
    pushSnapshot()
    setNodes(recovery.data.nodes || [])
    setEdges(recovery.data.edges || [])
    clearRecovery()
    setShowRecovery(false)
    setImportStatus({ type: 'success', message: 'Recovery restored' })
    setTimeout(() => setImportStatus(null), 3000)
  }, [pushSnapshot, setNodes, setEdges])

  const handleDismissRecovery = useCallback(() => {
    clearRecovery()
    setShowRecovery(false)
  }, [])

  const tabs = [
    { id: 'canvas',   label: 'Canvas' },
    { id: 'data',     label: 'Data' },
    { id: 'snapshots', label: 'History' },
  ]

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <motion.div
        className="modal-box"
        style={{ width: 420, maxHeight: '80vh' }}
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h2>
          <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 8 }} onClick={closeModal}>
            <X size={14} />
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 16,
          borderBottom: '1px solid var(--bg-border)', paddingBottom: 8,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 140px)' }}>

          {/* ── Canvas Tab ── */}
          {activeTab === 'canvas' && (
            <>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 8 }}>
                Canvas
              </p>
              <Toggle label="Snap to Grid" description="Align nodes to grid when moving"
                value={settings.snapToGrid} onChange={() => toggle('snapToGrid')} />
              <Toggle label="Allow Overlap" description="Nodes can overlap each other"
                value={settings.allowOverlap} onChange={() => toggle('allowOverlap')} />
              <Toggle label="Show Minimap" description="Show overview minimap on canvas"
                value={settings.showMinimap} onChange={() => toggle('showMinimap')} />
              <Toggle label="Show Grid" description="Dot pattern background grid"
                value={settings.showGrid} onChange={() => toggle('showGrid')} />

              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', margin: '16px 0 8px' }}>
                Appearance
              </p>
              <Toggle label="Animations" description="Enable micro-animations and transitions"
                value={settings.animations} onChange={() => toggle('animations')} />
              <Toggle label="Reduced Motion" description="Disable most animations for accessibility"
                value={settings.reducedMotion} onChange={() => toggle('reducedMotion')} />
            </>
          )}

          {/* ── Data Tab ── */}
          {activeTab === 'data' && (
            <>
              {/* Recovery alert */}
              {showRecovery && (
                <div style={{
                  padding: 10, borderRadius: 8, marginBottom: 12,
                  background: 'rgba(250,204,21,0.1)',
                  border: '1px solid rgba(250,204,21,0.3)',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} style={{ color: '#facc15', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Unrecovered session found
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    The previous session may have ended unexpectedly. You can restore your last state.
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={handleRestoreRecovery}
                      className="btn-ghost"
                      style={{ fontSize: 11, height: 28, gap: 4, padding: '0 10px' }}
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                    <button
                      onClick={handleDismissRecovery}
                      className="btn-ghost"
                      style={{ fontSize: 11, height: 28, gap: 4, padding: '0 10px', color: 'var(--text-muted)' }}
                    >
                      <X size={11} /> Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Import Status */}
              <AnimatePresence>
                {importStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{
                      padding: '6px 10px', borderRadius: 8, marginBottom: 12,
                      background: importStatus.type === 'success'
                        ? 'rgba(74,222,128,0.1)'
                        : 'rgba(248,113,113,0.1)',
                      border: importStatus.type === 'success'
                        ? '1px solid rgba(74,222,128,0.3)'
                        : '1px solid rgba(248,113,113,0.3)',
                      fontSize: 11, color: 'var(--text-primary)',
                    }}
                  >
                    {importStatus.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 8 }}>
                Workspace
              </p>

              {/* Stats */}
              <div style={{
                display: 'flex', gap: 8, marginBottom: 12,
                padding: 8, borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{nodes.length}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Nodes</p>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{edges.length}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Edges</p>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{workspaces.length}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Workspaces</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={handleExport}
                  className="btn-ghost"
                  style={{ justifyContent: 'center', gap: 6, height: 34, fontSize: 12 }}
                >
                  <Download size={13} />
                  Export Workspace
                </button>
                <button
                  onClick={handleImport}
                  className="btn-ghost"
                  style={{ justifyContent: 'center', gap: 6, height: 34, fontSize: 12 }}
                >
                  <Upload size={13} />
                  Import Workspace
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--bg-border)', margin: '12px 0' }} />

              <button
                onClick={() => { clearSavedState(); setImportStatus({ type: 'success', message: 'Local storage cleared' }); setTimeout(() => setImportStatus(null), 3000); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  height: 32, width: '100%',
                  background: 'rgba(191,97,106,0.08)',
                  border: '1px solid rgba(191,97,106,0.3)',
                  borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#bf616a',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={12} />
                Clear Local Storage
              </button>
            </>
          )}

          {/* ── Snapshots Tab ── */}
          {activeTab === 'snapshots' && (
            <>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 8 }}>
                Auto-snapshots (last {snapshots.length})
              </p>

              {snapshots.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: 24,
                  color: 'var(--text-muted)', fontSize: 12,
                }}>
                  <Clock size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>No snapshots yet.</p>
                  <p style={{ fontSize: 11, marginTop: 4 }}>Snapshots are created automatically as you work.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {snapshots.map(snap => (
                    <div
                      key={snap.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 10px', borderRadius: 8,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--bg-border)',
                      }}
                    >
                      <Clock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {snap.label}
                        </p>
                        <p style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                          {new Date(snap.savedAt).toLocaleString()} · {snap.nodeCount} nodes · {snap.edgeCount} edges
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="icon-btn"
                          style={{ width: 24, height: 24, borderRadius: 5 }}
                          onClick={() => handleRestoreSnapshot(snap.id)}
                          title="Restore this snapshot"
                        >
                          <RotateCcw size={10} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ width: 24, height: 24, borderRadius: 5, color: '#bf616a' }}
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          title="Delete snapshot"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsModal
