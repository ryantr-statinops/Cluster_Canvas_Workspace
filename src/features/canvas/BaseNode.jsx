import React, { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { NodeResizer } from 'reactflow'
import {
  Globe, StickyNote, CheckSquare, Clock, Calendar,
  Image, Video, Gauge, Timer, Pencil, Layers,
  Lock, Unlock, X, Maximize2, Grip, Settings2,
  FileText, BookOpen, Filter, Compass, GitBranch,
  Columns
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
  entity:    FileText,
  context:   BookOpen,
  collection:  Filter,
  portal:      Compass,
  relation:    GitBranch,
  'data-table': Columns,
}

export const TYPE_LABELS = {
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
  entity:    'ENTITY',
  context:   'CONTEXT',
  collection: 'COLLECTION',
  portal:    'PORTAL',
  relation:  'RELATION',
  'data-table': 'TABLE',
}

const BaseNode = ({ id, type, data, style, selected, children, headerControls, noPadding }) => {
  const { selectNode, removeNode, toggleLock, bringToFront, updateNodeData, updateNodeStyle, openNodeProperties } = useWorkspaceStore()
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
        zIndex:  style?.zIndex || 1,
        opacity: style?.opacity ?? 1,
        borderColor: style?.outline || undefined,
        backgroundColor: style?.background || undefined,
      }}
      onClick={handleSelect}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      whileDrag={{ scale: 1.015 }}
    >
      <NodeResizer
        color="var(--accent)"
        isVisible={selected && !isLocked}
        minWidth={200}
        minHeight={150}
        lineStyle={{ opacity: 0, pointerEvents: 'none' }}
        handleStyle={{ width: 8, height: 8, background: 'var(--accent)', border: 'none', borderRadius: 2 }}
        resizeHandlePositions={['top', 'right', 'bottom', 'left']}
        resizeHandleStyles={{
          top: { cursor: 'ns-resize', height: 4, top: -2 },
          right: { cursor: 'ew-resize', width: 4, right: -2 },
          bottom: { cursor: 'ns-resize', height: 4, bottom: -2 },
          left: { cursor: 'ew-resize', width: 4, left: -2 }
        }}
        onResize={(e, params) => {
           updateNodeStyle(id, { width: params.width, height: params.height })
        }}
      />
      
      {/* ── Header ─── */}
      <div className="node-header" onDoubleClick={(e) => e.stopPropagation()}>
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

          {headerControls}

          {/* Properties Panel Toggle */}
          <button
            className="icon-btn"
            style={{ width: 22, height: 22, borderRadius: 5, color: 'var(--text-secondary)' }}
            title="Properties"
            onClick={(e) => { e.stopPropagation(); openNodeProperties(id); }}
          >
            <Settings2 size={11} />
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
      <div className={`node-content${noPadding ? ' no-padding' : ''}`}>
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

// Thêm CSS tại đây nếu không có file CSS riêng
<style>{`
  .resize-handle:hover {
    transform: scale(1.1);
    opacity: 1 !important;
  }
  .node-window {
    transition: width 0.2s ease, height 0.2s ease;
  }
`}</style>
