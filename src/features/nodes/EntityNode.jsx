import React, { useState, useCallback } from 'react'
import { nanoid } from 'nanoid'
import {
  Circle, Plus, X, Link as LinkIcon, Hash, AlignLeft,
  GripVertical, ExternalLink,
} from 'lucide-react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active',   color: '#4ade80' },
  { value: 'draft',    label: 'Draft',    color: '#facc15' },
  { value: 'archived', label: 'Archived', color: '#94a3b8' },
  { value: 'complete', label: 'Complete', color: '#60a5fa' },
]

const TAG_PRESETS = ['frontend', 'backend', 'design', 'research', 'api', 'core', 'bug', 'feature']

const EntityNode = ({ id, data, style, selected }) => {
  const { updateNodeData } = useWorkspaceStore()

  const status    = data?.status    || 'draft'
  const tags      = data?.tags      || []
  const properties = data?.properties || []
  const references = data?.references || []
  const description = data?.description || ''
  const color     = data?.color     || ''

  // ── Description ───────────────────────────────────────────────────────
  const handleDescChange = useCallback((e) => {
    updateNodeData(id, { description: e.target.value })
  }, [id, updateNodeData])

  // ── Status ────────────────────────────────────────────────────────────
  const [statusOpen, setStatusOpen] = useState(false)
  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[1]

  const handleStatusChange = useCallback((value) => {
    updateNodeData(id, { status: value })
    setStatusOpen(false)
  }, [id, updateNodeData])

  // ── Tags ──────────────────────────────────────────────────────────────
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestOpen, setTagSuggestOpen] = useState(false)

  const addTag = useCallback((t) => {
    if (!t || tags.includes(t)) return
    updateNodeData(id, { tags: [...tags, t] })
    setTagInput('')
    setTagSuggestOpen(false)
  }, [id, tags, updateNodeData])

  const removeTag = useCallback((t) => {
    updateNodeData(id, { tags: tags.filter(tag => tag !== t) })
  }, [id, tags, updateNodeData])

  const filteredSuggestions = TAG_PRESETS.filter(
    p => !tags.includes(p) && p.includes(tagInput.toLowerCase())
  )

  // ── Custom Properties ─────────────────────────────────────────────────
  const addProperty = useCallback(() => {
    updateNodeData(id, {
      properties: [...properties, { key: '', value: '', id: nanoid(4) }]
    })
  }, [id, properties, updateNodeData])

  const updateProperty = useCallback((propId, field, val) => {
    updateNodeData(id, {
      properties: properties.map(p =>
        p.id === propId ? { ...p, [field]: val } : p
      )
    })
  }, [id, properties, updateNodeData])

  const removeProperty = useCallback((propId) => {
    updateNodeData(id, {
      properties: properties.filter(p => p.id !== propId)
    })
  }, [id, properties, updateNodeData])

  // ── References ────────────────────────────────────────────────────────
  const [refInput, setRefInput] = useState('')

  const addReference = useCallback(() => {
    const url = refInput.trim()
    if (!url) return
    let formatted = url
    if (!formatted.startsWith('http') && !formatted.startsWith('#')) {
      formatted = 'https://' + formatted
    }
    updateNodeData(id, {
      references: [...references, { id: nanoid(4), url: formatted, label: url }]
    })
    setRefInput('')
  }, [id, references, refInput, updateNodeData])

  const removeReference = useCallback((refId) => {
    updateNodeData(id, {
      references: references.filter(r => r.id !== refId)
    })
  }, [id, references, updateNodeData])

  // ── Entity Color ──────────────────────────────────────────────────────
  const [colorOpen, setColorOpen] = useState(false)
  const COLOR_PRESETS = ['#60a5fa', '#4ade80', '#f87171', '#facc15', '#c084fc', '#fb923c', '#e2e8f0']

  const handleColorChange = useCallback((c) => {
    updateNodeData(id, { color: c })
    setColorOpen(false)
  }, [id, updateNodeData])

  const statusColor = currentStatus.color
  const entityAccent = color || statusColor

  return (
    <BaseNode id={id} type="entity" data={data} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10, overflow: 'hidden' }}>
        
        {/* ── Status Bar ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Status selector */}
          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); setStatusOpen(s => !s) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', height: 24, borderRadius: 6,
                background: `rgba(${parseInt(statusColor.slice(1,3), 16)}, ${parseInt(statusColor.slice(3,5), 16)}, ${parseInt(statusColor.slice(5,7), 16)}, 0.12)`,
                border: `1px solid ${statusColor}33`,
                fontSize: 10, fontWeight: 600, color: statusColor,
              }}
              title="Change status"
            >
              <Circle size={7} fill={statusColor} stroke="none" />
              {currentStatus.label}
            </button>
            {statusOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={(e) => { e.stopPropagation(); setStatusOpen(false) }} />
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4,
                  background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: 8, padding: 4, zIndex: 10, minWidth: 120,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(opt.value) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        width: '100%', padding: '5px 8px', borderRadius: 5,
                        border: 'none', background: opt.value === status ? 'var(--bg-elevated)' : 'transparent',
                        color: opt.value === status ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: 11, cursor: 'pointer', fontWeight: 500,
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseOut={e => e.currentTarget.style.background = opt.value === status ? 'var(--bg-elevated)' : 'transparent'}
                    >
                      <Circle size={8} fill={opt.color} stroke="none" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Entity color dot */}
          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); setColorOpen(s => !s) }}
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: entityAccent || 'var(--bg-elevated)',
                border: '2px solid var(--bg-border)',
                padding: 0,
              }}
              title="Entity color"
            />
            {colorOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={(e) => { e.stopPropagation(); setColorOpen(false) }} />
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4,
                  background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: 8, padding: 6, zIndex: 10,
                  display: 'flex', gap: 4,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={(e) => { e.stopPropagation(); handleColorChange(c) }}
                      style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: c,
                        border: c === entityAccent ? '2px solid var(--text-primary)' : '2px solid transparent',
                        cursor: 'pointer', padding: 0,
                      }}
                    />
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleColorChange('') }}
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '2px dashed var(--bg-border)',
                      cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'var(--text-muted)',
                    }}
                    title="Clear color"
                  >
                    <X size={8} />
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500 }}>
            {tags.length} tags
          </span>
        </div>

        {/* ── Description ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexShrink: 0 }}>
          <AlignLeft size={11} style={{ color: 'var(--text-muted)', marginTop: 4, flexShrink: 0 }} />
          <textarea
            className="field-input"
            style={{
              flex: 1, height: 48, resize: 'none', border: 'none',
              background: 'transparent', padding: 0,
              fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)',
            }}
            placeholder="Add a description..."
            value={description}
            onChange={handleDescChange}
            onClick={e => e.stopPropagation()}
          />
        </div>

        {/* ── Tags ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Hash size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
              {tags.map(t => (
                <span
                  key={t}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '1px 6px', borderRadius: 4,
                    background: 'var(--accent-glow)',
                    color: 'var(--accent)', fontSize: 10, fontWeight: 600,
                  }}
                >
                  {t}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTag(t) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.6 }}
                  >
                    <X size={7} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          {/* Tag input */}
          <div style={{ position: 'relative', display: 'flex', gap: 4 }}>
            <input
              className="field-input"
              style={{ flex: 1, height: 22, fontSize: 10, padding: '0 6px' }}
              placeholder="+ add tag..."
              value={tagInput}
              onChange={e => { setTagInput(e.target.value); setTagSuggestOpen(true) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput.toLowerCase()) } }}
              onBlur={() => setTimeout(() => setTagSuggestOpen(false), 150)}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="icon-btn"
              style={{ width: 22, height: 22, borderRadius: 4, flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); addTag(tagInput.toLowerCase()) }}
            >
              <Plus size={10} />
            </button>
            {tagSuggestOpen && tagInput && filteredSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 30, marginTop: 2,
                background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderRadius: 6, padding: 3, zIndex: 10,
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              }}>
                {filteredSuggestions.map(s => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); addTag(s) }}
                    style={{
                      display: 'block', width: '100%', padding: '3px 6px', borderRadius: 4,
                      border: 'none', background: 'transparent', color: 'var(--text-secondary)',
                      fontSize: 10, cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Custom Properties ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Properties
            </span>
            <button
              className="icon-btn"
              style={{ width: 16, height: 16, borderRadius: 3 }}
              onClick={(e) => { e.stopPropagation(); addProperty() }}
              title="Add property"
            >
              <Plus size={9} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {properties.map((prop, i) => (
              <div key={prop.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <GripVertical size={8} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.4 }} />
                <input
                  className="field-input"
                  style={{ width: '40%', height: 22, fontSize: 10, padding: '0 6px' }}
                  placeholder="Key"
                  value={prop.key}
                  onChange={e => updateProperty(prop.id, 'key', e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <input
                  className="field-input"
                  style={{ flex: 1, height: 22, fontSize: 10, padding: '0 6px' }}
                  placeholder="Value"
                  value={prop.value}
                  onChange={e => updateProperty(prop.id, 'value', e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <button
                  className="icon-btn"
                  style={{ width: 18, height: 18, borderRadius: 3, flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); removeProperty(prop.id) }}
                >
                  <X size={7} />
                </button>
              </div>
            ))}
            {properties.length === 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 4px' }}>
                No properties yet
              </span>
            )}
          </div>
        </div>

        {/* ── References ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, borderTop: '1px solid var(--bg-border)', paddingTop: 6 }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            References
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 60, overflowY: 'auto' }}>
            {references.map(ref => (
              <div key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <LinkIcon size={8} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1, fontSize: 10, color: 'var(--accent)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: 'none',
                  }}
                  onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {ref.label}
                </a>
                <button
                  className="icon-btn"
                  style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); removeReference(ref.id) }}
                >
                  <X size={6} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              className="field-input"
              style={{ flex: 1, height: 22, fontSize: 10, padding: '0 6px' }}
              placeholder="+ Add URL or reference..."
              value={refInput}
              onChange={e => setRefInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addReference() } }}
              onClick={e => e.stopPropagation()}
            />
            <button
              className="icon-btn"
              style={{ width: 22, height: 22, borderRadius: 4, flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); addReference() }}
            >
              <ExternalLink size={9} />
            </button>
          </div>
        </div>
      </div>
    </BaseNode>
  )
}

export default React.memo(EntityNode)
