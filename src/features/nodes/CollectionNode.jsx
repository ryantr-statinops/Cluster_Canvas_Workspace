import React, { useState, useCallback, useMemo } from 'react'
import { nanoid } from 'nanoid'
import {
  Filter, Plus, X, Layers, Globe, StickyNote,
  CheckSquare, Pencil, FileText, BookOpen, Tag,
  Type, AlignLeft, Circle,
} from 'lucide-react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { TYPE_LABELS } from '../canvas/BaseNode'

// ── Filter field definitions ──────────────────────────────────────────
const FILTER_FIELDS = [
  { value: 'type',   label: 'Type',     icon: Layers },
  { value: 'tag',    label: 'Tag',      icon: Tag },
  { value: 'title',  label: 'Title',    icon: AlignLeft },
  { value: 'status', label: 'Status',   icon: Circle },
]

const FILTER_OPERATORS = {
  type:   [{ value: 'equals',   label: 'is' }],
  tag:    [{ value: 'contains', label: 'contains' }, { value: 'equals', label: 'is' }],
  title:  [{ value: 'contains', label: 'contains' }, { value: 'starts',  label: 'starts with' }],
  status: [{ value: 'equals',   label: 'is' }],
}

const NODE_TYPE_OPTIONS = ['entity', 'context', 'notes', 'todo', 'website', 'draw', 'group']
const STATUS_OPTIONS = ['active', 'draft', 'archived', 'complete']

// ── Node type icon map (mirrors BaseNode) ─────────────────────────────
const TYPE_ICON_MAP = {
  entity:  FileText,
  context: BookOpen,
  notes:   StickyNote,
  todo:    CheckSquare,
  website: Globe,
  draw:    Pencil,
  group:   Layers,
}

// ── Filter engine ─────────────────────────────────────────────────────
function nodeMatchesFilter(node, filter) {
  const { field, operator, value } = filter
  if (!value) return false

  const nodeTitle = (node.data?.title || '').toLowerCase()
  const searchVal = value.toLowerCase()

  switch (field) {
    case 'type':
      return node.type === value

    case 'tag': {
      const tags = node.data?.tags || []
      if (operator === 'contains') return tags.some(t => t.toLowerCase().includes(searchVal))
      if (operator === 'equals')   return tags.some(t => t.toLowerCase() === searchVal)
      return false
    }

    case 'title':
      if (operator === 'contains') return nodeTitle.includes(searchVal)
      if (operator === 'starts')   return nodeTitle.startsWith(searchVal)
      return false

    case 'status':
      return (node.data?.status || '').toLowerCase() === searchVal

    default:
      return false
  }
}

function getFilteredNodes(nodes, excludeId, filters, matchMode = 'all') {
  if (!filters || filters.length === 0) return []
  return nodes.filter(node => {
    if (node.id === excludeId) return false
    if (node.type === 'collection') return false
    if (matchMode === 'any') {
      return filters.some(f => f.value && nodeMatchesFilter(node, f))
    }
    // 'all' = AND logic: every filter must match
    return filters.every(f => f.value && nodeMatchesFilter(node, f))
  })
}

