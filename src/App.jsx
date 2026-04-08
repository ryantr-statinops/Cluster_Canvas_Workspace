import React, { useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import CanvasContainer from './features/canvas/CanvasContainer'
import useWorkspaceStore from './store/useWorkspaceStore'

function App() {
  const { setNodes } = useWorkspaceStore()

  useEffect(() => {
    // Initial nodes for demonstration
    setNodes([
      {
        id: 'terminal-1',
        type: 'terminal',
        position: { x: 250, y: 150 },
        data: { 
          label: 'npm run dev', 
          output: 'Vite v5.2.0 ready in 150ms',
          status: 'success'
        },
      },
      {
        id: 'chart-1',
        type: 'chart',
        position: { x: 600, y: 200 },
        data: { label: 'Performance Metrics' },
      },
      {
        id: 'web-1',
        type: 'web',
        position: { x: 250, y: 450 },
        data: { 
          title: 'Nordic Palette Ref', 
          url: 'https://www.nordtheme.com',
          preview: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400'
        },
      },
    ])
  }, [setNodes])

  return (
    <div className="w-full h-screen">
      <Navbar />
      <main className="w-full h-full pt-16">
        <CanvasContainer />
      </main>
      
      {/* Toast Overlay Example */}
      <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
        <div className="bg-nord-14/10 border border-nord-14/30 px-4 py-2 rounded-lg backdrop-blur-md">
          <p className="text-[10px] font-bold text-nord-14 uppercase tracking-widest">Workspace Online</p>
        </div>
      </div>
    </div>
  )
}

export default App
