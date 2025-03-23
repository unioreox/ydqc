<script setup lang="ts">
import {onMounted, ref, useTemplateRef} from "vue";
import {infoApi, listCollegeApi, updateApi, type UserUpdateDto} from "@/api";
import {showConfirmDialog, showToast} from "vant";
import {useUserStore} from "@/stores/user";
import {useRouter} from "vue-router";
import {getToken} from "@/util/token";

const router = useRouter();

const form = ref<UserUpdateDto>({
  nickname: "",
  college: "",
  avatar: "",
  phone: "",
});

const collegeOptions = ref<any>([]);

const showCollegePopup = ref(false);

const idNumber = ref("");

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
  // if (form.value.idNumber && form.value.idNumber.length > 15 || form.value.idNumber?.length === 0) {
  //   showToast({
  //     type: 'fail',
  //     message: '学号/工号未填写或者格式错误'
  //   })
  //   return
  // }
  if (form.value.nickname && form.value.nickname.length > 20) {
    showToast({
      type: 'fail',
      message: '姓名不超过20位'
    })
    return
  }
  showConfirmDialog({
    title: '确认修改',
    message: '本次活动涉及到计入课外体育分数哦~，请务必确认姓名和学号正确',
  }).then(() => {
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
            nickname: res.data.data.nickname || "",
            avatar: res.data.data.avatar || "",
            college: res.data.data.college || "",
            phone: res.data.data.phone
          }
          idNumber.value = res.data.data.idNumber || ""
        }
      }
    })
  } else {
    form.value = {
      nickname: user.nickname,
      avatar: user.avatar,
      college: user.college,
      phone: user.phone
    }
    idNumber.value = user.idNumber || ""
  }
})

// @ts-ignore
const afterRead = async (file) => {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', file.file);

  fetch('/api/v1/upload/avatar', {
    method: 'POST',
    body: formData,
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
      .then(response => response.json())
      .then(data => {
        console.log('File uploaded successfully:', data);
        form.value.avatar = data.data;
        showToast({
          type: 'success',
          message: '图片上传成功'
        });
      })
      .catch(error => {
        console.error('Error uploading file:', error);
        showToast({
          type: 'fail',
          message: '图片上传过程中出现错误'
        });
      });
};

const uploader = useTemplateRef("uploader");

const triggerUploader = () => {
  if (uploader.value) {
    uploader.value.$el.querySelector('input[type="file"]').click();
  }
};

</script>

<template>
  <div class="edit-container bg-gray-100 min-h-screen p-4">
    <van-form class="" @submit="submitProfileHandle">
      <van-field label="头像" @click="triggerUploader">
        <template #input>
          <van-image round width="40" height="40" :src="form.avatar"/>
        </template>
      </van-field>
      <van-uploader ref="uploader" :after-read="afterRead" style="display: none;"/>
      <van-field v-model="form.nickname"
                 required
                 :rules="[{required: true, message: '请输入姓名'}]"
                 label="姓名" placeholder="请输入姓名"/>
      <van-field v-model="idNumber" label="学号/职工号" disabled
                 placeholder="学号/职工号，校外人员无需填写"/>
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
