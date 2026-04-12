import React, { useEffect, useState } from 'react'
import BaseNode from '../canvas/BaseNode'

const ClockNode = ({ id, data, style, selected }) => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const ss = String(time.getSeconds()).padStart(2, '0')

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month:   'short',
    day:     'numeric',
  })

  return (
    <BaseNode id={id} type="clock" data={data} style={style} selected={selected}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 4,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 36,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}>
          <span>{hh}</span>
          <span style={{ color: 'var(--accent)', margin: '0 2px' }}>:</span>
          <span>{mm}</span>
          <span style={{ fontSize: 22, color: 'var(--text-muted)', marginLeft: 4 }}>
            :{ss}
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {dateStr}
        </p>
      </div>
    </BaseNode>
  )
}

export default React.memo(ClockNode)
