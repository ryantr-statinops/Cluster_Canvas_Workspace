import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Pencil, RotateCcw } from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const DEFAULT_SHORTCUTS = [
  { id: 'addNode',      label: 'Add Node',       keys: ['Ctrl', 'N'] },
  { id: 'deleteNode',   label: 'Delete Node',    keys: ['Delete'] },
  { id: 'duplicate',    label: 'Duplicate Node', keys: ['Ctrl', 'D'] },
  { id: 'flexMode',     label: 'Flex Mode',      keys: ['Ctrl', 'F'] },
  { id: 'gridMode',     label: 'Grid Mode',      keys: ['Ctrl', 'G'] },
  { id: 'groupNodes',   label: 'Group/Ungroup',  keys: ['Ctrl', 'Shift', 'G'] },
  { id: 'zoomReset',    label: 'Zoom Reset',     keys: ['Ctrl', '0'] },
]

const KeyBadge = ({ label }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 8px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--bg-border)',
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-secondary)',
    fontWeight: 500,
  }}>
    {label}
  </span>
)

const ShortcutModal = () => {
  const { closeModal } = useWorkspaceStore()
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS)

  const reset = () => setShortcuts(DEFAULT_SHORTCUTS)

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <motion.div
        className="modal-box"
        style={{ width: 440 }}
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Keyboard Shortcuts
          </h2>
          <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 8 }} onClick={closeModal}>
            <X size={14} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {shortcuts.map((sc) => (
            <div
              key={sc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid var(--bg-border)',
                background: 'var(--bg-elevated)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                {sc.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {sc.keys.map((k, i) => <KeyBadge key={i} label={k} />)}
                </div>
                <button
                  className="icon-btn"
                  style={{ width: 24, height: 24, borderRadius: 6 }}
                  title="Edit shortcut"
                >
                  <Pencil size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reset */}
        <button
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', gap: 6 }}
          onClick={reset}
        >
          <RotateCcw size={13} />
          Reset to defaults
        </button>
      </motion.div>
    </div>
  )
}

export default ShortcutModal
