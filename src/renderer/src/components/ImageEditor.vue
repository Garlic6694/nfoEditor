<template>
  <div class="image-editor">
    <el-card class="editor-card">
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
        </div>
      </template>

      <div class="editor-content">
        <!-- 图片预览区 -->
        <div 
          class="image-preview" 
          @click="selectImage"
          :class="{ 'has-image': imageData }"
        >
          <img 
            v-if="imageData" 
            :src="imageData" 
            :alt="title"
            class="preview-img"
          />
          <div v-else class="empty-preview">
            <el-icon :size="48"><Picture /></el-icon>
            <p>点击选择图片</p>
          </div>
        </div>

        <!-- 图片信息 -->
        <div v-if="imageInfo" class="image-info">
          <el-tag type="info" size="small">
            {{ imageInfo }}
          </el-tag>
        </div>

        <!-- 控制面板 -->
        <div class="controls">
          <el-form label-width="80px" size="small">
            <el-form-item label="宽度">
              <el-input-number
                v-model="width"
                :min="100"
                :max="4000"
                :step="10"
                placeholder="宽度"
              />
            </el-form-item>

            <el-form-item label="高度">
              <el-input-number
                v-model="height"
                :min="100"
                :max="4000"
                :step="10"
                placeholder="高度"
              />
            </el-form-item>

            <el-form-item label="文件名">
              <el-input
                v-model="filename"
                placeholder="文件名"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                @click="saveImage"
                :disabled="!imageData || !targetDirectory"
                :loading="saving"
              >
                保存图片
              </el-button>
              <el-button 
                v-if="enableCrop && imageData"
                type="success"
                @click="autoCropImage"
                :loading="cropping"
              >
                裁切图片
              </el-button>
              <el-button @click="clearImage" :disabled="!imageData">
                清除
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  defaultFilename: {
    type: String,
    required: true
  },
  defaultWidth: {
    type: Number,
    default: 1920
  },
  defaultHeight: {
    type: Number,
    default: 1080
  },
  targetDirectory: {
    type: String,
    default: ''
  },
  aspectRatio: {
    type: String,
    default: '16/9'
  },
  enableCrop: {
    type: Boolean,
    default: false
  }
})

const imageData = ref(null)
const selectedImagePath = ref(null)
const width = ref(props.defaultWidth)
const height = ref(props.defaultHeight)
const filename = ref(props.defaultFilename)
const saving = ref(false)
const originalImageInfo = ref(null)
const cropping = ref(false)

// 图片信息显示
const imageInfo = computed(() => {
  if (!originalImageInfo.value) return null
  return `原始尺寸: ${originalImageInfo.value.width} × ${originalImageInfo.value.height}`
})

// 自动裁切图片（居中裁切，宽度减半，高度不变）
const autoCropImage = async () => {
  if (!imageData.value || !props.targetDirectory) {
    ElMessage.warning('请先选择图片和目标目录')
    return
  }

  cropping.value = true

  try {
    // 加载图片获取尺寸
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = imageData.value
    })

    const originalWidth = img.width
    const originalHeight = img.height
    
    // 裁切尺寸：宽度 = 高度 ÷ 1.5（2:3 比例），高度不变
    const cropWidth = Math.round(originalHeight / 1.5)
    const cropHeight = originalHeight
    
    // 居中裁切：从 (originalWidth/4, 0) 开始裁切
    const cropX = Math.round((originalWidth - cropWidth) / 2)
    const cropY = 0

    // 创建 canvas 进行裁切
    const canvas = document.createElement('canvas')
    canvas.width = cropWidth
    canvas.height = cropHeight
    const ctx = canvas.getContext('2d')
    
    // 绘制裁切后的图片
    ctx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,  // 源区域
      0, 0, cropWidth, cropHeight            // 目标区域
    )
    
    // 获取裁切后的 base64 数据
    const croppedImageData = canvas.toDataURL('image/jpeg', 0.9)
    
    // 目标文件路径
    const targetPath = await window.api.joinPath(props.targetDirectory, props.defaultFilename)
    
    // 检查是否已存在
    const exists = await window.api.checkFileExists(targetPath)
    
    // 如果存在，重命名为 -old
    if (exists) {
      const oldFilename = props.defaultFilename.replace(/\.jpg$/, '-old.jpg')
      const oldPath = await window.api.joinPath(props.targetDirectory, oldFilename)
      const renameResult = await window.api.renameFile(targetPath, oldPath)
      if (!renameResult.success) {
        ElMessage.warning('备份原文件失败: ' + renameResult.error)
      }
    }

    // 保存裁切后的图片
    const result = await window.api.saveBase64Image(croppedImageData, targetPath)
    
    if (result.success) {
      ElMessage.success(`图片已自动裁切并保存 (${cropWidth}×${cropHeight})`)
      
      // 更新预览
      imageData.value = croppedImageData
      selectedImagePath.value = targetPath
      
      // 更新原始图片信息
      originalImageInfo.value = {
        width: cropWidth,
        height: cropHeight
      }
    } else {
      ElMessage.error('保存裁切图片失败: ' + result.error)
    }
  } catch (error) {
    ElMessage.error('裁切图片失败: ' + error.message)
  } finally {
    cropping.value = false
  }
}

