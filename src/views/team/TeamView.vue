<script setup lang="ts">
import {ref} from 'vue';
import {createTeamRequest, joinTeam} from '@/api';
import {showToast} from 'vant';

const active = ref(0);
const teamName = ref('');
const joinCode = ref('');
const teamCode = ref<string>("");
const isLoading = ref(false);
const joinLoading = ref(false);
const isToastShow = ref(false);
const toastType = ref<'success' | 'fail'>('success');
const toastMsg = ref('');

// 创建队伍处理函数
const createTeamHandle = async () => {
  if (!teamName.value) {
    showToast({type: 'fail', message: '请输入队伍名称'});
    return;
  }

  try {
    isLoading.value = true;
    const response = await createTeamRequest({
      query: {
        teamName: teamName.value
      }
    });
    console.log('创建队伍成功:', response.data?.data?.pwd);
    teamCode.value = response.data?.data?.pwd ?? "";
    toastType.value = 'success';
    toastMsg.value = '队伍创建成功';
  } catch (error: any) {
    toastType.value = 'fail';
    toastMsg.value = error.response?.data.msg || '创建失败，请重试';
  } finally {
    isLoading.value = false;
    isToastShow.value = true;
  }
};

// 加入队伍处理函数
const joinTeamHandle = async () => {
  if (!joinCode.value) {
    showToast({type: 'fail', message: '请输入队伍编号'});
    return;
  }

  try {
    joinLoading.value = true;
    await joinTeam({
      query: {
        teamCode: joinCode.value
      }
    });
    toastType.value = 'success';
    toastMsg.value = '加入队伍成功';
    joinCode.value = '';
  } catch (error: any) {
    toastType.value = 'fail';
    toastMsg.value = error.response?.data.msg || '加入失败，请检查编号';
  } finally {
    joinLoading.value = false;
    isToastShow.value = true;
  }
};

// 复制编号功能
const copyCode = () => {
  if (teamCode.value) {
    navigator.clipboard.writeText(teamCode.value)
        .then(() => showToast({type: 'success', message: '编号已复制'}))
        .catch(() => showToast({type: 'fail', message: '复制失败'}));
  }
};
</script>

<template>
  <div class="team-container">
    <van-tabs v-model="active">
      <van-tab title="创建队伍">
        <van-form @submit="createTeamHandle">
          <van-field
              v-model="teamName"
              label="队伍名称"
              placeholder="请输入队伍名称（3-15字）"
              :rules="[{ required: true, message: '请输入队伍名称' }, { minLength: 3, maxLength: 15, message: '长度需3-15字' }]"
          />
          <van-button type="primary" block :loading="isLoading" native-type="submit">
            创建队伍
          </van-button>
        </van-form>
        <div v-if="teamCode" class="code-container">
          <h3> 您的队伍编号：</h3>
          <van-text-ellipsis :text="teamCode" :rows="1" class="code-display"/>
          <van-button type="default" @click="copyCode"> 复制编号</van-button>
        </div>
      </van-tab>

      <van-tab title="加入队伍">
        <van-form @submit="joinTeamHandle">
          <van-field
              v-model="joinCode"
              label="队伍编号"
              placeholder="请输入四位队伍编号"
              :rules="[{ required: true, message: '请输入队伍编号' }, { pattern: /^\d{4}$/, message: '请输入四位数字' }]"
          />
          <van-button type="primary" block :loading="joinLoading" native-type="submit">
            加入队伍
          </van-button>
        </van-form>
      </van-tab>
    </van-tabs>

    <van-toast :show="isToastShow" :type="toastType" :message="toastMsg"/>
  </div>
</template>

<style scoped>
.team-container {
  padding: 20px;
}

.code-container {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ebedf0;
  border-radius: 8px;
}

.code-display {
  font-size: 24px;
  font-weight: bold;
  margin: 15px 0;
  color: #1989fa;
}
</style>
