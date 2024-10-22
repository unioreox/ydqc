<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import { roleText, idLabel } from "@/util/user";
import {infoApi} from "@/api";
import {ref} from "vue";

const {user} = useUserStore();

infoApi().then(res => {
  console.log(res);
})

</script>

<template>
  <div class="profile-container">
    <div class="bg-gray-100 min-h-screen p-4">
      <!-- 用户信息单元格，可以编辑的附带 is-link 标签并监听 click 事件 -->
      <van-cell-group>
        <van-cell title="姓名" :value="user?.name" />
        <van-cell title="昵称" :value="user?.nickname" />
        <van-cell title="头像">
          <van-image slot="right-icon" class="w-8 h-8" round :src="user?.avatar" />
        </van-cell>
        <van-cell title="身份" :value="roleText" />
        <van-cell :title="idLabel" :value="user?.idNumber" />
        <van-cell title="所属学院" :value="user?.college" />
        <van-cell v-if="user?.role !== 'STUDENT'" title="所属单位" :value="user?.org" />
        <van-cell title="手机号" :value="user?.phone" />
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
