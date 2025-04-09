<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

// 全局挂载完成后，配置微信 js-sdk
import { onMounted, ref } from 'vue'
import wx from "weixin-js-sdk";
import { getWxConfig } from "@/api";
import { showNotify, showConfirmDialog } from "vant";
import Clarity from '@microsoft/clarity';

onMounted(() => {
  checkUpdate();
  console.log('全局挂载完成，配置sdk');

  const projectId = "qu3cf7upw6";
  Clarity.init(projectId);

  getWxConfig(
    {
      query: {
        url: window.location.href.split('#')[0]
      }
    }
  ).then(res => {
    if (res.data) {
      wx.config({
        debug: import.meta.env.MODE === 'development',
        appId: res.data.data?.appId!,
        timestamp: +res.data.data?.timestamp!,
        nonceStr: res.data.data?.nonceStr!,
        signature: res.data.data?.signature!,
        jsApiList: ['getLocation', 'onMenuShareAppMessage', 'onMenuShareTimeline', 'updateAppMessageShareData', 'scanQRCode']
      });
      wx.ready(() => {
        console.log('微信 js-sdk 配置成功')
      })
      wx.error((res) => {
        showNotify({
          type: 'danger',
          message: '微信 js-sdk 配置失败'
        })
      })
    }
  });
})

const currentBuildTime = ref();
const checkUpdateSwitch = ref(true);

const buildInfo = ref({
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
  }
});

async function checkUpdate() {
  try {
    const response = await fetch('/build-info.json' + '?_timestamp=' + Date.now());
    if (!response.ok) throw new Error('Fetch Build Info Error');
    const currentInfo = await response.json();
    currentBuildTime.value = currentInfo.time;
    autoRefresh();
  } catch (error) {
    console.error('Fetch Build Time Error:', error);
    checkUpdate();
  }
}

async function autoRefresh() {
  if (!checkUpdateSwitch.value) return;
  
  try {
    const response = await fetch('/build-info.json' + '?_timestamp=' + Date.now());
    if (!response.ok) throw new Error('Fetch Build Info Error');
    const info = await response.json();
    if (info.time != currentBuildTime.value) {
      buildInfo.value = info;
      
      // 在显示对话框前暂停自动刷新
      checkUpdateSwitch.value = false;
      
      if(buildInfo.value.updateInfo.switch){
        showConfirmDialog({
        // messageAlign: "left",
        allowHtml: true,
        title: buildInfo.value.updateInfo.header,
        message: buildInfo.value.updateInfo.body
        + "\n构建时间: " + new Date(buildInfo.value.time).toLocaleString(),
        // + "\n提交版本: " + buildInfo.value.commitInfo.commitId
        // + "\n提交信息: " + buildInfo.value.commitInfo.commitMessage
        // + "\n提交比较: " + buildInfo.value.commitInfo.fileStats
        // + "\n提交标签: " + buildInfo.value.commitInfo.tagInfo
        // + "\n分支名称: " + buildInfo.value.commitInfo.branchName,
      })
        .then(() => {
          // 用户确认后刷新页面
          location.reload();
        })
        .catch(() => {
          // 用户取消，保持 checkUpdateSwitch 为 false
          console.log('用户取消更新，停止自动刷新');
        });
      return; // 提前退出，避免设置新的定时器
      }else{
        // 直接刷新, 静默更新
        showNotify({
          type: 'success',
          message: '服务器强制应用热更新'
        })
        setTimeout(() => location.reload(), 6000);
      }
    }
    
    // 设置下一次检查的定时器
    setTimeout(() => autoRefresh(), 5000);
  } catch (error) {
    console.error('Fetch Build Time Error:', error);
    // 出错时仍继续检查
    setTimeout(() => autoRefresh(), 5000);
  }
}

</script>

<template>
  <!-- Canvas FingerPrint -->
  <canvas class="initCanvasFingerPrint" id="initCanvasFingerPrint"
    style="z-index: -100; opacity: 0; display: none;"></canvas>
  <RouterView />
</template>

<style>
/*

在触摸屏设备上禁用平移操作

[MDN] touch-action
https://developer.mozilla.org/zh-CN/docs/Web/CSS/touch-action

*/
/*
html {
  touch-action: none;
}
*/
/* 隐藏 scrollbar */
html::-webkit-scrollbar {
  width: 0;
}
</style>
