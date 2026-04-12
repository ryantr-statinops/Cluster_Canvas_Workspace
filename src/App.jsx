import React, { useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'

import Navbar          from './components/layout/Navbar'
import Sidebar         from './components/layout/Sidebar'
import PropertiesPanel from './components/layout/PropertiesPanel'
import CanvasContainer from './features/canvas/CanvasContainer'
import ThemeModal      from './components/ui/ThemeModal'
import ShortcutModal   from './components/ui/ShortcutModal'
import SettingsModal   from './components/ui/SettingsModal'
import EmptyState      from './components/ui/EmptyState'

import useWorkspaceStore from './store/useWorkspaceStore'
import useThemeStore     from './store/useThemeStore'

function App() {
  const {
    nodes,
    selectedNodeId,
    activeModal,
    closeModal,
    openModal,
    addNode,
    removeNode,
    duplicateNode,
    setViewMode,
    viewMode,
  } = useWorkspaceStore()

  const { init } = useThemeStore()

  // Init theme CSS variables on mount
  useEffect(() => {
    init()
  }, [init])

  // ── Global Keyboard Shortcuts ──────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const tag = e.target.tagName.toLowerCase()
    const isEditing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable
    if (isEditing) return

    const ctrl = e.ctrlKey || e.metaKey

    if (ctrl && e.key === 'n') {
      e.preventDefault()
      addNode('notes')
    } else if (ctrl && e.key === 'd') {
      e.preventDefault()
      if (selectedNodeId) duplicateNode(selectedNodeId)
    } else if (ctrl && e.key === 'g') {
      e.preventDefault()
      setViewMode(viewMode === 'flex' ? 'grid' : 'flex')
    } else if (ctrl && e.key === '0') {
      e.preventDefault()
      // Fit view is handled inside CanvasContainer
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNodeId) removeNode(selectedNodeId)
    } else if (e.key === 'Escape') {
      if (activeModal) closeModal()
    }
  }, [selectedNodeId, activeModal, viewMode, addNode, duplicateNode, removeNode, setViewMode, closeModal])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const isEmpty = nodes.length === 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: 'var(--bg-canvas)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* ── Top Navbar ── */}
      <Navbar />

      {/* ── Main Layout Row ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Left Sidebar */}
        <Sidebar />

        {/* Canvas + Empty state */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <CanvasContainer />
          {isEmpty && <EmptyState />}
        </div>

        {/* Right Properties Panel (conditionally shown) */}
        <AnimatePresence>
          {selectedNodeId && <PropertiesPanel key="props" />}
        </AnimatePresence>
      </div>

      {/* ── Modal Layer ── */}
      <AnimatePresence>
        {activeModal === 'theme'     && <ThemeModal    key="theme"     />}
        {activeModal === 'shortcuts' && <ShortcutModal key="shortcuts" />}
        {activeModal === 'settings'  && <SettingsModal key="settings"  />}
      </AnimatePresence>
    </div>
  )
}

export default App
