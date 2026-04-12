import React, { useState, useCallback } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const TodoNode = ({ id, data, style, selected }) => {
  const { updateNodeData } = useWorkspaceStore()
  const tasks = data?.tasks || []
  const [newText, setNewText] = useState('')

  const toggleTask = useCallback((taskId) => {
    const updated = tasks.map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    )
    updateNodeData(id, { tasks: updated })
  }, [id, tasks, updateNodeData])

  const addTask = useCallback(() => {
    if (!newText.trim()) return
    const updated = [...tasks, { id: nanoid(), text: newText.trim(), done: false }]
    updateNodeData(id, { tasks: updated })
    setNewText('')
  }, [id, tasks, newText, updateNodeData])

  const removeTask = useCallback((taskId) => {
    updateNodeData(id, { tasks: tasks.filter(t => t.id !== taskId) })
  }, [id, tasks, updateNodeData])

  const done   = tasks.filter(t => t.done).length
  const total  = tasks.length

  return (
    <BaseNode id={id} type="todo" data={data} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
        {/* Progress bar */}
        {total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1,
              height: 3,
              background: 'var(--bg-elevated)',
              borderRadius: 99,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(done / total) * 100}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
              {done}/{total}
            </span>
          </div>
        )}

        {/* Task List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tasks.map(task => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 6px',
                borderRadius: 6,
                background: task.done ? 'rgba(163,190,140,0.06)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1.5px solid ${task.done ? 'var(--accent)' : 'var(--bg-border)'}`,
                  background: task.done ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {task.done && <Check size={9} color="#1e222a" strokeWidth={3} />}
              </button>

              <span style={{
                flex: 1,
                fontSize: 12,
                color: task.done ? 'var(--text-muted)' : 'var(--text-secondary)',
                textDecoration: task.done ? 'line-through' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {task.text}
              </span>

              <button
                onClick={() => removeTask(task.id)}
                style={{
                  opacity: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 0,
                }}
                className="task-delete-btn"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Add task input */}
        <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid var(--bg-border)' }}>
          <input
            className="field-input"
            style={{ fontSize: 11, height: 28, padding: '0 8px' }}
            placeholder="Add task..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            onClick={e => e.stopPropagation()}
          />
          <button
            className="icon-btn"
            style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}
            onClick={addTask}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <style>{`.task-delete-btn { opacity: 0; }
        div:hover > .task-delete-btn { opacity: 1; }`}</style>
    </BaseNode>
  )
}

export default React.memo(TodoNode)
