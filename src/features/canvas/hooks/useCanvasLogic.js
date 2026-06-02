import { useCallback } from 'react'
import useWorkspaceStore from '../../../store/useWorkspaceStore'
import { createBaseNode } from '../../registry/nodeSchema'
import { getDefaultData } from '../../registry/nodeRegistry'

/**
 * createNode now uses the Unified Schema + Registry.
 * Accepts (type, position, extraData) and delegates to store.addNode.
 */
export const useCanvasLogic = () => {
  const { addNode } = useWorkspaceStore()

  const createNode = useCallback((type, position = { x: 100, y: 100 }, data = {}) => {
    const defaultData = getDefaultData(type)
    addNode(type, { ...defaultData, ...data })
  }, [addNode])

  return {
    createNode,
  }
}
