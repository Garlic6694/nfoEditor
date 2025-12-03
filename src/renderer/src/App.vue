<template>
  <div id="app" class="nfo-editor-app">
    <div class="app-header">
      <h1 class="app-title">
        <el-icon class="title-icon"><Film /></el-icon>
        Jellyfin NFO 编辑器
      </h1>
      <p class="app-subtitle">电影元数据管理工具</p>
    </div>

    <div class="app-content">
      <el-container class="main-container">
        <!-- 最左侧：目录树 -->
        <el-aside width="280px" class="library-sidebar">
          <LibraryTree
            ref="libraryTree"
            @directory-selected="handleDirectorySelected"
          />
        </el-aside>

        <!-- 内容区域 -->
        <el-container class="content-container">
          <!-- 中间：图片管理 -->
          <el-aside width="380px" class="images-sidebar">
            <div class="sidebar-content">
              <div class="current-path-info" v-if="currentDirectory">
                <el-icon><Folder /></el-icon>
                <span :title="currentDirectory">{{ currentDirectoryName }}</span>
              </div>

              <div class="images-section">
                <el-tabs v-model="activeImageTab" type="border-card" class="image-tabs">
                  <el-tab-pane label="海报图" name="poster">
                    <ImageEditor
                      title="海报图 (Poster)"
                      default-filename="poster.jpg"
                      :default-width="1000"
                      :default-height="1500"
                      :target-directory="currentDirectory"
                      aspect-ratio="2/3"
                      enable-crop
                    />
                  </el-tab-pane>

                  <el-tab-pane label="背景图" name="backdrop">
                    <ImageEditor
                      title="背景图 (Backdrop)"
                      default-filename="backdrop.jpg"
                      :default-width="1920"
                      :default-height="1080"
                      :target-directory="currentDirectory"
                      aspect-ratio="16/9"
                    />
                  </el-tab-pane>

                  <el-tab-pane label="缩略图" name="landscape">
                    <ImageEditor
                      title="缩略图 (Landscape)"
                      default-filename="landscape.jpg"
                      :default-width="1280"
                      :default-height="720"
                      :target-directory="currentDirectory"
                      aspect-ratio="16/9"
                    />
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </el-aside>

          <!-- 右侧：电影元数据编辑 -->
          <el-main class="metadata-content">
            <MovieEditor
              :key="editorKey"
              v-model="movieData"
              :target-directory="currentDirectory"
            />
          </el-main>
        </el-container>
      </el-container>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Film, Folder } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LibraryTree from './components/LibraryTree.vue'
import ImageEditor from './components/ImageEditor.vue'
import MovieEditor from './components/MovieEditor.vue'
import { createEmptyMovieNFO } from './utils/nfoSchemas'
import { parseNFO } from './utils/nfoParser'

const currentDirectory = ref('')
const movieData = ref(createEmptyMovieNFO())
const activeImageTab = ref('poster')
const libraryTree = ref(null)
const editorKey = ref(0)

const currentDirectoryName = computed(() => {
  if (!currentDirectory.value) return ''
  // 简单的获取路径最后一部分作为名称，实际应该用 path.basename 但前端没有 path 模块
  // 这里可以用简单的字符串处理
  const parts = currentDirectory.value.split(/[/\\]/)
  return parts[parts.length - 1] || currentDirectory.value
})

// 处理目录选择
const handleDirectorySelected = async (dirPath) => {
  currentDirectory.value = dirPath
  
  // 尝试加载现有的 NFO 文件
  await loadNFOFile(dirPath)
}

// 加载 NFO 文件
const loadNFOFile = async (dirPath) => {
  try {
    const nfoPath = await window.api.joinPath(dirPath, 'movie.nfo')
    const exists = await window.api.checkFileExists(nfoPath)

    if (exists) {
      const result = await window.api.readNFOFile(nfoPath)
      
      if (result.success) {
        const parsedData = parseNFO(result.content)
        movieData.value = parsedData
        ElMessage.success('NFO 文件加载成功')
      } else {
        ElMessage.error('读取 NFO 文件失败: ' + result.error)
        movieData.value = createEmptyMovieNFO()
      }
    } else {
      // 没有 NFO 文件，使用空白数据
      movieData.value = createEmptyMovieNFO()
      // 静默处理，不提示错误，因为可能是新目录
    }
  } catch (error) {
    ElMessage.error('加载 NFO 文件失败: ' + error.message)
    movieData.value = createEmptyMovieNFO()
  } finally {
    // 强制刷新编辑器组件，避免数据绑定冲突
    editorKey.value++
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f0f2f5;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>

<style scoped>
.nfo-editor-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.app-header {
  height: 60px;
  padding: 0 20px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.app-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
  color: #409eff;
}

.app-subtitle {
  font-size: 13px;
  color: #909399;
}

.app-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.main-container {
  height: 100%;
}

.library-sidebar {
  background: #fff;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
}

.content-container {
  height: 100%;
}

.images-sidebar {
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 10px;
}

.current-path-info {
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.images-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.metadata-content {
  padding: 20px;
  overflow-y: auto;
  background: #fff;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>
