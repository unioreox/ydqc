<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import {infoApi} from "@/api";
import {onMounted, ref} from "vue";

const {user} = useUserStore();

// 如果仓库中的用户信息为空，调用接口获取用户信息
onMounted(() => {
  infoApi().then(res => {
    if (res.data?.data) {
      useUserStore().setUser(res.data.data);
    }
  })
})
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
</script>

<template>
  <div class="profile-container">
    <div class="bg-gray-100 min-h-screen p-4">
      <div style="padding: 5vh;" v-if="!isNotOHOS" class="ohosSafeZone"></div>
      <!-- 用户信息单元格，可以编辑的附带 is-link 标签并监听 click 事件 -->
      <van-cell-group>
        <van-cell title="昵称" :value="user?.nickname"/>
        <van-cell title="头像">
          <van-image slot="right-icon" class="w-8 h-8" round :src="user?.avatar"/>
        </van-cell>
        <van-cell title="学号/工号" :value="user?.idNumber"/>
        <van-cell title="所属学院" :value="user?.college"/>
        <van-cell title="手机号" :value="user?.phone"/>
      </van-cell-group>

      <RouterLink to="/user/edit">
        <div class="mt-6 flex justify-center">
          <van-button
              type="primary"
              size="large"
          >
            修改资料
          </van-button>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>

</style>
