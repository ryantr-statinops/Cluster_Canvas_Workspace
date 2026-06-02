import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Search, Plus, LayoutGrid, Workflow,
  Layers, Palette, Keyboard, Settings, ChevronDown,
  Globe, StickyNote, CheckSquare, Clock, Calendar,
  Image, Video, Gauge, Timer, Pencil, Square, FileText, BookOpen, Filter as FilterIcon, Compass, GitBranch,
  ArrowUp, Undo2, Redo2, Shuffle, Trash2, Tag,
  Columns, PanelLeft,
} from 'lucide-react'
import { useReactFlow } from 'reactflow'
import useWorkspaceStore from '../../store/useWorkspaceStore'

// ── Layout directions ─────────────────────────────────────────────────
const LAYOUT_DIRECTIONS = [
  { value: 'TB', label: 'Top → Bottom', icon: ArrowUp },
  { value: 'LR', label: 'Left → Right',  icon: ArrowUp },
]

const NODE_QUICK_ADD = [
  { type: 'data-table',label: 'Table',    icon: Columns },
  { type: 'relation',  label: 'Relation',  icon: GitBranch },
  { type: 'entity',    label: 'Entity',    icon: FileText },
  { type: 'context',   label: 'Context',   icon: BookOpen },
  { type: 'collection',label: 'Collection',icon: FilterIcon },
  { type: 'portal',    label: 'Portal',    icon: Compass },
  { type: 'notes',     label: 'Note',      icon: StickyNote },
  { type: 'todo',      label: 'To-do',     icon: CheckSquare },
  { type: 'website',   label: 'Website',   icon: Globe },
  { type: 'draw',      label: 'Draw',      icon: Pencil },
  { type: 'group',     label: 'Group',     icon: Layers },
]

const NODE_TYPE_ICONS = {
  entity: FileText, context: BookOpen, notes: StickyNote,
  todo: CheckSquare, website: Globe, draw: Pencil,
  group: Layers, collection: FilterIcon, portal: Compass,
  relation: GitBranch, 'data-table': Columns,
}

