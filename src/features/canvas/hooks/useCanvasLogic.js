import { useCallback } from 'react'
import useWorkspaceStore from '../../../store/useWorkspaceStore'

export const useCanvasLogic = () => {
  const { addNode } = useWorkspaceStore()

  const createNode = useCallback((type, position = { x: 100, y: 100 }, data = {}) => {
    const id = `${type}-${Date.now()}`
    const newNode = {
      id,
      type,
      position,
      data: { 
        label: `New ${type}`,
        ...data 
      },
    }
    addNode(newNode)
    return newNode
  }, [addNode])

  return {
    createNode,
  }
}
