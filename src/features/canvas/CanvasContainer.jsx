import React, { useCallback, useMemo, useRef } from 'react'
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Compass, Maximize, Minimize } from 'lucide-react'

import useWorkspaceStore from '../../store/useWorkspaceStore'
import GridOverlay from '../../components/ui/GridOverlay'

import TodoNode     from '../nodes/TodoNode'
import NotesNode    from '../nodes/NotesNode'
import WebsiteNode  from '../nodes/WebsiteNode'
import GroupNode    from '../nodes/GroupNode'
import DrawNode     from '../nodes/DrawNode'

// Define outside component to avoid recreation on each render
const NODE_TYPES = {
  todo:     TodoNode,
  notes:    NotesNode,
  website:  WebsiteNode,
  group:    GroupNode,
  draw:     DrawNode,
}

const CanvasInner = () => {
  const {
    nodes,
    onNodesChange,
    selectNode,
    clearSelection,
    viewMode,
    isFullScreen,
    toggleFullScreen
  } = useWorkspaceStore()

  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const wrapperRef = useRef(null)

  // Map our store nodes to React Flow format
  const rfNodes = useMemo(() => nodes.map(node => ({
    id:       node.id,
    type:     node.type,
    position: node.position,
    selected: node.selected,
    data:     node.data,
    style:    node.style,
    draggable: !node.style?.locked,
    // Pass width/height to React Flow so fitView calculates correctly
    width:  node.style?.width  || 280,
    height: node.style?.height || 220,
    // For group nodes (parent containers)
    ...(node.parentId ? { parentNode: node.parentId, extent: 'parent' } : {}),
  })), [nodes])

  const handleNodeClick = useCallback((e, node) => {
    e.stopPropagation()
    selectNode(node.id)
  }, [selectNode])

  const handlePaneClick = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15, duration: 500 })
  }, [fitView])

  const handleInit = useCallback(() => {
    // Delay fitView so nodes are fully rendered
    setTimeout(() => fitView({ padding: 0.12, duration: 600 }), 100)
  }, [fitView])

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--bg-canvas)',
      }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        onInit={handleInit}
        minZoom={0.1}
        maxZoom={2.5}
        panOnDrag={[1, 2]} // middle mouse or right click pan
        selectionOnDrag={true}
        multiSelectionKeyCode="Shift"
        deleteKeyCode={null}   // We handle delete ourselves
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        {/* Background Grid */}
        <Background
          color="var(--bg-border)"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
          style={{ opacity: 0.4 }}
        />

        {/* Controls (custom positioned) */}
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{ bottom: 24, right: 24 }}
        />

        {/* Minimap */}
        <MiniMap
          position="bottom-left"
          style={{ bottom: 24, left: 176 }}
          nodeColor="var(--bg-elevated)"
          maskColor="rgba(0,0,0,0.4)"
          nodeStrokeColor="var(--bg-border)"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Grid mode overlay badge */}
      <AnimatePresence>
        {viewMode === 'grid' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent)',
              color: '#1e222a',
              padding: '4px 14px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 100,
            }}
          >
            <LayoutGrid size={12} />
            Grid Mode — Resize any panel to reflow
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Container */}
      <div style={{
        position: 'absolute', bottom: 24, right: 100,
        display: 'flex', gap: 8, zIndex: 10
      }}>
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullScreen}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 8,
            padding: '6px 10px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
          }}
          title="Toggle Fullscreen"
        >
          {isFullScreen ? <Minimize size={12} /> : <Maximize size={12} />}
          {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>

        {/* Fit view button */}
        <button
          onClick={handleFitView}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 8,
            padding: '6px 10px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
          }}
          title="Fit view (Ctrl+0)"
        >
          <Compass size={12} />
          Fit
        </button>
      </div>

      {/* Grid Overlay inside Provider */}
      <GridOverlay />
    </div>
  )
}

// Wrap with provider required by useReactFlow hook
const CanvasContainer = () => (
  <ReactFlowProvider>
    <CanvasInner />
  </ReactFlowProvider>
)

export default CanvasContainer
