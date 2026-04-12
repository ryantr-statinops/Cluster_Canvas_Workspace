import React, { useRef, useState, useEffect, useCallback } from 'react'
import BaseNode from '../canvas/BaseNode'
import { Eraser, Trash2, Minus, Plus } from 'lucide-react'

const COLORS = [
  { hex: '#60a5fa', name: 'Blue' },
  { hex: '#f87171', name: 'Red' },
  { hex: '#4ade80', name: 'Green' },
  { hex: '#facc15', name: 'Yellow' },
  { hex: '#e2e8f0', name: 'White' },
  { hex: '#c084fc', name: 'Purple' },
]

const DrawNode = ({ id, type, selected, data, style }) => {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)
  const lastPos = useRef(null)
  const [ctx, setCtx] = useState(null)
  const [color, setColor] = useState('#60a5fa')
  const [lineWidth, setLineWidth] = useState(3)
  const [tool, setTool] = useState('pen') // 'pen' | 'eraser'

  // Initialize canvas + ResizeObserver so canvas always matches DOM size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const initContext = (canvas) => {
      const context = canvas.getContext('2d')
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = color
      context.lineWidth = lineWidth
      context.globalCompositeOperation = 'source-over'
      setCtx(context)
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      if (!w || !h) return
      // Save drawing before resize
      const prevCtx = canvas.getContext('2d')
      const imageData = w > 0 && h > 0 ? prevCtx.getImageData(0, 0, canvas.width, canvas.height) : null
      canvas.width = w * dpr
      canvas.height = h * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      if (imageData) {
        try { ctx.putImageData(imageData, 0, 0) } catch(_) {}
      }
      setCtx(ctx)
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // Update ctx settings when tool/color/lineWidth changes
  useEffect(() => {
    if (!ctx) return
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = lineWidth * 5
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
    }
  }, [ctx, color, lineWidth, tool])

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left),
        y: (e.touches[0].clientY - rect.top),
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = useCallback((e) => {
    e.stopPropagation()
    isDrawing.current = true
    const canvas = canvasRef.current
    if (!canvas || !ctx) return
    const pos = getPos(e, canvas)
    lastPos.current = pos
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }, [ctx])

  const draw = useCallback((e) => {
    if (!isDrawing.current || !ctx) return
    e.stopPropagation()
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }, [ctx])

  const stopDrawing = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
    if (ctx) {
      ctx.beginPath()
    }
  }, [ctx])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [ctx])

  const changeColor = (newColor) => {
    setColor(newColor)
    setTool('pen')
  }

  return (
    <BaseNode
      id={id}
      type={type || 'draw'}
      style={style}
      selected={selected}
      data={data}
      noPadding
      headerControls={
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }} className="nodrag">
          {/* Color Swatches */}
          {COLORS.map(c => (
            <button
              key={c.hex}
              onClick={(e) => { e.stopPropagation(); changeColor(c.hex) }}
              title={c.name}
              style={{
                width: 11, height: 11, borderRadius: '50%', background: c.hex,
                border: color === c.hex && tool === 'pen' ? '2px solid white' : '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', padding: 0, flexShrink: 0,
                transition: 'transform 0.1s',
                transform: color === c.hex && tool === 'pen' ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}

          <div style={{ width: 1, height: 12, background: 'var(--bg-border)', margin: '0 2px' }} />

          {/* Eraser */}
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); setTool(t => t === 'eraser' ? 'pen' : 'eraser') }}
            title="Eraser"
            style={{
              width: 18, height: 18, borderRadius: 4,
              background: tool === 'eraser' ? 'var(--accent)' : 'transparent',
              color: tool === 'eraser' ? '#000' : 'var(--text-muted)',
              padding: 0,
            }}
          >
            <Eraser size={10} />
          </button>

          {/* Line Width */}
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); setLineWidth(w => Math.max(1, w - 1)) }}
            style={{ width: 16, height: 16, borderRadius: 4, padding: 0 }}
            title="Decrease size"
          >
            <Minus size={9} />
          </button>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', minWidth: 10, textAlign: 'center' }}>{lineWidth}</span>
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); setLineWidth(w => Math.min(20, w + 1)) }}
            style={{ width: 16, height: 16, borderRadius: 4, padding: 0 }}
            title="Increase size"
          >
            <Plus size={9} />
          </button>

          <div style={{ width: 1, height: 12, background: 'var(--bg-border)', margin: '0 2px' }} />

          {/* Clear */}
          <button
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); clearCanvas() }}
            title="Clear canvas"
            style={{ width: 18, height: 18, borderRadius: 4, color: 'var(--text-muted)', padding: 0 }}
          >
            <Trash2 size={10} />
          </button>
        </div>
      }
    >
      {/* Canvas Drawing Area */}
      <div
        className="nodrag nowheel"
        style={{ width: '100%', height: '100%', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        />
      </div>
    </BaseNode>
  )
}

export default DrawNode
