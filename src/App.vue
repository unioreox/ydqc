<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

// 全局挂载完成后，配置微信 js-sdk
import { onMounted } from 'vue'
import wx from "weixin-js-sdk";
import { getWxConfig } from "@/api";
import { showNotify } from "vant";

onMounted(() => {
  console.log('全局挂载完成，配置微信 js-sdk')
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
</script>

<template>
  <!-- Canvas FingerPrint -->
  <canvas class="initCanvasFingerPrint" id="initCanvasFingerPrint" style="z-index: -100; opacity: 0; display: none;"></canvas>
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
