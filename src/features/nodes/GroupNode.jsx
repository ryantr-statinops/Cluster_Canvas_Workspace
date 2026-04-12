import React from 'react'
import { Layers } from 'lucide-react'
import BaseNode from '../canvas/BaseNode'

/**
 * GroupNode — container for grouping other nodes.
 * In FLEX mode this renders as a styled frame (React Flow parentId).
 * Child nodes are nested via React Flow's parentNode prop.
 */
const GroupNode = ({ id, data, style, selected }) => {
  return (
    <BaseNode id={id} type="group" data={data} style={style} selected={selected}>
      <div style={{
        height: '100%',
        border: '1.5px dashed var(--bg-border)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 6,
        opacity: 0.6,
      }}>
        <Layers size={20} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Drag nodes here to group
        </span>
      </div>
    </BaseNode>
  )
}

export default React.memo(GroupNode)
