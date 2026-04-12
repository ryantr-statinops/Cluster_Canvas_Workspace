import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LayoutGrid, StickyNote, Globe, CheckSquare, Pencil, Layers } from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const TYPE_ICONS = {
  notes:   StickyNote,
  website: Globe,
  todo:    CheckSquare,
  draw:    Pencil,
  group:   Layers,
}

const TYPE_COLORS = {
  notes:   '#60a5fa',
  website: '#34d399',
  todo:    '#a78bfa',
  draw:    '#f59e0b',
}

/* ─── Mini card preview for each selected node ─── */
const GridCard = ({ node }) => {
  const Icon = TYPE_ICONS[node.type] || Layers
  const color = TYPE_COLORS[node.type] || 'var(--accent)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: '14px 14px 0 0' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            {node.data?.title || 'Untitled'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {node.type}
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {node.type === 'notes' && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
            {node.data?.content || 'Empty note…'}
          </p>
        )}
        {node.type === 'website' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.data?.url || 'No URL set'}
            </div>
            <div style={{ height: 60, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={20} style={{ color: 'var(--bg-border)' }} />
            </div>
          </div>
        )}
        {node.type === 'todo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(node.data?.tasks || []).slice(0, 5).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: 3,
                  background: task.done ? color : 'transparent',
                  border: `1.5px solid ${task.done ? color : 'var(--bg-border)'}`,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, color: task.done ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: task.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.text}
                </span>
              </div>
            ))}
            {(node.data?.tasks || []).length === 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>No tasks yet</p>
            )}
          </div>
        )}
        {node.type === 'draw' && (
          <div style={{ height: 60, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={20} style={{ color: 'var(--bg-border)' }} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

const GridOverlay = () => {
  const { nodes, viewMode, setViewMode } = useWorkspaceStore()

  const selectedNodes = useMemo(
    () => nodes.filter(n => n.selected && n.type !== 'group'),
    [nodes]
  )

  if (viewMode !== 'grid') return null

  const count = selectedNodes.length
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4

  return (
    <AnimatePresence>
      <motion.div
        key="grid-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg-canvas)',
          zIndex: 400,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid var(--bg-border)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LayoutGrid size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Grid Mode</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count} node{count !== 1 ? 's' : ''} selected</div>
            </div>
          </div>
          <button
            onClick={() => setViewMode('flex')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
              transition: 'border-color 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
          >
            <X size={13} /> Exit Grid Mode
          </button>
        </div>

        {/* Grid */}
        {count === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <LayoutGrid size={48} style={{ color: 'var(--bg-border)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Select some nodes on the canvas first, then switch to Grid view.</p>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 16,
              padding: 24,
              overflowY: 'auto',
              alignContent: 'start',
            }}
          >
            {selectedNodes.map(node => (
              <GridCard key={node.id} node={node} />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default GridOverlay
