import React, { useState, useCallback, useMemo } from 'react'
import { nanoid } from 'nanoid'
import {
  Compass, Plus, X, ExternalLink, LayoutDashboard,
  Globe, StickyNote, CheckSquare, Pencil, FileText,
  BookOpen, Layers, Filter, ArrowRight,
} from 'lucide-react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { TYPE_LABELS } from '../canvas/BaseNode'

// ── Icon map for node types ───────────────────────────────────────────
const NODE_TYPE_ICONS = {
  entity:  FileText,
  context: BookOpen,
  notes:   StickyNote,
  todo:    CheckSquare,
  website: Globe,
  draw:    Pencil,
  group:   Layers,
  collection: Filter,
}

const LINK_TYPES = [
  { value: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { value: 'node',      label: 'Node',      icon: Layers },
  { value: 'url',       label: 'URL',       icon: ExternalLink },
]

const PortalNode = ({ id, data, style, selected }) => {
  const { nodes, workspaces, activeWorkspaceId, switchWorkspace, selectNode, updateNodeData } = useWorkspaceStore()
  const links = data?.links || []

  // ── Add new link ────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState('node')
  const [newTarget, setNewTarget] = useState('')

  const addLink = useCallback(() => {
    if (!newTarget) return
    const label = newType === 'workspace'
      ? workspaces.find(w => w.id === newTarget)?.name || newTarget
      : newType === 'node'
      ? nodes.find(n => n.id === newTarget)?.data?.title || newTarget
      : newTarget
    updateNodeData(id, {
      links: [...links, { id: nanoid(4), type: newType, target: newTarget, label }]
    })
    setNewTarget('')
    setShowAdd(false)
  }, [id, links, newType, newTarget, nodes, workspaces, updateNodeData])

  const removeLink = useCallback((linkId) => {
    updateNodeData(id, { links: links.filter(l => l.id !== linkId) })
  }, [id, links, updateNodeData])

  // ── Activate a link ─────────────────────────────────────────────────
  const activateLink = useCallback((e, link) => {
    e.stopPropagation()
    if (link.type === 'workspace') {
      switchWorkspace(link.target)
    } else if (link.type === 'node') {
      // Check if the node exists in the current workspace
      const targetNode = nodes.find(n => n.id === link.target)
      if (targetNode) {
        selectNode(link.target)
      } else {
        // Try to find it in another workspace
        for (const ws of workspaces) {
          const found = ws.nodes?.find(n => n.id === link.target)
          if (found) {
            switchWorkspace(ws.id)
            // After switching, select the node (will need a tick for state to update)
            setTimeout(() => selectNode(link.target), 50)
            break
          }
        }
      }
    } else if (link.type === 'url') {
      window.open(link.target, '_blank', 'noopener')
    }
  }, [nodes, workspaces, switchWorkspace, selectNode])

  // ── Available targets for new links ─────────────────────────────────
  const availableWorkspaces = workspaces.filter(w => w.id !== activeWorkspaceId)
  const availableNodes = useMemo(() =>
    nodes.filter(n => n.id !== id && n.type !== 'portal'),
  [nodes, id])

  // Stats
  const wsCount = links.filter(l => l.type === 'workspace').length
  const nodeCount = links.filter(l => l.type === 'node').length
  const urlCount = links.filter(l => l.type === 'url').length

  return (
    <BaseNode id={id} type="portal" data={data} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, overflow: 'hidden' }}>

        {/* ── Stats bar ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, fontSize: 10,
          padding: '2px 0', color: 'var(--text-muted)',
        }}>
          {wsCount > 0 && <span>{wsCount} workspace{wsCount > 1 ? 's' : ''}</span>}
          {nodeCount > 0 && <span>{nodeCount} node{nodeCount > 1 ? 's' : ''}</span>}
          {urlCount > 0 && <span>{urlCount} URL{urlCount > 1 ? 's' : ''}</span>}
          {links.length === 0 && <span style={{ fontStyle: 'italic' }}>No links yet</span>}
        </div>

        {/* ── Links list ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(link => {
            const LinkIcon = LINK_TYPES.find(t => t.value === link.type)?.icon || ExternalLink
            const isActive = (link.type === 'workspace' && link.target === activeWorkspaceId)

            return (
              <div
                key={link.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 6px', borderRadius: 6,
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onClick={(e) => activateLink(e, link)}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)' }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                title={
                  link.type === 'workspace' ? `Switch to "${link.label}"` :
                  link.type === 'node' ? `Select "${link.label}"` :
                  `Open ${link.target}`
                }
              >
                <LinkIcon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {link.label}
                  </div>
                  <div style={{
                    fontSize: 8, color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {link.type === 'workspace' ? 'workspace' :
                     link.type === 'node' ? `node · ${link.target}` :
                     link.target}
                  </div>
                </div>
                <ArrowRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <button
                  className="icon-btn"
                  style={{ width: 16, height: 16, borderRadius: 3, flexShrink: 0, opacity: 0.5 }}
                  onClick={(e) => { e.stopPropagation(); removeLink(link.id) }}
                >
                  <X size={7} />
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Add link ───────────────────────────────────────────────── */}
        {showAdd ? (
          <div style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
            borderTop: '1px solid var(--bg-border)', paddingTop: 6,
          }}>
            {/* Type selector */}
            <div style={{ display: 'flex', gap: 4 }}>
              {LINK_TYPES.map(lt => {
                const Icon = lt.icon
                return (
                  <button
                    key={lt.value}
                    className="icon-btn"
                    onClick={(e) => { e.stopPropagation(); setNewType(lt.value); setNewTarget('') }}
                    style={{
                      flex: 1, height: 24, borderRadius: 5, fontSize: 9, gap: 3,
                      background: newType === lt.value ? 'var(--accent-glow)' : 'transparent',
                      color: newType === lt.value ? 'var(--accent)' : 'var(--text-muted)',
                      border: newType === lt.value ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                  >
                    <Icon size={10} /> {lt.label}
                  </button>
                )
              })}
            </div>

            {/* Target selector — workspace / node / URL */}
            {newType === 'workspace' ? (
              <select
                className="field-input"
                value={newTarget}
                onChange={e => setNewTarget(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', height: 26, fontSize: 10, padding: '0 6px' }}
              >
                <option value="">Select workspace...</option>
                {availableWorkspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name} ({ws.nodes?.length || 0} nodes)</option>
                ))}
              </select>
            ) : newType === 'node' ? (
              <select
                className="field-input"
                value={newTarget}
                onChange={e => setNewTarget(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', height: 26, fontSize: 10, padding: '0 6px' }}
              >
                <option value="">Select node...</option>
                {availableNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.data?.title || 'Untitled'} ({TYPE_LABELS[n.type] || n.type})</option>
                ))}
              </select>
            ) : (
              <input
                className="field-input"
                style={{ width: '100%', height: 26, fontSize: 10, padding: '0 6px' }}
                placeholder="https://..."
                value={newTarget}
                onChange={e => setNewTarget(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                onClick={e => e.stopPropagation()}
              />
            )}

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn-ghost"
                onClick={(e) => { e.stopPropagation(); addLink() }}
                style={{ flex: 1, height: 24, fontSize: 10, justifyContent: 'center' }}
              >
                <Plus size={10} /> Add
              </button>
              <button
                className="icon-btn"
                onClick={(e) => { e.stopPropagation(); setShowAdd(false); setNewTarget('') }}
                style={{ width: 24, height: 24, borderRadius: 5 }}
              >
                <X size={10} />
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn-ghost"
            onClick={(e) => { e.stopPropagation(); setShowAdd(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
              height: 26, fontSize: 10, flexShrink: 0,
              border: '1px dashed var(--bg-border)', borderRadius: 6, color: 'var(--text-muted)',
            }}
          >
            <Plus size={10} /> Add link
          </button>
        )}
      </div>
    </BaseNode>
  )
}

export default React.memo(PortalNode)
