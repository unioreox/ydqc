<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { showDialog, showImagePreview, showNotify, showToast, Sticky } from 'vant';
import AMapLoader from "@amap/amap-jsapi-loader";
import 'vant/es/notify/style';
import init, { RsaEncryptor } from "@/util/rsa_wasm";
import { type CheckPoint, doCheckin, getLastRecord, infoApi, listCheckPoint, loginApi, type RecordVo } from "@/api";
import md5 from "md5";
import router from "@/router";
import { useUserStore } from "@/stores/user";
import wx from "weixin-js-sdk";
import { io, Socket } from "socket.io-client";
import getCanvasFingerPrint from "@/util/canvasFingerPrint"
import Clarity from '@microsoft/clarity';
import markerIconUrl from '@/assets/marker.svg';
import mainBgSrc from '@/assets/background.png'
import EXIF from 'exif-js-next';
import FingerprintJS from '@fingerprintjs/fingerprintjs'

// fingerprint.js
const fpPromise = FingerprintJS.load();

const fpValue = ref<string>("NULL");
async function getFpValue() {
  const fp = await fpPromise
  const result = await fp.get()
  fpValue.value = result.visitorId;
  // console.log(fpValue.value);
}

// WGS84 To GCJ02
// import { wgs84ToGcj02 } from "@/util/convertLocation";
import gcoord from 'gcoord';
// import { AntiFakeGPS, useAntiFakeGPS } from 'anti-fakegps'

const socketLocation = import.meta.env.MODE === 'development' ? "http://localhost:9092" : "";
const isDevMode = ref(import.meta.env.MODE);

const socket: Socket = io(socketLocation);
const isWSConnected = ref(false);
const socketMessages = ref<string[]>([]);
const list = ref<{ id: number; text: string }[]>([]);
const messageInput = ref<string>("");
const inputRef = ref<HTMLInputElement | null>(null);
const onlineCount = ref(0);

import simpleMapImgUrl from "@/assets/simpleMap.png";
import type { WeatherData } from "@/types/weather";
import type { BuildInfo } from "@/types/buildInfo";
import { LayoutGrid, LayoutTemplate } from 'lucide-vue-next';
import showOHOSNotify from '@/util/ohosNotify';

const userStore = useUserStore();
const curRecord = ref<RecordVo>({
  status: "PENDING",
  startTime: "",
  endTime: "",
  isValid: true,
  createdAt: "",
  updatedAt: "",
  totalMilliseconds: ""
});

const currentStep = ref(0);
const currentStage = ref(-1);
const currentLocation = ref('正在获取位置...');
const canCheckIn = ref(false);
const showSuccessPopup = ref(false);
const map = ref<AMap.Map | null>(null);
const isLoading = ref(true);
const isSubmitting = ref(false);
const checkPoints = ref<CheckPoint[]>([]);
const matchedPoint = ref<CheckPoint | undefined>();
const showBarrageInput = ref(false);

// 协助模式
const pressButtonCount = ref<number>(0);
const wxGetLocationWgs84Data = ref({
  latitude: 28.195522,
  longitude: 112.93388,
  accuracy: -1,
});

// 获取最后一次更新位置的时间
const lastUpdateLocationTime = ref(0);

const checkInButtonText = computed(() => currentStep.value === 0 ? '起点打卡' : '终点打卡');

interface Form {
  latitude: string;
  longitude: string;
  accuracy: string;
  type: number;
}

const form = ref<Form>({
  longitude: "112.93388",
  latitude: "28.195522",
  accuracy: "1",
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
        showOHOSNotify(isNotOHOS.value, 'success', '检测到你有未完成的记录，继续挑战吧！')
        // showNotify({ type: 'success', message: '检测到你有未完成的记录，继续挑战吧！' });
        curRecord.value = lastRecord;
        currentStep.value = 1;
        currentStage.value = 0;
      } else {
        currentStep.value = 0;
        currentStage.value = -1;
        form.value.type = checkPoints.value.find(point => !point.isEnd)?.id || 1;

        showOHOSNotify(isNotOHOS.value, 'success', '点击发起挑战或者再次挑战！😏')
        // showNotify({ type: 'success', message: '点击发起挑战或者再次挑战！😏' });
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
    showOHOSNotify(isNotOHOS.value, 'danger', '获取上次记录失败，请重试')
    // showNotify({ type: 'danger', message: '获取上次记录失败，请重试' });
  }
};

const drawCircleHandle = async () => {
  if (!map.value) return;

  map.value.remove(map.value.getAllOverlays('circle'));

  checkPoints.value.forEach(point => {
    // wgs84 转 gcj02
    if (!point.longitude || !point.latitude) {
      return;
    }
    var result = gcoord.transform(
      // 经纬度坐标
      [point.longitude * 1, point.latitude * 1],
      gcoord.WGS84,               // 当前坐标系
      gcoord.GCJ02                // 目标坐标系
    );

    // const gcj02DataRaw: any = wgs84ToGcj02(point.latitude + "," + point.longitude);
    // const gcj02Data = [parseFloat(gcj02DataRaw[0]), parseFloat(gcj02DataRaw[1])];
    console.log("添加打卡指示");
    new AMap.Circle({
      center: new AMap.LngLat(result[0], result[1]),
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
      // layers: [new AMap.TileLayer.Satellite(),
      //   new AMap.TileLayer.Traffic({opacity: 0.5}),
      //   new AMap.TileLayer.RoadNet({opacity: 0.5})],
      viewMode: "3D",
      zoom: 14,
      center: [form.value.longitude, form.value.latitude],
    });

    console.log("加载高德地图成功");
    isLoading.value = false;
  } catch (error) {
    console.error("加载高德地图失败:", error);
    showOHOSNotify(isNotOHOS.value, 'danger', '地图加载失败，请刷新重试')
    // showNotify({ type: 'danger', message: '地图加载失败，请刷新重试' });
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
    showOHOSNotify(isNotOHOS.value, 'danger', '获取打卡点失败，请重试')
    // showNotify({ type: 'danger', message: '获取打卡点失败，请重试' });
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
    // headers: {
    //   'X-54sh-Authorization': initCanvasFingerPrint
    // },
    body: {
      data: encrypted,
      state: state,
      fingerprintNew: initCanvasFingerPrint,
      fingerprint: fpValue.value,
      timestamp: timestamp.toString(),
    }
  });
};

