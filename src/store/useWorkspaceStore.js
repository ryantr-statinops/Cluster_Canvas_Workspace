import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { nanoid } from 'nanoid'

import { createBaseNode } from '../features/nodes/registry/nodeSchema'
import { getDefaultSize, getDefaultData } from '../features/nodes/registry/nodeRegistry'
import {
  captureSnapshot,
  pushSnapshot,
  performUndo,
  performRedo,
} from '../utils/history'
import { applyAutoLayout, applyLayoutToSelection } from '../utils/autoLayout'

const useWorkspaceStore = create((set, get) => ({
  // ── Undo/Redo State ──────────────────────────────────────────────────────────
  undoStack: [],
  redoStack: [],

  // ── Core State ──────────────────────────────────────────────────────────────
  workspaces: [{ id: 'default', name: 'Main Workspace', nodes: [], edges: [] }],
  activeWorkspaceId: 'default',
  nodes: [],
  edges: [], // Active edges from React Flow
  
  selectedNodeId: null, // Primary selection for Properties
  sidebarOpen: true,
  zoom: 1,
  propertiesPanelOpen: false,
  activeModal: null,

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  pushSnapshot: () => {
    const state = get()
    const snap = captureSnapshot(state)
    set(s => pushSnapshot(s.undoStack, snap))
  },
  undo: () => {
    const state = get()
    const result = performUndo(state.undoStack, state.redoStack, state)
    if (!result) return
    set({
      ...result.snapshot,
      undoStack: result.undoStack,
      redoStack: result.redoStack,
      // Clear selections on undo
      selectedNodeId: null,
      selectedEdgeId: null,
      propertiesPanelOpen: false,
    })
  },
  redo: () => {
    const state = get()
    const result = performRedo(state.undoStack, state.redoStack, state)
    if (!result) return
    set({
      ...result.snapshot,
      undoStack: result.undoStack,
      redoStack: result.redoStack,
      selectedNodeId: null,
      selectedEdgeId: null,
      propertiesPanelOpen: false,
    })
  },
  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  // ── Workspace Switching ──────────────────────────────────────────────────────
  createWorkspace: () => {
    const newWs = { id: nanoid(6), name: `Workspace ${get().workspaces.length + 1}`, nodes: [], edges: [] }
    set(state => ({
      workspaces: [...state.workspaces.map(ws => ws.id === state.activeWorkspaceId ? { ...ws, nodes: state.nodes, edges: state.edges } : ws), newWs],
      activeWorkspaceId: newWs.id,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      propertiesPanelOpen: false,
    }))
  },

  switchWorkspace: (workspaceId) => {
    if (workspaceId === get().activeWorkspaceId) return;
    set(state => {
      const updatedWorkspaces = state.workspaces.map(ws => 
        ws.id === state.activeWorkspaceId ? { ...ws, nodes: state.nodes, edges: state.edges } : ws
      )
      const nextWs = updatedWorkspaces.find(ws => ws.id === workspaceId)
      return {
        workspaces: updatedWorkspaces,
        activeWorkspaceId: workspaceId,
        nodes: nextWs.nodes,
        edges: nextWs.edges || [],
        selectedNodeId: null,
        propertiesPanelOpen: false,
      }
    })
  },

  // ── React Flow Handlers ──────────────────────────────────────────────────────
  onNodesChange: (changes) => {
    // Only snapshot for non-view-only changes (position updates, deletions, additions)
    const hasStructuralChange = changes.some(c => c.type !== 'position' || (c.type === 'position' && c.dragging === false))
    if (hasStructuralChange) get().pushSnapshot()
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },
  onEdgesChange: (changes) => {
    // Only snapshot for structural changes (add/remove), not selection/hover
    const hasStructuralChange = changes.some(c => c.type === 'add' || c.type === 'remove')
    if (hasStructuralChange) get().pushSnapshot()
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },
  onConnect: (connection) => {
    const { source, target } = connection
    if (!source || !target) return
    // Prevent self-connections
    if (source === target) return
    // Prevent duplicate edges
    const existing = get().edges.find(e => e.source === source && e.target === target)
    if (existing) return

    const newEdge = {
      id: `edge-${nanoid(8)}`,
      source,
      target,
      type: 'styled',
      data: {
        type: 'default',
        label: '',
        createdAt: Date.now(),
      },
    }
    set((state) => ({ edges: [...state.edges, newEdge] }))
  },
  updateEdgeData: (edgeId, data) => {
    get().pushSnapshot()
    set((state) => ({
      edges: state.edges.map(e => e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e),
    }))
  },
  setEdges: (edges) => {
    get().pushSnapshot()
    set({ edges })
  },

  // ── Node CRUD (via Unified Schema) ──────────────────────────────────────────
  addNode: (type, extraData = {}) => {
    get().pushSnapshot()
    const size = getDefaultSize(type)
    const defaultData = getDefaultData(type)
    const maxZ = get().nodes.reduce((max, n) => Math.max(max, n.style?.zIndex || 0), 0)

    const viewportCenter = {
      x: (window.innerWidth / 2) - (size.width / 2) - 150,
      y: (window.innerHeight / 2) - (size.height / 2) - 32,
    }

    const newNode = createBaseNode({
      type,
      position: viewportCenter,
      data: { ...defaultData, ...extraData },
      style: {
        width: size.width,
        height: size.height,
        zIndex: maxZ + 1,
      },
    })

    if (!newNode) return

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
    }))
  },

  removeNode: (nodeId) => {
    get().pushSnapshot()
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId && n.parentNode !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      propertiesPanelOpen: state.selectedNodeId === nodeId ? false : state.propertiesPanelOpen,
    }))
  },

  duplicateNode: (nodeId) => {
    get().pushSnapshot()
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node || node.type === 'group') return
    const maxZ = get().nodes.reduce((max, n) => Math.max(max, n.style?.zIndex || 0), 0)

    const newNode = createBaseNode({
      id: `${node.type}-${nanoid(6)}`,
      type: node.type,
      position: { x: node.position.x + 30, y: node.position.y + 30 },
      data: JSON.parse(JSON.stringify(node.data)),
      style: { ...node.style, zIndex: maxZ + 1 },
    })

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
    }))
  },

  // ── Node Data Updates ────────────────────────────────────────────────────────
  updateNodeData: (nodeId, data) => {
    get().pushSnapshot()
    set((state) => ({
      nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n),
    }))
  },

  updateNodeStyle: (nodeId, style) => {
    get().pushSnapshot()
    set((state) => ({
      nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, style: { ...n.style, ...style } } : n),
    }))
  },

  updateNodePosition: (nodeId, position) => {
    get().pushSnapshot()
    set((state) => ({
      nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, position } : n),
    }))
  },

  // ── Selection ────────────────────────────────────────────────────────────────
  selectedEdgeId: null,
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null })
  },
  selectEdge: (edgeId) => {
    set({ selectedEdgeId: edgeId, selectedNodeId: null, propertiesPanelOpen: true })
  },
  clearEdgeSelection: () => {
    set({ selectedEdgeId: null })
  },
  openNodeProperties: (nodeId) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null, propertiesPanelOpen: true })
  },
  closeNodeProperties: () => {
    set({ propertiesPanelOpen: false, selectedEdgeId: null })
  },
  clearSelection: () => {
    set({ selectedNodeId: null, selectedEdgeId: null, propertiesPanelOpen: false })
  },

  // ── Grouping ─────────────────────────────────────────────────────────────────
  groupSelected: () => {
    get().pushSnapshot()
    const nodes = get().nodes;
    const selected = nodes.filter(n => n.selected && n.type !== 'group');
    if (selected.length < 2) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selected.forEach(n => {
       const w = n.style?.width || 280;
       const h = n.style?.height || 220;
       if (n.parentNode) return;
       minX = Math.min(minX, n.position.x);
       minY = Math.min(minY, n.position.y);
       maxX = Math.max(maxX, n.position.x + w);
       maxY = Math.max(maxY, n.position.y + h);
    });

    if (minX === Infinity) return;

    const padding = 24;
    const headerHeight = 40;
    const groupPos = { x: minX - padding, y: minY - headerHeight - padding };
    const groupW = (maxX - minX) + padding * 2;
    const groupH = (maxY - minY) + padding * 2 + headerHeight;

    const groupNode = createBaseNode({
      id: `group-${nanoid(6)}`,
      type: 'group',
      position: groupPos,
      data: { title: 'New Group' },
      style: {
        width: groupW,
        height: groupH,
        zIndex: Math.max(0, selected[0]?.style?.zIndex - 1 || 0),
      },
    })

    const newNodes = nodes.map(n => {
      if (n.selected && !n.parentNode && n.type !== 'group') {
        return {
          ...n,
          parentNode: groupNode.id,
          extent: 'parent',
          selected: false,
          position: {
            x: n.position.x - groupPos.x,
            y: n.position.y - groupPos.y
          }
        };
      }
      return n;
    });

    set({ nodes: [...newNodes, groupNode], selectedNodeId: groupNode.id });
  },

  ungroupSelected: () => {
    get().pushSnapshot()
    const nodes = get().nodes;
    const selectedGroups = nodes.filter(n => n.selected && n.type === 'group');
    if (selectedGroups.length === 0) return;

    const groupIdsToRemove = selectedGroups.map(g => g.id);

    const updatedNodes = nodes.map(n => {
       if (n.parentNode && groupIdsToRemove.includes(n.parentNode)) {
          const parent = selectedGroups.find(g => g.id === n.parentNode);
          return {
             ...n,
             parentNode: undefined,
             extent: undefined,
             selected: true,
             position: {
                x: parent.position.x + n.position.x,
                y: parent.position.y + n.position.y
             }
          };
       }
       return n;
    }).filter(n => !groupIdsToRemove.includes(n.id));

    set({ nodes: updatedNodes, selectedNodeId: null });
  },

  // ── Layer / Z-Index ──────────────────────────────────────────────────────────
  bringToFront: (nodeId) => {
    get().pushSnapshot()
    const maxZ = get().nodes.reduce((max, n) => Math.max(max, n.style?.zIndex || 0), 0)
    get().updateNodeStyle(nodeId, { zIndex: maxZ + 1 })
  },
  sendToBack: (nodeId) => {
    get().pushSnapshot()
    const minZ = get().nodes.reduce((min, n) => Math.min(min, n.style?.zIndex || 0), Infinity)
    get().updateNodeStyle(nodeId, { zIndex: Math.max(0, minZ - 1) })
  },
  toggleLock: (nodeId) => {
    get().pushSnapshot()
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    get().updateNodeStyle(nodeId, { locked: !node.style?.locked })
  },

  // ── UI State ─────────────────────────────────────────────────────────────────
  isFullScreen: false,
  toggleFullScreen: () => {
    const isFull = !get().isFullScreen;
    if (isFull) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
    set({ isFullScreen: isFull });
  },
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setNodes: (nodes) => set({ nodes }),

  // ── Batch Operations ─────────────────────────────────────────────────────────
  /**
   * Update data for multiple nodes at once (batch edit).
   * e.g., batchUpdateNodes(['id1', 'id2'], { status: 'active' })
   */
  batchUpdateNodes: (nodeIds, dataPatch) => {
    get().pushSnapshot()
    set((state) => ({
      nodes: state.nodes.map(n =>
        nodeIds.includes(n.id)
          ? { ...n, data: { ...n.data, ...dataPatch } }
          : n
      ),
    }))
  },

  /**
   * Update style for multiple nodes at once (batch style).
   */
  batchUpdateNodeStyle: (nodeIds, stylePatch) => {
    get().pushSnapshot()
    set((state) => ({
      nodes: state.nodes.map(n =>
        nodeIds.includes(n.id)
          ? { ...n, style: { ...n.style, ...stylePatch } }
          : n
      ),
    }))
  },

  /**
   * Remove multiple nodes at once.
   */
  batchRemoveNodes: (nodeIds) => {
    get().pushSnapshot()
    const idSet = new Set(nodeIds)
    set((state) => ({
      nodes: state.nodes.filter(n => !idSet.has(n.id) && !idSet.has(n.parentNode)),
      edges: state.edges.filter(e => !idSet.has(e.source) && !idSet.has(e.target)),
      selectedNodeId: idSet.has(state.selectedNodeId) ? null : state.selectedNodeId,
      propertiesPanelOpen: idSet.has(state.selectedNodeId) ? false : state.propertiesPanelOpen,
    }))
  },

  /**
   * Apply auto-layout to all nodes.
   */
  applyLayout: (direction = 'TB') => {
    const { nodes, edges } = get()
    get().pushSnapshot()
    const updated = applyAutoLayout(nodes, edges, direction)
    set({ nodes: updated })
  },

  /**
   * Apply auto-layout only to selected nodes.
   */
  applyLayoutToSelected: (direction = 'TB') => {
    const { nodes, edges } = get()
    const selectedIds = nodes.filter(n => n.selected).map(n => n.id)
    if (selectedIds.length === 0) return
    get().pushSnapshot()
    const updated = applyLayoutToSelection(nodes, edges, selectedIds, direction)
    set({ nodes: updated })
  },
}))

export default useWorkspaceStore

