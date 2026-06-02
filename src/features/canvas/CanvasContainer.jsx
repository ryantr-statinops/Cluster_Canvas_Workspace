import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'

import useWorkspaceStore from '../../store/useWorkspaceStore'
import { getNodeTypes, getDefaultSize, initRegistry, setNodeComponent } from '../../features/nodes/registry/nodeRegistry'
import GridOverlay from '../../components/ui/GridOverlay'
import StyledEdge from '../edges/StyledEdge'

// Custom edge types for React Flow
const EDGE_TYPES = {
  styled: StyledEdge,
}

import TodoNode     from '../nodes/TodoNode'
import NotesNode    from '../nodes/NotesNode'
import WebsiteNode  from '../nodes/WebsiteNode'
import GroupNode    from '../nodes/GroupNode'
import DrawNode     from '../nodes/DrawNode'
import EntityNode   from '../nodes/EntityNode'
import ContextNode  from '../nodes/ContextNode'
import CollectionNode from '../nodes/CollectionNode'
import PortalNode     from '../nodes/PortalNode'
import RelationNode     from '../nodes/RelationNode'
import DataTableNode    from '../nodes/DataTableNode'

// Init registry with components on first import
initRegistry()
setNodeComponent('todo',       TodoNode)
setNodeComponent('notes',      NotesNode)
setNodeComponent('website',    WebsiteNode)
setNodeComponent('group',      GroupNode)
setNodeComponent('draw',       DrawNode)
setNodeComponent('entity',     EntityNode)
setNodeComponent('context',    ContextNode)
setNodeComponent('collection', CollectionNode)
setNodeComponent('portal',     PortalNode)
setNodeComponent('relation',   RelationNode)
setNodeComponent('data-table', DataTableNode)

// Get node types from registry
const NODE_TYPES = getNodeTypes()

const CanvasInner = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    selectEdge,
    clearSelection,
    clearEdgeSelection,
    setEdges,
    viewMode,
    isFullScreen,
    toggleFullScreen
  } = useWorkspaceStore()

  // Listen for custom delete-edge event from StyledEdge
  useEffect(() => {
    const handler = (e) => {
      const edgeId = e.detail?.edgeId
      if (edgeId) {
        const state = useWorkspaceStore.getState()
        state.setEdges(state.edges.filter(edge => edge.id !== edgeId))
      }
    }
    window.addEventListener('delete-edge', handler)
    return () => window.removeEventListener('delete-edge', handler)
  }, [])

  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const wrapperRef = useRef(null)    // Map our store nodes to React Flow format

  const [isMoving, setIsMoving] = useState(false)
  const [isHoveringMiniMap, setIsHoveringMiniMap] = useState(false)
  const moveTimeoutRef = useRef(null)

  const handleMoveStart = useCallback(() => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
      moveTimeoutRef.current = null
    }
    setIsMoving(true)
  }, [])

  const handleMove = useCallback((event, viewport) => {
    setIsMoving(true)
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
      moveTimeoutRef.current = null
    }
    if (viewport) {
      useWorkspaceStore.setState({ zoom: viewport.zoom })
    }
  }, [])

  const handleMoveEnd = useCallback(() => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current)
    }
    moveTimeoutRef.current = setTimeout(() => {
      setIsMoving(false)
      moveTimeoutRef.current = null
    }, 1000)
  }, [])

  useEffect(() => {
    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current)
      }
    }
  }, [])
  const rfNodes = useMemo(() => nodes.map(node => ({
    id:       node.id,
    type:     node.type,
    position: node.position,
    selected: node.selected,
    data:     node.data,
    style:    node.style,
    draggable: !node.style?.locked,
    // Pass width/height to React Flow so fitView calculates correctly
    width:  node.style?.width  ?? (getDefaultSize(node.type)?.width  || 280),
    height: node.style?.height ?? (getDefaultSize(node.type)?.height || 220),
    // For group nodes (parent containers) — use parentNode from store
    ...(node.parentNode ? { parentNode: node.parentNode, extent: 'parent' } : {}),
  })), [nodes])

  const handleNodeClick = useCallback((e, node) => {
    e.stopPropagation()
    selectNode(node.id)
  }, [selectNode])

  const handlePaneClick = useCallback(() => {
    clearSelection()
    clearEdgeSelection()
  }, [clearSelection, clearEdgeSelection])

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.15, duration: 500 })
  }, [fitView])

  const handleInit = useCallback((instance) => {
    // Delay fitView so nodes are fully rendered
    setTimeout(() => fitView({ padding: 0.12, duration: 600 }), 100)
    if (instance) {
      useWorkspaceStore.setState({ zoom: instance.getZoom() })
    }
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
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={handleNodeClick}
        onEdgeClick={(e, edge) => {
          e.stopPropagation()
          selectEdge(edge.id)
        }}
        onPaneClick={handlePaneClick}
        onMoveStart={handleMoveStart}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
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
        nodesConnectable={true}
        elementsSelectable
        connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 2, strokeDasharray: '5 3' }}
        defaultEdgeOptions={{ type: 'styled', data: { type: 'default', label: '' } }}
      >
        {/* Background Grid */}
        <Background
          color="var(--bg-border)"
          gap={24}
          size={1}
          variant={BackgroundVariant.Dots}
          style={{ opacity: 0.4 }}
        />

        {/* Minimap */}
        <AnimatePresence>
          {(isMoving || isHoveringMiniMap) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 0.8, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseEnter={() => setIsHoveringMiniMap(true)}
              onMouseLeave={() => setIsHoveringMiniMap(false)}
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 10,
                transformOrigin: 'bottom right',
              }}
            >
              <MiniMap
                position="bottom-right"
                style={{ margin: 0, position: 'relative', bottom: 'auto', right: 'auto' }}
                nodeColor="var(--bg-elevated)"
                maskColor="rgba(0,0,0,0.4)"
                nodeStrokeColor="var(--bg-border)"
                pannable
                zoomable
              />
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Grid Overlay inside Provider */}
      <GridOverlay />
    </div>
  )
}

const CanvasContainer = () => (
  <CanvasInner />
)

export default CanvasContainer
