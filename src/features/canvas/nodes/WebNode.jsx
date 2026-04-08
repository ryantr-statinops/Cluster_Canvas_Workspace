import React, { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Globe, ExternalLink } from 'lucide-react'

const WebNode = ({ data, selected }) => {
  return (
    <div className={`node-base min-w-[300px] overflow-hidden ${selected ? 'ring-2 ring-accent-purple shadow-2xl' : ''}`}>
      <div className="bg-nord-2 px-3 py-2 flex items-center justify-between border-b border-nord-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-accent-purple" />
          <span className="text-xs font-bold text-nord-5 uppercase tracking-wider">Web Resource</span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-nord-3" />
      </div>

      <div className="p-4 space-y-3">
        <div className="h-32 bg-nord-0 rounded-md overflow-hidden relative group">
          <img 
            src={data.preview || 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=400'} 
            alt="Preview" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-nord-0 to-transparent">
            <h3 className="text-sm font-semibold text-nord-6 truncate">{data.title || 'Untitled Resource'}</h3>
            <p className="text-[10px] text-nord-4 truncate">{data.url || 'https://example.com'}</p>
          </div>
        </div>

        <button className="w-full py-2 bg-nord-2 hover:bg-nord-3 text-nord-6 text-xs font-medium rounded-md transition-all">
          Open in Browser
        </button>
      </div>

      <Handle type="target" position={Position.Left} className="!bg-accent-purple" />
      <Handle type="source" position={Position.Right} className="!bg-accent-purple" />
    </div>
  )
}

export default memo(WebNode)
