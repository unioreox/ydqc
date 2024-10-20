<script setup lang="ts">
import {onMounted, ref} from "vue";
import {
  type CollegeCountLeaderBoardVO,
  getCollegeLeaderBoard,
  getTop30UsersByBestScore,
  getUserCountLeaderBoard,
  type UserBestScoreLeaderBoardVO,
  type UserCountLeaderBoardVO
} from "@/api";
import {Trophy, Medal, Clock} from 'lucide-vue-next';

const current = ref(0);
const lastUpdated = ref("");
const top30User = ref<UserBestScoreLeaderBoardVO[]>([]);
const countUser = ref<UserCountLeaderBoardVO[]>([]);
const collegeUser = ref<CollegeCountLeaderBoardVO[]>([]);

const beforeChange = (index: number) => {
  console.log('beforeChange', index);
  switch (index) {
    case 0:
      fetchTop30Users();
      break;
    case 1:
      fetchCountUsers();
      break;
    case 2:
      fetchCollegeUsers();
      break;
  }
  return true;
}

onMounted(() => {
  fetchTop30Users();
});

const fetchTop30Users = async () => {
  getTop30UsersByBestScore().then((res) => {
    if (res.data?.data?.leaderBoard && res.data?.data?.lastUpdateTime) {
      top30User.value = res.data?.data?.leaderBoard;
      lastUpdated.value = res.data.data.lastUpdateTime;
    }
  });
}

const fetchCountUsers = async () => {
  getUserCountLeaderBoard().then((res) => {
    if (res.data?.data?.leaderBoard && res.data?.data?.lastUpdateTime) {
      countUser.value = res.data?.data?.leaderBoard;
      lastUpdated.value = res.data.data.lastUpdateTime;
      console.log(countUser.value);
    }
  });
}

const fetchCollegeUsers = async () => {
  getCollegeLeaderBoard().then((res) => {
    if (res.data?.data?.leaderBoard && res.data?.data?.lastUpdateTime) {
      collegeUser.value = res.data?.data?.leaderBoard;
      lastUpdated.value = res.data.data.lastUpdateTime;
    }
  });
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-4 pb-16">
    <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div class="p-4 bg-blue-500 text-white flex items-center justify-between">
        <h1 class="text-2xl font-bold"> 排行榜 </h1>
        <div class="flex items-center text-sm">
          <Clock class="w-4 h-4 mr-1"/>
          <span> 上次更新: {{ lastUpdated }}</span>
        </div>
      </div>

      <van-tabs v-model:active="current" :before-change="beforeChange"
                sticky animated swipeable class="custom-tabs">
        <van-tab title="Top 30">
          <div class="px-4 py-2 bg-gray-100 text-gray-700 font-semibold flex">
            <span class="w-1/6 text-center"> 排名 </span>
            <span class="w-2/6 pl-14"> 姓名 </span>
            <span class="w-3/6 text-right"> 用时 </span>
          </div>
          <ul v-if="top30User.length > 0" class="divide-y divide-gray-200">
            <li v-for="(user, index) in top30User" :key="index"
                class="flex items-center py-3 px-4 hover:bg-gray-50 transition-colors duration-150">
              <div class="w-1/6 flex justify-center items-center">
                <Trophy v-if="index === 0" class="w-6 h-6 text-yellow-400"/>
                <Medal v-else-if="index === 1" class="w-6 h-6 text-gray-400"/>
                <Medal v-else-if="index === 2" class="w-6 h-6 text-yellow-700"/>
                <span v-else class="text-gray-500 font-medium">{{ index + 1 }}</span>
              </div>
              <div class="w-2/6 flex items-center">
                <img :src="user.userAvatar" :alt="user.userName" class="w-8 h-8 rounded-full mr-3">
                <span class="font-medium text-gray-900 pl-4">{{ user.userName }}</span>
              </div>
              <div class="w-3/6 text-right">
                <span class="font-bold text-blue-600">{{ user.userBestScoreFormatted }}</span>
              </div>
            </li>
          </ul>
        </van-tab>
        <van-tab title="完成次数">
          <div class="px-4 py-2 bg-gray-100 text-gray-700 font-semibold flex">
            <span class="w-1/6 text-center"> 排名 </span>
            <span class="w-2/6 pl-14"> 姓名 </span>
            <span class="w-3/6 text-right"> 完成次数 </span>
          </div>
          <ul v-if="countUser.length > 0" class="divide-y divide-gray-200">
            <li v-for="(user, index) in countUser" :key="index"
                class="flex items-center py-3 px-4 hover:bg-gray-50 transition-colors duration-150">
              <div class="w-1/6 flex justify-center items-center">
                <Trophy v-if="index === 0" class="w-6 h-6 text-yellow-400"/>
                <Medal v-else-if="index === 1" class="w-6 h-6 text-gray-400"/>
                <Medal v-else-if="index === 2" class="w-6 h-6 text-yellow-700"/>
                <span v-else class="text-gray-500 font-medium">{{ index + 1 }}</span>
              </div>
              <div class="w-2/6 flex items-center">
                <img :src="user.userAvatar" :alt="user.userName" class="w-8 h-8 rounded-full mr-3">
                <span class="font-medium text-gray-900 pl-4">{{ user.userName }}</span>
              </div>
              <div class="w-3/6 text-right">
                <span class="font-bold text-blue-600">{{ user.userCount }}</span>
              </div>
            </li>
          </ul>
        </van-tab>
        <van-tab title="学院排名">
          <div class="px-4 py-2 bg-gray-100 text-gray-700 font-semibold flex">
            <span class="w-1/6 text-center"> 排名 </span>
            <span class="w-2/6 pl-14"> 学院 </span>
            <span class="w-3/6 text-right"> 参与人次 </span>
          </div>
          <ul v-if="collegeUser.length > 0" class="divide-y divide-gray-200">
            <li v-for="(college, index) in collegeUser" :key="index"
                class="flex items-center py-3 px-4 hover:bg-gray-50 transition-colors duration-150">
              <div class="w-1/6 flex-1 justify-center items-center">
                <Trophy v-if="index === 0" class="w-6 h-6 text-yellow-400"/>
                <Medal v-else-if="index === 1" class="w-6 h-6 text-gray-400"/>
                <Medal v-else-if="index === 2" class="w-6 h-6 text-yellow-700"/>
                <span v-else class="text-gray-500 font-medium">{{ index + 1 }}</span>
              </div>
              <div class="w-2/6 flex-1 items-center">
                <span class="font-medium text-gray-900 pl-4">{{ college.collegeName }}</span>
              </div>
              <div class="w-3/6 text-right">
                <span class="font-bold text-blue-600">{{ college.collegeCount }}</span>
              </div>
            </li>
          </ul>
        </van-tab>
      </van-tabs>
    </div>
    <span class="text-gray-500 text-sm block text-center mt-4"> 数据每五分钟更新一次 </span>
    <span class="text-gray-500 text-sm block text-center mt-4"> 为大家所有的精彩表现点赞 🎉</span>
  </div>
</template>

<style scoped>
.custom-tabs :deep(.van-tabs__wrap) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.custom-tabs :deep(.van-tab) {
  color: #4a5568;
  font-weight: 600;
}

.custom-tabs :deep(.van-tab--active) {
  color: #2b6cb0;
}

.custom-tabs :deep(.van-tabs__line) {
  background-color: #2b6cb0;
}
</style>
