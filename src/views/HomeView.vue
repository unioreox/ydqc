<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { showDialog, showImagePreview, showNotify, showToast } from 'vant';
import AMapLoader from "@amap/amap-jsapi-loader";
import 'vant/es/notify/style';
import init, { RsaEncryptor } from "@/util/rsa_wasm";
import { type CheckPoint, doCheckin, getLastRecord, infoApi, listCheckPoint, loginApi, type RecordVO } from "@/api";
import md5 from "md5";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import wx from "weixin-js-sdk";
import { io, Socket } from "socket.io-client";
import { wgs84ToGcj02 } from "@/util/convertLocation";
import getCanvasFingerPrint from "@/util/canvasFingerPrint"

const socketLocation = import.meta.env.MODE === 'development' ? "http://localhost:9092" : "";

const socket: Socket = io(socketLocation);
const isWSConnected = ref(false);
const socketMessages = ref<string[]>([]);
const list = ref<{ id: number; text: string }[]>([]);
const messageInput = ref<string>("");
const inputRef = ref<HTMLInputElement | null>(null);
const onlineCount = ref(0);

import simpleMapImgUrl from "@/assets/simpleMap.png";

const userStore = useUserStore();
const curRecord = ref<RecordVO>({
  status: "PENDING",
  startTime: "",
  endTime: "",
  isValid: true,
  createdAt: "",
  updatedAt: "",
  totalMilliseconds: ""
});

const currentStep = ref(0);
const currentLocation = ref('正在获取位置...');
const canCheckIn = ref(false);
const showSuccessPopup = ref(false);
const map = ref<AMap.Map | null>(null);
const isLoading = ref(true);
const isSubmitting = ref(false);
const checkPoints = ref<CheckPoint[]>([]);
const matchedPoint = ref<CheckPoint | undefined>();
const showBarrageInput = ref(false);

const checkInButtonText = computed(() => currentStep.value === 0 ? '起点打卡' : '终点打卡');

interface Form {
  latitude: string;
  longitude: string;
  type: number;
}

const form = ref<Form>({
  longitude: "112.93388",
  latitude: "28.195522",
  type: 1,
});

