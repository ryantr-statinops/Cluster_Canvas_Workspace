import React, { useState, useCallback, useRef } from 'react'
import {
  Bold, Italic, Code, Link, List, Quote,
  Heading2, Heading3, Copy, Check, ExternalLink,
  Plus, X, Link as LinkIcon, Sparkles, Loader, Bot,
} from 'lucide-react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'
import { nanoid } from 'nanoid'
import { summarize, smartSummarize, aiComplete, hasApiKey } from '../../utils/ai'

// ── Toolbar actions: insert markdown syntax at cursor ─────────────────
const TOOLBAR_ACTIONS = [
  { icon: Bold,      label: 'Bold',      wrap: ['**', '**'],     defaultText: 'bold' },
  { icon: Italic,    label: 'Italic',    wrap: ['*', '*'],       defaultText: 'italic' },
  { icon: Code,      label: 'Code',      wrap: ['`', '`'],       defaultText: 'code' },
  { icon: Link,      label: 'Link',      wrap: ['[', '](url)'],  defaultText: 'text' },
  { icon: List,      label: 'List',      prefix: '- ' },
  { icon: Quote,     label: 'Quote',     prefix: '> ' },
  { icon: Heading2,  label: 'H2',        prefix: '## ' },
  { icon: Heading3,  label: 'H3',        prefix: '### ' },
]

