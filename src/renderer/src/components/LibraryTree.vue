<template>
  <div class="library-tree">
    <div class="tree-header">
      <el-button type="primary" :icon="FolderOpened" @click="selectRootDirectory" class="select-btn">
        选择电影库根目录
      </el-button>
      <el-input
        v-model="filterText"
        placeholder="搜索目录..."
        :prefix-icon="Search"
        class="filter-input"
        clearable
      />
    </div>

    <div class="tree-container" v-loading="loading">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="defaultProps"
        :filter-node-method="filterNode"
        @node-click="handleNodeClick"
        highlight-current
        default-expand-all
        node-key="path"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <el-icon class="folder-icon"><Folder /></el-icon>
            <span class="node-label" :title="data.label">{{ node.label }}</span>
          </span>
        </template>
      </el-tree>
      
      <div v-if="!treeData.length && !loading" class="empty-state">
        <p>请选择一个目录开始</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineEmits } from 'vue'
import { FolderOpened, Search, Folder } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['directory-selected'])

const treeRef = ref(null)
const filterText = ref('')
const treeData = ref([])
const loading = ref(false)
const rootPath = ref('')

const defaultProps = {
  children: 'children',
  label: 'label'
}

// 过滤节点
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

const filterNode = (value, data) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

// 选择根目录
const selectRootDirectory = async () => {
  try {
    const dirPath = await window.api.selectDirectory()
    
    if (dirPath) {
      rootPath.value = dirPath
      await loadDirectoryTree(dirPath)
      
      // 默认选中根节点
      if (treeData.value.length > 0) {
        // 自动选中根目录并触发刷新
        handleNodeClick(treeData.value[0])
      }
    }
  } catch (error) {
    ElMessage.error('选择目录失败: ' + error.message)
  }
}

// 加载目录树
const loadDirectoryTree = async (path) => {
  loading.value = true
  try {
    const result = await window.api.scanDirectoryTree(path)
    if (result.success) {
      treeData.value = result.data
    } else {
      ElMessage.error('加载目录结构失败: ' + result.error)
    }
  } catch (error) {
    ElMessage.error('加载目录结构失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 点击节点
const handleNodeClick = (data) => {
  emit('directory-selected', data.path)
}

// 暴露刷新方法
const refresh = async () => {
  if (rootPath.value) {
    await loadDirectoryTree(rootPath.value)
  }
}

defineExpose({
  refresh
})
</script>

<style scoped>
.library-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.tree-header {
  padding: 12px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-btn {
  width: 100%;
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-icon {
  color: #e6a23c;
}

.node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 覆盖 el-tree 样式以适应侧边栏 */
:deep(.el-tree) {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
</style>
