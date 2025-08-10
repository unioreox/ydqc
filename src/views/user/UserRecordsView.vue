<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {cancelCheckin, listRecord, type RecordVo} from "@/api"
import {ClockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, LoaderIcon} from 'lucide-vue-next'
import {showConfirmDialog, showDialog, NoticeBar} from "vant";

const records = ref<RecordVo[]>([])
const recordsSorted = ref<RecordVo[]>([])
const isLoading = ref(true)

function showIsValidWarn(){
  showDialog({
    title: '提示',
    message: '经系统研判, 你的部分打卡记录存在异常\n异常记录已被标记为无效',
  }).then(() => {
  // on close
  });
}

const fetchRecords = async () => {
  isLoading.value = true
  try {
    const res = await listRecord()
    if (res.data?.data) {
      console.log("获取记录成功:", res.data.data)
      records.value = res.data.data;
    }
  } catch (error) {
    console.error("获取记录失败:", error)
  } finally {
    // 查询是否存在无效数据
    for (const item of records.value) {
      if (item.isValid === false && item.status !== 'CANCELLED') {
        showIsValidWarn();
        break;
      }
    }

    // 安全排序
    recordsSorted.value = records.value.sort((a, b) => {
      if (!a.endTime && !b.endTime) return 0;
      if (!a.endTime) return 1;    // a没有endTime，排到后面
      if (!b.endTime) return -1;   // b没有endTime，排到后面
  
      // 两个都有endTime，正常比较
      return b.endTime.localeCompare(a.endTime);
    });
    
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
  return records.value.find((record) => record.status === 'PENDING')
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
// isOHOS
const isNotOHOS = ref(true)
const userAgent = navigator.userAgent;
const uaVersionMatch = userAgent.match(/Firefox\/(\d+\.\d+\.\d+)/);

function isOHOS(){
if (uaVersionMatch) {
    const versionNumber = uaVersionMatch[1];
    if(versionNumber === '141.0.0'){
      isNotOHOS.value = false;
    }
}
}
isOHOS();
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-4 record-container">
    <div style="padding: 5vh;" v-if="!isNotOHOS" class="ohosSafeZone"></div>
    <h1 class="text-2xl font-bold mb-4 text-gray-800"> 记录查询 </h1>

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <LoaderIcon class="animate-spin h-8 w-8 text-gray-500"/>
    </div>

    <div v-else>
      <van-notice-bar left-icon="info-o" color="#1989fa" background="#ecf9ff" :scrollable="false" wrapable
        class="notice-primary rounded-lg shadow-sm">
        <b>提示</b> 受系统升级影响，近两日部分记录的详细数据可能存在错误。实际打卡次数请以 <b>“我的”</b> 页面中头像下方 <b>“打卡次数”</b> 为准。
      </van-notice-bar>
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
        <div v-for="record in recordsSorted"
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
    <div style="padding: 3vh;" v-if="!isNotOHOS" class="ohosSafeZone"></div>
  </div>
</template>

<style scoped>
.record-container {
  padding-bottom: 3.5em;
}
</style>
