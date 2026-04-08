import React, { useCallback, useMemo } from 'react'
import ReactFlow, { 
  Controls, 
  Background, 
  BackgroundVariant,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'

import useWorkspaceStore from '../../store/useWorkspaceStore'
import TerminalNode from './nodes/TerminalNode'
import ChartNode from './nodes/ChartNode'
import WebNode from './nodes/WebNode'

const nodeTypes = {
  terminal: TerminalNode,
  chart: ChartNode,
  web: WebNode,
}

const CanvasContainer = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkspaceStore()

  const defaultEdgeOptions = useMemo(() => ({
    animated: true,
    style: { stroke: '#88c0d0' },
  }), [])

  return (
    <div className="canvas-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Background 
          color="#4c566a" 
          gap={20} 
          variant={BackgroundVariant.Dots} 
        />
        <Controls />
        <Panel position="bottom-right" className="bg-nord-1 p-3 rounded-xl border border-nord-2 shadow-2xl">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] text-nord-3 uppercase font-bold tracking-tighter">Stats</p>
            <p className="text-xs text-nord-5 font-mono">{nodes.length} Nodes • {edges.length} Connections</p>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default CanvasContainer
