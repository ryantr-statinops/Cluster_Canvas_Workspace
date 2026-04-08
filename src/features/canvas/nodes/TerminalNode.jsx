import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Terminal } from 'lucide-react'

const TerminalNode = ({ data, selected }) => {
  return (
    <div className={`node-base min-w-[280px] overflow-hidden ${selected ? 'ring-2 ring-accent-frost shadow-2xl' : ''}`}>
      <div className="bg-nord-2 px-3 py-2 flex items-center justify-between border-b border-nord-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent-frost" />
          <span className="text-xs font-bold text-nord-5 uppercase tracking-wider">Terminal</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-nord-11/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-nord-13/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-nord-14/50" />
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="font-mono text-sm space-y-1">
          <div className="text-accent-teal flex gap-2">
            <span>$</span>
            <span className="text-nord-4">{data.label || 'System initialized...'}</span>
          </div>
          <div className="text-nord-3 text-xs leading-relaxed">
            {data.output || 'Waiting for input command...'}
          </div>
        </div>
        
        {data.status && (
          <div className="flex items-center gap-2 px-2 py-1 bg-nord-0/50 rounded-md border border-nord-2/30">
            <div className={`w-2 h-2 rounded-full animate-pulse ${data.status === 'success' ? 'bg-nord-14' : 'bg-nord-13'}`} />
            <span className="text-[10px] font-mono text-nord-3 uppercase">{data.status}</span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="!bg-accent-frost" />
      <Handle type="source" position={Position.Bottom} className="!bg-accent-frost" />
    </div>
  )
}

export default memo(TerminalNode)
