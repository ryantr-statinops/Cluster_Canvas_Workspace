/**
 * Workspace Export / Import
 *
 * Export: serializes current workspace + all workspaces to a downloadable JSON file.
 * Import: reads a JSON file from disk, validates, and restores the workspace.
 */

import { serializeWorkspace, validateImportedWorkspace } from './history'

/**
 * Export the current workspace as a downloadable JSON file.
 */
export function exportWorkspace(getState, filename) {
  const state = getState()
  const json  = serializeWorkspace(state)
  const blob  = new Blob([json], { type: 'application/json' })
  const url   = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href     = url
  a.download = filename || `cluster-canvas-export-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import a workspace from a JSON file.
 * Opens a native file picker dialog.
 * Returns a promise that resolves with the imported data or rejects with an error.
 */
export function importWorkspace() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type  = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        const validation = validateImportedWorkspace(data)
        if (!validation.valid) {
          reject(new Error(`Validation failed:\n${validation.errors.join('\n')}`))
          return
        }

        resolve(data.workspace)
      } catch (err) {
        if (err instanceof SyntaxError) {
          reject(new Error('Invalid JSON file'))
        } else {
          reject(err)
        }
      }
    }

    input.onerror = () => reject(new Error('File read failed'))
    input.click()
  })
}

/**
 * Download a snapshot as a recovery file.
 */