const locationButtonCooldown = ref(false);
const testInfo = ref("testInfo");
const ohosPosition = ref({
  lat: 0,
  lng: 0,
  acc: 0,
});
const updateLocation = () => {
  pressButtonCount.value++;
  if (locationButtonCooldown.value) return;

  // 冷却
  locationButtonCooldown.value = true;

  // 更新最后一次获取位置的时间
  lastUpdateLocationTime.value = Date.now();
  drawCircleHandle();




  if (!isNotOHOS.value) {
    // OHOS 备用方案
    // window.location.href = 'ohos://callLocationKitAbility'

    // showOHOSNotify(isNotOHOS.value, 'success', 'onUpdate');
    // const ohosLocationKitLatElement = document.getElementById('ohosLocationKitLat');
    // const LatString = ohosLocationKitLatElement ? ohosLocationKitLatElement.innerText : '';
    // const ohosLocationKitLngElement = document.getElementById('ohosLocationKitLng');
    // const LngString = ohosLocationKitLngElement ? ohosLocationKitLngElement.innerText : '';
    // const ohosLocationKitAccElement = document.getElementById('ohosLocationKitAcc');
    // const AccString = ohosLocationKitAccElement ? ohosLocationKitAccElement.innerText : '';

    // ohosPosition.value.lat = Number(LatString);
    // ohosPosition.value.lng = Number(LngString);
    // ohosPosition.value.acc = Number(AccString);

    // OHOS 主要方案
    if (navigator.geolocation) {
      // 访问设备地理位置
      navigator.geolocation.getCurrentPosition((arkWebPosition) => {
        ohosPosition.value.lat = arkWebPosition.coords.latitude;
        ohosPosition.value.lng = arkWebPosition.coords.longitude;
        ohosPosition.value.acc = arkWebPosition.coords.accuracy;
        console.log('OHOS LocationKit', ohosPosition.value, arkWebPosition.coords);

        // if (ohosPosition.value.lat === 0 && ohosPosition.value.lng === 0) {
        //   showOHOSNotify(isNotOHOS.value, 'danger', '已获取 ohos.locationKit 数据, 但数据为空\n请打开定位权限')
        // }

        if (arkWebPosition.coords) {
          // 业务逻辑同wx.getLocation
          matchedPoint.value = checkPoints.value.find(point => {
            const distance = AMap.GeometryUtil.distance([ohosPosition.value.lng, ohosPosition.value.lat], [point.longitude, point.latitude]);
            return distance <= 50;
          });

          wxGetLocationWgs84Data.value.latitude = ohosPosition.value.lat;
          wxGetLocationWgs84Data.value.longitude = ohosPosition.value.lng;
          form.value.latitude = ohosPosition.value.lat.toString();
          form.value.longitude = ohosPosition.value.lng.toString();

          let ohosResult = gcoord.transform(
            // 经纬度坐标
            [ohosPosition.value.lng * 1, ohosPosition.value.lat * 1],
            gcoord.WGS84,               // 当前坐标系
            gcoord.GCJ02                 // 目标坐标系
          );

          const marker = new AMap.Marker({
            position: new AMap.LngLat(ohosResult[0], ohosResult[1]),
            title: '当前位置'
          });

          map.value?.remove(map.value.getAllOverlays('marker'));
          map.value?.add(marker);
          // await drawCircleHandle();
          map.value?.setZoom(17);
          map.value?.setCenter([ohosResult[0], ohosResult[1]]);

          // 打卡提示放在后面
          if (matchedPoint.value) {
            if (currentStep.value === 0 || !matchedPoint.value.isEnd) {
              form.value.type = matchedPoint.value.id ?? -1;
            }
            if (currentStep.value === 1 && !matchedPoint.value.isEnd) {
              showOHOSNotify(isNotOHOS.value, 'warning', '不在终点打卡点范围内，请移动到终点打卡点附近')
              // showNotify({ type: 'warning', message: '不在终点打卡点范围内，请移动到终点打卡点附近' });
            }
            if (currentStep.value === 0 && matchedPoint.value.isEnd) {
              showOHOSNotify(isNotOHOS.value, 'warning', '不在起点打卡点范围内，请移动到起点打卡点附近')
              // showNotify({ type: 'warning', message: '不在起点打卡点范围内，请移动到起点打卡点附近' });
            }
            canCheckIn.value = true;
            form.value.type = matchedPoint.value.id ?? -1;
          } else {
            canCheckIn.value = false;
            showOHOSNotify(isNotOHOS.value, 'warning', '不在打卡点范围内，请移动到打卡点附近')
            // showNotify({ type: 'warning', message: '不在打卡点范围内，请移动到打卡点附近' });
          }
        }
      });
    } else {
      // 未获取到OHOS的 LocationKit 数据
      // 可能原因 ArkWeb 错误
      showOHOSNotify(isNotOHOS.value, 'danger', 'SystemCapability.Location.Location.Core 错误\n调用 LocationKit 失败')
    }
  } else if (isAndroidApp) {
    console.log("发现安卓客户端")
    const androidBridge = window.AndroidAPP;
    androidBridge.apply4Location("onLocationReceived");
    window.onLocationReceived = function(locationInfoJson) {
      if (locationInfoJson)
      {
        const locationInfo = JSON.parse(locationInfoJson);

        ohosPosition.value.lat = locationInfo.latitude;
        ohosPosition.value.lng = locationInfo.longitude;
        ohosPosition.value.acc = locationInfo.accuracy;

        // 业务逻辑同wx.getLocation
        currentLocation.value = ` 纬度: ${locationInfo.latitude}, 经度: ${locationInfo.latitude}`;
        matchedPoint.value = checkPoints.value.find(point => {
          const distance = AMap.GeometryUtil.distance([ohosPosition.value.lng, ohosPosition.value.lat], [point.longitude, point.latitude]);
          return distance <= 50;
        });

        wxGetLocationWgs84Data.value.latitude = ohosPosition.value.lat;
        wxGetLocationWgs84Data.value.longitude = ohosPosition.value.lng;
        form.value.latitude = locationInfo.latitude.toString();
        form.value.longitude = locationInfo.longitude.toString();

        let ohosResult = gcoord.transform(
            // 经纬度坐标
            [ohosPosition.value.lng * 1, ohosPosition.value.lat * 1],
            gcoord.WGS84,               // 当前坐标系
            gcoord.GCJ02                 // 目标坐标系
        );

        const marker = new AMap.Marker({
          position: new AMap.LngLat(ohosResult[0], ohosResult[1]),
          title: '当前位置'
        });

        map.value?.remove(map.value.getAllOverlays('marker'));
        map.value?.add(marker);
        // await drawCircleHandle();
        map.value?.setZoom(17);
        map.value?.setCenter([ohosResult[0], ohosResult[1]]);

        // 打卡提示放在后面
        if (matchedPoint.value) {
          if (currentStep.value === 0 || !matchedPoint.value.isEnd) {
            form.value.type = matchedPoint.value.id ?? -1;
          }
          if (currentStep.value === 1 && !matchedPoint.value.isEnd) {
            showOHOSNotify(isNotOHOS.value, 'warning', '不在终点打卡点范围内，请移动到终点打卡点附近')
            // showNotify({ type: 'warning', message: '不在终点打卡点范围内，请移动到终点打卡点附近' });
          }
          if (currentStep.value === 0 && matchedPoint.value.isEnd) {
            showOHOSNotify(isNotOHOS.value, 'warning', '不在起点打卡点范围内，请移动到起点打卡点附近')
            // showNotify({ type: 'warning', message: '不在起点打卡点范围内，请移动到起点打卡点附近' });
          }
          canCheckIn.value = true;
          form.value.type = matchedPoint.value.id ?? -1;
        } else {
          canCheckIn.value = false;
          showOHOSNotify(isNotOHOS.value, 'warning', '不在打卡点范围内，请移动到打卡点附近')
          // showNotify({ type: 'warning', message: '不在打卡点范围内，请移动到打卡点附近' });
        }
      }
      else
      {
        showOHOSNotify(isNotOHOS.value, 'danger', 'Android Location 错误\n调用 JsBridgeFallBack 失败')
      }

    }
  } else {
    // 微信客户端内
    wx.getNetworkType({
      success: function (res) {
        if (res.networkType === "wifi") {
          showOHOSNotify(isNotOHOS.value, 'warning', '同学你好！请到室外完成打卡哦！')
          // showNotify({
          //   type: 'warning',
          //   message: '同学你好！请到室外完成打卡哦！😨'
          // })
        }
      }
    });

    wx.getLocation({
      type: 'wgs84',
      success: async (res) => {
        currentLocation.value = ` 纬度: ${res.latitude}, 经度: ${res.longitude}`;

        // const strIn = res.latitude + "," + res.longitude;
        // const gcj02PositionRaw = wgs84ToGcj02(strIn);
        // const gcj02Position = [parseFloat(gcj02PositionRaw[0]), parseFloat(gcj02PositionRaw[1])];

        matchedPoint.value = checkPoints.value.find(point => {
          const distance = AMap.GeometryUtil.distance([res.longitude, res.latitude], [point.longitude, point.latitude]);
          return distance <= 50;
        });

        if (matchedPoint.value) {
          if (currentStep.value === 0 || !matchedPoint.value.isEnd) {
            form.value.type = matchedPoint.value.id ?? -1;
          }
          if (currentStep.value === 1 && !matchedPoint.value.isEnd) {
            showOHOSNotify(isNotOHOS.value, 'warning', '不在终点打卡点范围内，请移动到终点打卡点附近')
            // showNotify({ type: 'warning', message: '不在终点打卡点范围内，请移动到终点打卡点附近' });
          }
          if (currentStep.value === 0 && matchedPoint.value.isEnd) {
            showOHOSNotify(isNotOHOS.value, 'warning', '不在起点打卡点范围内，请移动到起点打卡点附近')
            // showNotify({ type: 'warning', message: '不在起点打卡点范围内，请移动到起点打卡点附近' });
          }
          canCheckIn.value = true;
          form.value.type = matchedPoint.value.id ?? -1;
        } else {
          canCheckIn.value = false;
          showOHOSNotify(isNotOHOS.value, 'warning', '不在打卡点范围内，请移动到打卡点附近')
          // showNotify({ type: 'warning', message: '不在打卡点范围内，请移动到打卡点附近' });
        }

        wxGetLocationWgs84Data.value.latitude = res.latitude;
        wxGetLocationWgs84Data.value.longitude = res.longitude;
        form.value.latitude = res.latitude.toString();
        form.value.longitude = res.longitude.toString();
        // 弃用检测fakelocation
        if (isFakeLocation.value.state) {
          if (isFakeLocation.value.ready) {
            form.value.accuracy = "3715";
            wxGetLocationWgs84Data.value.accuracy = 3715;
          } else {
            form.value.accuracy = "5173";
            wxGetLocationWgs84Data.value.accuracy = 5173;
          }
        } else {
          form.value.accuracy = res.accuracy.toString();
          wxGetLocationWgs84Data.value.accuracy = res.accuracy;
        }


        var result = gcoord.transform(
          // 经纬度坐标
          [res.longitude * 1, res.latitude * 1],
          gcoord.WGS84,               // 当前坐标系
          gcoord.GCJ02                 // 目标坐标系
        );

        const marker = new AMap.Marker({
          position: new AMap.LngLat(result[0], result[1]),
          title: '当前位置'
        });

        map.value?.remove(map.value.getAllOverlays('marker'));
        map.value?.add(marker);
        // await drawCircleHandle();
        map.value?.setZoom(17);
        map.value?.setCenter([result[0], result[1]]);
      },
      fail: () => {
        wxGetLocationWgs84Data.value.latitude = 0;
        wxGetLocationWgs84Data.value.longitude = 0;
        wxGetLocationWgs84Data.value.accuracy = -1;
        currentLocation.value = '获取位置失败，请重试';
        canCheckIn.value = false;
        showOHOSNotify(isNotOHOS.value, 'danger', '获取位置失败，请检查定位权限')
        // showNotify({ type: 'danger', message: '获取位置失败，请检查定位权限' });
      }
    });
  }

  // if (map.value) {
  //   const numbers = wgs84ToGcj02(res.longitude, res.latitude);
  //   const marker = new AMap.Marker({
  //     position: new AMap.LngLat(numbers[0], numbers[1]),
  //     title: '当前位置'
  //   });
  //   map.value.remove(map.value.getAllOverlays('marker'));
  //   map.value.add(marker);
  //   await drawCircleHandle();
  //   map.value.setZoom(17);
  //   map.value.setCenter(numbers);
  // AMap.convertFrom([res.longitude, res.latitude], 'gps', async (status, result) => {
  //   if (result.info === 'ok') {
  //     const convertLatLng = result.locations[0];
  //     const marker = new AMap.Marker({
  //       position: new AMap.LngLat(convertLatLng.lng, convertLatLng.lat),
  //       title: '当前位置'
  //     });
  //     map.value?.remove(map.value.getAllOverlays('marker'));
  //     map.value?.add(marker);
  //     await drawCircleHandle();
  //     map.value?.setZoom(17);
  //     map.value?.setCenter([convertLatLng.lng, convertLatLng.lat]);
  //   }
  // });
  // }

  // wx.getLocation({
  //   type: 'gcj02',
  //   success: async (res) => {
  //     // alert("微信直接获取的经纬度为：" + res.longitude + " " + res.latitude);
  //     const marker = new AMap.Marker({
  //       position: new AMap.LngLat(res.longitude, res.latitude),
  //       title: '当前位置'
  //     });
  //     wxGetLocationGcj02Data.value.longitude = res.longitude;
  //     wxGetLocationGcj02Data.value.latitude = res.latitude;
  //     wxGetLocationGcj02Data.value.accuracy = res.accuracy;
  //     map.value?.remove(map.value.getAllOverlays('marker'));
  //     map.value?.add(marker);
  //     await drawCircleHandle();
  //     map.value?.setZoom(17);
  //     map.value?.setCenter([res.longitude, res.latitude]);
  //   },
  //   fail: () => {
  //     wxGetLocationGcj02Data.value.longitude = 0;
  //     wxGetLocationGcj02Data.value.latitude = 0;
  //     wxGetLocationGcj02Data.value.accuracy = 0;
  //   }
  // });

  // 预留协助模式接口

  setTimeout(() => {
    locationButtonCooldown.value = false;
  }, 3000);
};

