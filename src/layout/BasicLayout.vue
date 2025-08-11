<script setup lang="ts">

import NavBar from "@/components/NavBar.vue";
import BottomBar from "@/components/BottomBar.vue";
import { onMounted, ref } from "vue";
import { useRouter } from 'vue-router';
import { initOHOSMessager, sendOHOSMessage } from '@/util/ohosMsg';
const router = useRouter();

// isOHOS
const isNotOHOS = ref(true)
const userAgent = navigator.userAgent;
const uaVersionMatch = userAgent.match(/Firefox\/(\d+\.\d+\.\d+)/);

function isOHOS() {
  if (uaVersionMatch) {
    const versionNumber = uaVersionMatch[1];
    if (versionNumber === '141.0.0') {
      isNotOHOS.value = false;
    }
  }
}

function changeTab(url: string) {
  location.replace("/" + url);
}

onMounted(() => {
  isOHOS();
  // OHOS ArkWeb JS Bridge
  // { source: string, type: string, path: string }
  if (isNotOHOS.value) {
    window.addEventListener('message', (event) => {
      // OHOS
      console.log('Incoming ArkWeb Msg', event.data)
      if (event.data?.source === 'ohos') {
        if (event.data?.type === 'routerNavigate') {
          router.push(event.data.path);
        }
      }
    });

    // Port
    // initOHOSMessager();
    // const h5Port = localStorage.getItem('h5Port');
    // console.log('storage');
    // console.log(h5Port);
    // sendOHOSMessage(h5Port, 'send function init complete');
  }
})

// 返回上一页的回调函数
const handleBack = () => {
  router.go(0); // 浏览器历史记录回退
};

const offset = ref({ x: 200, y: 400 });

</script>

<template>
  <div class="app-container">
    <NavBar />
    <router-view />
    <!-- <div class="ohos-backButton">
      <van-floating-bubble axis="xy" icon="chat" v-model:offset="offset" @click="handleBack"
        class="bubble-animation" />
    </div> -->
    <BottomBar />
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100%;
}
</style>
