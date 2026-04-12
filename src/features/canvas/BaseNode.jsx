import React, { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, StickyNote, CheckSquare, Clock, Calendar,
  Image, Video, Gauge, Timer, Pencil, Layers,
  Lock, Unlock, X, Maximize2, Grip
} from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const TYPE_ICONS = {
  website:   Globe,
  notes:     StickyNote,
  todo:      CheckSquare,
  clock:     Clock,
  calendar:  Calendar,
  picture:   Image,
  video:     Video,
  widget:    Gauge,
  countdown: Timer,
  draw:      Pencil,
  group:     Layers,
}

const TYPE_LABELS = {
  website:   'WEBSITE',
  notes:     'NOTES',
  todo:      'TODO',
  clock:     'CLOCK',
  calendar:  'CALENDAR',
  picture:   'PICTURE',
  video:     'VIDEO',
  widget:    'WIDGET',
  countdown: 'COUNTDOWN',
  draw:      'DRAW',
  group:     'GROUP',
}

const BaseNode = ({ id, type, data, style, selected, children }) => {
  const { selectNode, removeNode, toggleLock, bringToFront, updateNodeData } = useWorkspaceStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(data?.title || 'Node')
  const titleRef = useRef(null)

  const isLocked = style?.locked || false
  const TypeIcon = TYPE_ICONS[type] || Layers

  const handleSelect = useCallback((e) => {
    e.stopPropagation()
    selectNode(id)
    bringToFront(id)
  }, [id, selectNode, bringToFront])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    removeNode(id)
  }, [id, removeNode])

  const handleLock = useCallback((e) => {
    e.stopPropagation()
    toggleLock(id)
  }, [id, toggleLock])

  const handleTitleDoubleClick = useCallback(() => {
    if (isLocked) return
    setEditingTitle(true)
    setTimeout(() => titleRef.current?.select(), 10)
  }, [isLocked])

  const handleTitleBlur = useCallback(() => {
    setEditingTitle(false)
    updateNodeData(id, { title: titleValue || 'Untitled' })
  }, [id, titleValue, updateNodeData])

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.target.blur()
    }
  }, [])

  return (
    <motion.div
      className={`node-window ${selected ? 'selected' : ''}`}
      style={{
        width:   style?.width  || 280,
        height:  style?.height || 220,
        zIndex:  style?.zIndex || 1,
        opacity: style?.opacity ?? 1,
        borderColor: selected
          ? 'var(--accent)'
          : style?.outline
          ? style.outline
          : undefined,
        backgroundColor: style?.background || undefined,
      }}
      onClick={handleSelect}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      whileDrag={{ scale: 1.015, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
    >
      {/* ── Header ─── */}
      <div className="node-header nodrag" onDoubleClick={(e) => e.stopPropagation()}>
        {/* Drag handle indicator */}
        <Grip size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

        {/* Type Icon */}
        <TypeIcon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              ref={titleRef}
              className="field-input"
              style={{ padding: '1px 4px', fontSize: 12, height: 20 }}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                cursor: isLocked ? 'default' : 'text',
              }}
              onDoubleClick={handleTitleDoubleClick}
            >
              {data?.title || 'Untitled'}
            </span>
          )}
        </div>

        {/* Type badge */}
        <span className="badge" style={{ flexShrink: 0 }}>
          {TYPE_LABELS[type] || type.toUpperCase()}
        </span>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {/* Lock button */}
          <button
            className="icon-btn"
            style={{ width: 22, height: 22, borderRadius: 5 }}
            onClick={handleLock}
            title={isLocked ? 'Unlock' : 'Lock'}
          >
            {isLocked
              ? <Lock size={10} style={{ color: 'var(--accent)' }} />
              : <Unlock size={10} />
            }
          </button>

          {/* Expand (placeholder) */}
          <button
            className="icon-btn"
            style={{ width: 22, height: 22, borderRadius: 5 }}
            title="Expand"
            onClick={(e) => e.stopPropagation()}
          >
            <Maximize2 size={10} />
          </button>

          {/* Close */}
          <button
            className="icon-btn"
            style={{ width: 22, height: 22, borderRadius: 5, color: 'var(--text-muted)' }}
            onClick={handleDelete}
            title="Delete node"
          >
            <X size={10} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="node-content" style={{ overflow: 'hidden' }}>
        {children}
      </div>

      {/* ── Lock Overlay ── */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            cursor: 'not-allowed',
            borderRadius: 'inherit',
          }}
          onClick={handleSelect}
        />
      )}
    </motion.div>
  )
}

export default React.memo(BaseNode)