// state: 是否为虚拟定位
// ready: 检测是否完成
const isFakeLocation = ref({
  state: false,
  ready: true,
  count: 0,
  msg: ""
});

// async function checkFakeLocation() {
//   // 获取检测结果
//   const antiFakeGPSInstance = new AntiFakeGPS;
//   const checkResult = useAntiFakeGPS().check()
//   setTimeout(()=>{
//     isFakeLocation.value.msg = JSON.stringify(checkResult) + " " + JSON.stringify(checkResult.isOk());
//     checkFakeLocation()
//   }, 10000)
// }

function debugMarker() {
  const marker = new AMap.Marker({
    position: new AMap.LngLat(112.932187, 28.158230),
    title: '当前位置',
    icon: markerIconUrl,
    content: "",
    label: { content: 'DEBUG' }
  });
  map.value?.remove(map.value.getAllOverlays('marker'));
  map.value?.add(marker);
}

const performCheckIn = async () => {

  // 点击打卡按钮的时间 - 最后一次获取位置的时间 > 2min 即为卡bug
  if (Date.now() - lastUpdateLocationTime.value > 120000) {
    showOHOSNotify(isNotOHOS.value, 'danger', '同学, 你在卡bug吗?')
    // showNotify({ type: 'danger', message: '同学, 你在卡bug吗?' });
    return 0;
  }

  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const result = await encryptDataAndCheckInHandle();
    if (result.data?.code === 0) {
      showSuccessPopup.value = true;

      // 放在 getLastRecordHandle 前, 否则 step 会归位
      if (currentStep.value === 1) {
        // 前一阶段为 PENDING 状态, 完成终点打卡
        currentStage.value = 1;
        // 给爬山的同学显示一下进度条全满, 3s
        setTimeout(() => {
          // const endCanvasFingerPrint = getCanvasFingerPrint("endCanvasFingerPrint");
          currentStage.value = 0;
          getLastRecordHandle();
        }, 2000);
      } else {
        // 前一阶段为起点打卡
        // const startCanvasFingerPrint = getCanvasFingerPrint("startCanvasFingerPrint");
        currentStage.value = 0;
        await getLastRecordHandle();
      }

      showOHOSNotify(isNotOHOS.value, 'success', '打卡成功！')
      // showNotify({ type: 'success', message: '打卡成功！' });

      if (!userStore.user?.count && currentStep.value === 0) {
        await router.push('/finish');
      }

    } else {
      showOHOSNotify(isNotOHOS.value, 'danger', '打卡失败，请重试')
      // showNotify({ type: 'danger', message: '打卡失败，请重试' });
    }
  } catch (error) {
    console.error('Check-in failed:', error);
    showOHOSNotify(isNotOHOS.value, 'danger', '打卡失败，请重试')
    // showNotify({ type: 'danger', message: '打卡失败，请重试' });
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
        if (res.data.data.isBanned) {
          // 封禁页面
          router.push('/banned');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Login or info fetch failed:', error);
      showOHOSNotify(isNotOHOS.value, 'danger', '登录失败，请重试')
      // showNotify({ type: 'danger', message: '登录失败，请重试' });
    }
  } else {
    try {
      const res = await infoApi();
      if (res.data?.data) {
        userStore.setUser(res.data.data);
        if (res.data.data.isBanned) {
          // 封禁页面
          router.push('/banned');
        }

        // custom-id=学号 friendly-name=昵称+学号
        // https://www.npmjs.com/package/@microsoft/clarity
        Clarity.identify(userStore.user?.id ?? "undefined", "", "", userStore.user?.nickname ?? userStore.user?.idNumber ?? "undefined");
        Clarity.setTag("id", userStore.user?.id ?? "undefined");
        Clarity.setTag("idNumber", userStore.user?.idNumber ?? "undefined");
        Clarity.setTag("nickname", userStore.user?.nickname ?? "undefined");
        Clarity.setTag("college", userStore.user?.college ?? "undefined");
        Clarity.setTag("phone", userStore.user?.phone ?? "undefined");
      }
    } catch (error) {
      console.error('Info fetch failed:', error);
      showOHOSNotify(isNotOHOS.value, 'danger', '获取用户信息失败，请重试')
      // showNotify({ type: 'danger', message: '获取用户信息失败，请重试' });
    }
  }
};

