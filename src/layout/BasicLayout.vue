<script setup lang="ts">

import NavBar from "@/components/NavBar.vue";
import BottomBar from "@/components/BottomBar.vue";
</script>

<template>
  <div class="app-container">
    <NavBar/>
    <router-view/>
    <BottomBar/>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100%;
}
</style>
