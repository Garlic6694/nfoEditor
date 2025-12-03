<template>
  <div class="movie-editor">
    <el-card class="editor-card">
      <template #header>
        <div class="card-header">
          <span>电影元数据编辑</span>
          <div class="header-actions">
            <el-button type="success" @click="saveNFO" :loading="saving">
              保存 NFO
            </el-button>
          </div>
        </div>
      </template>

      <el-form
        :model="movieData"
        label-width="120px"
        label-position="left"
        class="movie-form"
      >
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="片名">
          <el-input v-model="movieData.title" placeholder="电影标题" />
        </el-form-item>

        <el-form-item label="原始片名">
          <el-input v-model="movieData.originaltitle" placeholder="原始标题" />
        </el-form-item>

        <el-form-item label="简介">
          <el-input
            v-model="movieData.plot"
            type="textarea"
            :rows="4"
            placeholder="电影简介"
          />
        </el-form-item>

        <el-form-item label="概述">
          <el-input
            v-model="movieData.outline"
            type="textarea"
            :rows="2"
            placeholder="简短概述"
          />
        </el-form-item>

        <el-form-item label="宣传语">
          <el-input v-model="movieData.tagline" placeholder="Tagline" />
        </el-form-item>

        <!-- 时间和评级 -->
        <el-divider content-position="left">时间和评级</el-divider>

        <el-form-item label="年份">
          <el-input-number v-model.number="movieData.year" :min="1900" :max="2100" />
        </el-form-item>

        <el-form-item label="首映日期">
          <el-date-picker
            v-model="premieredDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="updatePremiered"
          />
        </el-form-item>

        <el-form-item label="运行时长">
          <el-input v-model="movieData.runtime" placeholder="例如：120 min" />
        </el-form-item>

        <el-form-item label="MPAA 评级">
          <el-select v-model="movieData.mpaa" placeholder="选择评级" clearable>
            <el-option
              v-for="rating in mpaaRatings"
              :key="rating"
              :label="rating"
              :value="rating"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="评分">
          <el-input-number
            v-model.number="movieData.rating"
            :min="0"
            :max="10"
            :step="0.1"
            :precision="1"
          />
        </el-form-item>

        <el-form-item label="投票数">
          <el-input-number v-model.number="movieData.votes" :min="0" />
        </el-form-item>

        <!-- 分类 -->
        <el-divider content-position="left">分类和制作</el-divider>

        <el-form-item label="类型">
          <el-select
            v-model="movieData.genre"
            multiple
            placeholder="选择类型"
            style="width: 100%"
          >
            <el-option
              v-for="genre in commonGenres"
              :key="genre"
              :label="genre"
              :value="genre"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="制片公司">
          <el-input v-model="movieData.studio" placeholder="Studio" />
        </el-form-item>

        <el-form-item label="系列">
          <el-input v-model="movieData.set" placeholder="电影系列" />
        </el-form-item>

        <!-- 导演和编剧 -->
        <el-divider content-position="left">导演和编剧</el-divider>

        <el-form-item label="导演">
          <el-select
            v-model="movieData.director"
            multiple
            filterable
            allow-create
            placeholder="添加导演"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>

        <el-form-item label="编剧">
          <el-select
            v-model="movieData.credits"
            multiple
            filterable
            allow-create
            placeholder="添加编剧"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>

        <!-- 外部 ID -->
        <el-divider content-position="left">外部数据库 ID</el-divider>

        <el-form-item label="IMDb ID">
          <el-input v-model="movieData.IMDbid" placeholder="tt1234567" />
        </el-form-item>

        <el-form-item label="TMDb ID">
          <el-input v-model="movieData.TMDbid" placeholder="12345" />
        </el-form-item>

        <el-form-item label="预告片">
          <el-input v-model="movieData.trailer" placeholder="YouTube URL or plugin URL" />
        </el-form-item>

        <!-- 演员 -->
        <el-divider content-position="left">演员</el-divider>

        <div class="actors-list">
          <div
            v-for="(actor, index) in movieData.actor"
            :key="index"
            class="actor-item"
          >
            <el-input
              v-model="actor.name"
              placeholder="演员姓名"
              class="actor-name"
            />
            <el-input
              v-model="actor.role"
              placeholder="角色名"
              class="actor-role"
            />
            <el-button
              type="danger"
              :icon="Delete"
              circle
              @click="removeActor(index)"
            />
          </div>

          <el-button type="primary" :icon="Plus" @click="addActor">
            添加演员
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { createEmptyMovieNFO, createEmptyActor, mpaaRatings, commonGenres } from '../utils/nfoSchemas'
import { generateNFO } from '../utils/nfoGenerator'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => createEmptyMovieNFO()
  },
  targetDirectory: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const movieData = ref({ ...props.modelValue })
const premieredDate = ref(props.modelValue.premiered || '')
const saving = ref(false)

// 监听本地数据变化，通知父组件
watch(movieData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// 更新首映日期
const updatePremiered = (value) => {
  movieData.value.premiered = value || ''
}

// 添加演员
const addActor = () => {
  movieData.value.actor.push(createEmptyActor())
}

// 删除演员
const removeActor = (index) => {
  movieData.value.actor.splice(index, 1)
}

// 保存 NFO
const saveNFO = async () => {
  if (!props.targetDirectory) {
    ElMessage.error('请先选择目录')
    return
  }

  saving.value = true

  try {
    // 生成 XML
    const xmlContent = generateNFO(movieData.value)
    
    // 保存文件
    const nfoPath = await window.api.joinPath(props.targetDirectory, 'movie.nfo')
    const result = await window.api.writeNFOFile(nfoPath, xmlContent)

    if (result.success) {
      ElMessage.success('NFO 文件保存成功')
    } else {
      ElMessage.error('保存失败: ' + result.error)
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.movie-editor {
  width: 100%;
}

.editor-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.movie-form {
  max-width: 100%;
}

.actors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actor-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.actor-name {
  flex: 2;
}

.actor-role {
  flex: 2;
}

.el-divider {
  margin: 24px 0 16px 0;
}

.el-select,
.el-input-number {
  width: 100%;
}</style>
