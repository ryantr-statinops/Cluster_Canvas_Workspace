/**
 * Auto-Layout Engine — Dagre-based directed graph layout
 *
 * Uses dagre to compute node positions based on edge relationships.
 * Supports: top-to-bottom, left-to-right layouts.
 * Handles connected components separately.
 */

import dagre from 'dagre'

const NODE_WIDTH  = 280
const NODE_HEIGHT = 180
const RANK_SEP    = 80   // Vertical spacing between ranks
const NODE_SEP     = 50   // Horizontal spacing between nodes in same rank

/**
 * Run dagre layout on the given nodes and edges.
 * Returns a map of nodeId → { x, y } new positions.
 *
 * @param {Array} nodes  - Array of { id, style: { width, height } }
 * @param {Array} edges  - Array of { source, target }
 * @param {string} direction - 'TB' (top-to-bottom) or 'LR' (left-to-right)
 * @returns {Object} map of nodeId → { x, y }
 */
export function computeLayout(nodes, edges, direction = 'TB') {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    marginx: 40,
    marginy: 40,
  })

  // Add nodes to dagre graph
  const nodeMap = {}
  for (const node of nodes) {
    if (node.parentNode) continue // Skip grouped nodes — handled by their group
    const w = node.style?.width  || NODE_WIDTH
    const h = node.style?.height || NODE_HEIGHT
    g.setNode(node.id, { width: w, height: h })
    nodeMap[node.id] = node
  }

  // Add edges
  for (const edge of edges) {
    // Skip edges where source or target is a grouped node
    if (nodeMap[edge.source]?.parentNode) continue
    if (nodeMap[edge.target]?.parentNode) continue
    if (!nodeMap[edge.source] || !nodeMap[edge.target]) continue
    g.setEdge(edge.source, edge.target)
  }

  // Run layout
  dagre.layout(g)

  // Extract positions
  const positions = {}
  g.nodes().forEach(nodeId => {
    const dagreNode = g.node(nodeId)
    if (!dagreNode) return

    // dagre gives center coordinates; we need top-left for React Flow
    positions[nodeId] = {
      x: dagreNode.x - (dagreNode.width / 2),
      y: dagreNode.y - (dagreNode.height / 2),
    }
  })

  return positions
}

/**
 * Apply layout to all nodes in the workspace.
 * Only affects top-level nodes (not grouped).
 */
export function applyAutoLayout(nodes, edges, direction = 'TB') {
  const positions = computeLayout(nodes, edges, direction)

  // Offset all positions so min x,y is at 0 (no negative positions)
  let minX = Infinity, minY = Infinity
  Object.values(positions).forEach(p => {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
  })
  const offsetX = minX < 0 ? -minX + 40 : 40
  const offsetY = minY < 0 ? -minY + 40 : 40

  return nodes.map(node => {
    if (node.parentNode) return node // Don't move grouped nodes
    const pos = positions[node.id]
    if (!pos) return node // Unconnected node stays put
    return {
      ...node,
      position: {
        x: Math.round(pos.x + offsetX),
        y: Math.round(pos.y + offsetY),
      },
    }
  })
}

/**
 * Layout only selected nodes (keeping others in place).
 */
export function applyLayoutToSelection(nodes, edges, selectedIds, direction = 'TB') {
  const selectedNodes = nodes.filter(n => selectedIds.includes(n.id))
  const relevantEdges = edges.filter(e =>
    selectedIds.includes(e.source) && selectedIds.includes(e.target)
  )
  const positions = computeLayout(selectedNodes, relevantEdges, direction)
  if (Object.keys(positions).length === 0) return nodes

  // Offset to stay near original area
  let avgX = 0, avgY = 0, count = 0
  selectedNodes.forEach(n => {
    if (positions[n.id]) {
      avgX += n.position.x
      avgY += n.position.y
      count++
    }
  })
  avgX = count > 0 ? avgX / count : 0
  avgY = count > 0 ? avgY / count : 0

  // Compute centroid of layout result
  let layoutCx = 0, layoutCy = 0
  Object.values(positions).forEach(p => {
    layoutCx += p.x
    layoutCy += p.y
  })
  const layoutCount = Object.keys(positions).length
  layoutCx = layoutCount > 0 ? layoutCx / layoutCount : 0
  layoutCy = layoutCount > 0 ? layoutCy / layoutCount : 0

  const dx = Math.round(avgX - layoutCx)
  const dy = Math.round(avgY - layoutCy)

  return nodes.map(node => {
    const pos = positions[node.id]
    if (!pos) return node
    return {
      ...node,
      position: {
        x: Math.round(pos.x + dx),
        y: Math.round(pos.y + dy),
      },
    }
  })
}
