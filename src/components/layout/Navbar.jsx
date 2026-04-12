import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Search, Plus, LayoutGrid, Workflow,
  Layers, Palette, Keyboard, Settings, ChevronDown,
  Globe, StickyNote, CheckSquare, Clock, Calendar,
  Image, Video, Gauge, Timer, Pencil, Square,
} from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const NODE_QUICK_ADD = [
  { type: 'notes',     label: 'Note',     icon: StickyNote },
  { type: 'todo',      label: 'To-do',    icon: CheckSquare },
  { type: 'website',   label: 'Website',  icon: Globe },
  { type: 'draw',      label: 'Draw',     icon: Pencil },
]

const Navbar = () => {
  const { 
    viewMode, setViewMode, openModal, addNode, nodes, 
    workspaces, activeWorkspaceId, createWorkspace, switchWorkspace 
  } = useWorkspaceStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)

  const handleAddNode = useCallback((type) => {
    addNode(type)
    setAddMenuOpen(false)
  }, [addNode])

  const filteredNodes = nodes.filter(n =>
    n.data?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Cluster Canvas
          </h1>
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

      {/* ── Center: Search ── */}
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
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
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {filteredNodes.length} found
            </span>
          )}
        </div>
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
