<script setup lang="ts">

import NavBar from "@/components/NavBar.vue";
import BottomBar from "@/components/BottomBar.vue";
import {onMounted, ref} from "vue";

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

function changeTab(url: string){
  location.replace("/" + url);
}

onMounted(()=>{
  isOHOS();
})
</script>

<template>
  <div class="app-container">
    <NavBar/>
    <router-view/>
    <BottomBar v-if="isNotOHOS"/>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100%;
}
</style>
