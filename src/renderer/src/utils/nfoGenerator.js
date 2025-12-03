import { XMLBuilder } from 'fast-xml-parser'

/**
 * 将 NFO 数据对象生成为 XML 字符串
 * @param {Object} nfoData - NFO 数据对象
 * @returns {string} 格式化的 XML 字符串
 */
export function generateNFO(nfoData) {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
    suppressBooleanAttributes: false
  })

  // 清理数据（移除空值）
  const cleanedData = cleanNFOData(nfoData)

  // 构建 XML 对象
  const xmlObj = {
    '?xml': {
      '@_version': '1.0',
      '@_encoding': 'UTF-8',
      '@_standalone': 'yes'
    },
    movie: cleanedData
  }

  try {
    return builder.build(xmlObj)
  } catch (error) {
    console.error('XML 生成错误:', error)
    throw new Error(`无法生成 NFO 文件: ${error.message}`)
  }
}

/**
 * 清理 NFO 数据，移除空值和空数组
 */
function cleanNFOData(data) {
  const cleaned = {}

  // 确保 type 字段不被包含在 XML 中
  const { type, ...dataWithoutType } = data

  for (const [key, value] of Object.entries(dataWithoutType)) {
    // 跳过空值
    if (value === null || value === undefined || value === '') {
      continue
    }

    // 处理数组
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      
      // 特殊处理演员数组
      if (key === 'actor') {
        const cleanedActors = value
          .filter(actor => actor.name && actor.name.trim())
          .map(actor => cleanActorData(actor))
        
        if (cleanedActors.length > 0) {
          cleaned[key] = cleanedActors
        }
      } else {
        // 其他数组（genre, director, credits 等）
        const cleanedArray = value.filter(item => item && item.trim && item.trim())
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray
        }
      }
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

/**
 * 清理演员数据
 */
function cleanActorData(actor) {
  const cleaned = {
    name: actor.name
  }

  if (actor.role && actor.role.trim()) {
    cleaned.role = actor.role
  }

  if (actor.thumb && actor.thumb.trim()) {
    cleaned.thumb = actor.thumb
  }

  return cleaned
}

/**
 * 格式化 XML 字符串（美化输出）
 * @param {string} xmlString - XML 字符串
 * @returns {string} 格式化后的 XML 字符串
 */
export function formatXML(xmlString) {
  // 已经在 XMLBuilder 中使用 format: true，这里直接返回
  return xmlString
}
