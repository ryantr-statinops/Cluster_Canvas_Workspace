import React, { useState, useCallback, useMemo } from 'react'
import { nanoid } from 'nanoid'
import {
  Plus, X, Link as LinkIcon,
  ArrowUpDown, ArrowUp, ArrowDown, Columns, Rows,
  Type, Hash, Calendar, ToggleLeft,
} from 'lucide-react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'

// ── Column Types ──────────────────────────────────────────────────────
const COLUMN_TYPES = [
  { value: 'text',   label: 'Text',   icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'select', label: 'Select', icon: ToggleLeft },
  { value: 'date',   label: 'Date',   icon: Calendar },
]

const TYPE_LABEL_MAP = Object.fromEntries(COLUMN_TYPES.map(t => [t.value, t.label]))

// ── Helpers ───────────────────────────────────────────────────────────
function createDefaultColumns() {
  return [
    { id: nanoid(4), name: 'Name',  type: 'text',   width: 140 },
    { id: nanoid(4), name: 'Status', type: 'select', width: 110, options: ['Active', 'Inactive', 'Pending'] },
    { id: nanoid(4), name: 'Value',  type: 'number', width: 90 },
  ]
}

function sortRows(rows, sortColumn, sortDirection) {
  if (!sortColumn) return rows
  return [...rows].sort((a, b) => {
    const va = (a.cells[sortColumn] || '').toString()
    const vb = (b.cells[sortColumn] || '').toString()
    const numA = parseFloat(va)
    const numB = parseFloat(vb)
    // Try numeric comparison first
    if (!isNaN(numA) && !isNaN(numB)) {
      return sortDirection === 'asc' ? numA - numB : numB - numA
    }
    return sortDirection === 'asc'
      ? va.localeCompare(vb)
      : vb.localeCompare(va)
  })
}

function filterRows(rows, columns, filters) {
  if (!filters || filters.length === 0) return rows
  return rows.filter(row => {
    return filters.every(f => {
      if (!f.value) return true
      const cellVal = (row.cells[f.columnId] || '').toString().toLowerCase()
      return cellVal.includes(f.value.toLowerCase())
    })
  })
}

