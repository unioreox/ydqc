<script setup lang="ts">
import routes from "@/router/routes";
import {useRoute} from "vue-router";
import {onMounted, ref, watch} from "vue";

// isOHOS
const isNotOHOS = ref(true)
const userAgent = navigator.userAgent;
const uaVersionMatch = userAgent.match(/Firefox\/(\d+\.\d+\.\d+)/);

function isOHOS(){
if (uaVersionMatch) {
    const versionNumber = uaVersionMatch[1];
    if(versionNumber === '141.0.0'){
      isNotOHOS.value = false;
    }
}
}

isOHOS();

// 当前路由
const route = useRoute();

// 当前标题
const curTitle = ref("");

// 控制是否显示返回按钮
const showBackArrow = ref(true);

// 动态设置标题和返回按钮显示逻辑
const updateNavBar = () => {
  // 遍历路由表，找到与当前 path 匹配的父路由和子路由
  let parentRoute = null;
  let childRoute = null;

  for (const r of routes) {
    // 先匹配父路由
    if (route.path.startsWith(r.path)) {
      parentRoute = r;

      // 在父路由的子路由中寻找匹配，确保组合路径的正确性
      childRoute = r.children?.find(c => route.path === `${r.path}${c.path !== "" ? "/" + c.path : ""}`);
    }
  }

  if (parentRoute) {
    if (childRoute && childRoute.path === "") {
      // 父路由页面，不显示返回按钮
      if(isNotOHOS.value){
        curTitle.value = parentRoute.name;
      }else{
        curTitle.value = parentRoute.name;
      }
      showBackArrow.value = false;
    } else if (childRoute) {
      // 匹配到子路由，显示子路由名称
      if(isNotOHOS.value){
        curTitle.value = parentRoute.name;
      }else{
        curTitle.value = parentRoute.name;
      }
      showBackArrow.value = true;
    } else {
      // 没有子路由，使用父路由的标题
      if(isNotOHOS.value){
        curTitle.value = parentRoute.name;
      }else{
        curTitle.value = parentRoute.name;
      }
      showBackArrow.value = true;
    }
  } else {
    console.log("没有匹配的路由");
  }
};

// 监听路由变化，动态更新
watch(
    () => route.path,
    () => {
      updateNavBar();
    }
);

// 初始调用更新函数
updateNavBar();

// 返回上一页的回调函数
const handleBack = () => {
  history.back(); // 浏览器历史记录回退
};

</script>

<template>
  <!-- 占位元素, 防止挤压 navBar -->
  <div class="nav-bar-container" v-if="isNotOHOS">
    <!-- <br v-if="!isNotOHOS" /> -->
    <van-nav-bar :title="curTitle" :left-arrow="showBackArrow" v-if="isNotOHOS" @click-left="handleBack" class="nav-inner"/>
  </div>
</template>

<style scoped>
.add-nav {
  visibility: hidden;
}

/* 置顶 navBar */
.nav-bar-container {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 99;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

.nav-inner {
  background: transparent;
}
</style>
