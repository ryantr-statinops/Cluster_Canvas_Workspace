import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'

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
  const { closeModal } = useWorkspaceStore()
  const [settings, setSettings] = React.useState({
    snapToGrid: false,
    allowOverlap: true,
    showMinimap: true,
    showGrid: true,
    animations: true,
    reducedMotion: false,
  })

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <motion.div
        className="modal-box"
        style={{ width: 380 }}
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
      </motion.div>
    </div>
  )
}

export default SettingsModal
