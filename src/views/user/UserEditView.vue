<script setup lang="ts">
import {ref} from "vue";

const updateProfile = ref({
    name: "",
    role: "",
    idNumber: "",
    college: "",
    phone: "",
    org: ""
});

</script>

<template>
  <div class="edit-container">
    <div class="bg-gray-100 min-h-screen p-4">

      <van-field :value="updateProfile.name" label="姓名" placeholder="请输入姓名" />
      <van-cell title="身份">
        <van-radio-group slot="value" v-model="updateProfile.role" direction="horizontal">
          <van-radio name="STUDENT" > 学生 </van-radio>
          <van-radio name="TEACHER"> 教师 </van-radio>
        </van-radio-group>
      </van-cell>
      <van-field :value="updateProfile.idNumber" label="学号/职工号" placeholder="请输入学号/职工号" />
      <!-- 需要获取学院列表，实现一个学院的选择 -->
      <van-field :value="updateProfile.college" label="所属学院" placeholder="请选择学院" is-link readonly @click="" />
      <van-field :value="updateProfile.org" label="所属单位" placeholder="请输入所属单位" />
      <van-field :value="updateProfile.phone" label="手机号" placeholder="请输入手机号" />

      <div class="mt-6 flex justify-center">
        <van-button
            type="primary"
            size="large"
        >
          提交更改
        </van-button>

      </div>
    </div>
  </div>
</template>

<style scoped>

</style>