import { create } from 'zustand'

const themes = {
  'nordic-dark': {
    id: 'nordic-dark',
    name: 'Nordic Dark',
    swatches: ['#3b4252', '#4c566a', '#5e81ac', '#88c0d0'],
    accent: '#88c0d0',
    css: {
      '--bg-canvas':    '#1e222a',
      '--bg-surface':   '#2e3440',
      '--bg-elevated':  '#3b4252',
      '--bg-border':    '#434c5e',
      '--text-primary': '#eceff4',
      '--text-secondary':'#d8dee9',
      '--text-muted':   '#4c566a',
      '--accent':       '#88c0d0',
      '--accent-glow':  'rgba(136,192,208,0.25)',
      '--accent-secondary': '#81a1c1',
    },
  },
  'light-minimal': {
    id: 'light-minimal',
    name: 'Light Minimal',
    swatches: ['#f8f9fa', '#e9ecef', '#dee2e6', '#4361ee'],
    accent: '#4361ee',
    css: {
      '--bg-canvas':    '#f0f2f5',
      '--bg-surface':   '#ffffff',
      '--bg-elevated':  '#f8f9fa',
      '--bg-border':    '#dee2e6',
      '--text-primary': '#212529',
      '--text-secondary':'#495057',
      '--text-muted':   '#adb5bd',
      '--accent':       '#4361ee',
      '--accent-glow':  'rgba(67,97,238,0.2)',
      '--accent-secondary': '#7209b7',
    },
  },
  'midnight-blue': {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    swatches: ['#0a0e27', '#13193b', '#1e2a5e', '#4361ee'],
    accent: '#4361ee',
    css: {
      '--bg-canvas':    '#060914',
      '--bg-surface':   '#0a0e27',
      '--bg-elevated':  '#13193b',
      '--bg-border':    '#1e2a5e',
      '--text-primary': '#e2e8f0',
      '--text-secondary':'#94a3b8',
      '--text-muted':   '#334155',
      '--accent':       '#4361ee',
      '--accent-glow':  'rgba(67,97,238,0.3)',
      '--accent-secondary': '#7c3aed',
    },
  },
  'warm-beige': {
    id: 'warm-beige',
    name: 'Warm Beige',
    swatches: ['#f5f0e8', '#e8d9c0', '#c4a882', '#e76f51'],
    accent: '#e76f51',
    css: {
      '--bg-canvas':    '#ede8df',
      '--bg-surface':   '#f5f0e8',
      '--bg-elevated':  '#faf7f2',
      '--bg-border':    '#d4c4a8',
      '--text-primary': '#3d2b1f',
      '--text-secondary':'#6b4c3b',
      '--text-muted':   '#a08060',
      '--accent':       '#e76f51',
      '--accent-glow':  'rgba(231,111,81,0.2)',
      '--accent-secondary': '#f4a261',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    swatches: ['#000000', '#1a1a1a', '#333333', '#f9c74f'],
    accent: '#f9c74f',
    css: {
      '--bg-canvas':    '#000000',
      '--bg-surface':   '#111111',
      '--bg-elevated':  '#1a1a1a',
      '--bg-border':    '#333333',
      '--text-primary': '#ffffff',
      '--text-secondary':'#cccccc',
      '--text-muted':   '#666666',
      '--accent':       '#f9c74f',
      '--accent-glow':  'rgba(249,199,79,0.3)',
      '--accent-secondary': '#90e0ef',
    },
  },
}

const applyTheme = (themeId) => {
  const theme = themes[themeId]
  if (!theme) return
  const root = document.documentElement
  Object.entries(theme.css).forEach(([key, val]) => {
    root.style.setProperty(key, val)
  })
}

const useThemeStore = create((set) => ({
  activeTheme: 'nordic-dark',
  themes,

  setTheme: (themeId) => {
    applyTheme(themeId)
    set({ activeTheme: themeId })
  },

  init: () => {
    applyTheme('nordic-dark')
  },
}))

export default useThemeStore
