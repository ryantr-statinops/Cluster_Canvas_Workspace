# Cluster Canvas Workspace 🌌

An infinite canvas workspace built for high-performance terminal operations, data visualization, and AI integration.

## 🚀 Features

- **Infinite Canvas**: Powered by React Flow for zero-latency pan and zoom.
- **Custom Nodes**:
  - `TerminalNode`: Interactive command simulation.
  - `ChartNode`: Professional data visualization.
  - `WebNode`: Integrated web resource previews.
- **Nordic Dark Mode**: A professional, minimalist aesthetic using the Nord color palette.
- **State Management**: Ultra-fast state handling with Zustand.
- **Responsive Design**: Designed for everything from 13" laptops to ultra-wide monitors.
- **Supabase Ready**: Integrated connection boilerplate for backend operations.

## 🛠️ Tech Stack

- **Framework**: [Vite](https://vitejs.dev/) + [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Canvas Engine**: [React Flow](https://reactflow.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**: [Supabase](https://supabase.com/)

## 📦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env` and fill in your Supabase credentials.
   ```bash
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
cluster-canvas-workspace/
├── public/                 # Static assets
├── src/
│   ├── api/                # Supabase configuration
│   ├── components/         # Shared UI & Layout
│   ├── features/           # Core canvas logic & nodes
│   ├── store/              # Global state (Zustand)
│   ├── utils/              # Helper functions
│   ├── App.jsx             
│   └── main.jsx            
├── tailwind.config.js      # Nordic Dark Mode configuration
└── package.json
```

## 📜 License

MIT
