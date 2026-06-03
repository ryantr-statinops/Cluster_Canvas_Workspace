import React, { useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ReactFlowProvider } from 'reactflow'

import Navbar          from './components/layout/Navbar'
import Sidebar         from './components/layout/Sidebar'
import PropertiesPanel from './components/layout/PropertiesPanel'
import EdgePropertiesPanel from './components/edges/EdgePropertiesPanel'
import CanvasContainer from './features/canvas/CanvasContainer'
import SearchModal     from './components/ui/SearchModal'
import ThemeModal      from './components/ui/ThemeModal'
import ShortcutModal   from './components/ui/ShortcutModal'
import SettingsModal   from './components/ui/SettingsModal'
import EmptyState      from './components/ui/EmptyState'

import useWorkspaceStore from './store/useWorkspaceStore'
import useThemeStore     from './store/useThemeStore'
import { initPersistence } from './utils/persistence'

function App() {
  const store = useWorkspaceStore
  const {
    nodes,
    selectedNodeId,
    activeModal,
    closeModal,
    openModal,
    addNode,
    removeNode,
    duplicateNode,
    groupSelected,
    ungroupSelected,
    propertiesPanelOpen,
    selectedEdgeId,
    isFullScreen,
  } = useWorkspaceStore()

  const { init } = useThemeStore()

  // Init theme CSS variables + persistence on mount
  useEffect(() => {
    init()
    initPersistence(store)
  }, [init, store])

  // ── Global Keyboard Shortcuts ──────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    const tag = e.target.tagName.toLowerCase()
    const isEditing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable
    if (isEditing) return

    const ctrl = e.ctrlKey || e.metaKey
    const shift = e.shiftKey

    if (ctrl && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      addNode('notes')
    } else if (ctrl && e.key.toLowerCase() === 'd') {
      e.preventDefault()
      if (selectedNodeId) duplicateNode(selectedNodeId)
    } else if (ctrl && shift && e.key.toLowerCase() === 'g') {
      e.preventDefault()
      const hasGroupSelected = nodes.some(n => n.selected && n.type === 'group')
      if (hasGroupSelected) ungroupSelected()
      else groupSelected()
    } else if (ctrl && e.key === '0') {
      e.preventDefault()
      // Fit view is handled inside CanvasContainer
    } else if (ctrl && e.key === 'k') {
      e.preventDefault()
      openModal('search')
    } else if (ctrl && e.key === 'z') {
      e.preventDefault()
      const state = useWorkspaceStore.getState()
      if (shift) {
        if (state.redoStack.length > 0) state.redo()
      } else {
        if (state.undoStack.length > 0) state.undo()
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      const state = useWorkspaceStore.getState()
      const selectedEdge = state.edges.find(e => e.selected)
      if (selectedEdge) {
        state.setEdges(state.edges.filter(e => e.id !== selectedEdge.id))
      } else if (selectedNodeId) {
        removeNode(selectedNodeId)
      }
    } else if (e.key === 'Escape') {
      if (activeModal) closeModal()
    }
  }, [selectedNodeId, activeModal, addNode, duplicateNode, removeNode, closeModal, groupSelected, ungroupSelected, nodes])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const isEmpty = nodes.length === 0

  return (
    <ReactFlowProvider>
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
      {!isFullScreen && <Navbar />}

      {/* ── Main Layout Row ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Left Sidebar */}
        {!isFullScreen && <Sidebar />}

        {/* Canvas + Empty state */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <CanvasContainer />
          {isEmpty && <EmptyState />}
        </div>

        {/* Right Properties Panel (conditionally shown) */}
        <AnimatePresence>
          {propertiesPanelOpen && selectedEdgeId && <EdgePropertiesPanel key="edge-props" />}
          {propertiesPanelOpen && !selectedEdgeId && <PropertiesPanel key="props" />}
        </AnimatePresence>
      </div>

      {/* ── Modal Layer ── */}
      <AnimatePresence>
        {activeModal === 'search'    && <SearchModal   key="search"    />}
        {activeModal === 'theme'     && <ThemeModal    key="theme"     />}
        {activeModal === 'shortcuts' && <ShortcutModal key="shortcuts" />}
        {activeModal === 'settings'  && <SettingsModal key="settings"  />}
      </AnimatePresence>
      </div>
    </ReactFlowProvider>
  )
}

export default App