onMounted(async () => {
  try {
    isOHOS();
    // initOHOS();
    await loginAndGetInfoHandle();
    await getCheckInPointHandle();
    await getLastRecordHandle();
    await initMap();
    // 修复定位在圈内但是打卡按钮禁用问题
    setTimeout(() => {
      updateLocation();
    }, 3000);
    // 第一次必须异步请求
    await getWeather();
    await getAnnouncement();
    // Fingerprint.js
    await getFpValue();
    // 反虚拟定位
    // await checkFakeLocation();

    if (import.meta.env.MODE === 'development') {
      console.log("DEV MODE");
      debugMarker();
    }
  } catch (error) {
    console.error('Initialization failed:', error);

    showOHOSNotify(isNotOHOS.value, 'danger', '初始化失败，请刷新重试');

    // showNotify({ type: 'danger', message: '初始化失败，请刷新重试' });
  }
});

// function initOHOS(){

//   if(!isNotOHOS.value){
//       window.location.href = 'ohos://callLocationKitAbility'
//       const ohosLocationKitLatElement = document.getElementById('ohosLocationKitLat');
//       const LatString = ohosLocationKitLatElement ? ohosLocationKitLatElement.innerText : '';
//       const ohosLocationKitLngElement = document.getElementById('ohosLocationKitLng');
//       const LngString = ohosLocationKitLngElement ? ohosLocationKitLngElement.innerText : '';
//       const ohosLocationKitAccElement = document.getElementById('ohosLocationKitAcc');
//       const AccString = ohosLocationKitAccElement ? ohosLocationKitAccElement.innerText : '';

//       ohosPosition.value.lat = Number(LatString);
//       ohosPosition.value.lng = Number(LngString);
//       ohosPosition.value.acc = Number(AccString);
//       showOHOSNotify(isNotOHOS.value, 'success', '初始化 kit.ArkWeb 成功');
//   }

// }

// WebSocket event handlers
socket.on("connect", () => {
  isWSConnected.value = true;
  // socket.emit("chat", "又有一位同学加入了比赛！🎉");
});

const socketMessagesLength = ref<number>(0);
socket.on("race", (msg) => {
  // if (socketMessages.value.length >= 1) {
  //   socketMessages.value.shift();
  // }
  socketMessages.value.push(msg);
  clearSocketMessages(msg);
});

async function clearSocketMessages(data: string) {
  if (aqi?.value >= 200) {
    socketMessages.value.length += 1;
    if (wInfo?.value.alarmData.w.length > 0) {
      socketMessages.value.length += wInfo.value.alarmData.w.length;
    }
  } else if (wInfo?.value.alarmData.w.length > 0) {
    socketMessages.value.length += wInfo.value.alarmData.w.length;
  }
  setTimeout(() => {
    socketMessages.value = socketMessages.value.filter(item => item !== data);
  }, 3000 * (socketMessages.value.length + socketMessages.value.length))
}

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

