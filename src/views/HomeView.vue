<template>
  <div class="check-in-container bg-gray-100 min-h-screen p-4">
    <van-notice-bar
        left-icon="info-o"
        color="#1989fa"
        background="#ecf9ff"
        scrollable
    >
      欢迎参加 "FUN 山越岭"登山挑战赛！完成三个检查点的打卡，挑战成功！
    </van-notice-bar>

    <div class="mt-6">
      <van-steps :active="currentStep" active-icon="success" active-color="#07c160">
        <van-step> 起点打卡</van-step>
        <van-step> 中途打卡</van-step>
        <van-step> 终点打卡</van-step>
      </van-steps>
    </div>

    <div class="mt-6 bg-white rounded-lg shadow-md p-4">
      <div id="map" class="h-64 w-full rounded-lg">
        <AMap/>
      </div>
    </div>

    <div class="mt-6 bg-white rounded-lg shadow-md p-4">
      <h2 class="text-lg font-semibold mb-2"> 当前位置 </h2>
      <p>{{ currentLocation }}</p>
    </div>

    <div class="mt-6 flex justify-center">
      <van-button
          type="primary"
          size="large"
          :disabled="!canCheckIn"
          @click="performCheckIn"
      >
        {{ checkInButtonText }}
      </van-button>
    </div>

    <van-popup v-model:show="showSuccessPopup" round position="bottom">
      <div class="p-6 text-center">
        <van-icon name="success" size="48" color="#07c160"/>
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 继续前进到下一个检查点 </p>
        <van-button type="primary" block class="mt-4" @click="closeSuccessPopup">
          确定
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {showNotify} from 'vant'
import 'vant/es/notify/style'
import AMap from "@/components/AMap.vue";
import init, {RsaEncryptor} from "@/util/rsa_wasm";
import {doCheckin, infoApi, loginApi, type RecordVO} from "@/api";
import md5 from "md5";

// Simulated API functions
const getLastRecord = () => Promise.resolve({data: {progress: 1}})
const performCheckInApi = () => Promise.resolve({success: true})

const currentStep = ref(0)
const currentLocation = ref('正在获取位置...')
const canCheckIn = ref(false)
const showSuccessPopup = ref(false)

const checkInButtonText = computed(() => {
  const steps = ['起点打卡', '中途打卡', '终点打卡']
  return currentStep.value < 3 ? steps[currentStep.value] : '挑战完成'
})

const initMap = () => {
  // Here you would initialize and set up your map
  // For example, using a library like Leaflet or Google Maps
  console.log('Map initialized')
}

const updateLocation = () => {
  // Simulating location update
  // In a real app, you'd use the Geolocation API or a mapping library
  currentLocation.value = '纬度: 30.123, 经度: 120.456'
  canCheckIn.value = true
}

const form = ref({
  latitude: "35.5678",
  longitude: "67.5467",
  type: 1,
})

const performCheckIn = async () => {
  try {
    const result = await performCheckInApi()
    if (result.success) {
      currentStep.value++
      showSuccessPopup.value = true
      if (currentStep.value === 3) {
        showNotify({type: 'success', message: '恭喜你完成了全部挑战！'})
      }
    }
  } catch (error) {
    showNotify({type: 'danger', message: '打卡失败，请重试'})
  }
}

const closeSuccessPopup = () => {
  showSuccessPopup.value = false
}

import router from "@/router";
import {useUserStore} from "@/stores/user";

const userStore = useUserStore();
const curRecord = ref<RecordVO>({});
const isFresh = ref(false);
// 这里可能是微信跳转回来（有 code）或者登录态还有效
const code: string | null = new URLSearchParams(window.location.search).get('code');
const loginAndGetInfoHandle = () => {
  if (code) {
    loginApi({query: {code}}).then(res => {
      infoApi().then(res => {
        res.data?.data && userStore.setUser(res.data.data);
      });
    }).catch(() => { // 登录失败，跳转到登录页
      router.push('/login');
    });
  } else {
    infoApi().then(res => {
      res.data?.data && userStore.setUser(res.data.data);
    });
  }
  showNotify({type: 'success', message: ` 登录成功，欢迎 ${userStore.user?.name} 同学！`});
}
loginAndGetInfoHandle();
onMounted(async () => {
  try {
    const record = await getLastRecord()
    currentStep.value = record.data.progress - 1
    initMap()
    updateLocation()
  } catch (error) {
    showNotify({type: 'danger', message: '获取记录失败，请重试'})
  }

  async function encryptData() {
    await init();

    const encryptor = new RsaEncryptor();
    const queryParams = Object.keys(form.value)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(form.value[key])}`)
        .join('&');
    const data = new TextEncoder().encode(queryParams);
    const encrypted = encryptor.encrypt(data);

    console.log('Encrypted Data:', encrypted);

    // 获取当前 Unix 时间戳
    const timestamp = Math.floor(Date.now() / 1000);

    // 定义一个盐值
    const salt = "54sher*#^&$)!"; // 你可以根据需求更改这个值

    // 生成 state
    const state = md5(timestamp + salt);

    doCheckin({
      body: {
        data: encrypted,
        state: state,
        timestamp: timestamp + "",
      }
    })
  }

  await encryptData();
})
</script>

<style scoped>
.check-in-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
