<script setup lang="ts">
import {ref, computed, nextTick, onMounted, watch} from 'vue';
import {showNotify, showToast} from 'vant';
import AMapLoader from "@amap/amap-jsapi-loader";
import 'vant/es/notify/style';
import init, {RsaEncryptor} from "@/util/rsa_wasm";
import {type CheckPoint, doCheckin, getLastRecord, infoApi, listCheckPoint, loginApi, type RecordVO} from "@/api";
import md5 from "md5";
import router from "@/router";
import {useUserStore} from "@/stores/user";
import wx from "weixin-js-sdk";
import io from "socket.io-client";

const socketLocation = import.meta.env.MODE === 'development' ? "http://localhost:9092" : "";

let socket: any;

if (!socket) {
  socket = io(socketLocation);

  socket.on("connect", () => {
    console.log("连接成功");
    showToast({
      message: '与服务器的实时连接已建立',
    });
  });

  socket.on("race", (msg) => {
    if (socketMessages.value.length >= 1) {
      socketMessages.value.shift();
    }
    console.log(msg);
    socketMessages.value.push(msg);
  });

  socket.on("onlineCount", (msg) => {
    console.log("当前人数：" + msg);
    onlineCount.value = msg;
  });

  socket.on("chat", (msg) => {
    if (list.value.length >= 10) {
      list.value.shift();
    }
    console.log(msg);
    list.value.push({
      id: Math.random(),
      text: msg,
    });
  });

  socket.on("disconnect", () => {
    console.log("断开连接");
    showToast({
      message: '与服务器的实时连接已断开',
    });
  });

  socket.emit("chat", "又一位同学加入了活动！");
}

const socketMessages = ref<string[]>([]);
const list = ref<any>([]);
const messageInput = ref<string>("");
const inputRef = ref<HTMLInputElement | null>(null);
const onlineCount = ref(0);

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

const currentStep = ref(0);
const currentLocation = ref('正在获取位置...');
const canCheckIn = ref(false);
const showSuccessPopup = ref(false);
const map = ref(null);
const isLoading = ref(true);
const isSubmitting = ref(false);
const checkPoints = ref<CheckPoint[]>([]);
const matchedPoint = ref<CheckPoint | undefined>({});
const showBarrageInput = ref(false);

const checkInButtonText = computed(() => {
  return currentStep.value === 0 ? '起点打卡' : '终点打卡';
});

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

/**
 * 获取最后一条记录，如果有未完成的记录，提示用户继续
 */
const getLastRecordHandle = async () => {
  const res = await getLastRecord();
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
  const res = await listCheckPoint();
  console.log(res.data)
  checkPoints.value = res.data.data
  // // 设置初始打卡点类型
  // form.value.type = checkPoints.value.find(point => !point.isEnd)?.id || 1
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
        // 这里仅在不是终点打卡时才匹配打卡点
        if (currentStep.value === 0 || !matchedPoint.value.isEnd) {
          form.value.type = matchedPoint.value.id
        }
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
      // 打卡完成，成功横幅
      showNotify({type: 'success', message: '打卡成功！'})
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
    await getCheckInPointHandle()
    await getLastRecordHandle()
    console.log('当前进度', currentStep.value)
    await initMap()
    updateLocation()
  } catch (error) {
    console.log(error)
    showNotify({type: 'danger', message: '获取记录失败，请重试'})
  }
})

const onOffsetChange = () => {
  showToast({
    message: '点击发表弹幕，与' + onlineCount.value + '人一起分享叭~',
  })
}
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
          :autoplay="3000"
          :touchable="false"
          :show-indicators="false"
      >
        <van-swipe-item v-for="(msg, index) in socketMessages" :key="index">{{ msg }}</van-swipe-item>
      </van-swipe>
    </van-notice-bar>

    <div class="banner-image mt-4 mb-6 rounded-lg overflow-hidden relative">
      <van-barrage v-model="list" :autoplay="300" :loop="true">
        <div class="video" style="width: 100%; height: 200px"></div>
      </van-barrage>
      <img src="https://54sh.csu.edu.cn/static/compressed-img/1-16-9.jpg" alt="Banner" class="w-full h-auto absolute top-0">
    </div>

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
            @click="updateLocation"
        >
          <h2 class="text-base text-center text-xs font-semibold border-b border-gray-300"> 点击刷新 </h2>
          <p class="p-1 text-xs text-gray-700">{{ currentLocation }}</p>
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

    <van-floating-bubble
        axis="xy"
        icon="chat"
        magnetic="x"
        @offset-change="onOffsetChange"
        @click="openBarrageInput"
    />

    <van-popup v-model:show="showBarrageInput" position="bottom" :style="{ height: '20%' }">
      <div class="p-4 flex items-center">
        <van-field
            v-model="messageInput"
            placeholder="输入弹幕消息"
            class="flex-grow mr-2"
        >
          <template #button>
            <van-button size="small" type="primary" @click="addBarrageHandle"> 发送</van-button>
          </template>
        </van-field>
      </div>
    </van-popup>

    <div class="text-center mt-4 text-sm text-gray-600">
      正在与 {{ onlineCount }} 人一起征服岳麓山
    </div>

    <van-popup v-model:show="showSuccessPopup" round position="bottom">
      <div class="p-6 text-center" v-if="currentStep === 1">
        <van-icon name="success" size="48" color="#07c160"/>
        <h2 class="mt-4 text-xl font-bold"> 打卡成功！</h2>
        <p class="mt-2"> 欢迎你加入"FUN 山越岭"登山挑战赛！迈开步子，顶峰相见！</p>
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

<style lang="less" scoped>
.check-in-container {
  max-width: 600px;
  margin: 0 auto;
}

.notice-swipe {
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  font-weight: 500;
}

.banner-image {
  width: 100%;
  height: 150px;
  background-size: cover;
  background-position: center;
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
