import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, StickyNote, CheckSquare, Clock, Calendar,
  Image, Video, Gauge, Timer, Pencil, Layers,
  ChevronDown, ChevronRight, FolderOpen, Star,
  History, Keyboard, Palette, LayoutGrid, Plus,
  PanelLeft, FileText, BookOpen, Filter as FilterIcon, Compass, GitBranch,
  Columns,
} from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const NODE_CATEGORIES = [
  { type: 'data-table',label: 'Data Table',icon: Columns },
  { type: 'relation',  label: 'Relation',  icon: GitBranch },
  { type: 'entity',    label: 'Entity',    icon: FileText },
  { type: 'context',   label: 'Context',   icon: BookOpen },
  { type: 'collection',label: 'Collection',icon: FilterIcon },
  { type: 'portal',    label: 'Portal',    icon: Compass },
  { type: 'website',   label: 'Website',   icon: Globe },
  { type: 'notes',     label: 'Notes',     icon: StickyNote },
  { type: 'todo',      label: 'To-do',     icon: CheckSquare },
  { type: 'draw',      label: 'Draw',      icon: Pencil },
]

const SectionHeader = ({ label, open, onToggle, count }) => (
  <button
    onClick={onToggle}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '7px 12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}
  >
    <span>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {count !== undefined && (
        <span style={{
          fontSize: 9,
          background: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
          padding: '1px 5px',
          borderRadius: 4,
        }}>
          {count}
        </span>
      )}
      {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
    </div>
  </button>
)

const Sidebar = () => {
  const { addNode, nodes, sidebarOpen, toggleSidebar, openModal } = useWorkspaceStore()
  const [openSections, setOpenSections] = useState({
    workspace: true,
    nodeTypes: true,
    shortcuts: false,
    themes: false,
  })

  const toggleSection = (key) =>
    setOpenSections(s => ({ ...s, [key]: !s[key] }))

  return (
    <>
      {/* Sidebar Panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -220, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -220, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: 200,
              height: '100%',
              background: 'color-mix(in srgb, var(--bg-surface) 60%, transparent)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRight: '1px solid color-mix(in srgb, var(--bg-border) 40%, transparent)',
              boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              flexShrink: 0,
              zIndex: 20,
            }}
          >
            {/* Ambient Top Glow */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to bottom, var(--accent-glow), transparent)', pointerEvents: 'none', opacity: 0.5 }} />

            {/* ── Workspace Section ── */}
            <SectionHeader
              label="Workspace"
              open={openSections.workspace}
              onToggle={() => toggleSection('workspace')}
              count={nodes.length}
            />
            <AnimatePresence>
              {openSections.workspace && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '2px 8px 8px' }}>
                    <div style={{
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 8,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {nodes.length}
                      </span>
                      {' '}nodes in workspace
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ height: 1, background: 'var(--bg-border)', margin: '0 12px' }} />

            {/* ── Node Types Section ── */}
            <SectionHeader
              label="Node Types"
              open={openSections.nodeTypes}
              onToggle={() => toggleSection('nodeTypes')}
            />
            <AnimatePresence>
              {openSections.nodeTypes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '2px 8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {NODE_CATEGORIES.map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        className="sidebar-item"
                        onClick={() => addNode(type)}
                        style={{ width: '100%', textAlign: 'left' }}
                        title={`Add ${label} node`}
                      >
                        <Icon size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ height: 1, background: 'var(--bg-border)', margin: '0 12px' }} />

            {/* ── Shortcuts / Themes ── */}
            <button className="sidebar-item" style={{ margin: '4px 8px' }} onClick={() => openModal('shortcuts')}>
              <Keyboard size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Shortcuts</span>
            </button>
            <button className="sidebar-item" style={{ margin: '0 8px 8px' }} onClick={() => openModal('theme')}>
              <Palette size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Themes</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapse toggle button */}
      <button
        onClick={toggleSidebar}
        className="icon-btn"
        style={{
          position: 'absolute',
          top: '50%',
          left: sidebarOpen ? 204 : 8,
          transform: 'translateY(-50%)',
          zIndex: 30,
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 8,
          transition: 'left 0.22s',
        }}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <PanelLeft size={14} />
      </button>
    </>
  )
}

export default Sidebar