const openBarrageInput = () => {
  showBarrageInput.value = true;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

const addBarrageHandle = () => {
  if (messageInput.value.trim() !== "") {
    socket.emit("chat", messageInput.value);
    messageInput.value = "";
  }
  showBarrageInput.value = false;
};

watch(showBarrageInput, (value) => {
  if (!value) {
    inputRef.value?.blur();
  }
});

const getLastRecordHandle = async () => {
  try {
    const res = await getLastRecord();
    if (res.data?.data) {
      const lastRecord = res.data.data;
      if (lastRecord.status === "PENDING") {
        showNotify({ type: 'success', message: '检测到你有未完成的记录，继续挑战吧！' });
        curRecord.value = lastRecord;
        currentStep.value = 1;
      } else {
        currentStep.value = 0;
        form.value.type = checkPoints.value.find(point => !point.isEnd)?.id || 1;
        showNotify({ type: 'success', message: '点击发起挑战或者再次挑战！😏' });
      }
    } else {
      curRecord.value = {
        status: "PENDING",
        startTime: "",
        endTime: "",
        isValid: true,
        createdAt: "",
        updatedAt: "",
        totalMilliseconds: ""
      };
    }
  } catch (error) {
    console.error('Failed to get last record:', error);
    showNotify({ type: 'danger', message: '获取上次记录失败，请重试' });
  }
};

const drawCircleHandle = async () => {
  if (!map.value) return;

  map.value.remove(map.value.getAllOverlays('circle'));

  checkPoints.value.forEach(point => {
    // wgs84 转 gcj02
    // wgs84 转 gcj02
    const [gcj02Lng, gcj02Lat] = wgs84ToGcj02(point.longitude, point.latitude);
    console.log("添加打卡指示");
    new AMap.Circle({
      center: new AMap.LngLat(gcj02Lng, gcj02Lat),
      radius: 50,
      strokeColor: "#ff0000",
      strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: "#ff8b51",
      fillOpacity: 0.35
    }).setMap(map.value);
  });
};

const initMap = async () => {
  window._AMapSecurityConfig = {
    securityJsCode: "cef01e97e3b8139773127f9e1ed9a134",
  };

  try {
    const AMap = await AMapLoader.load({
      key: "70312d47b8803ec59bf0d7b70560cb19",
      version: "2.0",
      plugins: ["AMap.Scale", "AMap.Geocoder", "AMap.Circle"],
    });

    map.value = new AMap.Map("amap-container", {
      viewMode: "3D",
      zoom: 14,
      center: [form.value.longitude, form.value.latitude],
    });

    console.log("加载高德地图成功");
    isLoading.value = false;
  } catch (error) {
    console.error("加载高德地图失败:", error);
    showNotify({ type: 'danger', message: '地图加载失败，请刷新重试' });
  }
};

const getCheckInPointHandle = async () => {
  try {
    const res = await listCheckPoint();
    if (res.data?.data) {
      checkPoints.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to get check-in points:', error);
    showNotify({ type: 'danger', message: '获取打卡点失败，请重试' });
  }
};

const encryptDataAndCheckInHandle = async () => {
  await init();
  const encryptor = new RsaEncryptor();
  const queryParams = Object.entries(form.value)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const data = new TextEncoder().encode(queryParams);
  const encrypted = encryptor.encrypt(data);

  const timestamp = Math.floor(Date.now() / 1000);
  const salt = "54sher*#^&$)!";
  const state = md5(timestamp + salt);
  const initCanvasFingerPrint = getCanvasFingerPrint();

  return await doCheckin({
    headers: {
      'X-54sh-Authorization': initCanvasFingerPrint
    },
    body: {
      data: encrypted,
      state: state,
      timestamp: timestamp.toString(),
    }
  });
};

const updateLocation = () => {
  wx.getLocation({
    type: 'wgs84',
    success: async (res) => {
      currentLocation.value = ` 纬度: ${res.latitude}, 经度: ${res.longitude}`;

      matchedPoint.value = checkPoints.value.find(point => {
        const distance = AMap.GeometryUtil.distance([res.longitude, res.latitude], [point.longitude, point.latitude]);
        return distance <= 50;
      });

      if (matchedPoint.value) {
        if (currentStep.value === 0 || !matchedPoint.value.isEnd) {
          form.value.type = matchedPoint.value.id;
        }
        if (currentStep.value === 1 && !matchedPoint.value.isEnd) {
          showNotify({ type: 'warning', message: '不在终点打卡点范围内，请移动到终点打卡点附近' });
        }
        if (currentStep.value === 0 && matchedPoint.value.isEnd) {
          showNotify({ type: 'warning', message: '不在起点打卡点范围内，请移动到起点打卡点附近' });
        }
        canCheckIn.value = true;
      } else {
        canCheckIn.value = false;
        showNotify({ type: 'warning', message: '不在打卡点范围内，请移动到打卡点附近' });
      }

      form.value.latitude = res.latitude.toString();
      form.value.longitude = res.longitude.toString();

      if (map.value) {
        AMap.convertFrom([res.longitude, res.latitude], 'gps', async (status, result) => {
          if (result.info === 'ok') {
            const convertLatLng = result.locations[0];
            const marker = new AMap.Marker({
              position: new AMap.LngLat(convertLatLng.lng, convertLatLng.lat),
              title: '当前位置'
            });
            map.value?.remove(map.value.getAllOverlays('marker'));
            map.value?.add(marker);
            await drawCircleHandle();
            map.value?.setZoom(17);
            map.value?.setCenter([convertLatLng.lng, convertLatLng.lat]);
          }
        });
      }

    },
    fail: () => {
      currentLocation.value = '获取位置失败，请重试';
      canCheckIn.value = false;
      showNotify({ type: 'danger', message: '获取位置失败，请检查定位权限' });
    }
  });
};

const performCheckIn = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const result = await encryptDataAndCheckInHandle();
    if (result.data?.code === 0) {
      showSuccessPopup.value = true;

      // 放在getLastRecordHandle前, 否则step会归位
      if (currentStep.value === 1) {
        // 前一阶段为PENDING状态, 完成终点打卡
        currentStep.value === 2;
        // 给爬山的同学显示一下进度条全满, 3s
        setTimeout(() => {
          // const endCanvasFingerPrint = getCanvasFingerPrint("endCanvasFingerPrint");
          getLastRecordHandle();
        }, 2000);
      } else {
        // 前一阶段为起点打卡
        // const startCanvasFingerPrint = getCanvasFingerPrint("startCanvasFingerPrint");
        await getLastRecordHandle();
      }

      showNotify({ type: 'success', message: '打卡成功！' });

      if (!userStore.user?.count && currentStep.value === 0) {
        await router.push('/finish');
      }

    } else {
      showNotify({ type: 'danger', message: '打卡失败，请重试' });
    }
  } catch (error) {
    console.error('Check-in failed:', error);
    showNotify({ type: 'danger', message: '打卡失败，请重试' });
  } finally {
    isSubmitting.value = false;
  }
};


