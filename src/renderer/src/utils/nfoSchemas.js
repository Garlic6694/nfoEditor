// NFO 数据结构定义

/**
 * 创建空白电影 NFO 数据结构
 */
export function createEmptyMovieNFO() {
  return {
    title: '',
    originaltitle: '',
    plot: '',
    outline: '',
    tagline: '',
    year: '',
    premiered: '',
    releasedate: '',
    runtime: '',
    mpaa: '',
    rating: '',
    votes: '',
    genre: [],
    studio: '',
    director: [],
    credits: [],
    actor: [],
    trailer: '',
    IMDbid: '',
    TMDbid: '',
    set: '',
    thumb: []
  }
}

/**
 * 默认演员结构
 */
export function createEmptyActor() {
  return {
    name: '',
    role: '',
    thumb: ''
  }
}

/**
 * MPAA 评级选项
 */
export const mpaaRatings = [
  'G',
  'PG',
  'PG-13',
  'R',
  'NC-17',
  'Not Rated',
  'TV-Y',
  'TV-Y7',
  'TV-G',
  'TV-PG',
  'TV-14',
  'TV-MA'
]

/**
 * 常见电影类型
 */
export const commonGenres = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Thriller',
  'War',
  'Western'
]
