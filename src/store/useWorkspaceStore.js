import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { nanoid } from 'nanoid'

import { createBaseNode } from '../features/nodes/registry/nodeSchema'
import { getDefaultSize, getDefaultData } from '../features/nodes/registry/nodeRegistry'

const useWorkspaceStore = create((set, get) => ({
  // ── Core State ──────────────────────────────────────────────────────────────
  workspaces: [{ id: 'default', name: 'Main Workspace', nodes: [], edges: [], gridPositions: {} }],
  activeWorkspaceId: 'default',
  nodes: [],
  edges: [], // Active edges from React Flow
  viewMode: 'flex',
  
  selectedNodeId: null, // Primary selection for Properties
  sidebarOpen: true,
  propertiesPanelOpen: false,
  activeModal: null,

  // ── Workspace Switching ──────────────────────────────────────────────────────
  createWorkspace: () => {
    const newWs = { id: nanoid(6), name: `Workspace ${get().workspaces.length + 1}`, nodes: [], edges: [], gridPositions: {} }
    set(state => ({
      workspaces: [...state.workspaces.map(ws => ws.id === state.activeWorkspaceId ? { ...ws, nodes: state.nodes, edges: state.edges } : ws), newWs],
      activeWorkspaceId: newWs.id,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      propertiesPanelOpen: false,
      viewMode: 'flex'
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
        viewMode: 'flex'
      }
    })
  },

  // ── React Flow Handlers ──────────────────────────────────────────────────────
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },
  onEdgesChange: (changes) => {
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
    set((state) => ({
      edges: state.edges.map(e => e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e),
    }))
  },
  setEdges: (edges) => set({ edges }),

  // ── Node CRUD (via Unified Schema) ──────────────────────────────────────────
  addNode: (type, extraData = {}) => {
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
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId && n.parentNode !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      propertiesPanelOpen: state.selectedNodeId === nodeId ? false : state.propertiesPanelOpen,
    }))
  },

  duplicateNode: (nodeId) => {
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
    set((state) => ({
      nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n),
    }))
  },

  updateNodeStyle: (nodeId, style) => {
    set((state) => ({
      nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, style: { ...n.style, ...style } } : n),
    }))
  },

  updateNodePosition: (nodeId, position) => {
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
    const maxZ = get().nodes.reduce((max, n) => Math.max(max, n.style?.zIndex || 0), 0)
    get().updateNodeStyle(nodeId, { zIndex: maxZ + 1 })
  },
  sendToBack: (nodeId) => {
    const minZ = get().nodes.reduce((min, n) => Math.min(min, n.style?.zIndex || 0), Infinity)
    get().updateNodeStyle(nodeId, { zIndex: Math.max(0, minZ - 1) })
  },
  toggleLock: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    get().updateNodeStyle(nodeId, { locked: !node.style?.locked })
  },

  // ── View Modes ───────────────────────────────────────────────────────────────
  setViewMode: (mode) => {
    const state = get()
    const current = state.viewMode;
    const nodes = state.nodes
    const selectedNodes = nodes.filter(n => n.selected && n.type !== 'group')

    if (mode === 'grid' && current === 'flex') {
      if (selectedNodes.length === 0) return;
      set({ viewMode: 'grid' })
    } else if (mode === 'flex' && current === 'grid') {
      set({ viewMode: 'flex' })
    }
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
}))

export default useWorkspaceStore

