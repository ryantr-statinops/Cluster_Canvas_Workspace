import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Search, X, Globe, StickyNote, CheckSquare, Pencil,
  FileText, BookOpen, Filter as FilterIcon, Compass, GitBranch,
  Layers, Square, Hash, Tag, Type, ArrowUpDown,
} from 'lucide-react'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { searchNodes, buildFilters, FIELD_LABELS } from '../../utils/search'

// ── Node type icon map ────────────────────────────────────────────────
const NODE_ICONS = {
  entity:     FileText,
  context:    BookOpen,
  notes:      StickyNote,
  todo:       CheckSquare,
  website:    Globe,
  draw:       Pencil,
  group:      Layers,
  collection: FilterIcon,
  portal:     Compass,
  relation:   GitBranch,
}

const SearchModal = () => {
  const { nodes, selectNode, closeModal } = useWorkspaceStore()
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState({ types: [], statuses: [], tags: [] })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  // Available filter options
  const filterOptions = useMemo(() => buildFilters(nodes), [nodes])

  // Search results
  const results = useMemo(() => {
    // Determine active filter types
    const types = activeFilters.types.length > 0 ? activeFilters.types : undefined
    const status = activeFilters.statuses.length > 0 ? activeFilters.statuses : undefined
    const tags = activeFilters.tags.length > 0 ? activeFilters.tags : undefined

    return searchNodes(nodes, query, { types, status, tags })
  }, [nodes, query, activeFilters])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, activeFilters])

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // ── Filter toggles ──────────────────────────────────────────────────
  const toggleFilter = useCallback((category, value) => {
    setActiveFilters(prev => {
      const current = prev[category] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [category]: updated }
    })
    setSelectedIndex(0)
  }, [])

  const clearFilters = useCallback(() => {
    setActiveFilters({ types: [], statuses: [], tags: [] })
  }, [])

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0)

  // ── Result selection ────────────────────────────────────────────────
  const handleSelect = useCallback((nodeId) => {
    selectNode(nodeId)
    closeModal()
  }, [selectNode, closeModal])

  // ── Keyboard navigation ─────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex].node.id)
    } else if (e.key === 'Escape') {
      closeModal()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setShowFilters(s => !s)
    }
  }, [results, selectedIndex, handleSelect, closeAllModals])

  // Scroll selected result into view
  useEffect(() => {
    const el = resultsRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex])

  // ── Field icon map ──────────────────────────────────────────────────
  const getFieldIcon = (field) => {
    switch (field) {
      case 'title':          return <Type size={10} />
      case 'content':        return <BookOpen size={10} />
      case 'description':    return <FileText size={10} />
      case 'tag':            return <Tag size={10} />
      case 'status':         return <Hash size={10} />
      case 'property_key':
      case 'property_value': return <Square size={10} />
      default:               return <ArrowUpDown size={10} />
    }
  }

  const filterChipClass = (active) => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '3px 8px', borderRadius: 6, border: 'none',
    fontSize: 10, fontWeight: 600, cursor: 'pointer',
    background: active ? 'var(--accent)' : 'var(--bg-elevated)',
    color: active ? '#1e222a' : 'var(--text-secondary)',
    transition: 'all 0.1s',
    whiteSpace: 'nowrap',
  })

  return (
    <div
      className="modal-overlay"
      onClick={closeAllModals}
      style={{ backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.5)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 520,
          maxHeight: '70vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Search Input ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid var(--bg-border)',
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes, content, tags, properties..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            className="icon-btn"
            style={{ width: 24, height: 24, borderRadius: 6 }}
            onClick={closeAllModals}
            title="Close (Esc)"
          >
            <X size={12} />
          </button>
        </div>

        {/* ── Filter Bar ── */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              borderBottom: '1px solid var(--bg-border)',
              padding: '10px 16px',
              display: 'flex', flexDirection: 'column', gap: 8,
              overflow: 'hidden',
            }}
          >
            {/* Type filters */}
            {filterOptions.types.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 36 }}>
                  Type
                </span>
                {filterOptions.types.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleFilter('types', t)}
                    style={filterChipClass(activeFilters.types.includes(t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Status filters */}
            {filterOptions.statuses.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 36 }}>
                  Status
                </span>
                {filterOptions.statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleFilter('statuses', s)}
                    style={filterChipClass(activeFilters.statuses.includes(s))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Tag filters */}
            {filterOptions.tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 36 }}>
                  Tags
                </span>
                {filterOptions.tags.map(t => (
                  <button
                    key={t}
                    onClick={() => toggleFilter('tags', t)}
                    style={filterChipClass(activeFilters.tags.includes(t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  alignSelf: 'flex-start', fontSize: 10, color: 'var(--accent)',
                  background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                  padding: '2px 4px',
                }}
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* ── Filter toggle + results ── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* Filter toggle button */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 16px',
          }}>
            <button
              onClick={() => setShowFilters(s => !s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: showFilters ? 'var(--bg-elevated)' : 'transparent',
                border: 'none', borderRadius: 6, padding: '3px 8px',
                fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <FilterIcon size={10} />
              Filters
              {hasActiveFilters && (
                <span style={{
                  background: 'var(--accent)', color: '#1e222a',
                  borderRadius: 99, padding: '0 5px', fontSize: 9,
                  fontWeight: 700, marginLeft: 2,
                }}>
                  {Object.values(activeFilters).reduce((s, a) => s + a.length, 0)}
                </span>
              )}
            </button>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              Tab to toggle filters · ↑↓ navigate · Enter select
            </span>
          </div>

          {/* ── Results ── */}
          <div
            ref={resultsRef}
            style={{
              flex: 1, overflowY: 'auto',
              padding: '0 8px 8px',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}
          >
            {!query.trim() ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, padding: 40,
                color: 'var(--text-muted)',
              }}>
                <Search size={28} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: 13, fontWeight: 500 }}>Start typing to search</p>
                <p style={{ fontSize: 11, opacity: 0.7 }}>
                  Searches across titles, content, descriptions, tags, and properties
                </p>
              </div>
            ) : results.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 32,
                color: 'var(--text-muted)', fontSize: 12,
              }}>
                No results for "{query}"
              </div>
            ) : (
              results.map((result, idx) => {
                const node = result.node
                const Icon = NODE_ICONS[node.type] || Layers
                const isSelected = idx === selectedIndex

                return (
                  <button
                    key={node.id}
                    data-index={idx}
                    onClick={() => handleSelect(node.id)}
                    onMouseOver={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '8px 10px', borderRadius: 8,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      width: '100%', transition: 'all 0.1s',
                      background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      outline: isSelected ? `1px solid var(--bg-border)` : 'none',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--bg-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                    }}>
                      <Icon size={13} style={{ color: 'var(--accent)' }} />
                    </div>

                    {/* Node info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title + type badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {node.data?.title || 'Untitled'}
                        </span>
                        <span style={{
                          fontSize: 8, fontWeight: 600, color: 'var(--text-muted)',
                          background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 4,
                          textTransform: 'uppercase', letterSpacing: '0.03em',
                        }}>
                          {node.type}
                        </span>
                      </div>

                      {/* Match context */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {result.matches.slice(0, 2).map((match, mi) => (
                          <div
                            key={mi}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 10, color: 'var(--text-muted)',
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ flexShrink: 0, opacity: 0.6 }}>
                              {getFieldIcon(match.field)}
                            </span>
                            <span style={{
                              fontWeight: FIELD_LABELS[match.field] === 'Title' ? 500 : 400,
                              color: FIELD_LABELS[match.field] === 'Title' ? 'var(--text-secondary)' : undefined,
                            }}>
                              {FIELD_LABELS[match.field] || match.field}:
                            </span>
                            <span style={{
                              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {match.snippet}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score */}
                    <span style={{
                      fontSize: 9, color: 'var(--text-muted)',
                      fontFamily: 'monospace', flexShrink: 0, marginTop: 3,
                      opacity: 0.6,
                    }}>
                      {result.score}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SearchModal
