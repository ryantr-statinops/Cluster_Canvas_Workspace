/**
 * Search Engine — Full-text search across all node fields
 *
 * Searches: title, content (ContextNode), description (EntityNode),
 * tags (EntityNode), properties (EntityNode key/values), status, node type.
 *
 * Returns ranked results with match context for display.
 */

/**
 * Extract all searchable text from a node based on its type.
 */
export function extractSearchableText(node) {
  const data = node.data || {}
  const fields = []

  // Common fields
  if (data.title)        fields.push({ text: data.title,        weight: 10, field: 'title' })
  if (data.content)      fields.push({ text: data.content,      weight: 8,  field: 'content' })
  if (data.description)  fields.push({ text: data.description,  weight: 7,  field: 'description' })
  if (data.status)       fields.push({ text: data.status,       weight: 4,  field: 'status' })
  if (node.type)         fields.push({ text: node.type,         weight: 3,  field: 'type' })

  // Tags
  if (Array.isArray(data.tags)) {
    data.tags.forEach(tag => {
      fields.push({ text: tag, weight: 5, field: 'tag' })
    })
  }

  // Custom properties (EntityNode)
  if (Array.isArray(data.properties)) {
    data.properties.forEach(prop => {
      if (prop.key)   fields.push({ text: prop.key,   weight: 4, field: 'property_key' })
      if (prop.value) fields.push({ text: prop.value, weight: 4, field: 'property_value' })
    })
  }

  // References (EntityNode, ContextNode)
  if (Array.isArray(data.references)) {
    data.references.forEach(ref => {
      if (ref.label) fields.push({ text: ref.label, weight: 3, field: 'reference' })
      if (ref.url)   fields.push({ text: ref.url,   weight: 2, field: 'reference_url' })
    })
  }

  return fields
}

/**
 * Search rank result with match context.
 */
function rankResult(node, query, fields) {
  const q = query.toLowerCase()
  let score = 0
  const matches = []

  for (const field of fields) {
    const text = field.text?.toLowerCase() || ''
    if (!text) continue

    // Exact title match = highest score
    if (field.field === 'title' && text === q) {
      score += 50
      matches.push({ field: field.field, snippet: field.text })
      continue
    }

    // Title starts with query
    if (field.field === 'title' && text.startsWith(q)) {
      score += 30
      matches.push({ field: field.field, snippet: field.text })
      continue
    }

    // Contains match
    if (text.includes(q)) {
      score += field.weight
      const snippet = getSnippet(field.text, q, 60)
      matches.push({ field: field.field, snippet })
    }
  }

  return { score, matches }
}

/**
 * Generate a snippet around the first match of query in text.
 */
function getSnippet(text, query, maxLen = 60) {
  if (!text) return ''
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, maxLen)

  const start = Math.max(0, idx - Math.floor(maxLen / 3))
  const end   = Math.min(text.length, idx + query.length + Math.floor(maxLen / 2))

  let snippet = text.slice(start, end)
  if (start > 0) snippet = '…' + snippet
  if (end < text.length) snippet = snippet + '…'

  return snippet
}

/**
 * Run a full-text search across all nodes.
 * Returns results sorted by relevance score (highest first).
 */
export function searchNodes(nodes, query, filters = {}) {
  if (!query || !query.trim()) return []

  const q = query.trim().toLowerCase()
  let results = []

  for (const node of nodes) {
    const fields = extractSearchableText(node)
    const { score, matches } = rankResult(node, q, fields)
    if (score > 0 && matches.length > 0) {
      results.push({
        node,
        score,
        matches,
        // Best match field for display
        primaryMatch: matches.find(m => m.field === 'title') || matches[0],
      })
    }
  }

  // Apply filters
  if (filters.types && filters.types.length > 0) {
    results = results.filter(r => filters.types.includes(r.node.type))
  }
  if (filters.status && filters.status.length > 0) {
    results = results.filter(r => {
      const st = r.node.data?.status?.toLowerCase()
      return st && filters.status.includes(st)
    })
  }
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(r => {
      const tags = r.node.data?.tags || []
      return filters.tags.some(t => tags.includes(t))
    })
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results
}

/**
 * Build a set of available filters from all nodes.
 * Returns { types: [...], statuses: [...], tags: [...] }
 */
export function buildFilters(nodes) {
  const types    = new Set()
  const statuses = new Set()
  const tags     = new Set()

  for (const node of nodes) {
    types.add(node.type)

    const data = node.data || {}
    if (data.status) statuses.add(data.status.toLowerCase())

    if (Array.isArray(data.tags)) {
      data.tags.forEach(t => tags.add(t))
    }
  }

  return {
    types:    [...types].sort(),
    statuses: [...statuses].sort(),
    tags:     [...tags].sort(),
  }
}

/**
 * Get field display label for match context.
 */
export const FIELD_LABELS = {
  title:          'Title',
  content:        'Content',
  description:    'Description',
  tag:            'Tag',
  status:         'Status',
  type:           'Type',
  property_key:   'Property',
  property_value: 'Property value',
  reference:      'Reference',
  reference_url:  'URL',
}
