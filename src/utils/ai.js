/**
 * AI Service — Client-side NLP + optional OpenAI-compatible API
 *
 * Features:
 * - Auto-tagging: keyword extraction via frequency analysis (no API key needed)
 * - Summarization: extractive summarization via sentence scoring (no API key needed)
 * - AI Completion: GPT-style via configurable OpenAI-compatible endpoint
 */

// ── Configuration ─────────────────────────────────────────────────────
const AI_CONFIG_KEY = 'cluster-canvas-ai-config'

export function getAIConfig() {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY)
    if (!raw) return { apiKey: '', model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1' }
    return JSON.parse(raw)
  } catch {
    return { apiKey: '', model: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1' }
  }
}

export function saveAIConfig(config) {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
}

export function hasApiKey() {
  return !!getAIConfig().apiKey
}

// ── Client-side NLP Utilities ─────────────────────────────────────────

/** Common English stop words to filter from keyword extraction */
const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','by','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need',
  'this','that','these','those','it','its','it\'s','they','them','their',
  'we','us','our','you','your','he','she','him','her','his','my','me',
  'not','no','nor','so','if','as','from','about','into','over','after',
  'all','each','every','both','few','more','most','other','some','such',
  'only','own','same','than','too','very','just','because','then','also',
  'here','there','when','where','why','how','which','who','whom',
])

/** Split text into words and normalize */
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s+#_-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

/**
 * Extract keywords from text using frequency analysis.
 * Returns array of { word, score } sorted by score descending.
 */
export function extractKeywords(text, maxKeywords = 10) {
  if (!text || text.trim().length < 10) return []

  const tokens = tokenize(text)
  if (tokens.length === 0) return []

  // Count frequency
  const freq = {}
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1
  }

  // Calculate TF (normalized by total tokens)
  const total = tokens.length
  const tf = Object.entries(freq).map(([word, count]) => ({
    word,
    score: count / total,
    count,
  }))

  // Sort by frequency descending, take top N
  return tf
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords)
    .filter(k => k.count >= 2 || k.word.length > 4) // Filter rare short words
}

/**
 * Auto-suggest tags from text content.
 * Returns array of tag strings (lowercase, no duplicates).
 */
export function suggestTags(text, existingTags = [], maxTags = 5) {
  const keywords = extractKeywords(text, maxTags + 5)
  const existing = new Set(existingTags.map(t => t.toLowerCase()))
  const suggested = []

  for (const kw of keywords) {
    if (suggested.length >= maxTags) break
    const tag = kw.word.toLowerCase().replace(/[#]/g, '')
    if (!existing.has(tag) && !suggested.includes(tag)) {
      suggested.push(tag)
    }
  }

  return suggested
}

/**
 * Extractive summarization — picks the most important sentences.
 * Returns array of summary sentences.
 */
export function summarize(text, maxSentences = 3) {
  if (!text || text.trim().length < 20) return []

  // Split into sentences
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || []
  if (sentences.length <= maxSentences) return sentences.map(s => s.trim())

  // Score sentences by keyword frequency
  const keywords = extractKeywords(text, 15)
  const keywordWords = new Set(keywords.map(k => k.word))

  const scored = sentences.map((s, i) => {
    const words = tokenize(s)
    const matchCount = words.filter(w => keywordWords.has(w)).length
    // Boost first sentence
    const positionBonus = i === 0 ? 0.3 : 0
    return {
      sentence: s.trim(),
      score: matchCount / Math.max(words.length, 1) + positionBonus,
      index: i,
    }
  })

  // Pick top N sentences while preserving original order
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence)

  return topSentences
}

// ── OpenAI-compatible API ─────────────────────────────────────────────

/**
 * Send a prompt to the OpenAI-compatible API for text completion.
 * Uses configurable endpoint, model, and API key from localStorage.
 *
 * @param {string} systemPrompt - System message for context
 * @param {string} userPrompt - The user's prompt
 * @param {Object} options - { temperature, maxTokens }
 * @returns {Promise<string>} The completion text
 */
export async function aiComplete(systemPrompt, userPrompt, options = {}) {
  const config = getAIConfig()
  if (!config.apiKey) {
    throw new Error('API key not configured. Add your API key in Settings → AI.')
  }

  const { temperature = 0.7, maxTokens = 1024 } = options

  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}

/**
 * Convenience: summarize text using AI (if API key configured) or fallback to extractive.
 */
export async function smartSummarize(text, options = {}) {
  if (hasApiKey()) {
    try {
      const result = await aiComplete(
        'You are a concise summarizer. Summarize the following text in 2-3 sentences.',
        text,
        { temperature: 0.3, maxTokens: 300, ...options }
      )
      return result
    } catch {
      // Fallback to extractive on API error
      return summarize(text, 3).join(' ')
    }
  }
  return summarize(text, 3).join(' ')
}

/**
 * Convenience: generate tags using AI (if API key configured) or fallback to client-side.
 */
export async function smartSuggestTags(text, existingTags = []) {
  if (hasApiKey()) {
    try {
      const existingStr = existingTags.length > 0 ? ` (existing tags: ${existingTags.join(', ')})` : ''
      const result = await aiComplete(
        'You are a smart tagger. Extract 3-5 relevant tags from the text. Return only the tags, comma-separated, lowercase.',
        `${text}${existingStr}`,
        { temperature: 0.3, maxTokens: 100 }
      )
      const aiTags = result.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      // Merge with existing tags, deduplicate
      const merged = [...new Set([...existingTags, ...aiTags])]
      return merged
    } catch {
      return suggestTags(text, existingTags)
    }
  }
  return suggestTags(text, existingTags)
}
