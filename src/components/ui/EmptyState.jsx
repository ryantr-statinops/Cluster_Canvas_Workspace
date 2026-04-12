import React from 'react'
import { motion } from 'framer-motion'
import { Plus, MousePointer2, ZoomIn, Move } from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const EmptyState = () => {
  const { addNode } = useWorkspaceStore()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        pointerEvents: 'none',
      }}
    >
      {/* Glowing orb */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        opacity: 0.15,
        position: 'absolute',
      }} />

      <div style={{ textAlign: 'center', position: 'relative' }}>
        <h2 style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}>
          Start building your infinite workspace
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.6 }}>
          Add nodes from the sidebar or the button above. Pan the canvas by dragging, zoom with the scroll wheel.
        </p>
      </div>

      <button
        className="btn-primary"
        style={{ pointerEvents: 'all', padding: '10px 24px', height: 42, fontSize: 14 }}
        onClick={() => addNode('notes')}
      >
        <Plus size={16} />
        Add your first node
      </button>

      {/* Hints */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginTop: 8,
        pointerEvents: 'none',
      }}>
        {[
          { icon: Move, label: 'Pan canvas', hint: 'Click + drag' },
          { icon: ZoomIn, label: 'Zoom', hint: 'Scroll wheel' },
          { icon: MousePointer2, label: 'Select node', hint: 'Click on a node' },
        ].map(({ icon: Icon, label, hint }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 6px',
            }}>
              <Icon size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{hint}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default EmptyState
