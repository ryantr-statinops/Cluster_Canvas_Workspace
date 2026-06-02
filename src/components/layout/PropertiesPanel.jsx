import React, { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Lock, Unlock, Layers, ArrowUp, ArrowDown,
  Copy, Trash2, ChevronUp, ChevronDown,
  Globe, StickyNote, CheckSquare, Clock, Calendar,
  Image, Video, Gauge, Timer, Pencil, Square, FileText, BookOpen, Filter as FilterIcon, Compass, GitBranch,

} from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { getDefaultSize } from '../../features/nodes/registry/nodeRegistry'


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
  group:     Square,
  entity:    FileText,
  context:   BookOpen,
  collection: FilterIcon,
  portal:    Compass,
  relation:  GitBranch,
}

const Row = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {label}
    </label>
    {children}
  </div>
)

const NumBox = ({ value, label }) => (
  <div style={{
    flex: 1,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--bg-border)',
    borderRadius: 8,
    padding: '5px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  }}>
    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
      fontFamily: "'JetBrains Mono', monospace" }}>
      {Math.round(value ?? 0)}
    </span>
  </div>
)

const PropertiesPanel = () => {
  const {
    nodes,
    selectedNodeId,
    clearSelection,
    updateNodeData,
    updateNodeStyle,
    toggleLock,
    bringToFront,
    sendToBack,
    removeNode,
    duplicateNode,
  } = useWorkspaceStore()

  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  const handleTitleChange = useCallback((e) => {
    updateNodeData(selectedNodeId, { title: e.target.value })
  }, [selectedNodeId, updateNodeData])

  const handleOpacityChange = useCallback((e) => {
    updateNodeStyle(selectedNodeId, { opacity: parseFloat(e.target.value) })
  }, [selectedNodeId, updateNodeStyle])

  const handleOutlineChange = useCallback((e) => {
    updateNodeStyle(selectedNodeId, { outline: e.target.value })
  }, [selectedNodeId, updateNodeStyle])

  const handleBgChange = useCallback((e) => {
    updateNodeStyle(selectedNodeId, { background: e.target.value })
  }, [selectedNodeId, updateNodeStyle])

  if (!selectedNode) return null

  const TypeIcon = TYPE_ICONS[selectedNode.type] || Square
  const isLocked = selectedNode.style?.locked || false

  return (
    <AnimatePresence>
      <motion.aside
        key="properties"
        initial={{ x: 280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 280, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 260,
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--bg-border)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Properties
          </h2>
          <button className="icon-btn" style={{ width: 24, height: 24, borderRadius: 6 }} onClick={useWorkspaceStore.getState().closeNodeProperties}>
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <Row label="Title">
            <input
              className="field-input"
              value={selectedNode.data?.title || ''}
              onChange={handleTitleChange}
            />
          </Row>

          {/* Type */}
          <Row label="Type">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: '6px 10px',
            }}>
              <TypeIcon size={13} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {selectedNode.type}
              </span>
            </div>
          </Row>

          {/* Position */}
          <Row label="Position">
            <div style={{ display: 'flex', gap: 8 }}>
              <NumBox value={selectedNode.position?.x} label="X" />
              <NumBox value={selectedNode.position?.y} label="Y" />
            </div>
          </Row>

          {/* Size */}
          <Row label="Size">
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  W
                </label>
                <input
                  type="number"
                  min={200}
                  step={1}
                  disabled={isLocked}
                  value={Math.round(selectedNode.style?.width ?? getDefaultSize(selectedNode.type)?.width ?? 280)}
                  onChange={(e) => updateNodeStyle(selectedNodeId, { width: parseInt(e.target.value || '0', 10) })}
                  style={{ height: 30, opacity: isLocked ? 0.6 : 1 }}
                  className="field-input"
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  H
                </label>
                <input
                  type="number"
                  min={150}
                  step={1}
                  disabled={isLocked}
                  value={Math.round(selectedNode.style?.height ?? getDefaultSize(selectedNode.type)?.height ?? 220)}
                  onChange={(e) => updateNodeStyle(selectedNodeId, { height: parseInt(e.target.value || '0', 10) })}
                  style={{ height: 30, opacity: isLocked ? 0.6 : 1 }}
                  className="field-input"
                />
              </div>
            </div>
          </Row>


          {/* Layer */}
          <Row label="Layer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                textAlign: 'center',
              }}>
                {selectedNode.style?.zIndex ?? 1}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <button
                  className="icon-btn"
                  style={{ width: 26, height: 26, borderRadius: 6 }}
                  onClick={() => bringForward(selectedNodeId)}
                  title="Bring forward"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  className="icon-btn"
                  style={{ width: 26, height: 26, borderRadius: 6 }}
                  onClick={() => sendBackward(selectedNodeId)}
                  title="Send backward"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-ghost"
                style={{ flex: 1, fontSize: 11, height: 30, justifyContent: 'center', gap: 4 }}
                onClick={() => bringToFront(selectedNodeId)}
              >
                <ArrowUp size={11} />
                Front
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1, fontSize: 11, height: 30, justifyContent: 'center', gap: 4 }}
                onClick={() => sendToBack(selectedNodeId)}
              >
                <ArrowDown size={11} />
                Back
              </button>
            </div>
          </Row>

          {/* Lock State */}
          <Row label="Lock State">
            <button
              className="btn-ghost"
              onClick={() => toggleLock(selectedNodeId)}
              style={{
                justifyContent: 'center',
                gap: 6,
                height: 32,
                color: isLocked ? 'var(--accent)' : 'var(--text-secondary)',
                borderColor: isLocked ? 'var(--accent)' : undefined,
                background: isLocked ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined,
              }}
            >
              {isLocked
                ? <Lock size={13} style={{ color: 'var(--accent)' }} />
                : <Unlock size={13} />
              }
              {isLocked ? 'Locked' : 'Unlocked'}
            </button>
          </Row>

          <div style={{ height: 1, background: 'var(--bg-border)' }} />

          {/* Style */}
          <Row label="Style">
            {/* Opacity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Opacity</span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {Math.round((selectedNode.style?.opacity ?? 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selectedNode.style?.opacity ?? 1}
                onChange={handleOpacityChange}
                style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
            </div>

            {/* Outline Color */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Outline</span>
              <input
                type="color"
                value={selectedNode.style?.outline || '#88c0d0'}
                onChange={handleOutlineChange}
                style={{
                  width: 32,
                  height: 24,
                  borderRadius: 6,
                  border: '1px solid var(--bg-border)',
                  cursor: 'pointer',
                  background: 'none',
                  padding: 2,
                }}
              />
            </div>

            {/* Background Color */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Background</span>
              <input
                type="color"
                value={selectedNode.style?.background || '#2e3440'}
                onChange={handleBgChange}
                style={{
                  width: 32,
                  height: 24,
                  borderRadius: 6,
                  border: '1px solid var(--bg-border)',
                  cursor: 'pointer',
                  background: 'none',
                  padding: 2,
                }}
              />
            </div>
          </Row>

          <div style={{ height: 1, background: 'var(--bg-border)' }} />

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              className="btn-ghost"
              style={{ justifyContent: 'center', gap: 6, height: 32 }}
              onClick={() => duplicateNode(selectedNodeId)}
            >
              <Copy size={13} />
              Duplicate
            </button>

            <button
              onClick={() => removeNode(selectedNodeId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 32,
                background: 'rgba(191,97,106,0.08)',
                border: '1px solid rgba(191,97,106,0.3)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#bf616a',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(191,97,106,0.16)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(191,97,106,0.08)'}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

export default PropertiesPanel
