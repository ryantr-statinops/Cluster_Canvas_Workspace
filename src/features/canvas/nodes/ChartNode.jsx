import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { BarChart3, TrendingUp } from 'lucide-react'

const ChartNode = ({ data, selected }) => {
  return (
    <div className={`node-base min-w-[320px] ${selected ? 'ring-2 ring-accent-teal shadow-2xl' : ''}`}>
      <div className="bg-nord-2 px-3 py-2 flex items-center gap-2 border-b border-nord-3">
        <BarChart3 className="w-4 h-4 text-accent-teal" />
        <span className="text-xs font-bold text-nord-5 uppercase tracking-wider">Data Analytics</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-between items-end h-24 gap-1.5">
          {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-nord-3 rounded-t-sm relative group cursor-pointer overflow-hidden"
              style={{ height: `${h}%` }}
            >
              <div className="absolute inset-0 bg-accent-teal opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-nord-2 pt-3">
          <div className="space-y-0.5">
            <p className="text-[10px] text-nord-3 uppercase font-medium">Monthly Growth</p>
            <p className="text-lg font-bold text-nord-6 flex items-center gap-1.5">
              +24.8% <TrendingUp className="w-4 h-4 text-nord-14" />
            </p>
          </div>
          <button className="text-[10px] bg-nord-2 hover:bg-nord-3 px-2 py-1 rounded text-nord-4 transition-colors">
            View Details
          </button>
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-accent-teal" />
      <Handle type="source" position={Position.Right} className="!bg-accent-teal" />
    </div>
  )
}

export default memo(ChartNode)