const SearchResultRow = ({ node, onClick, compact }) => {
  const Icon = NODE_TYPE_ICONS[node.type] || LayoutDashboard

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: compact ? '3px 6px' : '6px 8px',
        borderRadius: 6, border: 'none',
        background: 'transparent', cursor: 'pointer',
        textAlign: 'left', width: '100%',
        transition: 'background 0.1s',
      }}
      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={compact ? 10 : 12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <span style={{
        flex: 1, fontSize: compact ? 10 : 11,
        color: 'var(--text-primary)', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {node.data?.title || 'Untitled'}
      </span>
      <span style={{
        fontSize: compact ? 8 : 9, color: 'var(--text-muted)',
        background: 'var(--bg-elevated)', padding: '0 5px', borderRadius: 4,
        flexShrink: 0,
      }}>
        {node.type}
      </span>
    </button>
  )
}

const Navbar = () => {
  const { 
    viewMode, setViewMode, openModal, addNode, nodes, edges,
    workspaces, activeWorkspaceId, createWorkspace, switchWorkspace,
    selectNode, undo, redo, undoStack, redoStack,
    applyLayout, applyLayoutToSelected, batchUpdateNodes, batchRemoveNodes,
    sidebarOpen, toggleSidebar, zoom
  } = useWorkspaceStore()

  const { zoomTo } = useReactFlow()
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false)
  const [isEditingZoom, setIsEditingZoom] = useState(false)
  const [zoomInputValue, setZoomInputValue] = useState('')

  const handleZoomInputSubmit = useCallback(() => {
    let val = parseFloat(zoomInputValue)
    if (!isNaN(val)) {
      // Clamp zoom between 10% (0.1) and 250% (2.5) matching reactflow boundaries
      val = Math.max(10, Math.min(250, val))
      zoomTo(val / 100, { duration: 300 })
    }
    setIsEditingZoom(false)
  }, [zoomInputValue, zoomTo])

  useEffect(() => {
    if (!zoomMenuOpen) return
    const handleOutsideClick = (e) => {
      const container = document.getElementById('zoom-dropdown-container')
      if (container && !container.contains(e.target)) {
        setZoomMenuOpen(false)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [zoomMenuOpen])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false)
  const [batchMenuOpen, setBatchMenuOpen] = useState(false)

  const selectedCount = nodes.filter(n => n.selected).length

  const handleAddNode = useCallback((type) => {
    addNode(type)
    setAddMenuOpen(false)
  }, [addNode])

  // ── Graph-aware search ────────────────────────────────────────────────
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()

    // Direct matches by title
    const directMatches = nodes.filter(n =>
      n.data?.title?.toLowerCase().includes(q)
    )

    // Connected nodes: nodes connected via edges to direct matches
    const matchedIds = new Set(directMatches.map(n => n.id))
    const connectedIds = new Set()
    const edgeMap = []

    for (const edge of edges) {
      const sourceMatched = matchedIds.has(edge.source)
      const targetMatched = matchedIds.has(edge.target)

      if (sourceMatched && !targetMatched) {
        connectedIds.add(edge.target)
        edgeMap.push({ from: edge.source, to: edge.target, edge })
      } else if (targetMatched && !sourceMatched) {
        connectedIds.add(edge.source)
        edgeMap.push({ from: edge.target, to: edge.source, edge })
      }
    }

    const connectedNodes = nodes.filter(n => connectedIds.has(n.id))

    return {
      direct: directMatches,
      connected: connectedNodes,
      edgeMap,
    }
  }, [nodes, edges, searchQuery])

  const handleSearchResultClick = useCallback((nodeId) => {
    selectNode(nodeId)
    setSearchQuery('')
    setSearchFocused(false)
  }, [selectNode])

  return (
    <nav style={{
      height: 56,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--bg-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
      zIndex: 50,
      position: 'relative',
    }}>
      {/* ── Left: Logo & Workspace Switcher ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {/* Toggle Sidebar Button */}
        <button
          onClick={toggleSidebar}
          className="icon-btn"
          style={{
            color: sidebarOpen ? 'var(--accent)' : 'var(--text-secondary)',
            background: sidebarOpen ? 'var(--bg-elevated)' : 'transparent',
          }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <PanelLeft size={16} />
        </button>

        {/* Logo and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}>
            <LayoutDashboard size={16} color="#1e222a" />
          </div>

          {/* Zoom Percentage Dropdown or Input */}
          <div id="zoom-dropdown-container" style={{ position: 'relative' }}>
            {isEditingZoom ? (
              <input
                type="text"
                value={zoomInputValue}
                onChange={e => setZoomInputValue(e.target.value)}
                onBlur={handleZoomInputSubmit}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleZoomInputSubmit()
                  if (e.key === 'Escape') setIsEditingZoom(false)
                }}
                autoFocus
                onFocus={e => e.target.select()}
                style={{
                  width: 70,
                  height: 27,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  outline: 'none',
                  boxShadow: '0 0 0 2px var(--accent-glow)',
                }}
              />
            ) : (
              <button 
                onClick={() => setZoomMenuOpen(s => !s)}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setZoomMenuOpen(false)
                  setZoomInputValue(Math.round((zoom || 1) * 100).toString())
                  setIsEditingZoom(true)
                }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, 
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', cursor: 'pointer',
                  padding: '6px 12px', borderRadius: 8, transition: 'border-color 0.15s',
                  color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
                  minWidth: 70, justifyContent: 'center'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
                title="Double click to edit zoom percentage"
              >
                <span>{Math.round((zoom || 1) * 100)}%</span>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
            
            {!isEditingZoom && zoomMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: 10, padding: 6, zIndex: 99, minWidth: 90,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}
              >
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((zoomVal) => {
                  const percentageStr = `${Math.round(zoomVal * 100)}%`
                  const isCurrent = Math.abs((zoom || 1) - zoomVal) < 0.05
                  return (
                    <button
                      key={zoomVal}
                      onClick={() => {
                        zoomTo(zoomVal, { duration: 300 })
                        setZoomMenuOpen(false)
                      }}
                      style={{
                        textAlign: 'center', padding: '6px 8px', borderRadius: 6,
                        background: isCurrent ? 'var(--bg-elevated)' : 'transparent',
                        border: 'none', color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: 12, cursor: 'pointer', transition: 'background 0.1s', fontWeight: isCurrent ? 600 : 500
                      }}
                      onMouseOver={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                      onMouseOut={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
                    >
                      {percentageStr}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--bg-border)' }} />

        {/* Workspace Switcher */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setWorkspaceMenuOpen(s => !s)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, 
              background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', cursor: 'pointer',
              padding: '6px 12px', borderRadius: 8, transition: 'border-color 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--text-muted)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
          >
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
              {workspaces.find(ws => ws.id === activeWorkspaceId)?.name || 'Main Workspace'}
            </span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
          
          {workspaceMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                onClick={() => setWorkspaceMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: 12, padding: 8, zIndex: 99, minWidth: 200,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <div style={{ padding: '4px 8px 8px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => { switchWorkspace(ws.id); setWorkspaceMenuOpen(false); }}
                    style={{
                      textAlign: 'left', padding: '8px 10px', borderRadius: 6,
                      background: ws.id === activeWorkspaceId ? 'var(--bg-elevated)' : 'transparent',
                      border: 'none', color: ws.id === activeWorkspaceId ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: 13, cursor: 'pointer', transition: 'background 0.1s', fontWeight: 500
                    }}
                    onMouseOver={e => { if (ws.id !== activeWorkspaceId) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                    onMouseOut={e => { if (ws.id !== activeWorkspaceId) e.currentTarget.style.background = 'transparent' }}
                  >
                    {ws.name}
                  </button>
                ))}
                <div style={{ height: 1, background: 'var(--bg-border)', margin: '4px 0' }} />
                <button
                  onClick={() => { createWorkspace(); setWorkspaceMenuOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 6,
                    background: 'transparent', border: 'none', color: 'var(--accent)',
                    fontSize: 13, cursor: 'pointer', fontWeight: 600
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 15%, transparent)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Plus size={14} /> Create Workspace
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* ── Center: Graph-aware Search ── */}
      <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderRadius: 10,
          padding: '0 12px',
          height: 34,
          transition: 'border-color 0.15s',
        }}>
          <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
            placeholder="Search nodes & relationships..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchQuery && filteredNodes.direct && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {filteredNodes.direct.length} found
            </span>
          )}
        </div>

        {/* Search results dropdown */}
        {searchFocused && searchQuery.trim() && (filteredNodes.direct?.length > 0 || filteredNodes.connected?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 12,
              padding: 6,
              zIndex: 99,
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {/* Direct matches */}
            {filteredNodes.direct.length > 0 && (
              <>
                <div style={{
                  padding: '4px 8px', fontSize: 9, fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Nodes — {filteredNodes.direct.length} match{filteredNodes.direct.length !== 1 ? 'es' : ''}
                </div>
                {filteredNodes.direct.map(n => (
                  <SearchResultRow
                    key={n.id}
                    node={n}
                    onClick={() => handleSearchResultClick(n.id)}
                  />
                ))}
              </>
            )}

            {/* Connected nodes */}
            {filteredNodes.connected.length > 0 && (
              <>
                <div style={{
                  height: 1, background: 'var(--bg-border)',
                  margin: '4px 0',
                }} />
                <div style={{
                  padding: '4px 8px', fontSize: 9, fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Connected — {filteredNodes.connected.length} related
                </div>
                {filteredNodes.connected.map(n => {
                  // Find the edge that connects this node to a matched node
                  const conn = filteredNodes.edgeMap.find(
                    e => e.to === n.id || e.from === n.id
                  )
                  const matchedNode = conn
                    ? nodes.find(nn => nn.id === conn.from)
                    : null

                  return (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px', borderRadius: 6,
                      }}
                    >
                      <ArrowUp size={10} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }} />
                      <SearchResultRow
                        node={n}
                        onClick={() => handleSearchResultClick(n.id)}
                        compact
                      />
                      {matchedNode && (
                        <span style={{
                          fontSize: 8, color: 'var(--text-muted)',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', maxWidth: 80, flexShrink: 0,
                        }}>
                          via {matchedNode.data?.title || 'node'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Right: Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Add Node dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-primary"
            onClick={() => setAddMenuOpen(s => !s)}
            style={{ gap: 6, paddingRight: 10 }}
            id="add-node-btn"
          >
            <Plus size={14} />
            <span>Add node</span>
            <ChevronDown size={12} style={{ marginLeft: 2 }} />
          </button>

          {addMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                onClick={() => setAddMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 12,
                  padding: 8,
                  zIndex: 99,
                  minWidth: 160,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                }}
              >
                {NODE_QUICK_ADD.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => handleAddNode(type)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 6px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 500,
                      transition: 'background 0.12s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={16} style={{ color: 'var(--accent)' }} />
                    {label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--bg-border)' }} />

        {/* Flex / Grid toggle */}
        <button
          className={`btn-ghost ${viewMode === 'flex' ? 'active' : ''}`}
          onClick={() => setViewMode('flex')}
          title="Flex Mode - free canvas"
          id="flex-mode-btn"
        >
          <Workflow size={14} />
          <span style={{ fontSize: 12 }}>Flex</span>
        </button>

        <button
          className={`btn-ghost ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Grid Mode - tiled layout"
          id="grid-mode-btn"
        >
          <LayoutGrid size={14} />
          <span style={{ fontSize: 12 }}>Grid</span>
        </button>

        {/* Auto-Layout */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setLayoutMenuOpen(s => !s)}
            title="Auto-layout graph"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Shuffle size={14} />
          </button>

          {layoutMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                onClick={() => setLayoutMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: 10, padding: 6, zIndex: 99, minWidth: 160,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}
              >
                <div style={{
                  padding: '4px 8px', fontSize: 9, fontWeight: 600,
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Layout all nodes
                </div>
                {LAYOUT_DIRECTIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => { applyLayout(d.value); setLayoutMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 6, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontSize: 11, color: 'var(--text-secondary)', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <d.icon size={11} style={{ color: 'var(--accent)', transform: d.value === 'LR' ? 'rotate(90deg)' : 'none' }} />
                    {d.label}
                  </button>
                ))}
                {selectedCount > 0 && (
                  <>
                    <div style={{ height: 1, background: 'var(--bg-border)', margin: '4px 0' }} />
                    <div style={{
                      padding: '4px 8px', fontSize: 9, fontWeight: 600,
                      color: 'var(--text-muted)', textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Selected only ({selectedCount})
                    </div>
                    {LAYOUT_DIRECTIONS.map(d => (
                      <button
                        key={`sel-${d.value}`}
                        onClick={() => { applyLayoutToSelected(d.value); setLayoutMenuOpen(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 8px', borderRadius: 6, border: 'none',
                          background: 'transparent', cursor: 'pointer',
                          fontSize: 11, color: 'var(--text-secondary)', textAlign: 'left',
                          transition: 'background 0.1s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <d.icon size={11} style={{ color: 'var(--accent)', transform: d.value === 'LR' ? 'rotate(90deg)' : 'none' }} />
                        {d.label}
                      </button>
                    ))}
                  </>
                )}
              </motion.div>
            </>
          )}
        </div>

        {/* Batch Operations */}
        {selectedCount > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn-ghost"
              onClick={() => setBatchMenuOpen(s => !s)}
              style={{ gap: 4, height: 30, fontSize: 11 }}
            >
              <CheckSquare size={12} />
              <span>{selectedCount}</span>
              <ChevronDown size={10} />
            </button>

            {batchMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                  onClick={() => setBatchMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                    borderRadius: 10, padding: 6, zIndex: 99, minWidth: 160,
                    boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                >
                  <div style={{
                    padding: '4px 8px', fontSize: 9, fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Batch actions ({selectedCount} nodes)
                  </div>

                  <button
                    onClick={() => {
                      const ids = nodes.filter(n => n.selected).map(n => n.id)
                      batchUpdateNodes(ids, { status: 'active' })
                      setBatchMenuOpen(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 6, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontSize: 11, color: 'var(--text-secondary)', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Tag size={11} style={{ color: 'var(--accent)' }} />
                    Set status → Active
                  </button>

                  <button
                    onClick={() => {
                      const ids = nodes.filter(n => n.selected).map(n => n.id)
                      batchUpdateNodes(ids, { status: 'archived' })
                      setBatchMenuOpen(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 6, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontSize: 11, color: 'var(--text-secondary)', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Tag size={11} style={{ color: 'var(--text-muted)' }} />
                    Set status → Archived
                  </button>

                  <div style={{ height: 1, background: 'var(--bg-border)', margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      const ids = nodes.filter(n => n.selected).map(n => n.id)
                      batchUpdateNodes(ids, { color: '#60a5fa' })
                      setBatchMenuOpen(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 6, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontSize: 11, color: 'var(--text-secondary)', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Pencil size={11} style={{ color: 'var(--accent)' }} />
                    Set color → Blue
                  </button>

                  <div style={{ height: 1, background: 'var(--bg-border)', margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      const ids = nodes.filter(n => n.selected).map(n => n.id)
                      batchRemoveNodes(ids)
                      setBatchMenuOpen(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 6, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontSize: 11, color: '#bf616a', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(191,97,106,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 size={11} />
                    Delete all selected
                  </button>
                </motion.div>
              </>
            )}
          </div>
        )}

        {/* Undo / Redo */}
        <button
          className="icon-btn"
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
          style={{ opacity: undoStack.length === 0 ? 0.4 : 1 }}
        >
          <Undo2 size={14} />
        </button>
        <button
          className="icon-btn"
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Shift+Z)"
          style={{ opacity: redoStack.length === 0 ? 0.4 : 1 }}
        >
          <Redo2 size={14} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--bg-border)' }} />

        {/* Layer control */}
        <button
          className="icon-btn"
          onClick={() => openModal('settings')}
          title="Layer controls"
        >
          <Layers size={16} />
        </button>

        {/* Theme */}
        <button
          className="icon-btn"
          onClick={() => openModal('theme')}
          title="Choose theme"
          id="theme-btn"
        >
          <Palette size={16} />
        </button>

        {/* Shortcuts */}
        <button
          className="icon-btn"
          onClick={() => openModal('shortcuts')}
          title="Keyboard shortcuts"
          id="shortcuts-btn"
        >
          <Keyboard size={16} />
        </button>

        {/* Settings */}
        <button
          className="icon-btn"
          onClick={() => openModal('settings')}
          title="Settings"
          id="settings-btn"
        >
          <Settings size={16} />
        </button>
      </div>
    </nav>
  )
}

export default Navbar
