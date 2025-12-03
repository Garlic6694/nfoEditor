<template>
  <div class="image-cropper">
    <div class="cropper-container">
      <canvas
        ref="canvas"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @wheel.prevent="onWheel"
      ></canvas>
    </div>

    <div class="cropper-controls">
      <el-button :icon="RefreshLeft" @click="resetTransform">重置位置</el-button>
      
      <div class="cropper-info">
        <el-tag size="small" type="info">裁切尺寸: {{ actualCropWidth }} × {{ actualCropHeight }}</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps, defineExpose, watch } from 'vue'
import { ZoomIn, ZoomOut, RefreshLeft } from '@element-plus/icons-vue'

const props = defineProps({
  imageData: {
    type: String,
    required: true
  },
  cropWidth: {
    type: Number,
    default: 1000
  },
  cropHeight: {
    type: Number,
    default: 1500
  }
})

const canvas = ref(null)
const ctx = ref(null)
const image = ref(null)

// 图片变换参数
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// 拖动状态
const isDragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)

// 缩放百分比（用于输入）
const scalePercent = computed({
  get: () => Math.round(scale.value * 100),
  set: (val) => {
    scale.value = val / 100
    draw()
  }
})

// 缩放变化处理
const onScaleChange = (val) => {
  if (val) {
    scale.value = val / 100
    draw()
  }
}

// 初始化
onMounted(() => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext('2d')
    loadImage()
  }
})

// 监听图片数据变化
watch(() => props.imageData, () => {
  loadImage()
})

// 加载图片
const loadImage = () => {
  image.value = new Image()
  image.value.onload = () => {
    // 裁切框宽度 = 原图宽度 × (2/3)
    actualCropWidth.value = Math.round(image.value.width * 2 / 3)
    // 裁切框高度 = 裁切框宽度 × 1.5（保持 2:3 比例）
    actualCropHeight.value = Math.round(actualCropWidth.value * 1.5)
    
    setupCanvas()
    centerImage()
    draw()
  }
  image.value.src = props.imageData
}

// 设置 canvas 尺寸
const setupCanvas = () => {
  // Canvas 显示尺寸：基于裁切框尺寸，限制最大显示宽度
  const maxDisplayWidth = 500
  const displayScale = Math.min(1, maxDisplayWidth / actualCropWidth.value)
  
  canvas.value.width = Math.round(actualCropWidth.value * displayScale)
  canvas.value.height = Math.round(actualCropHeight.value * displayScale)
}

// 居中图片
const centerImage = () => {
  if (!image.value) return
  
  const canvasWidth = canvas.value.width
  const canvasHeight = canvas.value.height
  
  // 计算缩放比例：图片高度缩放到 canvas 高度
  scale.value = canvasHeight / (actualCropHeight.value / (actualCropHeight.value / image.value.height))
  // 简化：scale.value = canvasHeight / image.value.height × (actualCropHeight.value / actualCropHeight.value)
  // 实际上应该是：图片实际显示高度 = canvas 高度
  // 原图高度需要缩放到 actualCropHeight，然后再缩放到 canvas 显示
  
  // 重新计算：原图需要缩放到什么尺寸才能高度等于 actualCropHeight？
  const scaleToFitCropHeight = actualCropHeight.value / image.value.height
  // 缩放后的图片宽度
  const scaledImageWidth = image.value.width * scaleToFitCropHeight
  
  // 然后这个缩放后的图片再缩放到 canvas 显示尺寸
  const displayScale = canvasHeight / actualCropHeight.value
  
  // 最终缩放比例
  scale.value = scaleToFitCropHeight * displayScale
  
  // Y 轴固定为 0（高度匹配）
  offsetY.value = 0
  
  // X 轴居中
  const displayWidth = scaledImageWidth * displayScale
  offsetX.value = (canvasWidth - displayWidth) / 2
}

