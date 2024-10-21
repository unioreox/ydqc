<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {showNotify} from 'vant'
import AMapLoader from "@amap/amap-jsapi-loader";
import 'vant/es/notify/style'
import init, {RsaEncryptor} from "@/util/rsa_wasm";
import {doCheckin, getLastRecord, infoApi, loginApi, type RecordVO} from "@/api";
import md5 from "md5";
import router from "@/router";
import {useUserStore} from "@/stores/user";
import wx from "weixin-js-sdk";

// 从 store 中获取用户信息，初始化当前记录
const userStore = useUserStore();
const curRecord = ref<RecordVO>({
  "status": "PENDING",
  "progress": 0,
  "startTime": "",
  "halfTime": "",
  "endTime": "",
  "isValid": true,
  "createdAt": "",
  "updatedAt": "",
  "totalMilliseconds": ""
});
const isFresh = ref(false);

const currentStep = ref(0)
const currentLocation = ref('正在获取位置...')
const canCheckIn = ref(false)
const showSuccessPopup = ref(false)
const map = ref(null);
const isLoading = ref(true);
const isSubmitting = ref(false)

const checkInButtonText = computed(() => {
  const steps = ['起点打卡', '中途打卡', '终点打卡']
  return currentStep.value < 3 ? steps[currentStep.value] : '挑战完成'
})

interface Form {
  latitude: string;
  longitude: string;
  type: number;
}

const form = ref<Form>({
  longitude: "112.93388",
  latitude: "28.195522",
  type: 1,
})

/**
 * 获取最后一条记录，如果有未完成的记录，提示用户继续
 */
const getLastRecordHandle = async () => {
  getLastRecord().then(res => {
    console.log(res.data)
    if (res.data?.data) {
      if (res.data.data.status === "PENDING") {
        console.log("回填未完成的记录")
        showNotify({type: 'info', message: '您有未完成的挑战，请继续'})
        // 更新当前记录
        curRecord.value = res.data.data
        // 更新当前步骤
        currentStep.value = res.data.data.progress
        // 更新表单的类型
        if (res.data.data.progress !== 3) {
          form.value.type = res.data.data.progress + 1
        } else {
          form.value.type = 1
        }
      } else {
        curRecord.value.progress = 0
        currentStep.value = 0
        showNotify({type: 'success', message: '点击发起挑战或者再次挑战！😏'})
      }
    }
  });
}

const initMap = () => {
  window._AMapSecurityConfig = {
    securityJsCode: "cef01e97e3b8139773127f9e1ed9a134",
  };
  AMapLoader.load({
    key: "70312d47b8803ec59bf0d7b70560cb19",
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.Geocoder"],
  }).then((AMap) => {
    map.value = new AMap.Map("amap-container", {
      viewMode: "3D",
      zoom: 14,
      center: [form.value.longitude, form.value.latitude],
    });
    console.log("加载高德地图...");
    isLoading.value = false;
  }).catch((e) => {
    console.log(e);
  });
}

/**
 * 加密数据并发起打卡
 */