const jsonInfo = ref<BuildInfo>({
  time: "",
  commitInfo: {
    commitId: "",
    commitMessage: "",
    branchName: "",
    fileStats: "",
    tagInfo: [],
  },
  announcement: {
    switch: false,
    info: ""
  },
  updateInfo: {
    switch: false,
    header: "",
    body: ""
  },
  weather: {
    switch: {
      info: false,
      warn: false,
    },
    config: {
      api: "https://ydqc.csu.edu.cn/weather",
      province: "湖南",
      city: "长沙",
    },
    info: {
      title: {
        apply: "中央气象台发布天气预警",
        cancel: "天气预警解除"
      },
      body: {
        apply: "请仔细评估天气情况，及时返回到安全地带。\n如遇紧急情况，请及时拨打紧急电话！",
        cancel: "继续征服岳麓山吧！"
      }
    }
  }
});

const wInfo = ref<WeatherData>(
  {
    info: {
      timeStamp: 1744531360003,
      infoSource: "中央气象台",
      sourceUrl: [
        "http://d1.weather.com.cn/dingzhi/101250101.html?_=",
        "http://www.nmc.cn/rest/weather?stationid=sgkrL&_="
      ],
      serverCore: "csu-dynamic-youth-weather",
      author: "54sher",
      state: true,
      msg: "你居然发现了我们的天气api! 如要使用, 可访问danmuku.54sher.com/weather?province=&city="
    },
    cityData: {
      weatherinfo: {
        city: "101250101",
        cityname: "长沙",
        fctime: "202504131100",
        temp: "25℃",
        tempn: "15℃",
        weather: "晴",
        weathercode: "d0",
        weathercoden: "n0",
        wd: "南风",
        ws: "<3级"
      }
    },
    alarmData: {
      w: []
    },
    airData: {
      forecasttime: "2025-04-13 15:00",
      aqi: 182,
      aq: 4,
      text: "中度污染",
      aqiCode: "99031;99032;99033;99034;99035;99036;99037;99038;99039;99040"
    }
  }
);

async function getAnnouncement() {
  const response = await fetch('/build-info.json' + '?_timestamp=' + Date.now());
  if (!response.ok) throw new Error('Fetch Build Info Error');
  const info = await response.json();
  jsonInfo.value = info;
  // getWeather();
  if (jsonInfo.value.weather.switch.info || jsonInfo.value.weather.switch.warn) {
    getWeatherWithPolling();
  }
}

const weatherAlert = ref(false);
const airAlert = ref(false)
const aqi = ref();
const aqiText = ref();

async function getWeather() {
  const wRes = await fetch(jsonInfo.value.weather.config.api
    + '?province=' + jsonInfo.value.weather.config.province
    + '&city=' + jsonInfo.value.weather.config.city
    + '&_timestamp=' + Date.now());
  if (!wRes.ok) throw new Error('Fetch Weather Info Error');
  const wResData = await wRes.json();
  // console.log(wResData)
  wInfo.value = wResData;

  aqi.value = wInfo.value.airData.aqi?.toString();
  aqiText.value = wInfo.value.airData.text?.toString();

  if (wInfo.value.airData.aqi >= 200 && !airAlert.value) {
    airAlert.value = true;
    pushWeatherAlert(2);
  }

  if (wInfo.value.alarmData.w.length > 0 && !weatherAlert.value) {
    weatherAlert.value = true;
    pushWeatherAlert(1);
  } else if (wInfo.value.alarmData.w.length === 0 && weatherAlert.value) {
    weatherAlert.value = false;
    pushWeatherAlert(0);
  }

  // console.log("获取天气数据成功");
  // getAnnouncement();
}

function pushWeatherAlert(type: number) {
  if (type === 0) {
    showDialog({
      title: jsonInfo.value.weather.info.title.cancel,
      message: jsonInfo.value.weather.info.body.cancel,
    }).then(() => {
      // on close
    });
  } else if (type === 1) {
    showDialog({
      title: jsonInfo.value.weather.info.title.apply,
      message: jsonInfo.value.weather.info.body.apply,
    }).then(() => {
      // on close
    });
  } else if (type === 2) {
    showDialog({
      title: "空气质量提示",
      message: "当前AQI为" + wInfo.value.airData.aqi + "，达到" + wInfo.value.airData.text
        + "级别\n建议减少外出，避免室外活动！"
    }).then(() => {
      // on close
    });
  }
}

async function getWeatherWithPolling(interval = 10000) {
  try {
    await getWeather(); // 调用原始函数

    // 设置下一次轮询
    setTimeout(() => getWeatherWithPolling(interval), interval);
  } catch (error) {
    console.error("获取天气数据失败", error);
    // 出错时缩短轮询间隔
    setTimeout(() => getWeatherWithPolling(interval), 10000);
  }
}

const locationData = ref({
  lat: '',
  lng: '',
  acc: ''
})

function getDetailData() {
  getWgs84Gcj02Data();
  var result = gcoord.transform(
    // 经纬度坐标
    [wxGetLocationWgs84Data.value.longitude * 1, wxGetLocationWgs84Data.value.latitude * 1],
    gcoord.WGS84,               // 当前坐标系
    gcoord.GCJ02                 // 目标坐标系
  );

  locationData.value.lat = wxGetLocationWgs84Data.value.latitude?.toString()
  locationData.value.lng = wxGetLocationWgs84Data.value.longitude?.toString()

  if (isFakeLocation.value.state) {
    if (isFakeLocation.value.ready) {
      locationData.value.acc = "5.173";
    } else {
      locationData.value.acc = "not ready";
    }
  } else {
    locationData.value.acc = wxGetLocationWgs84Data.value.accuracy?.toString()
  }

  showDialog({
    messageAlign: "left",
    allowHtml: true,
    title: "详细信息",
    message:
      "buildTime: " + new Date(jsonInfo.value.time).toLocaleString()
      + "\nId: " + jsonInfo.value.commitInfo.commitId
      + "\nMsg: " + jsonInfo.value.commitInfo.commitMessage
      + "\nDiff: " + jsonInfo.value.commitInfo.fileStats
      + "\nTag: " + jsonInfo.value.commitInfo.tagInfo
      + "\nonBranch: " + jsonInfo.value.commitInfo.branchName
      + '\n\n<b>wx.getLocation</b>'
      + '\ntype: wgs84'
      + '\nresolution: gnss'
      + '\nlatitude ' + locationData.value.lat
      + '\nlongitude ' + locationData.value.lng
      + '\nversion ' + locationData.value.acc
      + '\n\n<b>wgs84ToGcj02</b>'
      + '\ntype: gcj02'
      + '\nstandard: GB 20263-2006'
      + '\nresolution: gcoord high accuracy'
      + '\nlatitude ' + result[1]?.toString()
      + '\nlongitude ' + result[0]?.toString()
      + '\nversion ' + locationData.value.acc
      + '\n' + isFakeLocation.value.msg
    ,
  })
    .then(() => {
    })
}

