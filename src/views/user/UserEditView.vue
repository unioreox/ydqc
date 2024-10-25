<script setup lang="ts">
import {onMounted, ref} from "vue";
import {infoApi, listCollegeApi, updateApi, type UserUpdateDTO} from "@/api";
import {showToast} from "vant";
import {useUserStore} from "@/stores/user";
import {useRouter} from "vue-router";

const router = useRouter();

const form = ref<UserUpdateDTO>({
  nickname: "",
  idNumber: "",
  college: "",
  phone: "",
});

const collegeOptions = ref<any>([]);

const showCollegePopup = ref(false);

const {user} = useUserStore();

const submitProfileHandle = () => {
  // 校验手机号 11 位，学号不超过 12 位，姓名不超过 20 位
  if (!form.value.phone || form.value.phone.length !== 11) {
    showToast({
      type: 'fail',
      message: '请输入正确的手机号'
    })
    return
  }
  if (form.value.idNumber && form.value.idNumber.length > 12) {
    showToast({
      type: 'fail',
      message: '学号/工号不超过12位'
    })
    return
  }
  if (form.value.nickname && form.value.nickname.length > 20) {
    showToast({
      type: 'fail',
      message: '姓名不超过20位'
    })
    return
  }
  updateApi({
    body: form.value
  }).then(res => {
    if (res.data?.data) {
      showToast({
        type: 'success',
        message: '修改成功'
      })
      infoApi().then(res => {
        if (res.data?.data) {
          useUserStore().setUser(res.data.data);
        }
        router.push("/user/profile")
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

  // 如果仓库中的用户信息为空，调用接口获取用户信息
  if (!user) {
    infoApi().then(res => {
      if (res.data?.data) {
        useUserStore().setUser(res.data.data);
        if (res.data.data) {
          form.value = {
            nickname: res.data.data.nickname,
            idNumber: res.data.data.idNumber,
            college: res.data.data.college,
            phone: res.data.data.phone
          }
        }
      }
    })
  } else {
    form.value = {
      nickname: user.nickname,
      idNumber: user.idNumber,
      college: user.college,
      phone: user.phone
    }
  }
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