const closeSuccessPopup = () => {
  showSuccessPopup.value = false;
};

let isLoginHandled = false;

const loginAndGetInfoHandle = async () => {
  if (isLoginHandled) return;
  isLoginHandled = true;

  const code = new URLSearchParams(window.location.search).get('code');
  if (code) {
    try {
      await loginApi({ query: { code } });
      const res = await infoApi();
      if (res.data?.data) {
        userStore.setUser(res.data.data);
        // 删掉 code 参数，防止刷新页面时再次登录
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Login or info fetch failed:', error);
      showNotify({ type: 'danger', message: '登录失败，请重试' });
    }
  } else {
    try {
      const res = await infoApi();
      if (res.data?.data) {
        userStore.setUser(res.data.data);
      }
    } catch (error) {
      console.error('Info fetch failed:', error);
      showNotify({ type: 'danger', message: '获取用户信息失败，请重试' });
    }
  }
};

onMounted(async () => {
  try {
    await loginAndGetInfoHandle();
    await getCheckInPointHandle();
    await getLastRecordHandle();
    await initMap();
    updateLocation();
  } catch (error) {
    console.error('Initialization failed:', error);
    showNotify({ type: 'danger', message: '初始化失败，请刷新重试' });
  }
});

// WebSocket event handlers
socket.on("connect", () => {
  isWSConnected.value = true;
  // socket.emit("chat", "又有一位同学加入了比赛！🎉");
});

socket.on("race", (msg) => {
  if (socketMessages.value.length >= 1) {
    socketMessages.value.shift();
  }
  socketMessages.value.push(msg);
});

socket.on("onlineCount", (msg) => {
  onlineCount.value = msg;
});

socket.on("chat", (msg) => {
  if (list.value.length >= 10) {
    list.value.shift();
  }
  list.value.push({
    id: Math.random(),
    text: msg,
  });
});

socket.on("disconnect", () => {
  isWSConnected.value = false;
});

const onOffsetChange = () => {
  showToast({
    message: '点击发表弹幕，与' + onlineCount.value + '人一起分享叭~',
  });
};
</script>

<template>
  <div class="mountain-challenge bg-gradient-to-b from-blue-100 to-green-100 min-h-screen p-4">
    <van-notice-bar left-icon="info-o" color="#1989fa" background="#ecf9ff" scrollable>
      欢迎参加中南大学 2024 首届秋季登山节！完成起点和终点的打卡，挑战成功！
    </van-notice-bar>

    <van-notice-bar left-icon="volume-o" :scrollable="false" class="mt-2" v-if="socketMessages.length > 0">
      <van-swipe vertical class="notice-swipe" :autoplay="3000" :touchable="false" :show-indicators="false">
        <van-swipe-item v-for="(msg, index) in socketMessages" :key="index">{{ msg }}</van-swipe-item>
      </van-swipe>
    </van-notice-bar>

    <div class="mt-4 relative overflow-hidden rounded-lg shadow-lg">
      <van-barrage v-model="list" :autoplay="300" :loop="true">
        <div class="video relative" style="width: 100%; height: 160px">
          <img src="@/assets/background.png" alt="Banner" class="w-full h-full object-cover">
        </div>
      </van-barrage>
    </div>

    <div class="mt-6 rounded-lg shadow-lg p-4 map-card">
      <div class="flex space-x-4">
        <div id="amap-container" class="h-58 w-2/3 rounded-lg overflow-hidden border border-gray-200"></div>
        <div class="flex-1 flex flex-col justify-between">
          <van-steps :active="currentStep - 1" class="w-32 h-26" direction="vertical" active-color="#07c160">
            <van-step> 起点打卡</van-step>
            <van-step> 终点打卡</van-step>
          </van-steps>
          <van-image :src="simpleMapImgUrl" fit="cover" style="background: #fff" class="h-28 rounded-lg p-1"
            @click="showImagePreview([simpleMapImgUrl])" />
          <div class="p-2 bg-gray-50 rounded-lg shadow-inner cursor-pointer hover:bg-gray-100 transition duration-200"
            @click="updateLocation">
            <h2 class="text-[0.5em] font-semibold text-center border-b border-gray-300 pb-1 mb-1"> 点击刷新位置 </h2>
            <!--<p class="text-xs text-gray-700">{{currentLocation}}</p>-->
            <p class="text-[0.4rem] text-gray-700"> 请在红色打卡范围（50m）进行打卡 </p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-center">
      <van-button type="primary" size="large" :disabled="!canCheckIn" @click="performCheckIn" :loading="isSubmitting"
        class="w-full max-w-xs">
        {{ checkInButtonText }}
      </van-button>
    </div>

    <van-floating-bubble axis="xy" icon="chat" magnetic="x" @offset-change="onOffsetChange" @click="openBarrageInput" />

    <van-popup v-model:show="showBarrageInput" position="bottom" :style="{ height: '20%' }">
      <div class="p-4 flex items-center">
        <van-field v-model="messageInput" placeholder="输入弹幕消息" class="flex-grow mr-2">
          <template #button>
            <van-button size="small" type="primary" @click="addBarrageHandle"> 发送</van-button>
          </template>
        </van-field>
      </div>
    </van-popup>

    <div class="text-center mt-4 text-sm text-gray-600">
      正在与 {{ onlineCount }} 人一起征服岳麓山
    </div>
    <div class="text-center mt-2 text-sm text-gray-600">
      服务器实时连接状态：
      <van-icon :name="isWSConnected ? 'success' : 'close'" :color="isWSConnected ? 'green' : 'red'" />
      {{ isWSConnected ? '已连接' : '未连接' }}
    </div>

    <van-divider class="mt-4" />

    <!--<div class="lucky-container p-4">-->
    <!--  <div class="text-center"> 昨日获奖名单</div>-->
    <!--  <van-swipe-->
    <!--      height="2em"-->
    <!--      class="text-center"-->
    <!--      :autoplay="3000"-->
    <!--      :touchable="false"-->
    <!--      :show-indicators="false"-->
    <!--  >-->
    <!--    <van-swipe-item>-->
    <!--      <div> 一等奖：小明 <br/>-->
    <!--        奖品：iPhone 13-->
    <!--      </div>-->
    <!--    </van-swipe-item>-->
    <!--    <van-swipe-item>-->
    <!--      <div> 二等奖：小红</div>-->
    <!--      <div> 奖品：iPad Pro</div>-->
    <!--    </van-swipe-item>-->
    <!--    <van-swipe-item>-->
    <!--      <div> 三等奖：小刚</div>-->
    <!--      <div> 奖品：AirPods Pro</div>-->
    <!--    </van-swipe-item>-->
    <!--  </van-swipe>-->
    <!--</div>-->

    <van-popup v-model:show="showSuccessPopup" round position="bottom">
      <div class="p-6 text-center" v-if="currentStep === 1">
        <van-icon name="success" size="48" color="#07c160" />
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 欢迎你加入"FUN 山越岭"登山挑战赛！迈开步子，顶峰相见！</p>
        <van-button type="primary" block class="mt-4" @click="closeSuccessPopup">
          确定
        </van-button>
      </div>
      <div class="p-6 text-center" v-else>
        <van-icon name="success" size="48" color="#07c160" />
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 恭喜你已经完成挑战 {{ userStore.user?.count ? userStore.user?.count + 1 : 1 }} 次 </p>
        <van-button to="/finish" type="primary" block class="mt-4" @click="closeSuccessPopup">
          前往统计页面
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<style lang="less" scoped>
.mountain-challenge {
  max-width: 600px;
  margin: 0 auto;
}

.map-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.notice-swipe {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

:deep(.van-barrage) {
  --van-barrage-item-height: 30px;
  --van-barrage-item-font-size: 14px;
  --van-barrage-item-color: #fff;
  --van-barrage-item-background: rgba(0, 0, 0, 0.7);
  --van-barrage-item-border-radius: 15px;
  --van-barrage-item-padding: 0 10px;
}
</style>