function getWgs84Gcj02Data() {
  // 预留协助接口
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const testImg = ref<string>(mainBgSrc);
const triggerFileInput = () => {
  fileInputRef.value?.click(); // Programmatically click the hidden file input
};
const isImageUpload = ref<boolean>(false);
// --- 辅助函数 START ---

/**
 * 处理文件输入框的 change 事件
 * @param event Input change event
 */
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) {
    console.log("没有选择文件");
    return;
  }

  const file = target.files[0];
  console.log("选择了文件:", file.name, file.type, file.size);

  // --- 可选：生成并显示图片预览 ---
  // 如果之前有预览，先释放旧的 Object URL 防止内存泄漏
  if (testImg.value.startsWith('blob:')) {
    URL.revokeObjectURL(testImg.value);
  }
  testImg.value = URL.createObjectURL(file); // 创建 Blob URL 用于预览
  // -------------------------------

  try {
    const exifImg = new Image();
    exifImg.src = URL.createObjectURL(file);

    exifImg.onload = () => {
      EXIF.getData(exifImg, function (this: any) {
        if (isDevMode.value === 'development') {
          const allMetaData = EXIF.getAllTags(this);
          console.log("[开发模式]提取到的数据:", allMetaData);
        }

        // --- 处理 GPS 信息 ---
        const latArray = EXIF.getTag(this, "GPSLatitude");
        const lonArray = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef");

        if (latArray && lonArray && latRef && lonRef) {
          try {
            const latitude = convertDMSToDD(latArray[0], latArray[1], latArray[2], latRef);
            const longitude = convertDMSToDD(lonArray[0], lonArray[1], lonArray[2], lonRef);
            showOHOSNotify(isNotOHOS.value, 'success', '上传成功')
            // showNotify({ type: 'success', message: `上传成功` });
            // 校验数据
            checkImageGPS(longitude, latitude);
            // form.value.accuracy
          } catch (conversionError) {
            if (isDevMode.value === 'development') {
              console.error("[开发模式]转换失败:", conversionError);
            }
            showOHOSNotify(isNotOHOS.value, 'danger', '获取图片失败, 请重新拍照: 2')
            // showNotify({ type: 'danger', message: '获取图片失败, 请重新拍照: 2' });
          }
        } else {
          if (isDevMode.value === 'development') {
            console.error("[开发模式]未找到数据");
          }
          showNotify({ type: 'danger', message: '获取图片失败, 请重新拍照: 3' });
        }
        // --- GPS 信息处理结束 ---
      });
    }

  } catch (error: any) {
    if (isDevMode.value === 'development') {
      console.error("[开发模式]处理文件时出错:", error);
    }
    showNotify({ type: 'danger', message: `处理文件失败: ${error.message || error}` });
    // 出错时清除预览
    if (testImg.value.startsWith('blob:')) {
      URL.revokeObjectURL(testImg.value);
    }
    testImg.value = "";
  } finally {
    // 重置文件输入框的值，这样即使用户再次选择同一个文件也能触发 change 事件
    if (target) {
      target.value = '';
    }
  }
};

/**
 * 将 EXIF GPS 坐标（度分秒数组）转换为十进制度数
 * @param degrees 度
 * @param minutes 分
 * @param seconds 秒
 * @param direction 方向 ('N', 'S', 'E', 'W')
 * @returns 十进制度数值
 */
function convertDMSToDD(degrees: number, minutes: number, seconds: number, direction: string): number {
  let dd = degrees + minutes / 60 + seconds / (60 * 60);
  // 南纬 S 和西经 W 为负值
  if (direction === "S" || direction === "W") {
    dd = dd * -1;
  }
  return dd;
}

const timeCountDown = ref(300000);
const isShowExifDialog = ref(false);

function showEXIFDialog() {
  isShowExifDialog.value = true;
}

function confirmEXIFDialog() {
  if (!isImageUpload.value) {
    return;
  }
  if (testImg.value.startsWith('blob:')) {
    console.log("清除blob Url释放内存 " + testImg.value)
    URL.revokeObjectURL(testImg.value);
  }
  testImg.value = mainBgSrc;
  isImageUpload.value = false;
}
// --- 辅助函数 END ---

// 点击打卡按钮
function checkInWithImage() {
  // showEXIFDialog();
  // 暂时取消打卡图片验证功能
  performCheckIn();
}

// 判断图片的位置是否在点里
function checkImageGPS(lng: number, lat: number) {
  let parseAccString: string = "113999000";
  matchedPoint.value = checkPoints.value.find(point => {
    const distance = AMap.GeometryUtil.distance([lng, lat], [point.longitude, point.latitude]);
    return distance <= 50;
  });

  // 定义错误码
  // X YY 999 ZZ
  // X 是否校验了 1否 2是
  // YY 校验是否成功 11不在终点 12不在起点 13哪个都不在 20是
  // ZZ 原有精度
  if (matchedPoint.value) {
    if (currentStep.value === 0 || !matchedPoint.value.isEnd) {
      parseAccString = "220999" + form.value.accuracy.toString();
    }
    if (currentStep.value === 1 && !matchedPoint.value.isEnd) {
      parseAccString = "211999" + form.value.accuracy.toString();
    }
    if (currentStep.value === 0 && matchedPoint.value.isEnd) {
      parseAccString = "212999" + form.value.accuracy.toString();
    }
    parseAccString = "220999" + form.value.accuracy.toString();
  } else {
    parseAccString = "213999" + form.value.accuracy.toString();
  }
  form.value.accuracy = parseAccString;
  performCheckIn();
  isImageUpload.value = true;
}
// Get User Agent
const userAgent = navigator.userAgent;
// isAndroid
const uaRegex = /^CSU-YDQC\/(.*?) \(Android\)$/
const isAndroidApp = uaRegex.test(userAgent)

// isOHOS
const isNotOHOS = ref(true)
const uaVersionMatch = userAgent.match(/Firefox\/(\d+\.\d+\.\d+)/);

function isOHOS() {
  if (uaVersionMatch) {
    const versionNumber = uaVersionMatch[1];
    if (versionNumber === '141.0.0') {
      isNotOHOS.value = false;
    }
  }
}
isOHOS();

function checkOHOSPerms() {

  const ohosLocationKitLatElement = document.getElementById('ohosLocationKitLat');
  const LatString = ohosLocationKitLatElement ? ohosLocationKitLatElement.innerText : '';
  const ohosLocationKitLngElement = document.getElementById('ohosLocationKitLng');
  const LngString = ohosLocationKitLngElement ? ohosLocationKitLngElement.innerText : '';
  const ohosLocationKitAccElement = document.getElementById('ohosLocationKitAcc');
  const AccString = ohosLocationKitAccElement ? ohosLocationKitAccElement.innerText : '';

  let msg: string = 'Acc ' + AccString + ' ' + ohosPosition.value.acc.toString()
    + '\nLat ' + LatString + ' ' + ohosPosition.value.lat.toString()
    + '\nLng ' + LngString + ' ' + ohosPosition.value.lng.toString()
    + '\n OHOS.Kit.Location';
  showOHOSNotify(isNotOHOS.value, 'success', msg)
}
const bubbleOffset = ref({ x: 300, y: 200 });
</script>

