<template>
  <div class="directory-selector">
    <el-card class="selector-card">
      <template #header>
        <div class="card-header">
          <span>电影目录</span>
          <el-button
            type="primary"
            :icon="RefreshRight"
            @click="handleRefresh"
            :disabled="!currentDirectory"
          >
            刷新
          </el-button>
        </div>
      </template>

      <div class="directory-content">
        <el-input
          v-model="currentDirectory"
          placeholder="请选择电影目录"
          readonly
          class="directory-input"
        >
          <template #append>
            <el-button :icon="FolderOpened" @click="selectDirectory">
              选择目录
            </el-button>
          </template>
        </el-input>

        <div v-if="currentDirectory" class="directory-info">
          <el-tag v-if="nfoExists" type="success">已找到 movie.nfo</el-tag>
          <el-tag v-else type="info">未找到 movie.nfo</el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { FolderOpened, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['directory-selected', 'refresh'])

const currentDirectory = ref('')
const nfoExists = ref(false)

// 选择目录
const selectDirectory = async () => {
  try {
    const dirPath = await window.api.selectDirectory()
    
    if (dirPath) {
      currentDirectory.value = dirPath
      await checkNFOExists()
      emit('directory-selected', dirPath)
      ElMessage.success('目录选择成功')
    }
  } catch (error) {
    ElMessage.error('选择目录失败: ' + error.message)
  }
}

// 检查 NFO 文件是否存在
const checkNFOExists = async () => {
  if (!currentDirectory.value) {
    nfoExists.value = false
    return
  }

  try {
    const nfoPath = await window.api.joinPath(currentDirectory.value, 'movie.nfo')
    nfoExists.value = await window.api.checkFileExists(nfoPath)
  } catch (error) {
    nfoExists.value = false
  }
}

// 刷新
const handleRefresh = () => {
  emit('refresh', currentDirectory.value)
  checkNFOExists()
  ElMessage.info('已刷新')
}

// 暴露方法给父组件
defineExpose({
  getCurrentDirectory: () => currentDirectory.value
})
</script>

<style scoped>
.directory-selector {
  margin-bottom: 20px;
}

.selector-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.directory-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.directory-input {
  width: 100%;
}

.directory-info {
  display: flex;
  gap: 8px;
}
</style>
