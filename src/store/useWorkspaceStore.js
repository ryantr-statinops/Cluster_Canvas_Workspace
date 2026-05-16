import { create } from 'zustand'
import { applyNodeChanges } from 'reactflow'
import { nanoid } from 'nanoid'

// Default node dimensions per type
const NODE_DEFAULTS = {
  notes:   { width: 280, height: 220 },
  todo:    { width: 280, height: 240 },
  website: { width: 400, height: 300 },
  draw:    { width: 360, height: 300 },
  group:   { width: 360, height: 300 },
}

// Default data templates per node type
const nodeDataTemplates = {
  notes:   { title: 'New Note', content: 'Start writing...' },
  todo:    { title: 'To-Do List', tasks: [{ id: nanoid(), text: 'New task', done: false }] },
  website: { title: 'Website', url: 'https://vercel.com' },
  draw:    { title: 'Sketch' },
}

const useWorkspaceStore = create((set, get) => ({
  // ── Core State ──────────────────────────────────────────────────────────────
  workspaces: [{ id: 'default', name: 'Main Workspace', nodes: [], gridPositions: {} }],
  activeWorkspaceId: 'default',
  nodes: [], // Active nodes injected from workspace switch
  viewMode: 'flex', // Global root view mode
  
  selectedNodeId: null, // Still keeps track of Primary selection for Properties
  sidebarOpen: true,
  propertiesPanelOpen: false,
  activeModal: null,

  // ── Workspace Switching ──────────────────────────────────────────────────────
  createWorkspace: () => {
    const newWs = { id: nanoid(6), name: `Workspace ${get().workspaces.length + 1}`, nodes: [], gridPositions: {} }
    set(state => ({
      workspaces: [...state.workspaces.map(ws => ws.id === state.activeWorkspaceId ? { ...ws, nodes: state.nodes } : ws), newWs],
      activeWorkspaceId: newWs.id,
      nodes: [],
      selectedNodeId: null,
      propertiesPanelOpen: false,
      viewMode: 'flex'
    }))
  },

  switchWorkspace: (workspaceId) => {
    if (workspaceId === get().activeWorkspaceId) return;
    set(state => {
      const updatedWorkspaces = state.workspaces.map(ws => 
        ws.id === state.activeWorkspaceId ? { ...ws, nodes: state.nodes } : ws
      )
      const nextWs = updatedWorkspaces.find(ws => ws.id === workspaceId)
      return {
        workspaces: updatedWorkspaces,
        activeWorkspaceId: workspaceId,
        nodes: nextWs.nodes,
        selectedNodeId: null,
        propertiesPanelOpen: false,
        viewMode: 'flex' // Reset to flex on switch
      }
    })
  },

  // ── React Flow Handlers ──────────────────────────────────────────────────────
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  // ── Node CRUD ────────────────────────────────────────────────────────────────
  addNode: (type, extraData = {}) => {
    const id = `${type}-${nanoid(6)}`
    const defaults = NODE_DEFAULTS[type] || { width: 280, height: 220 }
    const dataTemplate = nodeDataTemplates[type] || { title: 'Node' }

    const viewportCenter = {
      x: (window.innerWidth / 2) - (defaults.width / 2) - 150,
      y: (window.innerHeight / 2) - (defaults.height / 2) - 32,
    }

    const maxZ = get().nodes.reduce((max, n) => Math.max(max, n.style?.zIndex || 0), 0)

    const newNode = {
      id,
      type,
      position: viewportCenter,
      data: { ...dataTemplate, ...extraData },
      style: {
        width: defaults.width,
        height: defaults.height,
        zIndex: maxZ + 1,
        opacity: 1,
        locked: false,
        outline: '#88c0d0',
        background: '',
      },
      selected: false,
    }

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
      // Do not auto-open properties panel on add
    }))
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId && n.parentNode !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      propertiesPanelOpen: state.selectedNodeId === nodeId ? false : state.propertiesPanelOpen,
    }))
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node || node.type === 'group') return
    const newId = `${node.type}-${nanoid(6)}`
    const maxZ = get().nodes.reduce((max, n) => Math.max(max, n.style?.zIndex || 0), 0)
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 30, y: node.position.y + 30 },
      style: { ...node.style, zIndex: maxZ + 1 },
      selected: false,
    }
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newId,
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
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId }) // Removed properties panel auto-open
  },
  openNodeProperties: (nodeId) => {
    set({ selectedNodeId: nodeId, propertiesPanelOpen: true })
  },
  closeNodeProperties: () => {
    set({ propertiesPanelOpen: false })
  },
  clearSelection: () => {
    set({ selectedNodeId: null, propertiesPanelOpen: false })
  },

  // ── Grouping ───────────────────────────────────────────────────────────────
  groupSelected: () => {
    const nodes = get().nodes;
    const selected = nodes.filter(n => n.selected && n.type !== 'group');
    if (selected.length < 2) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selected.forEach(n => {
       const w = n.style?.width || 280;
       const h = n.style?.height || 220;
       
       // Handle relative positions if they are already in a group? 
       // For safety let's only group un-grouped nodes.
       if(n.parentNode) return; 

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
    const groupId = `group-${nanoid(6)}`;

    // Calculate max child Z to place group appropriately underneath
    const maxZ = get().nodes.reduce((max, n) => Math.max(max, n.style?.zIndex || 0), 0);

    const groupNode = {
      id: groupId,
      type: 'group',
      position: groupPos,
      data: { title: 'New Group' },
      style: { width: groupW, height: groupH, zIndex: Math.max(0, Object.values(selected)[0]?.style?.zIndex - 1 || 0), opacity: 1, locked: false },
      selected: true
    };

    const newNodes = nodes.map(n => {
      if (n.selected && !n.parentNode && n.type !== 'group') {
        return {
          ...n,
          parentNode: groupId,
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

    set({ nodes: [...newNodes, groupNode], selectedNodeId: groupId });
  },

  ungroupSelected: () => {
    const nodes = get().nodes;
    const selectedGroups = nodes.filter(n => n.selected && n.type === 'group');
    if (selectedGroups.length === 0) return;

    let updatedNodes = [...nodes];
    const groupIdsToRemove = selectedGroups.map(g => g.id);

    updatedNodes = updatedNodes.map(n => {
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
      if (selectedNodes.length === 0) return; // Grid needs selected nodes
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
export { NODE_DEFAULTS }
