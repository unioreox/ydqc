<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {cancelCheckin, listRecord, type RecordVO} from "@/api"
import {ClockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, LoaderIcon} from 'lucide-vue-next'
import {showConfirmDialog} from "vant";

const records = ref<RecordVO[]>([])
const isLoading = ref(true)

const fetchRecords = async () => {
  isLoading.value = true
  try {
    const res = await listRecord()
    if (res.data?.data) {
      console.log("获取记录成功:", res.data.data)
      records.value = res.data.data
    }
  } catch (error) {
    console.error("获取记录失败:", error)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const latestPendingRecord = computed(() => {
  return records.value.find(record => record.status === 'PENDING')
})

const handleCancelRecord = async (recordId: string | undefined) => {
  if (!recordId) return
  showConfirmDialog({
    title: '中断记录',
    message: '确定要中断这条记录吗？',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await cancelCheckin({
        path: {
          recordId
        }
      })
      await fetchRecords() // 取消后刷新列表
    } catch (error) {
      console.error("取消记录失败:", error)
    }
  })
}

onMounted(fetchRecords)
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-4 record-container">
    <h1 class="text-2xl font-bold mb-4 text-gray-800"> 记录查询 </h1>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <LoaderIcon class="animate-spin h-8 w-8 text-gray-500"/>
    </div>

    <div v-else>
      <div v-if="latestPendingRecord" class="bg-green-100 border-l-4 border-blue-500 p-4 mb-4">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="font-semibold text-green-700"> 正在进行 </h2>
            <p class="text-green-600"> 开始时间: {{ formatDate(latestPendingRecord.startTime) }}</p>
          </div>
          <button @click="handleCancelRecord(latestPendingRecord.id)"
                  class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            中断
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div v-for="record in records"
             class="border-b last:border-b-0 p-4 hover:bg-gray-50 transition duration-300">
          <div class="flex justify-between items-center">
            <div>
              <div class="text-lg font-semibold text-gray-800">
                {{ record.totalMilliseconds }}
              </div>
              <div class="flex items-center text-sm text-gray-600 mt-1">
                <ClockIcon class="h-4 w-4 mr-1"/>
                <span> 开始: {{ formatDate(record?.startTime) }}</span>
              </div>
              <div class="flex items-center text-sm text-gray-600 mt-1">
                <CalendarIcon class="h-4 w-4 mr-1"/>
                <span> 结束: {{ formatDate(record?.endTime) }}</span>
              </div>
            </div>
            <div class="flex items-center">
              <span :class="{
                'bg-green-100 text-green-800': record.status === 'FINISHED',
                'bg-yellow-100 text-yellow-800': record.status === 'PENDING',
                'bg-red-100 text-red-800': record.status === 'CANCELLED'
              }" class="px-2 py-1 rounded-full text-xs font-medium">
                {{
                  record.status === 'FINISHED' ? '已完成' :
                      record.status === 'PENDING' ? '待处理' :
                          record.status === 'CANCELLED' ? '已取消' : ''
                }}
              </span>
              <CheckCircleIcon v-if="record.isValid" class="h-5 w-5 text-green-500 ml-2"/>
              <XCircleIcon v-else class="h-5 w-5 text-red-500 ml-2"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-container {
  padding-bottom: 3.5em;
}
</style>