// ── Data Table Node Component ─────────────────────────────────────────
const DataTableNode = ({ id, data, style, selected }) => {
  const { updateNodeData } = useWorkspaceStore()

  const columns  = data?.columns || createDefaultColumns()
  const rows     = data?.rows    || []
  const references = data?.references || []

  const [sortColumn, setSortColumn]   = useState(data?.sortColumn || null)
  const [sortDir, setSortDir]         = useState(data?.sortDirection || 'asc')
  const [filters, setFilters]         = useState(data?.filters || [])
  const [filterOpen, setFilterOpen]   = useState(false)
  const [editingCell, setEditingCell] = useState(null) // { rowId, colId }
  const [editValue, setEditValue]     = useState('')
  const [columnMenuOpen, setColumnMenuOpen] = useState(null)

  // ── Persist sort/filter to data ────────────────────────────────────
  const persistMeta = useCallback((meta) => {
    updateNodeData(id, meta)
  }, [id, updateNodeData])

  // ── Column actions ──────────────────────────────────────────────────
  const addColumn = useCallback(() => {
    const newCol = { id: nanoid(4), name: 'Column', type: 'text', width: 100 }
    const updatedCols = [...columns, newCol]
    // Add empty cell to all existing rows for the new column
    const updatedRows = rows.map(r => ({
      ...r,
      cells: { ...r.cells, [newCol.id]: '' }
    }))
    updateNodeData(id, { columns: updatedCols, rows: updatedRows })
    setColumnMenuOpen(null)
  }, [id, columns, rows, updateNodeData])

  const updateColumn = useCallback((colId, field, value) => {
    const updated = columns.map(c => c.id === colId ? { ...c, [field]: value } : c)
    updateNodeData(id, { columns: updated })
  }, [id, columns, updateNodeData])

  const removeColumn = useCallback((colId) => {
    const updatedCols = columns.filter(c => c.id !== colId)
    const updatedRows = rows.map(r => {
      const cells = { ...r.cells }
      delete cells[colId]
      return { ...r, cells }
    })
    updateNodeData(id, { columns: updatedCols, rows: updatedRows })
    setColumnMenuOpen(null)
  }, [id, columns, rows, updateNodeData])

  // ── Row actions ────────────────────────────────────────────────────
  const addRow = useCallback(() => {
    const newRow = {
      id: nanoid(6),
      cells: Object.fromEntries(columns.map(c => [c.id, ''])),
    }
    updateNodeData(id, { rows: [...rows, newRow] })
  }, [id, columns, rows, updateNodeData])

  const removeRow = useCallback((rowId) => {
    updateNodeData(id, { rows: rows.filter(r => r.id !== rowId) })
  }, [id, rows, updateNodeData])

  const updateCell = useCallback((rowId, colId, value) => {
    const updated = rows.map(r =>
      r.id === rowId
        ? { ...r, cells: { ...r.cells, [colId]: value } }
        : r
    )
    updateNodeData(id, { rows: updated })
  }, [id, rows, updateNodeData])

  // ── Sort toggle ──────────────────────────────────────────────────
  const handleSortToggle = useCallback((colId) => {
    let newDir = 'asc'
    if (sortColumn === colId) {
      newDir = sortDir === 'asc' ? 'desc' : 'asc'
    }
    setSortColumn(colId)
    setSortDir(newDir)
    persistMeta({ sortColumn: colId, sortDirection: newDir })
  }, [sortColumn, sortDir, persistMeta])

  // ── Filter toggle ─────────────────────────────────────────────────
  const toggleFilter = useCallback((colId) => {
    setFilters(prev => {
      const exists = prev.find(f => f.columnId === colId)
      if (exists) {
        const next = prev.filter(f => f.columnId !== colId)
        persistMeta({ filters: next })
        return next
      }
      const next = [...prev, { columnId: colId, value: '' }]
      persistMeta({ filters: next })
      return next
    })
  }, [persistMeta])

  const updateFilter = useCallback((colId, value) => {
    setFilters(prev => {
      const next = prev.map(f =>
        f.columnId === colId ? { ...f, value } : f
      )
      return next
    })
  }, [])

  // ── Cell editing ─────────────────────────────────────────────────
  const startEdit = useCallback((rowId, colId, currentVal) => {
    setEditingCell({ rowId, colId })
    setEditValue(currentVal || '')
  }, [])

  const commitEdit = useCallback(() => {
    if (!editingCell) return
    updateCell(editingCell.rowId, editingCell.colId, editValue)
    setEditingCell(null)
    setEditValue('')
  }, [editingCell, editValue, updateCell])

  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  // ── Derived data ──────────────────────────────────────────────────
  const sortedRows = useMemo(() => sortRows(rows, sortColumn, sortDir), [rows, sortColumn, sortDir])
  const filteredRows = useMemo(() => filterRows(sortedRows, columns, filters), [sortedRows, columns, filters])

  const totalRows = rows.length
  const visibleRows = filteredRows.length

  return (
    <BaseNode id={id} type="data-table" data={data} style={style} selected={selected}
      headerControls={
        <div style={{ display: 'flex', gap: 2 }}>
          {/* Column menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              style={{ width: 22, height: 22, borderRadius: 5 }}
              onClick={(e) => { e.stopPropagation(); setColumnMenuOpen(s => s ? null : 'main') }}
              title="Column options"
            >
              <Columns size={10} />
            </button>
            {columnMenuOpen === 'main' && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setColumnMenuOpen(null)} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                  borderRadius: 8, padding: 4, zIndex: 10, minWidth: 130,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); addColumn() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 8px', borderRadius: 5, border: 'none',
                      background: 'transparent', color: 'var(--text-secondary)',
                      fontSize: 11, cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Plus size={10} style={{ color: 'var(--accent)' }} />
                    Add column
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFilterOpen(s => !s) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 8px', borderRadius: 5, border: 'none',
                      background: 'transparent', color: filterOpen ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: 11, cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <ArrowUpDown size={10} style={{ color: filterOpen ? 'var(--accent)' : 'var(--text-muted)' }} />
                    {filterOpen ? 'Hide filters' : 'Show filters'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, overflow: 'hidden' }}>

        {/* ── Stats Bar ────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          padding: '2px 0',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 5,
            background: 'var(--bg-elevated)',
            fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
          }}>
            <Rows size={10} />
            {totalRows} rows
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 5,
            background: 'var(--bg-elevated)',
            fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
          }}>
            <Columns size={10} />
            {columns.length} cols
          </div>
          {totalRows > 0 && visibleRows < totalRows && (
            <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 500 }}>
              {visibleRows} filtered
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            className="icon-btn"
            style={{ width: 18, height: 18, borderRadius: 4 }}
            onClick={(e) => { e.stopPropagation(); addRow() }}
            title="Add row"
          >
            <Plus size={9} />
          </button>
        </div>

        {/* ── Table Scroll Container ───────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0, borderRadius: 6, border: '1px solid var(--bg-border)' }}>

          {/* ── Filter Row ──────────────────────────────────────────── */}
          {filterOpen && (
            <div style={{
              display: 'flex', gap: 0, borderBottom: '1px solid var(--bg-border)',
              background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 2,
            }}>
              {columns.map(col => (
                <div
                  key={col.id}
                  style={{
                    flex: col.width ? `0 0 ${col.width}px` : 1, minWidth: 70,
                    padding: '2px 4px',
                    borderRight: '1px solid var(--bg-border)',
                  }}
                >
                  <input
                    className="field-input"
                    style={{
                      width: '100%', height: 20, fontSize: 9,
                      padding: '0 4px', background: 'var(--bg-surface)',
                    }}
                    placeholder="Filter..."
                    value={filters.find(f => f.columnId === col.id)?.value || ''}
                    onChange={e => updateFilter(col.id, e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Table ────────────────────────────────────────────────── */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 10,
            tableLayout: 'fixed',
          }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.id}
                    style={{
                      padding: '5px 6px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-elevated)',
                      borderBottom: '2px solid var(--bg-border)',
                      borderRight: '1px solid var(--bg-border)',
                      width: col.width,
                      minWidth: 60,
                      cursor: 'pointer',
                      userSelect: 'none',
                      position: 'relative',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={(e) => { e.stopPropagation(); handleSortToggle(col.id) }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      {/* Column name (editable) */}
                      <input
                        className="field-input"
                        style={{
                          flex: 1, height: 18, fontSize: 10,
                          padding: '0 2px', background: 'transparent',
                          border: 'none', fontWeight: 600, color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        value={col.name}
                        onChange={e => { e.stopPropagation(); updateColumn(col.id, 'name', e.target.value) }}
                        onClick={e => e.stopPropagation()}
                      />

                      {/* Sort indicator */}
                      {sortColumn === col.id && (
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
                          {sortDir === 'asc'
                            ? <ArrowUp size={10} />
                            : <ArrowDown size={10} />
                          }
                        </span>
                      )}

                      {/* Column type indicator */}
                      <div style={{ position: 'relative' }}>
                        <span
                          onClick={(e) => { e.stopPropagation(); setColumnMenuOpen(col.id) }}
                          style={{
                            fontSize: 8, color: 'var(--text-muted)',
                            background: 'var(--bg-surface)', padding: '1px 3px',
                            borderRadius: 3, cursor: 'pointer',
                          }}
                        >
                          {TYPE_LABEL_MAP[col.type] || 'Text'}
                        </span>
                        {columnMenuOpen === col.id && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setColumnMenuOpen(null)} />
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, marginTop: 2,
                              background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                              borderRadius: 6, padding: 3, zIndex: 10, minWidth: 100,
                              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                            }}>
                              {/* Type selector */}
                              <div style={{ padding: '2px 4px 4px', fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
                                Type
                              </div>
                              {COLUMN_TYPES.map(ct => (
                                <button
                                  key={ct.value}
                                  onClick={(e) => { e.stopPropagation(); updateColumn(col.id, 'type', ct.value); setColumnMenuOpen(null) }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    width: '100%', padding: '4px 6px', borderRadius: 4,
                                    border: 'none', background: col.type === ct.value ? 'var(--bg-elevated)' : 'transparent',
                                    color: col.type === ct.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontSize: 10, cursor: 'pointer',
                                  }}
                                >
                                  <ct.icon size={10} style={{ color: 'var(--accent)' }} />
                                  {ct.label}
                                </button>
                              ))}
                              <div style={{ height: 1, background: 'var(--bg-border)', margin: '4px 0' }} />
                              {/* Column actions */}
                              <button
                                onClick={(e) => { e.stopPropagation(); addColumn() }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  width: '100%', padding: '4px 6px', borderRadius: 4,
                                  border: 'none', background: 'transparent',
                                  color: 'var(--accent)', fontSize: 10, cursor: 'pointer',
                                }}
                              >
                                <Plus size={10} /> Insert before
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeColumn(col.id) }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  width: '100%', padding: '4px 6px', borderRadius: 4,
                                  border: 'none', background: 'transparent',
                                  color: '#bf616a', fontSize: 10, cursor: 'pointer',
                                }}
                              >
                                <X size={10} /> Delete column
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
                {/* Row actions column */}
                <th style={{
                  width: 24,
                  padding: 0,
                  background: 'var(--bg-elevated)',
                  borderBottom: '2px solid var(--bg-border)',
                }} />
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    style={{
                      padding: 16, textAlign: 'center',
                      color: 'var(--text-muted)', fontSize: 10,
                      fontStyle: 'italic',
                    }}
                  >
                    {rows.length === 0
                      ? 'No rows yet — click + to add'
                      : 'No rows match the current filters'
                    }
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--bg-border)',
                      transition: 'background 0.1s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map(col => {
                      const cellKey = `${row.id}-${col.id}`
                      const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id
                      const cellValue = row.cells[col.id] || ''

                      return (
                        <td
                          key={col.id}
                          style={{
                            padding: '3px 6px',
                            borderRight: '1px solid var(--bg-border)',
                            cursor: 'text',
                            minHeight: 22,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isEditing) startEdit(row.id, col.id, cellValue)
                          }}
                        >
                          {isEditing ? (
                            col.type === 'select' ? (
                              <select
                                className="field-input"
                                style={{ width: '100%', height: 22, fontSize: 10, padding: '0 4px' }}
                                value={editValue}
                                onChange={e => { setEditValue(e.target.value) }}
                                onBlur={commitEdit}
                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                onClick={e => e.stopPropagation()}
                                autoFocus
                              >
                                <option value="">—</option>
                                {(col.options || ['Active', 'Inactive', 'Pending']).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : col.type === 'date' ? (
                              <input
                                type="date"
                                className="field-input"
                                style={{ width: '100%', height: 22, fontSize: 10, padding: '0 4px' }}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                onClick={e => e.stopPropagation()}
                                autoFocus
                              />
                            ) : col.type === 'number' ? (
                              <input
                                type="number"
                                className="field-input"
                                style={{ width: '100%', height: 22, fontSize: 10, padding: '0 4px' }}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                onClick={e => e.stopPropagation()}
                                autoFocus
                              />
                            ) : (
                              <input
                                className="field-input"
                                style={{ width: '100%', height: 22, fontSize: 10, padding: '0 4px' }}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                                onClick={e => e.stopPropagation()}
                                autoFocus
                              />
                            )
                          ) : (
                            <div style={{
                              minHeight: 18,
                              display: 'flex', alignItems: 'center',
                              color: cellValue ? 'var(--text-primary)' : 'var(--text-muted)',
                              fontSize: 10,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {col.type === 'number' && cellValue
                                ? <NumberDisplay value={cellValue} />
                                : col.type === 'date' && cellValue
                                ? <DateDisplay value={cellValue} />
                                : cellValue || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Empty</span>
                              }
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td style={{ padding: '2px 2px', width: 24 }}>
                      <button
                        className="icon-btn"
                        style={{ width: 18, height: 18, borderRadius: 3, opacity: 0.4 }}
                        onClick={(e) => { e.stopPropagation(); removeRow(row.id) }}
                        title="Delete row"
                      >
                        <X size={7} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── References ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0,
          borderTop: '1px solid var(--bg-border)', paddingTop: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <LinkIcon size={9} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              References
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 48, overflowY: 'auto' }}>
            {references.map(ref => (
              <div key={ref.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  flex: 1, fontSize: 9, color: 'var(--accent)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {ref.label}
                </span>
                <button
                  className="icon-btn"
                  style={{ width: 14, height: 14, borderRadius: 3 }}
                  onClick={() => {
                    updateNodeData(id, {
                      references: references.filter(r => r.id !== ref.id)
                    })
                  }}
                >
                  <X size={6} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </BaseNode>
  )
}

// ── Small sub-components ────────────────────────────────────────────
const NumberDisplay = ({ value }) => {
  const num = parseFloat(value)
  if (isNaN(num)) return <>{value}</>
  // Format with 2 decimal places if needed
  const formatted = num % 1 === 0 ? num.toString() : num.toFixed(2)
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
      {formatted}
    </span>
  )
}

const DateDisplay = ({ value }) => {
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return <>{value}</>
    return <>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
  } catch {
    return <>{value}</>
  }
}

export default React.memo(DataTableNode)