// ── Collection Node Component ─────────────────────────────────────────
const CollectionNode = ({ id, data, style, selected }) => {
  const { nodes, selectNode } = useWorkspaceStore()
  const { updateNodeData } = useWorkspaceStore()

  const filters = data?.filters || []
  const matchMode = data?.matchMode || 'all' // 'all' = AND, 'any' = OR

  // ── Computed matches ────────────────────────────────────────────────
  const matchedNodes = useMemo(() => {
    return getFilteredNodes(nodes, id, filters, matchMode)
  }, [nodes, id, filters, matchMode])

  // ── Add / remove filters ────────────────────────────────────────────
  const addFilter = useCallback(() => {
    updateNodeData(id, {
      filters: [...filters, { id: nanoid(4), field: 'type', operator: 'equals', value: '' }]
    })
  }, [id, filters, updateNodeData])

  const removeFilter = useCallback((filterId) => {
    updateNodeData(id, {
      filters: filters.filter(f => f.id !== filterId)
    })
  }, [id, filters, updateNodeData])

  const updateFilter = useCallback((filterId, key, val) => {
    const updated = filters.map(f => {
      if (f.id !== filterId) return f
      const next = { ...f, [key]: val }
      // Reset operator when field changes
      if (key === 'field') {
        const ops = FILTER_OPERATORS[next.field]
        next.operator = ops?.[0]?.value || 'equals'
        next.value = ''
      }
      return next
    })
    updateNodeData(id, { filters: updated })
  }, [id, filters, updateNodeData])

  const toggleMatchMode = useCallback(() => {
    updateNodeData(id, { matchMode: matchMode === 'all' ? 'any' : 'all' })
  }, [id, matchMode, updateNodeData])

  // ── Click to select a matched node ──────────────────────────────────
  const handleNodeClick = useCallback((e, nodeId) => {
    e.stopPropagation()
    selectNode(nodeId)
  }, [selectNode])

  const hasActiveFilters = filters.some(f => f.value)

  return (
    <BaseNode id={id} type="collection" data={data} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, overflow: 'hidden' }}>

        {/* ── Summary bar ────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          padding: '4px 0',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 6,
            background: matchedNodes.length > 0 ? 'var(--accent-glow)' : 'var(--bg-elevated)',
            fontSize: 11, fontWeight: 700, color: matchedNodes.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
          }}>
            {matchedNodes.length}
            <span style={{ fontWeight: 500, opacity: 0.7 }}>matched</span>
          </div>
          {filters.length > 0 && (
            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); toggleMatchMode() }}
              title={`Match ${matchMode === 'all' ? 'ALL' : 'ANY'} filters`}
              style={{ width: 20, height: 20, borderRadius: 4, fontSize: 9, fontWeight: 700 }}
            >
              {matchMode === 'all' ? 'AND' : 'OR'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500 }}>
            {nodes.length - 1} total
          </span>
        </div>

        {/* ── Filters ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          {filters.map((filter, i) => {
            const FieldIcon = FILTER_FIELDS.find(f => f.value === filter.field)?.icon || Filter
            const operators = FILTER_OPERATORS[filter.field] || [{ value: 'equals', label: 'is' }]

            return (
              <div key={filter.id} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {/* Field selector */}
                <select
                  className="field-input"
                  value={filter.field}
                  onChange={e => updateFilter(filter.id, 'field', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 60, height: 22, fontSize: 9, padding: '0 4px' }}
                >
                  {FILTER_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>

                {/* Operator */}
                <select
                  className="field-input"
                  value={filter.operator}
                  onChange={e => updateFilter(filter.id, 'operator', e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: 64, height: 22, fontSize: 9, padding: '0 4px' }}
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                {/* Value input — type-aware */}
                {filter.field === 'type' ? (
                  <select
                    className="field-input"
                    value={filter.value}
                    onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ flex: 1, height: 22, fontSize: 9, padding: '0 4px' }}
                  >
                    <option value="">Select type...</option>
                    {NODE_TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>{TYPE_LABELS[t] || t.toUpperCase()}</option>
                    ))}
                  </select>
                ) : filter.field === 'status' ? (
                  <select
                    className="field-input"
                    value={filter.value}
                    onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                    onClick={e => e.stopPropagation()}
                    style={{ flex: 1, height: 22, fontSize: 9, padding: '0 4px' }}
                  >
                    <option value="">Select status...</option>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="field-input"
                    style={{ flex: 1, height: 22, fontSize: 9, padding: '0 6px' }}
                    placeholder="Value..."
                    value={filter.value}
                    onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                )}

                <button
                  className="icon-btn"
                  style={{ width: 18, height: 18, borderRadius: 3, flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); removeFilter(filter.id) }}
                >
                  <X size={7} />
                </button>
              </div>
            )
          })}

          {/* Add filter button */}
          <button
            className="btn-ghost"
            onClick={(e) => { e.stopPropagation(); addFilter() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              height: 22, fontSize: 9, justifyContent: 'center',
              border: '1px dashed var(--bg-border)',
              borderRadius: 5, color: 'var(--text-muted)',
            }}
          >
            <Plus size={8} /> Add filter
          </button>
        </div>

        {/* ── Results ────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', minHeight: 0,
          display: 'flex', flexDirection: 'column', gap: 2,
          borderTop: '1px solid var(--bg-border)', paddingTop: 6,
        }}>
          {!hasActiveFilters ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flex: 1, gap: 6, opacity: 0.5,
            }}>
              <Filter size={20} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                Add filters above to collect matching nodes
              </span>
            </div>
          ) : matchedNodes.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
            }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No nodes match these filters
              </span>
            </div>
          ) : (
            matchedNodes.map(node => {
              const Icon = TYPE_ICON_MAP[node.type] || Layers
              const statusColor = node.data?.status
                ? ({ active: '#4ade80', draft: '#facc15', archived: '#94a3b8', complete: '#60a5fa' })[node.data.status] || '#94a3b8'
                : undefined

              return (
                <button
                  key={node.id}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 6px', borderRadius: 5,
                    border: 'none', background: 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{
                    flex: 1, fontSize: 10, color: 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {node.data?.title || 'Untitled'}
                  </span>
                  {statusColor && (
                    <Circle size={6} fill={statusColor} stroke="none" style={{ flexShrink: 0 }} />
                  )}
                  <span style={{
                    fontSize: 8, color: 'var(--text-muted)', flexShrink: 0,
                    background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 3,
                  }}>
                    {TYPE_LABELS[node.type] || node.type}
                  </span>
                </button>
              )
            })
          )}
        </div>

      </div>
    </BaseNode>
  )
}

export default React.memo(CollectionNode)
