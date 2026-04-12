import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BaseNode from '../canvas/BaseNode'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const CalendarNode = ({ id, data, style, selected }) => {
  const now = new Date()
  const [viewDate, setViewDate] = useState(new Date(2026, 3, 1)) // April 2026

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = now.getDate()
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  // Build grid cells
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <BaseNode id={id} type="calendar" data={{ ...data, title: `${MONTHS[month]} ${year}` }} style={style} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="icon-btn" style={{ width: 24, height: 24, borderRadius: 6 }} onClick={prevMonth}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {MONTHS[month]} {year}
          </span>
          <button className="icon-btn" style={{ width: 24, height: 24, borderRadius: 6 }} onClick={nextMonth}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{
              textAlign: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: 'var(--text-muted)',
              padding: '2px 0',
              letterSpacing: '0.04em',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            const isToday = isCurrentMonth && day === today
            const isSat = (i % 7) === 6
            const isSun = (i % 7) === 0
            return (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  padding: '4px 2px',
                  borderRadius: 6,
                  background: isToday ? 'var(--accent)' : 'transparent',
                  color: isToday
                    ? '#1e222a'
                    : day === null
                    ? 'transparent'
                    : isSun || isSat
                    ? 'var(--accent-secondary)'
                    : 'var(--text-secondary)',
                  fontWeight: isToday ? 700 : 400,
                  cursor: day ? 'pointer' : 'default',
                  transition: 'background 0.1s',
                }}
              >
                {day || ''}
              </div>
            )
          })}
        </div>
      </div>
    </BaseNode>
  )
}

export default React.memo(CalendarNode)
