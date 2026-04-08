/**
 * Utility helpers for Cluster Canvas
 */

/**
 * Format date for display
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Generate a unique ID
 */
export const generateId = (prefix = 'node') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Simple animation delay helper
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