const ContextNode = ({ id, data, style, selected }) => {
  const { updateNodeData } = useWorkspaceStore()
  const textareaRef = useRef(null)
  const [copiedBlock, setCopiedBlock] = useState(null)
  const [refInput, setRefInput] = useState('')

  const content    = data?.content || ''
  const references = data?.references || []

  // ── AI Actions ───────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(null) // 'summarize' | 'complete' | null
  const [aiPromptOpen, setAiPromptOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  const handleSummarize = useCallback(async () => {
    setAiLoading('summarize')
    try {
      const summary = await smartSummarize(content)
      // Replace previous AI summary if exists, otherwise append
      const summaryBlock = `> **AI Summary:** ${summary}`
      const prevMatch = content.match(/\n?> \*\*AI Summary:\*\*[\s\S]*?(?=\n\n|$)/)
      if (prevMatch) {
        updateNodeData(id, { content: content.replace(prevMatch[0], summaryBlock) })
      } else {
        updateNodeData(id, { content: `${content}\n\n${summaryBlock}` })
      }
    } catch (err) {
      const fallback = summarize(content, 3).join(' ')
      if (fallback) {
        const summaryBlock = `> **Summary:** ${fallback}`
        const prevMatch = content.match(/\n?> \*\*Summary:\*\*[\s\S]*?(?=\n\n|$)/)
        if (prevMatch) {
          updateNodeData(id, { content: content.replace(prevMatch[0], summaryBlock) })
        } else {
          updateNodeData(id, { content: `${content}\n\n${summaryBlock}` })
        }
      }
    }
    setAiLoading(null)
  }, [id, content, updateNodeData])

  const handleComplete = useCallback(async () => {
    if (!aiPrompt.trim()) return
    setAiLoading('complete')
    setAiPromptOpen(false)
    try {
      const systemMsg = 'You are a helpful writing assistant. Continue the following text naturally and coherently.'
      const userMsg = `Continue writing the following text:\n\n${content}\n\n---\nContinue with: ${aiPrompt}`
      const completion = await aiComplete(systemMsg, userMsg)
      updateNodeData(id, { content: `${content}\n\n${completion}` })
    } catch (err) {
      // Fallback: just append the prompt
      updateNodeData(id, { content: `${content}\n\n${aiPrompt}` })
    }
    setAiPrompt('')
    setAiLoading(null)
  }, [id, content, aiPrompt, updateNodeData])

  // ── Content update ──────────────────────────────────────────────────
  const handleContentChange = useCallback((e) => {
    updateNodeData(id, { content: e.target.value })
  }, [id, updateNodeData])

  // ── Toolbar insert ──────────────────────────────────────────────────
  const insertMarkdown = useCallback((action) => {
    const ta = textareaRef.current
    if (!ta) return

    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selectedText = content.substring(start, end) || action.defaultText || ''

    let newText, cursorPos

    if (action.wrap) {
      const [open, close] = action.wrap
      newText = content.substring(0, start) + open + selectedText + close + content.substring(end)
      cursorPos = start + open.length + selectedText.length + close.length
    } else if (action.prefix) {
      // Insert at start of current line
      const lineStart = content.lastIndexOf('\n', start - 1) + 1
      newText = content.substring(0, lineStart) + action.prefix + content.substring(lineStart)
      cursorPos = lineStart + action.prefix.length + (selectedText.length || 0)
    }

    if (newText !== undefined) {
      updateNodeData(id, { content: newText })
      // Restore cursor after React re-render
      setTimeout(() => {
        ta.focus()
        ta.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    }
  }, [id, content, updateNodeData])

  // ── Code block copy ─────────────────────────────────────────────────
  const copyCodeBlock = useCallback((code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlock(code.slice(0, 20))
      setTimeout(() => setCopiedBlock(null), 1500)
    })
  }, [])

  // ── References ──────────────────────────────────────────────────────
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

  // ── Code block extraction ───────────────────────────────────────────
  // Simple detection of ```code``` blocks in content
  const parts = content.split(/(```[\s\S]*?```)/g)

  const wordCount = content.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
  const charCount = content.length

  return (
    <BaseNode id={id} type="context" data={data} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, overflow: 'hidden' }}>

        {/* ── Formatting Toolbar ────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
          padding: '4px 0', borderBottom: '1px solid var(--bg-border)',
        }}>
          {TOOLBAR_ACTIONS.map((action, i) => {
            const Icon = action.icon
            return (
              <button
                key={i}
                className="icon-btn"
                onClick={(e) => { e.stopPropagation(); insertMarkdown(action) }}
                title={action.label}
                style={{ width: 24, height: 24, borderRadius: 4 }}
              >
                <Icon size={12} />
              </button>
            )
          })}
          {/* AI Summarize */}
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); handleSummarize() }}
            disabled={aiLoading === 'summarize' || !content.trim()}
            title="Summarize content"
            style={{ width: 24, height: 24, borderRadius: 4 }}
          >
            {aiLoading === 'summarize'
              ? <Loader size={11} className="animate-spin" />
              : <Sparkles size={11} style={{ color: hasApiKey() ? 'var(--accent)' : 'var(--text-muted)' }} />
            }
          </button>

          {/* AI Complete */}
          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); setAiPromptOpen(s => !s) }}
              disabled={aiLoading === 'complete' || !content.trim() || !hasApiKey()}
              title="AI Continue writing"
              style={{ width: 24, height: 24, borderRadius: 4 }}
            >
              {aiLoading === 'complete'
                ? <Loader size={11} className="animate-spin" />
                : <Bot size={11} style={{ color: hasApiKey() ? 'var(--accent)' : 'var(--text-muted)' }} />
              }
            </button>
            {aiPromptOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4,
                background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderRadius: 8, padding: 6, zIndex: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                display: 'flex', gap: 4, minWidth: 200,
              }}>
                <input
                  className="field-input"
                  style={{ flex: 1, height: 26, fontSize: 10, padding: '0 6px' }}
                  placeholder="e.g. explain the code above..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComplete() } }}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
                <button
                  className="icon-btn"
                  style={{ width: 26, height: 26, borderRadius: 5 }}
                  onClick={(e) => { e.stopPropagation(); handleComplete() }}
                  disabled={!aiPrompt.trim()}
                >
                  <Sparkles size={11} />
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {wordCount}w · {charCount}c
          </span>
        </div>

        {/* ── Content area ──────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Single editable textarea for raw markdown */}
          <textarea
            ref={textareaRef}
            className="field-input"
            style={{
              width: '100%', minHeight: 80, flex: 1,
              resize: 'none', border: 'none',
              background: 'transparent', padding: 0,
              fontSize: 12, lineHeight: 1.6,
              color: 'var(--text-secondary)',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
            placeholder="Write in markdown... Use ``` for code blocks"
            value={content}
            onChange={handleContentChange}
            onClick={e => e.stopPropagation()}
          />

          {/* Code block previews extracted from content */}
          {parts.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              {parts.filter(p => p.startsWith('```')).map((part, i) => {
                const firstLine = part.indexOf('\n')
                const lang = firstLine > 3 ? part.substring(3, firstLine).trim() : ''
                const code = part.substring(firstLine + 1, part.length - 3)
                const isCopied = copiedBlock && code.startsWith(copiedBlock)

                return (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 6,
                      border: '1px solid var(--bg-border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '3px 8px',
                      background: 'var(--bg-surface)',
                      borderBottom: '1px solid var(--bg-border)',
                    }}>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {lang || 'code'}
                      </span>
                      <button
                        className="icon-btn"
                        onClick={(e) => { e.stopPropagation(); copyCodeBlock(code) }}
                        style={{ width: 18, height: 18, borderRadius: 3 }}
                        title="Copy code"
                      >
                        {isCopied ? <Check size={8} color="var(--accent)" /> : <Copy size={8} />}
                      </button>
                    </div>
                    <pre style={{
                      margin: 0, padding: '6px 8px',
                      fontSize: 10, lineHeight: 1.5,
                      color: 'var(--text-secondary)',
                      overflowX: 'auto',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}>
                      {code}
                    </pre>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── References ────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid var(--bg-border)',
          paddingTop: 6,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{
            fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            References {references.length > 0 && `(${references.length})`}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 54, overflowY: 'auto' }}>
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
              placeholder="+ Add reference URL..."
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

export default React.memo(ContextNode)
