import React, { useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Circle } from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { EDGE_TYPES } from '../../features/edges/StyledEdge'

/**
 * EdgePropertiesPanel — floating popover when an edge is selected.
 * Allows changing edge type, editing label, and deleting the edge.
 */
const EdgePropertiesPanel = () => {
  const {
    edges,
    selectedEdgeId,
    updateEdgeData,
    setEdges,
    clearEdgeSelection,
    nodes,
  } = useWorkspaceStore()

  const selectedEdge = useMemo(
    () => edges.find(e => e.id === selectedEdgeId),
    [edges, selectedEdgeId]
  )

  // Resolve source/target node names
  const sourceNode = useMemo(
    () => nodes.find(n => n.id === selectedEdge?.source),
    [nodes, selectedEdge]
  )
  const targetNode = useMemo(
    () => nodes.find(n => n.id === selectedEdge?.target),
    [nodes, selectedEdge]
  )

  const handleTypeChange = useCallback((e) => {
    if (!selectedEdgeId) return
    updateEdgeData(selectedEdgeId, { type: e.target.value })
  }, [selectedEdgeId, updateEdgeData])

  const handleLabelChange = useCallback((e) => {
    if (!selectedEdgeId) return
    updateEdgeData(selectedEdgeId, { label: e.target.value })
  }, [selectedEdgeId, updateEdgeData])

  const handleDelete = useCallback(() => {
    if (!selectedEdgeId) return
    setEdges(edges.filter(e => e.id !== selectedEdgeId))
    clearEdgeSelection()
  }, [selectedEdgeId, edges, setEdges, clearEdgeSelection])

  const handleClose = useCallback(() => {
    clearEdgeSelection()
  }, [clearEdgeSelection])

  if (!selectedEdge) return null

  const currentType = selectedEdge.data?.type || 'default'
  const currentLabel = selectedEdge.data?.label || ''
  const typeConfig = EDGE_TYPES.find(t => t.value === currentType) || EDGE_TYPES[0]

  return (
    <AnimatePresence>
      <motion.div
        key="edge-props"
        initial={{ opacity: 0, y: -4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 260,
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Circle size={6} fill={typeConfig.color} stroke="none" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              Edge Properties
            </span>
          </div>
          <button
            className="icon-btn"
            style={{ width: 22, height: 22, borderRadius: 5 }}
            onClick={handleClose}
            title="Close"
          >
            <X size={11} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Connection info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 8px', borderRadius: 8,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right' }}>
              {sourceNode?.data?.title || 'Node'}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>→</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {targetNode?.data?.title || 'Node'}
            </span>
          </div>

          {/* Edge type selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Type
            </label>
            <select
              className="field-input"
              value={currentType}
              onChange={handleTypeChange}
              onClick={e => e.stopPropagation()}
              style={{ height: 30, fontSize: 11, padding: '0 8px' }}
            >
              {EDGE_TYPES.map(et => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>

            {/* Type preview dots */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
              {EDGE_TYPES.map(et => (
                <div
                  key={et.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    padding: '2px 6px', borderRadius: 4,
                    background: et.value === currentType ? 'var(--bg-elevated)' : 'transparent',
                    border: et.value === currentType ? '1px solid var(--bg-border)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    updateEdgeData(selectedEdgeId, { type: et.value })
                  }}
                  onMouseOver={e => { if (et.value !== currentType) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseOut={e => { if (et.value !== currentType) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: et.color, flexShrink: 0,
                    border: et.value === currentType ? '2px solid var(--accent)' : 'none',
                  }} />
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {et.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Label input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Label
            </label>
            <input
              className="field-input"
              placeholder="e.g. depends on, references..."
              value={currentLabel}
              onChange={handleLabelChange}
              onClick={e => e.stopPropagation()}
              style={{ height: 30, fontSize: 11, padding: '0 8px' }}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--bg-border)' }} />

          {/* Delete button */}
          <button
            onClick={handleDelete}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              height: 32, borderRadius: 8,
              background: 'rgba(191,97,106,0.08)',
              border: '1px solid rgba(191,97,106,0.3)',
              fontSize: 12, fontWeight: 500, color: '#bf616a',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(191,97,106,0.16)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(191,97,106,0.08)'}
          >
            <Trash2 size={12} />
            Delete Edge
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EdgePropertiesPanel
