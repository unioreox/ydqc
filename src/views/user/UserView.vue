<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import {computed} from 'vue';
import {
  User as UserIcon,
  Award,
  FileText,
  Share2,
  MessageSquare
} from 'lucide-vue-next';
import {infoApi} from "@/api";

const {user} = useUserStore();

// 不用三元，而是每个都判断，因为有 ADMIN 和 BANNED
const roleText = computed(() => {
  if (user?.role === 'ADMIN') {
    return '管理员';
  } else if (user?.role === 'TEACHER') {
    return '教师';
  } else if (user?.role === 'STUDENT') {
    return '学生';
  } else if (user?.role === 'BANNED') {
    return '封禁用户';
  }
});
const idLabel = computed(() => {
  if (user?.role === 'ADMIN') {
    return '管理员ID';
  } else if (user?.role === 'TEACHER') {
    return '职工号';
  } else if (user?.role === 'STUDENT') {
    return '学号';
  } else if (user?.role === 'BANNED') {
    return 'ID';
  }
});
</script>

<template>
  <div class="info-container">
    <div class="bg-gray-100 min-h-screen p-4">
      <div class="max-w-md mx-auto rounded-xl shadow-md overflow-hidden md:max-w-2xl info-card">
        <div class="p-8 flex flex-col items-center md:flex-row md:items-start">
          <div class="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              <img class="w-full h-full object-cover" :src="user?.avatar" alt="User avatar">
            </div>
          </div>
          <div class="text-center md:text-left">
            <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">{{ user?.college }}&nbsp;&nbsp;&nbsp;
              {{ roleText }}
            </div>
            <h1 class="text-xl font-bold text-gray-900 mt-2">{{ user?.name }}</h1>
            <div class="mt-2 text-gray-500">
              <p class="flex items-center justify-center md:justify-start">
                <UserIcon class="w-4 h-4 mr-2"/>
                <span class="font-semibold mr-2">{{ idLabel }}:</span> {{ user?.idNumber }}
              </p>
              <p class="flex items-center justify-center md:justify-start mt-2">
                <Award class="w-4 h-4 mr-2"/>
                <span class="font-semibold mr-2"> 最好成绩:</span> {{ user?.bestRecord }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-md mx-auto mt-6 bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-4"> 快速操作 </h2>
          <div class="space-y-4">
            <RouterLink to="/user/profile"
               class="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow">
              <UserIcon class="w-6 h-6"/>
              <span class="flex-1 ml-3 whitespace-nowrap"> 个人信息 </span>
            </RouterLink>
            <RouterLink to="/user/records"
               class="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow">
              <FileText class="w-6 h-6"/>
              <span class="flex-1 ml-3 whitespace-nowrap"> 记录查询 </span>
            </RouterLink>
            <RouterLink to="/finish"
               class="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow">
              <Share2 class="w-6 h-6"/>
              <span class="flex-1 ml-3 whitespace-nowrap"> 分享参赛信息 </span>
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="max-w-md mx-auto mt-6 bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-4"> 遇到问题？反馈给我们 ~</h2>
          <a href="/feedback"
             class="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 group hover:shadow">
            <MessageSquare class="w-6 h-6"/>
            <span class="flex-1 ml-3 whitespace-nowrap"> 反馈问题 </span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-container {
  padding-bottom: 2.3em;
}

.info-card {
  background: linear-gradient(145deg, rgba(109, 197, 251, 0.42), #f9fafb);
}
</style>
