import React from 'react'
import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import useThemeStore from '../../store/useThemeStore'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const ThemeModal = () => {
  const { themes, activeTheme, setTheme } = useThemeStore()
  const { closeModal } = useWorkspaceStore()

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Choose Theme
          </h2>
          <button className="icon-btn" style={{ width: 28, height: 28, borderRadius: 8 }} onClick={closeModal}>
            <X size={14} />
          </button>
        </div>

        {/* Theme List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.values(themes).map((theme) => {
            const isActive = theme.id === activeTheme
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--bg-border)'}`,
                  background: isActive
                    ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                    : 'var(--bg-elevated)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {/* Color swatches */}
                <div style={{ display: 'flex', gap: 3 }}>
                  {theme.swatches.map((color, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: color,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ))}
                </div>

                <span style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                }}>
                  {theme.name}
                </span>

                {isActive && <Check size={14} style={{ color: 'var(--accent)' }} />}
              </button>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default ThemeModal
