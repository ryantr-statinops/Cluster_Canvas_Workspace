import React, { useCallback } from 'react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const NotesNode = ({ id, data, style, selected }) => {
  const { updateNodeData } = useWorkspaceStore()

  const handleChange = useCallback((e) => {
    updateNodeData(id, { content: e.target.value })
  }, [id, updateNodeData])

  return (
    <BaseNode id={id} type="notes" data={data} style={style} selected={selected}>
      <textarea
        className="field-input"
        style={{
          height: '100%',
          resize: 'none',
          border: 'none',
          background: 'transparent',
          padding: 0,
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
        }}
        placeholder="Start writing..."
        value={data?.content || ''}
        onChange={handleChange}
        onClick={e => e.stopPropagation()}
      />
    </BaseNode>
  )
}

export default React.memo(NotesNode)
