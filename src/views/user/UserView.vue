<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import {
  User as UserIcon,
  Award,
  FileText,
  Share2,
  MessageSquare,
  Settings,
  ChevronRight, ScanQrCode
} from 'lucide-vue-next';
import {getLuckyGuy, infoApi} from "@/api";
import {onMounted, ref} from "vue";
import {showDialog} from "vant";
import wx from "weixin-js-sdk";

const version = import.meta.env.VITE_APP_VERSION;
const {user} = useUserStore();
const isLoading = ref(true);

onMounted(async () => {
  if (!user) {
    try {
      const res = await infoApi();
      if (res.data?.data) {
        useUserStore().setUser(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
});

const showAboutHandle = (e: MouseEvent) => {
  e.preventDefault();
  showDialog({
    title: '关于 ｜ Powered by 升华工作室',
    message: '这里是 CSU 升华工作室！\n\n' +
        '程序开发\ngrtsinry43, SteamFinder, mufenqwq, Kyliancc\n\n' +
        '技术栈\n' +
        '前端 Vite + Vue3 + Vant\n' +
        '后端 SpringBoot + MyBatis\n\n' +
        `Version: ${version}\n` +
        '盛世升华 服务中南',
  }).then(() => {
    console.log("应该不会有人发现log吧（）");
  });
}

const selectLuckUser = () => {
  showDialog({
    title: '抽取今天的幸运儿',
    message: '确定要抽取今天的幸运儿吗？',
    confirmButtonText: '确定',
    closeOnClickOverlay: true,
  }).then(() => {
    getLuckyGuy().then(res => {
      if (res.data?.data) {
        showDialog({
          title: '今日幸运儿',
          message: ` 恭喜 ${res.data.data.userName} 获得今天的幸运儿称号！\n` +
              ` 学号 / 工号：${res.data.data.idNumber}\n` +
              ` 手机号：${res.data.data.phone}\n` +
              ` 打卡信息：\n` +
              ` 打卡完成时间：${res.data.data.endTime}\n` +
              ` 总时间：${res.data.data.totalMilliseconds}`,
          confirmButtonText: '确定',
          closeOnClickOverlay: true,
        });
      } else {
        showDialog({
          title: '抽取失败',
          message: '出了点问题:(\n' +
              '请稍后再试',
          confirmButtonText: '确定',
          closeOnClickOverlay: true,
        });
      }
    });
  });
}

const blueToothTest = () => {
  showDialog({
    title: '蓝牙功能测试',
    message: '请确保您的设备支持蓝牙功能，并且已经打开蓝牙功能。\n' +
        '点击确定开始测试',
    confirmButtonText: '确定',
    closeOnClickOverlay: true,
  }).then(() => {
    wx.startSearchBeacons({
      ticket: "",
      fail: (err) => {
        showDialog({
          title: '蓝牙功能测试',
          message: ` 测试失败: ${err.errMsg}`,
          confirmButtonText: '确定',
          closeOnClickOverlay: true,
        });
      },
      complete: (argv) => {
        showDialog({
          title: '蓝牙功能测试',
          message: ` 测试完成: ${JSON.stringify(argv)}`,
          confirmButtonText: '确定',
          closeOnClickOverlay: true,
        });
        console.log(argv);
      },
    });
  });
  wx.onSearchBeacons({
    complete: (res) => {
      showDialog({
        title: '蓝牙功能测试',
        message: ` 搜索到的蓝牙设备: ${JSON.stringify(res)}`,
        confirmButtonText: '确定',
        closeOnClickOverlay: true,
      });
    },
    fail(...args) {
      showDialog({
        title: '蓝牙功能测试',
        message: ` 测试失败: ${JSON.stringify(args)}`,
        confirmButtonText: '确定',
        closeOnClickOverlay: true,
      });
    }
  });
}

const ScanQrCodeTest = () => {
  showDialog({
    title: '扫码功能测试',
    message: '请确保您的设备支持扫码功能，并且已经打开扫码功能。\n' +
        '点击确定开始测试',
    confirmButtonText: '确定',
    closeOnClickOverlay: true,
  }).then(() => {
    wx.scanQRCode({
      needResult: 1,
      scanType: ["qrCode"],
      success: (res) => {
        showDialog({
          title: '扫码功能测试',
          message: ` 扫码成功: ${JSON.stringify(res)}`,
          confirmButtonText: '确定',
          closeOnClickOverlay: true,
        });
      },
      fail: (err) => {
        showDialog({
          title: '扫码功能测试',
          message: ` 扫码失败: ${err.errMsg}`,
          confirmButtonText: '确定',
          closeOnClickOverlay: true,
        });
      },
    });
  });
}
</script>

<template>
  <div class=" bg-gradient-to-b from-blue-100 to-green-100 min-h-screen p-4 pb-16">
    <div class="max-w-4xl mx-auto">
      <div v-if="isLoading" class="flex justify-center items-center h-screen">
        <div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <template v-else>
        <!-- User Info Card -->
        <div
            class="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl mb-8">
          <div class="p-8 flex flex-col items-center md:flex-row md:items-start">
            <div class="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div class="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-teal-300 p-1">
                <img class="w-full h-full object-cover rounded-full" :src="user?.avatar" alt="User avatar">
              </div>
            </div>
            <div class="text-center md:text-left flex-grow">
              <div class="uppercase tracking-wide text-sm text-indigo-600 font-semibold">{{ user?.college }}</div>
              <h1 class="text-3xl font-bold text-gray-900 mt-2">{{ user?.nickname }}</h1>
              <div class="mt-4 text-gray-600 space-y-2">
                <p class="flex items-center justify-center md:justify-start">
                  <UserIcon class="w-5 h-5 mr-2 text-indigo-500"/>
                  <span class="font-medium mr-2"> 学号 / 工号：</span>{{ user?.idNumber }}
                </p>
                <p class="flex items-center justify-center md:justify-start">
                  <Award class="w-5 h-5 mr-2 text-yellow-500"/>
                  <span class="font-medium mr-2"> 最好成绩:</span>{{ user?.bestRecord }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg overflow-hidden mb-4">
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-6 text-gray-800"> 快速操作 </h2>
            <div class="space-y-4">
              <RouterLink v-for="(action, index) in [
                { to: '/user/profile', icon: UserIcon, text: '个人信息' },
                { to: '/user/records', icon: FileText, text: '记录查询' },
                { to: '/finish', icon: Share2, text: '分享参赛信息' }
              ]" :key="index" :to="action.to"
                          class="flex items-center p-4 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group hover:shadow-md">
                <component :is="action.icon"
                           class="w-6 h-6 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300"/>
                <span class="flex-1 ml-4 font-medium">{{ action.text }}</span>
                <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-300"/>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Feedback Section -->
        <div class="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg overflow-hidden mb-4">
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-6 text-gray-800"> 遇到问题？反馈给我们 ~</h2>
            <RouterLink to="/feedback"
                        class="flex items-center p-4 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group hover:shadow-md">
              <MessageSquare
                  class="w-6 h-6 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300"/>
              <span class="flex-1 ml-4 font-medium"> 反馈问题 </span>
              <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-300"/>
            </RouterLink>
          </div>
        </div>

        <!-- Admin Section -->
        <div v-if="user?.isAdmin"
             class="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg overflow-hidden mb-4">
          <div class="p-6">
            <h2 class="text-xl font-semibold mb-6 text-gray-800"> 管理员操作 </h2>
            <div @click="selectLuckUser"
                 class="flex items-center p-4 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group hover:shadow-md cursor-pointer">
              <Settings class="w-6 h-6 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300"/>
              <span class="flex-1 ml-4 font-medium"> 抽取今天的幸运儿 </span>
              <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-300"/>
            </div>
            <div @click="blueToothTest"
                 class="flex items-center p-4 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group hover:shadow-md cursor-pointer">
              <Settings class="w-6 h-6 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300"/>
              <span class="flex-1 ml-4 font-medium"> 测试蓝牙功能 </span>
              <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-300"/>
            </div>
            <div @click="ScanQrCodeTest"
                 class="flex items-center p-4 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group hover:shadow-md cursor-pointer">
              <Settings class="w-6 h-6 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300"/>
              <span class="flex-1 ml-4 font-medium"> 测试扫码功能 </span>
              <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-300"/>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer-copyright text-center py-4 text-[0.75rem]">
          <span class="text-gray-600">copyright © 2001-2024 升华工作室 </span>
          <img src="@/assets/logo.png" alt="Logo" class="inline-block mx-2 w-6 h-6">
          <a @click="showAboutHandle"
             class="text-indigo-600 hover:text-indigo-800 transition-colors duration-300 cursor-pointer"> 关于 ></a>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="less" scoped>

.footer-copyright {
  img {
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(360deg);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-white {
  animation: fadeIn 0.5s ease-out forwards;
}

:root:root {
  --van-dialog-background: rgba(255, 255, 255, 0.3);
  --van-dialog-transition: 0.5s;
  --van-overlay-background: rgba(0, 0, 0, 0.2);
}

.van-dialog {
  backdrop-filter: blur(10px); /* 高斯模糊 */
}


/* 设置半透明背景色并应用高斯模糊 */
.van-dialog__content {
  background: transparent;
}


/* 可选：标题和内容的字体样式 */
.van-dialog__header, .van-dialog__message {
  color: #333;
  font-weight: 500;
}

/* 可选：自定义按钮样式 */
.van-dialog__footer .van-button {
  background: transparent;
  color: #007aff;
  font-weight: bold;
}

:root:root {
  --van-notify-primary-background: rgba(0, 122, 255, 0.8);
  --van-notify-success-background: rgba(0, 128, 0, 0.8);
  --van-notify-danger-background: rgba(255, 69, 0, 0.8);
  --van-notify-warning-background: rgba(255, 69, 0, 0.8);
}

.van-notify {
  backdrop-filter: blur(2px);
  padding: 10px;
}

</style>
