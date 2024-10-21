<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import { roleText, idLabel } from "@/util/user";
import {infoApi} from "@/api";
import {ref} from "vue";

const {user} = useUserStore();

infoApi().then(res => {
  console.log(res);
})

const isNickEditShow = ref(false);
const isAvatarEditShow = ref(false);

const openNickEdit = () => {
    console.log('修改昵称');
    isNickEditShow.value = true;
}

const openAvatarEdit = () => {
    console.log('修改头像');
    isAvatarEditShow.value = true;
}

const closeNickEdit = () => {
  isNickEditShow.value = false;
}

const closeAvatarEdit = () => {
  isAvatarEditShow.value = false;
}

</script>

<template>

  <!-- 修改信息弹窗 -->
  <van-popup :show="isNickEditShow" @close="closeNickEdit" closeable position="bottom">
    修改昵称
  </van-popup>
  <van-popup :show="isAvatarEditShow" @close="closeAvatarEdit" closeable position="bottom">
    修改头像
  </van-popup>

  <div class="profile-container">
    <div class="bg-gray-100 min-h-screen p-4">
      <van-cell title="姓名" :value="user?.name" />
      <van-cell title="昵称" is-link :value="user?.nickname" @click="openNickEdit" />
      <van-cell title="头像" is-link @click="openAvatarEdit">
        <van-image slot="right-icon" class="w-8 h-8" round :src="user?.avatar" />
      </van-cell>
      <van-cell title="身份" :value="roleText" />
      <van-cell :title="idLabel" :value="user?.idNumber" />
      <van-cell title="所属学院" :value="user?.college" />
      <van-cell title="所属单位" :value="user?.org" />
      <van-cell title="手机号" :value="user?.phone" />
    </div>
  </div>
</template>

<style scoped>

</style>
