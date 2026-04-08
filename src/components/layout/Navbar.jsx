import React from 'react'
import { Layout, Search, Settings, Share2, Plus } from 'lucide-react'

const Navbar = () => {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl h-16 glass-panel rounded-2xl flex items-center justify-between px-6 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent-frost rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(136,192,208,0.4)]">
          <Layout className="text-nord-0 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-nord-6 leading-none">Cluster Canvas</h1>
          <p className="text-[10px] text-nord-3 font-medium uppercase tracking-widest mt-1">Workspace v1.0</p>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nord-3 group-focus-within:text-accent-frost transition-colors" />
          <input 
            type="text" 
            placeholder="Search nodes or commands..." 
            className="w-full h-10 bg-nord-0/50 border border-nord-2/50 rounded-xl pl-10 pr-4 text-sm text-nord-4 placeholder:text-nord-3 focus:outline-none focus:border-accent-frost/50 focus:bg-nord-0/80 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="h-10 px-4 bg-nord-2 hover:bg-nord-3 text-nord-6 text-sm font-medium rounded-xl transition-all flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
        
        <button className="h-10 px-4 bg-accent-frost hover:bg-accent-teal text-nord-0 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-accent-frost/20">
          <Plus className="w-4 h-4" />
          <span>New Node</span>
        </button>

        <div className="w-[1px] h-6 bg-nord-2 mx-1" />

        <button className="w-10 h-10 flex items-center justify-center text-nord-3 hover:text-nord-6 hover:bg-nord-2 rounded-xl transition-all">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}

export default Navbar
