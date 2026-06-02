import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow'
import { X } from 'lucide-react'

// ── Edge type styles ──────────────────────────────────────────────────
export const EDGE_TYPES = [
  { value: 'default',     label: 'Default',     color: '#60a5fa', dash: 'none',      width: 2 },
  { value: 'dependency',  label: 'Dependency',  color: '#f87171', dash: 'none',      width: 2.5 },
  { value: 'reference',   label: 'Reference',   color: '#4ade80', dash: '5 3',       width: 1.5 },
  { value: 'workflow',    label: 'Workflow',    color: '#c084fc', dash: 'none',      width: 2.5 },
  { value: 'related',     label: 'Related',     color: '#facc15', dash: '3 3',       width: 1.5 },
]

/**
 * StyledEdge — custom React Flow edge with:
 * - Type-based color and dash styling
 * - Editable label
 * - Delete button on hover
 */
const StyledEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

  const edgeType = data?.type || 'default'
  const typeConfig = EDGE_TYPES.find(t => t.value === edgeType) || EDGE_TYPES[0]
  const label = data?.label || ''
  const showHeader = data?.showHeader !== false

  return (
    <>
      {/* Edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: typeConfig.color,
          strokeWidth: selected ? typeConfig.width + 1 : typeConfig.width,
          strokeDasharray: typeConfig.dash !== 'none' ? typeConfig.dash : undefined,
          opacity: selected ? 1 : 0.7,
          transition: 'opacity 0.15s',
          cursor: 'pointer',
        }}
      />

      {/* Edge glow when selected */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke={typeConfig.color}
          strokeWidth={typeConfig.width + 6}
          strokeLinecap="round"
          opacity={0.15}
        />
      )}

      {/* Label + actions */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: selected ? 'var(--bg-surface)' : 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
            border: selected ? `1.5px solid ${typeConfig.color}` : '1px solid var(--bg-border)',
            borderRadius: 8,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 600,
            color: selected ? typeConfig.color : 'var(--text-secondary)',
            backdropFilter: 'blur(4px)',
            boxShadow: selected ? `0 0 12px ${typeConfig.color}33` : undefined,
            transition: 'all 0.15s',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          className="nodrag nopan"
        >
          {/* Type dot */}
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: typeConfig.color, flexShrink: 0,
          }} />

          {/* Label text */}
          {label ? (
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {label}
            </span>
          ) : (
            <span style={{ opacity: 0.5, fontStyle: 'italic', fontWeight: 400 }}>
              {typeConfig.label}
            </span>
          )}

          {/* Delete button (visible on hover via parent) */}
          <div className="edge-delete-btn" style={{ display: 'none', marginLeft: 2 }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Delete edge handled via React Flow's onEdgesChange
                // Or we dispatch a custom event
                window.dispatchEvent(new CustomEvent('delete-edge', { detail: { edgeId: id } }))
              }}
              style={{
                width: 14, height: 14, borderRadius: 3,
                border: 'none', background: 'rgba(191,97,106,0.2)',
                color: '#bf616a', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Delete edge"
            >
              <X size={8} />
            </button>
          </div>

          {/* Edge type label (small) */}
          <span style={{
            fontSize: 7, color: 'var(--text-muted)',
            background: 'var(--bg-elevated)', padding: '0 4px', borderRadius: 3,
            marginLeft: 2,
          }}>
            {typeConfig.label}
          </span>
        </div>
      </EdgeLabelRenderer>

      {/* Hover style for delete button */}
      <style>{`
        .edge-delete-btn { display: none; }
        div:hover > .edge-delete-btn { display: flex !important; }
      `}</style>
    </>
  )
}

export default React.memo(StyledEdge)
