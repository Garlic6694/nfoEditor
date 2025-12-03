import { XMLParser } from 'fast-xml-parser'

/**
 * 解析 NFO XML 文件为 JavaScript 对象
 * @param {string} xmlContent - XML 字符串内容
 * @returns {Object} 解析后的 NFO 数据对象
 */
export function parseNFO(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    cdataPropName: '__cdata'
  })

  try {
    const result = parser.parse(xmlContent)
    
    // 支持不同的根元素
    if (result.movie) {
      return normalizeMovieData(result.movie)
    } else if (result.tvshow) {
      return normalizeTVShowData(result.tvshow)
    } else if (result.episodedetails) {
      return normalizeEpisodeData(result.episodedetails)
    } else {
      throw new Error('未知的 NFO 文件类型')
    }
  } catch (error) {
    console.error('XML 解析错误:', error)
    throw new Error(`无法解析 NFO 文件: ${error.message}`)
  }
}

/**
 * 标准化电影数据
 */
function normalizeMovieData(data) {
  return {
    type: 'movie',
    title: data.title || '',
    originaltitle: data.originaltitle || '',
    plot: data.plot || '',
    outline: data.outline || '',
    tagline: data.tagline || '',
    year: data.year || '',
    premiered: data.premiered || '',
    releasedate: data.releasedate || '',
    runtime: data.runtime || '',
    mpaa: data.mpaa || '',
    rating: data.rating || '',
    votes: data.votes || '',
    genre: normalizeArray(data.genre),
    studio: data.studio || '',
    director: normalizeArray(data.director),
    credits: normalizeArray(data.credits),
    actor: normalizeActors(data.actor),
    trailer: data.trailer || '',
    IMDbid: data.imdbid || data.IMDbid || '',
    TMDbid: data.tmdbid || data.TMDbid || '',
    set: data.set || '',
    thumb: normalizeArray(data.thumb)
  }
}

/**
 * 标准化电视剧数据（预留）
 */
function normalizeTVShowData(data) {
  return {
    type: 'tvshow',
    ...data
  }
}

/**
 * 标准化单集数据（预留）
 */
function normalizeEpisodeData(data) {
  return {
    type: 'episode',
    ...data
  }
}

/**
 * 标准化数组数据
 * XML 解析器可能返回单个值或数组，统一为数组
 */
function normalizeArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

/**
 * 标准化演员数据
 */
function normalizeActors(actors) {
  if (!actors) return []
  
  const actorArray = Array.isArray(actors) ? actors : [actors]
  
  return actorArray.map(actor => {
    if (typeof actor === 'string') {
      return { name: actor, role: '', thumb: '' }
    }
    return {
      name: actor.name || '',
      role: actor.role || '',
      thumb: actor.thumb || ''
    }
  })
}

/**
 * 验证 XML 格式
 * @param {string} xmlContent - XML 字符串内容
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateXML(xmlContent) {
  try {
    parseNFO(xmlContent)
    return { valid: true }
  } catch (error) {
    return { 
      valid: false, 
      error: error.message 
    }
  }
}