async function encryptDataAndCheckInHandle() {
  await init();

  const encryptor = new RsaEncryptor();
  const queryParams = Object.keys(form.value)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent((form.value as Form)[key as keyof Form])}`)
      .join('&');
  const data = new TextEncoder().encode(queryParams);
  const encrypted = encryptor.encrypt(data);

  // 获取当前 Unix 时间戳
  const timestamp = Math.floor(Date.now() / 1000);

  // 定义一个盐值
  const salt = "54sher*#^&$)!";

  // 生成 state
  const state = md5(timestamp + salt);

  return await doCheckin({
    body: {
      data: encrypted,
      state: state,
      timestamp: timestamp + "",
    }
  });
}

/**
 * 更新位置信息
 */
const updateLocation = () => {
  console.log('更新位置...')
  wx.getLocation({
    type: 'wgs84',
    success: function (res) {
      currentLocation.value = ` 纬度: ${res.latitude}, 经度: ${res.longitude}`
      canCheckIn.value = true
      // 设置表单的经纬度
      form.value.latitude = res.latitude + ""
      form.value.longitude = res.longitude + ""

      if (map.value) {

        // wgs84 转 gcj02
        AMap.convertFrom([res.longitude, res.latitude], 'gps', function (status, result) {
          if (result.info === 'ok') {
            const convertLatLng = result.locations[0];
            console.log('转换后的经纬度', convertLatLng);

            // 创建并添加标记
            const marker = new AMap.Marker({
              position: new AMap.LngLat(convertLatLng.lng, convertLatLng.lat),
              title: '当前位置'
            });
            map.value.add(marker);

            // 设置地图中心
            map.value.setZoom(17);
            map.value.setCenter([convertLatLng.lng, convertLatLng.lat]);
          }
        });
      }
    },
    fail: function () {
      currentLocation.value = '获取位置失败，请重试'
      canCheckIn.value = false
    }
  })
}

const performCheckIn = async () => {
  if (isSubmitting.value) {
    return;
  }
  isSubmitting.value = true;
  try {
    const result = await encryptDataAndCheckInHandle();
    if (result.data?.code === 0) {
      showSuccessPopup.value = true
      await getLastRecordHandle();
      if (currentStep.value === 3) {
        showNotify({type: 'success', message: '恭喜你完成了全部挑战！'})
      }
    }
  } catch (error) {
    alert(error)
    showNotify({type: 'danger', message: '打卡失败，请重试'})
  } finally {
    isSubmitting.value = false;
  }
}

const closeSuccessPopup = () => {
  showSuccessPopup.value = false
}

/**
 * 登录并获取用户信息
 */
const loginAndGetInfoHandle = () => {
  // 这里可能是微信跳转回来（有 code）或者登录态还有效
  const code: string | null = new URLSearchParams(window.location.search).get('code');
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
}
loginAndGetInfoHandle();


onMounted(async () => {
  try {
    await getLastRecordHandle()
    console.log('当前进度', currentStep.value)
    initMap()
    updateLocation()
  } catch (error) {
    console.log(error)
    showNotify({type: 'danger', message: '获取记录失败，请重试'})
  }
})
</script>

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
      <div id="amap-container" class="h-64 w-full rounded-lg">
      </div>
    </div>

    <div class="mt-6 bg-white rounded-lg shadow-md p-4 relative" @click="updateLocation">
      <h2 class="text-lg font-semibold mb-2"> 当前位置 </h2>
      <span class="refresh-text text-gray-500"> 点击即可刷新 </span>
      <p>{{ currentLocation }}</p>
    </div>

    <div class="mt-6 flex justify-center">
      <van-button
          type="primary"
          size="large"
          :disabled="!canCheckIn"
          @click="performCheckIn"
          :loading="isSubmitting"
      >
        {{ checkInButtonText }}
      </van-button>
    </div>

    <van-popup v-model:show="showSuccessPopup" round position="bottom">
      <div class="p-6 text-center" v-if="curRecord.progress === 1">
        <van-icon name="success" size="48" color="#07c160"/>
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 欢迎你加入“FUN 山越岭”登山挑战赛！迈开步子，顶峰相见！ </p>
        <van-button type="primary" block class="mt-4" @click="closeSuccessPopup">
          确定
        </van-button>
      </div>
      <div class="p-6 text-center" v-else-if="curRecord.progress === 2">
        <van-icon name="success" size="48" color="#07c160"/>
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 遵道而行, 但到半途须努力; 会心不远, 要登绝顶莫辞劳！嗨起来！小团子为你打 call！</p>
        <van-button type="primary" block class="mt-4" @click="closeSuccessPopup">
          确定
        </van-button>
      </div>
      <div class="p-6 text-center" v-else>
        <van-icon name="success" size="48" color="#07c160"/>
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 恭喜你完成挑战 </p>
        <van-button type="primary" block class="mt-4" @click="closeSuccessPopup">
          前往统计页面
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.check-in-container {
  max-width: 600px;
  margin: 0 auto;
}

.refresh-text {
  position: absolute;
  font-size: small;
  top: 0.5rem;
  right: 0.5rem;
}
</style>
