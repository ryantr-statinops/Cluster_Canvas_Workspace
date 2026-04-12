import React, { useState } from 'react'
import { Globe, ExternalLink } from 'lucide-react'
import BaseNode from '../canvas/BaseNode'
import useWorkspaceStore from '../../store/useWorkspaceStore'

const WebsiteNode = ({ id, data, style, selected }) => {
  const { updateNodeData } = useWorkspaceStore()
  const [urlInput, setUrlInput] = useState(data?.url || '')
  const [submitted, setSubmitted] = useState(!!data?.url)

  const handleSubmit = (e) => {
    e.preventDefault()
    let url = urlInput
    if (url && !url.startsWith('http')) url = 'https://' + url
    updateNodeData(id, { url })
    setSubmitted(true)
  }

  return (
    <BaseNode id={id} type="website" data={data} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
        {/* URL bar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 6 }}
          onClick={e => e.stopPropagation()}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderRadius: 8,
            padding: '0 8px',
            height: 28,
          }}>
            <Globe size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <input
              className="field-input"
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                fontSize: 11,
                height: '100%',
              }}
              placeholder="https://..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
            />
          </div>
          <a
            href={data?.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="icon-btn"
              style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}
            >
              <ExternalLink size={11} />
            </button>
          </a>
        </form>

        {/* Preview area */}
        <div style={{
          flex: 1,
          borderRadius: 8,
          border: '1px solid var(--bg-border)',
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          {data?.url ? (
            <>
              <Globe size={32} style={{ color: 'var(--bg-border)' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Website Preview
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {data.url}
              </p>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 10,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--accent)',
                }}
              >
                Open in browser →
              </a>
            </>
          ) : (
            <>
              <Globe size={32} style={{ color: 'var(--bg-border)' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Enter a URL above
              </p>
            </>
          )}
        </div>
      </div>
    </BaseNode>
  )
}

export default React.memo(WebsiteNode)
