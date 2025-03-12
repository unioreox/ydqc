<script setup lang="ts">
import {ref} from "vue";
import {addFeedback} from "@/api";
import {showToast} from "vant";

const form = ref('')

const submitFeedbackHandle = () => {
  if (!form.value) {
    showToast({
      type: 'fail',
      message: '请输入反馈内容'
    })
    return
  }
  addFeedback({
    query: {
      content: form.value
    }
  }).then(res => {
    if (res.data?.data) {
      showToast({
        type: 'success',
        message: '提交成功'
      })
      form.value = ''
    }
  })
}
</script>

<template>
  <div class="feedback-container p-4">
    <van-field
        v-model="form"
        label="反馈内容"
        type="textarea"
        rows="6"
        placeholder="请输入反馈内容"
    />
    <van-button
        type="primary"
        block
        @click="submitFeedbackHandle"
    >
      提交
    </van-button>
  </div>
</template>

<style scoped>

</style>
