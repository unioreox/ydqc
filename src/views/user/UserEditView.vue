<script setup lang="ts">
import {onMounted, ref} from "vue";
import {listCollegeApi, updateApi, type UserUpdateDTO} from "@/api";
import {showToast} from "vant";
import router from "@/router";

const form = ref<UserUpdateDTO>({
  nickname: "",
  idNumber: "",
  college: "",
  phone: "",
});

const collegeOptions = ref<any>([]);

const showCollegePopup = ref(false);

const submitProfileHandle = () => {
  updateApi({
    body: form.value
  }).then(res => {
    if (res.data?.data) {
      showToast({
        type: 'success',
        message: '修改成功'
      })
      router.push({
        name: '个人信息'
      })
    }
  })
}

onMounted(() => {
  listCollegeApi().then(res => {
    // 转换成需要的格式
    if (res.data?.data) {
      collegeOptions.value = res.data.data.map((item: any) => {
        return {
          text: item.name,
          value: item.id
        }
      })
    }
  })
})

</script>

<template>
  <div class="edit-container bg-gray-100 min-h-screen p-4">
    <van-form class="" @submit="submitProfileHandle">
      <van-field v-model="form.nickname"
                 required
                 :rules="[{required: true, message: '请输入姓名'}]"
                 label="姓名" placeholder="请输入姓名"/>
      <van-field v-model="form.idNumber" label="学号/职工号" placeholder="请输入学号/职工号"/>
      <!-- 需要获取学院列表，实现一个学院的选择 -->
      <van-field v-model="form.college" required
                 :rules="[{required: true, message: '请选择学院'}]"
                 label="所属学院" placeholder="请选择学院" is-link readonly @click="()=>{
        showCollegePopup = true
      }"/>
      <van-popup v-model:show="showCollegePopup" position="bottom" :style="{height: '50%'}">
        <van-picker
            title="选择学院"
            show-toolbar
            :columns="collegeOptions"
            @confirm="(e) => {
              console.log(e.selectedOptions[0].text)
              form.college = e.selectedOptions[0].text;
              showCollegePopup = false;
            }"
        />
      </van-popup>
      <van-field v-model="form.phone" required
                 :rules="[{required: true, message: '请输入手机号'}]"
                 label="手机号" placeholder="请输入手机号"/>

      <div class="mt-6 flex justify-center">
        <van-button
            type="primary"
            size="large"
            native-type="submit"
        >
          提交更改
        </van-button>

      </div>
    </van-form>
  </div>
</template>

<style scoped>

</style>
