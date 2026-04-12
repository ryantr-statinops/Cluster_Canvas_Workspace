import { create } from 'zustand'
import { applyNodeChanges } from 'reactflow'
import { nanoid } from 'nanoid'

// Default node dimensions per type
const NODE_DEFAULTS = {
  notes:    { width: 280, height: 220 },
  todo:     { width: 280, height: 240 },
  clock:    { width: 220, height: 160 },
  calendar: { width: 340, height: 340 },
  website:  { width: 400, height: 300 },
  picture:  { width: 300, height: 240 },
  video:    { width: 400, height: 280 },
  widget:   { width: 240, height: 180 },
  countdown:{ width: 240, height: 160 },
  draw:     { width: 360, height: 300 },
  group:    { width: 500, height: 400 },
}

// Default data templates per node type
const nodeDataTemplates = {
  notes:    { title: 'New Note', content: 'Start writing...' },
  todo:     { title: 'To-Do List', tasks: [{ id: nanoid(), text: 'New task', done: false }] },
  clock:    { title: 'Clock' },
  calendar: { title: 'Calendar' },
  website:  { title: 'Website', url: 'https://vercel.com' },
  picture:  { title: 'Picture', src: '' },
  video:    { title: 'Video', url: '' },
  widget:   { title: 'Widget' },
  countdown:{ title: 'Countdown', targetDate: '' },
  draw:     { title: 'Sketch' },
  group:    { title: 'Group' },
}

// Mock initial nodes matching the screenshots
const initialNodes = [
  {
    id: 'notes-1',
    type: 'notes',
    position: { x: 20, y: 20 },
    data: {
      title: 'Project Ideas',
      content: 'Brainstorm new features for the workspace app...',
    },
    style: { width: 280, height: 220, zIndex: 1, opacity: 1, locked: false, outline: '#88c0d0', background: '' },
    selected: false,
  },
  {
    id: 'todo-1',
    type: 'todo',
    position: { x: 320, y: 20 },
    data: {
      title: 'Weekly Tasks',
      tasks: [
        { id: 't1', text: 'Review design specs', done: true },
        { id: 't2', text: 'Update documentation', done: false },
        { id: 't3', text: 'Team sync meeting', done: false },
        { id: 't4', text: 'Add task...', done: false, placeholder: true },
      ],
    },
    style: { width: 280, height: 240, zIndex: 2, opacity: 1, locked: false, outline: '#88c0d0', background: '' },
    selected: false,
  },
  {
    id: 'clock-1',
    type: 'clock',
    position: { x: 620, y: 20 },
    data: { title: 'Time' },
    style: { width: 220, height: 160, zIndex: 3, opacity: 1, locked: false, outline: '#88c0d0', background: '' },
    selected: false,
  },
  {
    id: 'calendar-1',
    type: 'calendar',
    position: { x: 20, y: 280 },
    data: { title: 'April 2026' },
    style: { width: 340, height: 340, zIndex: 1, opacity: 1, locked: false, outline: '', background: '' },
    selected: false,
  },
  {
    id: 'website-1',
    type: 'website',
    position: { x: 380, y: 280 },
    data: { title: 'Reference Site', url: 'https://vercel.com' },
    style: { width: 400, height: 300, zIndex: 2, opacity: 1, locked: false, outline: '#88c0d0', background: '' },
    selected: false,
  },
]

const useWorkspaceStore = create((set, get) => ({
  // ── Core State ──────────────────────────────────────────────────────────────
  nodes: initialNodes,
  selectedNodeId: null,
  viewMode: 'flex',         // 'flex' | 'grid'
  gridPositions: {},        // saved flex positions before entering grid mode
  sidebarOpen: true,
  propertiesPanelOpen: false,
  activeModal: null,        // 'theme' | 'shortcuts' | 'settings' | 'addNode' | null

  // ── React Flow Handlers ──────────────────────────────────────────────────────
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  // ── Node CRUD ────────────────────────────────────────────────────────────────
  addNode: (type, extraData = {}) => {
    const id = `${type}-${nanoid(6)}`
    const defaults = NODE_DEFAULTS[type] || { width: 280, height: 220 }
    const dataTemplate = nodeDataTemplates[type] || { title: 'Node' }

    // Compute center of viewport (approximate)
    const viewportCenter = {
      x: (window.innerWidth / 2) - (defaults.width / 2) - 150, // offset for sidebar
      y: (window.innerHeight / 2) - (defaults.height / 2) - 32, // offset for navbar
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
      propertiesPanelOpen: true,
    }))
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      propertiesPanelOpen: state.selectedNodeId === nodeId ? false : state.propertiesPanelOpen,
    }))
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
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
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    }))
  },

  updateNodeStyle: (nodeId, style) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, style: { ...n.style, ...style } } : n
      ),
    }))
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, position } : n
      ),
    }))
  },

  // ── Selection ────────────────────────────────────────────────────────────────
  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId, propertiesPanelOpen: nodeId !== null })
  },

  clearSelection: () => {
    set({ selectedNodeId: null, propertiesPanelOpen: false })
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

  bringForward: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    get().updateNodeStyle(nodeId, { zIndex: (node.style?.zIndex || 0) + 1 })
  },

  sendBackward: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    get().updateNodeStyle(nodeId, { zIndex: Math.max(0, (node.style?.zIndex || 0) - 1) })
  },

  // ── Lock / Unlock ────────────────────────────────────────────────────────────
  toggleLock: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return
    get().updateNodeStyle(nodeId, { locked: !node.style?.locked })
  },

  // ── View Modes ───────────────────────────────────────────────────────────────
  setViewMode: (mode) => {
    const current = get().viewMode
    const nodes = get().nodes

    if (mode === 'grid' && current === 'flex') {
      // Save current flex positions before switching to grid
      const saved = {}
      nodes.forEach((n) => { saved[n.id] = { ...n.position } })
      set({ gridPositions: saved })

      // Calculate grid positions (full-screen tiled layout)
      const sidebarW = 160
      const navH = 64
      const propW = 280
      const padding = 16
      const canvasW = window.innerWidth - sidebarW - propW - padding * 2
      const canvasH = window.innerHeight - navH - padding * 2
      const count = nodes.length
      const cols = Math.ceil(Math.sqrt(count))
      const rows = Math.ceil(count / cols)
      const cellW = Math.floor(canvasW / cols)
      const cellH = Math.floor(canvasH / rows)

      const gridNodes = nodes.map((node, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        return {
          ...node,
          position: {
            x: sidebarW + padding + col * cellW,
            y: navH + padding + row * cellH,
          },
          style: {
            ...node.style,
            width: cellW - padding,
            height: cellH - padding,
          },
        }
      })

      set({ nodes: gridNodes, viewMode: 'grid' })
    } else if (mode === 'flex' && current === 'grid') {
      // Restore saved flex positions
      const saved = get().gridPositions
      const restoredNodes = nodes.map((node) => ({
        ...node,
        position: saved[node.id] || node.position,
        style: {
          ...node.style,
          width: NODE_DEFAULTS[node.type]?.width || 280,
          height: NODE_DEFAULTS[node.type]?.height || 220,
        },
      }))
      set({ nodes: restoredNodes, viewMode: 'flex', gridPositions: {} })
    }
  },

  // ── UI State ─────────────────────────────────────────────────────────────────
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  // ── Setters ──────────────────────────────────────────────────────────────────
  setNodes: (nodes) => set({ nodes }),
}))

export default useWorkspaceStore
export { NODE_DEFAULTS }