<template>
  <div class="mountain-challenge">
    <div style="padding: 5vh;" v-if="!isNotOHOS" class="ohosSafeZone"></div>
    <!-- 通知栏 天气 -->
    <!-- 天气信息 -->
    <transition name="fade-slide">
      <van-notice-bar left-icon="location-o" color="#1989fa" background="#ecf9ff"
        class="notice-primary rounded-lg shadow-sm" v-if="jsonInfo.weather.switch.info && wInfo.info.state">
        <b>{{ wInfo.cityData.weatherinfo.cityname }}</b>
        {{ wInfo.cityData.weatherinfo.weather }}
        {{ wInfo.cityData.weatherinfo.tempn }} - {{ wInfo.cityData.weatherinfo.temp }}
        {{ wInfo.cityData.weatherinfo.wd }}
        {{ wInfo.cityData.weatherinfo.ws }}
        AQI:{{ aqi }} {{ aqiText }}级别
      </van-notice-bar>
    </transition>

    <!-- 天气警告 + 开始爬山公告 -->
    <!-- <van-sticky offset-top="3rem"> jsonInfo?.weather?.switch?.warn && wInfo?.airData?.aqi >= 150 && wInfo.info.state -->
    <transition name="fade-slide">
      <van-notice-bar left-icon="volume-o" :scrollable="false" class="mt-3 notice-secondary rounded-lg shadow-sm"
        v-if="socketMessages.length > 0 || (jsonInfo?.weather?.switch?.warn && ((wInfo?.alarmData?.w?.length > 0 && wInfo.info.state) || aqi >= 200))">
        <van-swipe vertical class="notice-swipe" :autoplay="3000" :touchable="false" :show-indicators="false">
          <van-swipe-item v-for="(w, index) in wInfo.alarmData.w" :key="index" class="font-medium">
            {{ w.w13 || null }}
          </van-swipe-item>
          <van-swipe-item v-if="aqi >= 200" class="font-medium" :key="wInfo.alarmData.w.length + 1">
            AQI:{{ aqi }} - {{ aqiText }}， 建议减少室外活动
          </van-swipe-item>
          <van-swipe-item v-for="(msg, index2) in socketMessages" :key="index2 + wInfo.alarmData.w.length + 1"
            class="font-medium">
            {{ msg }}
          </van-swipe-item>
        </van-swipe>
      </van-notice-bar>
    </transition>
    <!-- </van-sticky> -->

    <!-- 通知栏 公告 -->
    <transition name="fade-slide">
      <van-notice-bar left-icon="info-o" color="#1989fa" background="#ecf9ff" wrapable :scrollable="false"
        class="mt-3 notice-primary rounded-lg shadow-sm" v-if="jsonInfo.announcement.switch">
        {{ jsonInfo.announcement.info }}
      </van-notice-bar>
    </transition>

    <!-- 滚动通知 -->
    <!-- <van-notice-bar left-icon="volume-o" :scrollable="false" class="mt-3 notice-secondary rounded-lg shadow-sm"
      v-if="socketMessages.length > 0">
      <van-swipe vertical class="notice-swipe" :autoplay="3000" :touchable="false" :show-indicators="false">
        <van-swipe-item v-for="(msg, index) in socketMessages" :key="index" class="font-medium">
          {{ msg }}
        </van-swipe-item>
      </van-swipe>
    </van-notice-bar> -->

    <!-- 横幅区域 -->
    <div class="mt-4 relative overflow-hidden rounded-xl shadow-lg banner-container">
      <van-barrage v-model="list" :autoplay="300" :loop="true">
        <div class="video relative" style="width: 100%; height: 220px">
          <img src="@/assets/background.png" alt="Banner" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <div class="absolute bottom-4 left-4 text-white">
            <h1 class="text-2xl font-bold text-shadow">FUN 山越岭</h1>
            <p class="text-sm opacity-90">挑战自我，征服高峰</p>
          </div>
        </div>
      </van-barrage>
    </div>

    <!-- 地图卡片 -->
    <div class="mt-6 rounded-xl shadow-lg p-4 map-card">
      <div class="flex space-x-4">
        <div id="amap-container" class="h-58 w-2/3 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <van-steps :active="currentStage" class="w-32 h-26" direction="vertical" active-color="#07c160">
            <van-step>
              <div class="font-medium">起点打卡</div>
            </van-step>
            <van-step>
              <div class="font-medium">终点打卡</div>
            </van-step>
          </van-steps>

          <van-image :src="simpleMapImgUrl" fit="cover"
            class="h-28 rounded-lg p-1 shadow-sm transition-transform duration-300 hover:scale-105"
            @click="showImagePreview([simpleMapImgUrl])" />

          <!-- <div
            class="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-inner cursor-pointer hover:bg-gray-100 transition duration-200 border border-gray-200"
            @click="updateLocation">
            <h2 class="text-sm font-semibold text-center border-b border-gray-300 pb-1 mb-1">点击刷新位置</h2>
            <p class="text-xs text-gray-700">请在红色打卡范围（50m）进行打卡</p>
          </div> -->
          <van-cell :title="!locationButtonCooldown ? '刷新位置' : '正在获取'"
            :label="!locationButtonCooldown ? '请在红色打卡范围(50m)进行打卡' : '当多次无法获取到定位时请刷新页面'" center
            :clickable="!locationButtonCooldown" :border="true" @click="updateLocation"
            class="rounded-lg shadow-inner transition duration-300 location-button" :class="{
              'bg-gradient-to-r from-blue-50 to-sky-100': !locationButtonCooldown,
              'bg-gray-100 opacity-75': locationButtonCooldown,
              'pulse-animation': locationButtonCooldown
            }">
            <template #icon>
              <van-icon name="location-o" class="mr-2 text-blue-500" v-if="!locationButtonCooldown"
                :class="{ 'opacity-50': locationButtonCooldown }" />
              <div class="transition-all duration-300">
                <van-loading v-if="locationButtonCooldown" type="circular" size="18px" color="#3b82f6" />
              </div>
            </template>
          </van-cell>
        </div>
      </div>
    </div>

    <!-- 打卡按钮 -->
    <div class="mt-6 flex justify-center">
      <van-button type="primary" size="large" :disabled="!canCheckIn" @click="checkInWithImage" :loading="isSubmitting"
        class="w-full max-w-xs rounded-lg shadow-md check-in-button">
        {{ checkInButtonText }}
      </van-button>
    </div>

    <!-- 二次验证 -->
    <van-dialog v-model:show="isShowExifDialog" title="打卡图片上传" :show-cancel-button="false" width="90%"
      @confirm="confirmEXIFDialog" confirmButtonText="确认打卡" :confirmButtonDisabled="!isImageUpload">
      <div class="p-4 flex flex-col items-center">
        <div class="w-full flex flex-col items-center">
          <div class="relative mb-3">
            <img :src="testImg" class="max-w-full max-h-40 rounded-lg border border-gray-200 shadow-sm" alt="预览图片" />
            <div class="absolute top-2 right-2 bg-black/50 text-white text-xs rounded px-2 py-1">
              照片预览
            </div>
          </div>
        </div>
        <van-count-down :time="timeCountDown">
          <template #default="timeData">
            <span class="timeBlock">{{ timeData.minutes }}</span>
            <span class="timeColon">分钟</span>
            <span class="timeBlock">{{ timeData.seconds }}</span>
            <span class="timeColon">秒</span>
          </template>
        </van-count-down>
      </div>
      <div style="padding: 15px;">
        <p>注意事项:</p>
        <p>1. 请在5分钟内拍摄一张打卡点的照片</p>
        <p>2. 无需对准固定位置, 在打卡点附近即可</p>
        <p>3. 必须选择拍摄, 从相册选择无效</p>
      </div>
      <div class="p-4 flex flex-col items-center">
        <van-button @click="triggerFileInput" type="primary" size="normal" class="mb-4 rounded-lg" icon="flag-o">
          请拍摄打卡点照片
        </van-button>
      </div>
    </van-dialog>

    <div class="text-center mt-2 text-sm text-gray-600" v-if="isDevMode === 'development'">
      <van-button plain hairline type="primary" size="small" block @click="getDetailData">{{ testInfo }}</van-button>
      <!-- {{ jsonInfo.commitInfo.commitId }} - {{ jsonInfo.commitInfo.commitMessage }} -->
    </div>
    <!-- 测试按钮 -->
    <div class="mt-6 flex justify-center">
      <van-button v-if="isDevMode === 'development'" type="primary" size="normal" @click="showEXIFDialog"
        class="mt-3 rounded-lg">
        测试图片信息
      </van-button>
    </div>
    <div class="mt-6 flex justify-center">
      <van-button v-if="isDevMode === 'development'" type="primary" size="normal" @click="checkOHOSPerms"
        class="mt-3 rounded-lg">
        OHOS定位授权窗口拉起
      </van-button>
    </div>

    <input type="file" ref="fileInputRef" @change="handleFileChange" accept="image/jpeg,image/tiff"
      style="display: none;" />

    <!--&lt;!&ndash; 组队打卡链接 &ndash;&gt;-->
    <!--<div class="mt-5 text-center">-->
    <!--  <span-->
    <!--      class="inline-block text-sm font-medium text-blue-600 cursor-pointer transition-colors duration-200 hover:text-blue-800"-->
    <!--      @click="()=>router.push('/team')"-->
    <!--  >-->
    <!--    组队打卡 <van-icon name="arrow"/>-->
    <!--  </span>-->
    <!--</div>-->

    <!-- 浮动按钮 -->
    <van-floating-bubble axis="xy" icon="chat" v-model:offset="bubbleOffset" @offset-change="onOffsetChange"
      @click="openBarrageInput" class="bubble-animation" />

    <!-- 弹幕输入弹窗 -->
    <van-popup v-model:show="showBarrageInput" position="bottom" round :style="{ height: '20%' }" class="barrage-popup">
      <div class="p-4 flex items-center">
        <van-field v-model="messageInput" placeholder="输入弹幕消息" class="flex-grow mr-2 rounded-lg">
          <template #button>
            <van-button size="small" type="primary" @click="addBarrageHandle" class="rounded-lg">发送</van-button>
          </template>
        </van-field>
      </div>
    </van-popup>

    <!-- 在线人数和连接状态 -->
    <div class="mt-6 p-3 bg-white/80 rounded-lg shadow-sm">
      <div class="text-center text-sm text-gray-700 font-medium">
        正在与 <span class="text-green-600 font-bold">{{
          (onlineCount === 0 && isWSConnected) ? "99+" : onlineCount
        }}</span>
        人一起征服岳麓山
      </div>
      <div class="text-center mt-2 text-sm text-gray-600">
        服务器实时连接状态：
        <van-icon :name="isWSConnected ? 'success' : 'close'" :color="isWSConnected ? 'green' : 'red'" />
        <span :class="isWSConnected ? 'text-green-600' : 'text-red-600'">
          {{ isWSConnected ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="text-center mt-2 text-sm text-gray-600">
        <van-button plain hairline type="primary" size="small" block @click="getDetailData">版本信息</van-button>
        <!-- {{ jsonInfo.commitInfo.commitId }} - {{ jsonInfo.commitInfo.commitMessage }} -->
      </div>
    </div>

    <van-divider class="my-8" dashed />
    <div style="height: 1vh;"></div>

    <!-- 打卡成功弹窗 -->
    <van-popup v-model:show="showSuccessPopup" round position="bottom" class="success-popup">
      <div class="p-6 text-center" v-if="currentStep === 1">
        <div class="success-icon-container">
          <van-icon name="success" size="48" color="#07c160" />
        </div>
        <h2 class="mt-4 text-xl font-bold text-green-700">打卡成功！</h2>
        <p class="mt-2 text-gray-700">欢迎你加入"FUN 山越岭"登山挑战赛！迈开步子，顶峰相见！</p>
        <van-button type="primary" block class="mt-4 rounded-lg" @click="closeSuccessPopup">
          确定
        </van-button>
      </div>
      <div class="p-6 text-center" v-else>
        <div class="success-icon-container">
          <van-icon name="success" size="48" color="#07c160" />
        </div>
        <h2 class="mt-4 text-xl font-bold text-green-700">打卡成功！</h2>
        <p class="mt-2 text-gray-700">恭喜你已经完成挑战 {{ userStore.user?.count ? userStore.user?.count + 1 : 1 }}
          次</p>
        <van-button to="/finish" type="primary" block class="mt-4 rounded-lg" @click="closeSuccessPopup">
          前往统计页面
        </van-button>
      </div>
    </van-popup>
    <div style="padding: 3vh;" v-if="!isNotOHOS" class="ohosSafeZone"></div>
  </div>
</template>

<style lang="less" scoped>
.timeColon {
  display: inline-block;
  margin: 0 4px;
  color: #1989fa;
}

.timeBlock {
  display: inline-block;
  width: 22px;
  color: #fff;
  font-size: 12px;
  text-align: center;
  background-color: #1989fa;
}

.location-button {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.location-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  z-index: 1;
}

.pulse-animation::before {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.fade-slide-enter-active {
  transition: all 0.4s ease;
}

.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(1, 0.5, 0.8, 1);
}

.fade-slide-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.fade-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.mountain-challenge {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 50%, #f1f8e9 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.notice-primary {
  border-left: 4px solid #1989fa;
}

.notice-secondary {
  border-left: 4px solid #ff9800;
}

.notice-swipe {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

.map-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.banner-container {
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.01);
  }
}

.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.check-in-button {
  transition: all 0.3s ease;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.bubble-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
}

.success-icon-container {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: rgba(7, 193, 96, 0.1);
  border-radius: 50%;
  margin-bottom: 1rem;
}

.success-popup {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.barrage-popup {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

:deep(.van-barrage) {
  --van-barrage-item-height: 32px;
  --van-barrage-item-font-size: 14px;
  --van-barrage-item-color: #fff;
  --van-barrage-item-background: rgba(0, 0, 0, 0.7);
  --van-barrage-item-border-radius: 16px;
  --van-barrage-item-padding: 0 12px;
  --van-barrage-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
