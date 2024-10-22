<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {showNotify} from 'vant'
import AMapLoader from "@amap/amap-jsapi-loader";
import 'vant/es/notify/style'
import init, {RsaEncryptor} from "@/util/rsa_wasm";
import {type CheckPoint, doCheckin, getLastRecord, infoApi, listCheckPoint, loginApi, type RecordVO} from "@/api";
import md5 from "md5";
import router from "@/router";
import {useUserStore} from "@/stores/user";
import wx from "weixin-js-sdk";
import io from "socket.io-client";

const socket = io("http://localhost:9092");

const socketMessages = ref<string[]>([]);
const list = ref<any>([]);

socket.on("connect", () => {
  console.log("连接成功");
});

socket.on("chat", (msg) => {
  // 保留最新的 10 条消息
  if (socketMessages.value.length >= 10) {
    socketMessages.value.shift();
  }
  if (list.value.length >= 10) {
    list.value.shift();
  }
  console.log(msg);
  socketMessages.value.push(msg);
  list.value.push({
    id: Math.random(),
    text: msg,
  }); // Add message to barrage list
});

setInterval(() => {
  socket.emit("chat", "checkin");
}, 1000);

const add = () => {
  list.value.push("新弹幕消息");
};


// 从 store 中获取用户信息，初始化当前记录
const userStore = useUserStore();
const curRecord = ref<RecordVO>({
  "status": "PENDING",
  "startTime": "",
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
const checkPoints = ref<CheckPoint[]>([])
const matchedPoint = ref<CheckPoint | undefined>({})

const checkInButtonText = computed(() => {
  return currentStep.value === 0 ? '起点打卡' : '终点打卡'
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
      const lastRecord = res.data.data;

      if (lastRecord.status === "PENDING") {
        console.log("回填未完成的记录")
        showNotify({type: 'success', message: '检测到你有未完成的记录，继续挑战吧！'})
        // 更新当前记录
        curRecord.value = lastRecord
        // 更新当前步骤
        currentStep.value = 1 // 引导用户终点打卡
      } else {
        currentStep.value = 0 // 引导用户起点打卡
        form.value.type = checkPoints.value.find(point => !point.isEnd)?.id || 1 // 设置为起点打卡
        showNotify({type: 'success', message: '点击发起挑战或者再次挑战！😏'})
      }
    }
  });
}

/**
 * 在地图上画圈
 */
const drawCircleHandle = async () => {
  // 在地图上画圈
  checkPoints.value.forEach(point => {
    // wgs84 转 gcj02
    AMap.convertFrom([point.longitude, point.latitude], 'gps', function (status, result) {
      if (result.info === 'ok') {
        const gcj02Point = result.locations[0];
        new AMap.Circle({
          center: new AMap.LngLat(gcj02Point.lng, gcj02Point.lat),
          radius: 50, // 50 米范围
          strokeColor: "#0038ff", // 线颜色
          strokeOpacity: 1, // 线透明度
          strokeWeight: 3, // 线宽
          fillColor: "#8da4ff", // 填充颜色
          fillOpacity: 0.35 // 填充透明度
        }).setMap(map.value);
      }
    });
  });
}

/**
 * 初始化地图
 */
const initMap = async () => {
  window._AMapSecurityConfig = {
    securityJsCode: "cef01e97e3b8139773127f9e1ed9a134",
  };
  AMapLoader.load({
    key: "70312d47b8803ec59bf0d7b70560cb19",
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.Geocoder", "Amap.Circle"],
  }).then(async (AMap) => {
    map.value = new AMap.Map("amap-container", {
      viewMode: "3D",
      zoom: 14,
      center: [form.value.longitude, form.value.latitude],
    });
    console.log("加载高德地图...");
    isLoading.value = false;
  });

}

/**
 * 获取打卡点的信息和经纬度
 */
const getCheckInPointHandle = async () => {
  listCheckPoint().then(res => {
    console.log(res.data)
    checkPoints.value = res.data.data
    // // 设置初始打卡点类型
    // form.value.type = checkPoints.value.find(point => !point.isEnd)?.id || 1
  })
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
    success: async function (res) {
      currentLocation.value = ` 纬度: ${res.latitude}, 经度: ${res.longitude}`

      // 匹配用户位置和打卡点信息
      matchedPoint.value = checkPoints.value.find(point => {
        const distance = AMap.GeometryUtil.distance([res.longitude, res.latitude], [point.longitude, point.latitude]);
        return distance <= 50; // 50 米范围内
      });

      console.log('匹配的打卡点', matchedPoint.value)


      if (matchedPoint.value !== undefined) {
        form.value.type = matchedPoint.value?.id;
        canCheckIn.value = true;
      } else {
        canCheckIn.value = false;
        showNotify({type: 'danger', message: '不在打卡点范围内，请移动到打卡点附近'});
      }

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

      await drawCircleHandle();
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
      if (currentStep.value === 1) {
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
    await initMap()
    await getCheckInPointHandle()
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

    <van-notice-bar left-icon="volume-o" :scrollable="false" class="custom-notice-bar">
      <van-swipe
          vertical
          class="notice-swipe"
          :autoplay="500"
          :touchable="false"
          :show-indicators="false"
      >
        <van-swipe-item v-for="(msg, index) in socketMessages" :key="index">{{ msg }}</van-swipe-item>
      </van-swipe>
    </van-notice-bar>

    <van-barrage v-model="list">
      <div class="video" style="width: 100%; height: 150px"></div>
    </van-barrage>
    <van-space style="margin-top: 10px">
      <van-button @click="add" type="primary" size="small"> 弹幕</van-button>
    </van-space>

    <div class="mt-6 bg-white rounded-lg shadow-lg p-2 flex space-x-2">
      <div id="amap-container" class="h-48 w-3/4 rounded-lg overflow-hidden border border-gray-200">
      </div>
      <div class="flex-1 space-y-2">
        <van-steps :active="currentStep" direction="vertical" active-icon="success" active-color="#07c160">
          <van-step> 起点打卡</van-step>
          <van-step> 终点打卡</van-step>
        </van-steps>
        <div
            class="p-1 relative bg-gray-50 rounded-lg shadow-inner cursor-pointer hover:bg-gray-100 transition duration-200"
            @click="updateLocation">
          <h2 class="text-base text-center text-[0.5rem] font-semibold border-b border-gray-300"> 点击刷新 </h2>
          <p class="p-1 text-[0.25rem] text-gray-700">{{ currentLocation }}</p>
        </div>
      </div>
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
      <div class="p-6 text-center" v-if="currentStep === 0">
        <van-icon name="success" size="48" color="#07c160"/>
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 欢迎你加入“FUN 山越岭”登山挑战赛！迈开步子，顶峰相见！ </p>
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

.custom-notice-bar {
  background-color: #f0f9ff;
  color: #333;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.notice-swipe {
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  font-weight: 500;
}
</style>
