import React, { useState, useCallback, useMemo } from 'react'
import {
  ArrowUp, ArrowDown, GitBranch, Layers, Circle,
  Globe, StickyNote, CheckSquare, Pencil, FileText,
  BookOpen, Filter, Compass,
} from 'lucide-react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { EDGE_TYPES } from '../edges/StyledEdge'
import { TYPE_LABELS } from '../canvas/BaseNode'

// ── Node type icon map ────────────────────────────────────────────────
const NODE_ICONS = {
  entity: FileText, context: BookOpen, notes: StickyNote,
  todo: CheckSquare, website: Globe, draw: Pencil,
  group: Layers, collection: Filter, portal: Compass,
}

const RelationNode = ({ id, data, style, selected }) => {
  const { nodes, edges, selectNode, updateNodeData } = useWorkspaceStore()
  const targetId = data?.targetId || ''

  // Available nodes (exclude self and other relation nodes)
  const availableTargets = useMemo(() =>
    nodes.filter(n => n.id !== id && n.type !== 'relation'),
  [nodes, id])

  // ── Target selection ────────────────────────────────────────────────
  const handleTargetChange = useCallback((e) => {
    updateNodeData(id, { targetId: e.target.value })
  }, [id, updateNodeData])

  // Resolve target node
  const targetNode = useMemo(() =>
    nodes.find(n => n.id === targetId),
  [nodes, targetId])

  // ── Edge analysis ───────────────────────────────────────────────────
  const { outgoing, incoming } = useMemo(() => {
    if (!targetId) return { outgoing: [], incoming: [] }
    const out = []
    const in_ = []
    for (const edge of edges) {
      if (edge.source === targetId) {
        const connectedNode = nodes.find(n => n.id === edge.target)
        out.push({ edge, connectedNode, direction: 'outgoing' })
      }
      if (edge.target === targetId) {
        const connectedNode = nodes.find(n => n.id === edge.source)
        in_.push({ edge, connectedNode, direction: 'incoming' })
      }
    }
    return { outgoing: out, incoming: in_ }
  }, [edges, nodes, targetId])

  const totalConnections = outgoing.length + incoming.length

  // ── Navigate to connected node ──────────────────────────────────────
  const handleNodeClick = useCallback((e, nodeId) => {
    e.stopPropagation()
    selectNode(nodeId)
  }, [selectNode])

  // ── Render a connection row ─────────────────────────────────────────
  const renderConnection = (item, isOutgoing) => {
    const { edge, connectedNode } = item
    if (!connectedNode) return null

    const edgeType = EDGE_TYPES.find(t => t.value === (edge.data?.type || 'default')) || EDGE_TYPES[0]
    const Icon = NODE_ICONS[connectedNode.type] || Layers
    const DirectionIcon = isOutgoing ? ArrowUp : ArrowDown

    return (
      <button
        key={edge.id}
        onClick={(e) => handleNodeClick(e, connectedNode.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 6px', borderRadius: 5,
          border: 'none', background: 'transparent',
          cursor: 'pointer', textAlign: 'left', width: '100%',
          transition: 'background 0.1s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Direction indicator */}
        <DirectionIcon size={10} style={{
          color: edgeType.color, flexShrink: 0,
          opacity: 0.7,
        }} />

        {/* Node type icon */}
        <Icon size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />

        {/* Node title */}
        <span style={{
          flex: 1, fontSize: 10, color: 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {connectedNode.data?.title || 'Untitled'}
        </span>

        {/* Edge type dot + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
          <Circle size={5} fill={edgeType.color} stroke="none" />
          {edge.data?.label && (
            <span style={{
              fontSize: 8, color: 'var(--text-muted)',
              maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {edge.data.label}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <BaseNode id={id} type="relation" data={data} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, overflow: 'hidden' }}>

        {/* ── Target selector ────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <GitBranch size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <select
            className="field-input"
            value={targetId}
            onChange={handleTargetChange}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, height: 26, fontSize: 10, padding: '0 6px' }}
          >
            <option value="">Select a node...</option>
            {availableTargets.map(n => (
              <option key={n.id} value={n.id}>
                {n.data?.title || 'Untitled'} ({TYPE_LABELS[n.type] || n.type})
              </option>
            ))}
          </select>
        </div>

        {/* ── Target info (when selected) ────────────────────────────── */}
        {targetNode && (() => {
          const TargetIcon = NODE_ICONS[targetNode.type] || Layers
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              padding: '4px 8px', borderRadius: 6,
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
            }}>
              <TargetIcon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{
                flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {targetNode.data?.title || 'Untitled'}
              </span>
            <span style={{
              fontSize: 9, color: 'var(--accent)', opacity: 0.7,
              background: 'rgba(255,255,255,0.1)', padding: '0 5px', borderRadius: 4,
            }}>
              {TYPE_LABELS[targetNode.type] || targetNode.type}
            </span>
            <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, opacity: 0.8 }}>
              {totalConnections}
            </span>
            </div>
          )
        })()}

        {/* ── Connections list ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!targetId ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', flex: 1, gap: 8, opacity: 0.4,
            }}>
              <GitBranch size={24} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                Select a node above to see its relationships
              </span>
            </div>
          ) : totalConnections === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
            }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No connections — connect this node to others on the canvas
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Outgoing */}
              {outgoing.length > 0 && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 4px', fontSize: 9, fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    <ArrowUp size={9} />
                    Outgoing ({outgoing.length})
                  </div>
                  {outgoing.map(item => renderConnection(item, true))}
                </>
              )}

              {/* Incoming */}
              {incoming.length > 0 && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 4px', marginTop: 4, fontSize: 9, fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    <ArrowDown size={9} />
                    Incoming ({incoming.length})
                  </div>
                  {incoming.map(item => renderConnection(item, false))}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </BaseNode>
  )
}

export default React.memo(RelationNode)
