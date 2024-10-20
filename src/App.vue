<script setup lang="ts">
import {RouterLink, RouterView} from 'vue-router'

// 全局挂载完成后，配置微信 js-sdk
import {onMounted} from 'vue'
import wx from "weixin-js-sdk";
import {getWxConfig} from "@/api";
import {showNotify} from "vant";

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
        appId: res.data.appId!,
        timestamp: +res.data.timestamp!,
        nonceStr: res.data.nonceStr!,
        signature: res.data.signature!,
        jsApiList: ['getLocation', 'onMenuShareAppMessage', 'onMenuShareTimeline']
      });
    }
  }).then(() => {
    wx.ready(() => {
      if (import.meta.env.MODE === 'development') {
        showNotify("微信 js-sdk 配置成功")
      }
      console.log('微信 js-sdk 配置成功')
    })
  })
})
</script>

<template>
  <RouterView/>
</template>

<style scoped>
</style>