// 选择图片
const selectImage = async () => {
  try {
    const imagePath = await window.api.selectImageFile()
    
    if (imagePath) {
      selectedImagePath.value = imagePath
      const result = await window.api.readImageFile(imagePath)
      
      if (result.success) {
        imageData.value = result.data
        
        // 获取图片原始尺寸
        const img = new Image()
        img.onload = () => {
          originalImageInfo.value = {
            width: img.width,
            height: img.height
          }
        }
        img.src = result.data
        
        ElMessage.success('图片加载成功')
      } else {
        ElMessage.error('读取图片失败: ' + result.error)
      }
    }
  } catch (error) {
    ElMessage.error('选择图片失败: ' + error.message)
  }
}

// 保存图片
const saveImage = async () => {
  if (!selectedImagePath.value || !props.targetDirectory) {
    ElMessage.error('请先选择图片和目标目录')
    return
  }

  saving.value = true

  try {
    const targetPath = await window.api.joinPath(props.targetDirectory, filename.value)
    
    const result = await window.api.saveImageFile(
      selectedImagePath.value,
      targetPath,
      width.value,
      height.value
    )

    if (result.success) {
      ElMessage.success(`图片已保存: ${filename.value}`)
    } else {
      ElMessage.error('保存图片失败: ' + result.error)
    }
  } catch (error) {
    ElMessage.error('保存图片失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

// 清除图片
const clearImage = () => {
  imageData.value = null
  selectedImagePath.value = null
  originalImageInfo.value = null
  width.value = props.defaultWidth
  height.value = props.defaultHeight
  filename.value = props.defaultFilename
}

// 监听目标目录变化时加载现有图片
watch(() => props.targetDirectory, async (newDir) => {
  if (newDir) {
    try {
      const imagePath = await window.api.joinPath(newDir, props.defaultFilename)
      const exists = await window.api.checkFileExists(imagePath)
      
      if (exists) {
        const result = await window.api.readImageFile(imagePath)
        if (result.success) {
          imageData.value = result.data
          selectedImagePath.value = imagePath
          
          // 获取图片原始尺寸
          const img = new Image()
          img.onload = () => {
            originalImageInfo.value = {
              width: img.width,
              height: img.height
            }
            width.value = img.width
            height.value = img.height
          }
          img.src = result.data
        }
      }
    } catch (error) {
      // 忽略错误，可能是文件不存在
    }
  }
})
</script>

<style scoped>
.image-editor {
  width: 100%;
}

.editor-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-preview {
  width: 100%;
  aspect-ratio: v-bind(aspectRatio);
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  background-color: #fafafa;
}

.image-preview:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.image-preview.has-image {
  border-style: solid;
  border-color: #409eff;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.empty-preview {
  text-align: center;
  color: #909399;
}

.empty-preview p {
  margin-top: 12px;
  font-size: 14px;
}

.image-info {
  text-align: center;
}

.controls {
  padding-top: 8px;
}

.el-form {
  max-width: 100%;
}

.el-input-number {
  width: 100%;
}
</style>