// 绘制
const draw = () => {
  if (!ctx.value || !image.value) return
  
  const canvasWidth = canvas.value.width
  const canvasHeight = canvas.value.height
  
  // 清空画布
  ctx.value.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制背景
  ctx.value.fillStyle = '#000'
  ctx.value.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制图片
  ctx.value.save()
  ctx.value.drawImage(
    image.value,
    offsetX.value,
    offsetY.value,
    image.value.width * scale.value,
    image.value.height * scale.value
  )
  ctx.value.restore()
  
  // 绘制半透明遮罩（裁切框外的区域）
  ctx.value.fillStyle = 'rgba(0, 0, 0, 0.5)'
  
  // 裁切框居中
  const cropX = (canvasWidth - props.cropWidth) / 2
  const cropY = (canvasHeight - props.cropHeight) / 2
  
  // 上方遮罩
  ctx.value.fillRect(0, 0, canvasWidth, cropY)
  // 下方遮罩
  ctx.value.fillRect(0, cropY + props.cropHeight, canvasWidth, canvasHeight - cropY - props.cropHeight)
  // 左侧遮罩
  ctx.value.fillRect(0, cropY, cropX, props.cropHeight)
  // 右侧遮罩
  ctx.value.fillRect(cropX + props.cropWidth, cropY, canvasWidth - cropX - props.cropWidth, props.cropHeight)
  
  // 绘制裁切框边框
  ctx.value.strokeStyle = '#409eff'
  ctx.value.lineWidth = 2
  ctx.value.strokeRect(cropX, cropY, props.cropWidth, props.cropHeight)
}

// 开始拖动
const startDrag = (e) => {
  isDragging.value = true
  lastMouseX.value = e.offsetX
  lastMouseY.value = e.offsetY
  canvas.value.style.cursor = 'grabbing'
}

// 拖动中
const onDrag = (e) => {
  if (!isDragging.value) return
  
  // 只允许水平移动
  const deltaX = e.offsetX - lastMouseX.value
  offsetX.value += deltaX
  
  lastMouseX.value = e.offsetX
  
  draw()
}

// 结束拖动
const endDrag = () => {
  isDragging.value = false
  canvas.value.style.cursor = 'grab'
}

// 滚轮缩放
const onWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.1, Math.min(5, scale.value + delta))
  
  // 以鼠标位置为中心缩放
  const rect = canvas.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  const scaleChange = newScale / scale.value
  offsetX.value = mouseX - (mouseX - offsetX.value) * scaleChange
  offsetY.value = mouseY - (mouseY - offsetY.value) * scaleChange
  
  scale.value = newScale
  draw()
}

// 放大
const zoomIn = () => {
  scale.value = Math.min(5, scale.value + 0.2)
  draw()
}

// 缩小
const zoomOut = () => {
  scale.value = Math.max(0.1, scale.value - 0.2)
  draw()
}

// 重置
const resetTransform = () => {
  centerImage()
  draw()
}

// 获取裁切后的图片数据
const getCroppedImage = () => {
  if (!canvas.value || !image.value) return null
  
  // 创建临时 canvas 用于裁切，尺寸为实际裁切框尺寸
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = actualCropWidth.value
  tempCanvas.height = actualCropHeight.value
  const tempCtx = tempCanvas.getContext('2d')
  
  // 计算实际裁切区域在原图上的位置
  // offsetX 是在显示 canvas 上的偏移，需要转换回实际尺寸
  const displayScale = canvas.value.height / actualCropHeight.value
  const actualOffsetX = offsetX.value / displayScale
  
  // 计算原图缩放比例（高度匹配 actualCropHeight）
  const imageScale = actualCropHeight.value / image.value.height
  
  // 计算在原图上的裁切起始位置
  const sourceX = -actualOffsetX / imageScale
  const sourceY = 0
  const sourceWidth = actualCropWidth.value / imageScale
  const sourceHeight = actualCropHeight.value / imageScale
  
  // 绘制裁切区域到临时 canvas
  tempCtx.drawImage(
    image.value,
    sourceX, sourceY, sourceWidth, sourceHeight,
    sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
    0, 0, actualCropWidth.value, actualCropHeight.value // Destination rectangle
  )
  
  // 返回 base64 数据
  return tempCanvas.toDataURL('image/jpeg', 0.9)
}

defineExpose({
  getCroppedImage
})
</script>

<style scoped>
.image-cropper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cropper-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

canvas {
  cursor: grab;
  display: block;
}

.cropper-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cropper-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.scale-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 14px;
  color: #606266;
}

.control-unit {
  font-size: 14px;
  color: #909399;
}

.scale-control :deep(.el-input-number) {
  width: 100px;
}
</style>
