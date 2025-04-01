<script setup lang="ts">
import { ref, computed } from 'vue';
import { showToast, showDialog } from 'vant';
import { applyActivity, cancelApplyActivity, getAllActivities } from "@/api";

// Define the Activity type based on the API response
interface Activity {
  id?: string;
  name?: string;
  curNum?: number;
  limitNum?: number;
  description?: string;
  heroImg?: string;
  limitTime?: string;
  hasApplied?: boolean;
  createAt?: string;
  updateAt?: string;
}

const activities = ref<Activity[]>([]);

const fetchData = () => {
  getAllActivities().then(res => {
    // activities.value = res.data?.data ?? [];
    activities.value = (res.data?.data ?? []).slice().sort((a, b) => {
      // 按创建时间倒序排列, 新的在前
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }).catch(() => {
    showToast('获取活动列表失败');
  });
};

fetchData();

// Track which cards are expanded
const activeNames = ref<string[]>([]);

// Format date to a more readable format
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate remaining time in milliseconds for countdown
const getRemainingTime = (dateString?: string) => {
  if (!dateString) return 0;
  const targetDate = new Date(dateString).getTime();
  const now = Date.now();
  return Math.max(0, targetDate - now);
};

// Handle registration
const handleRegister = (activity: Activity) => {
  const currentParticipants = activity.curNum ?? 0;

  if (currentParticipants >= (activity.limitNum ?? 0)) {
    showToast('活动名额已满');
    return;
  }

  showDialog({
    title: '确认报名',
    message: ` 确定要报名参加"${activity.name}"吗？`,
    confirmButtonText: '确认报名',
    cancelButtonText: '取消',
  }).then(() => {
    applyActivity({
      query: {
        activityId: activity.id ?? ''
      }
    }).then(() => {
      // Update the current number of participants
      fetchData();
      showToast('报名成功');
    }).catch(() => {
      // User canceled
    });
  });
}

// Handle cancellation
const handleCancel = (activity: Activity) => {
  showDialog({
    title: '取消报名',
    message: `确定要取消报名"${activity.name}"吗？`,
    confirmButtonText: '确认取消',
    cancelButtonText: '返回',
  }).then(() => {
    cancelApplyActivity({
      query: {
        activityId: activity.id ?? ''
      },
    }).then(() => {
      // Update the current number of participants
      fetchData();
      showToast('取消报名成功');
    }).catch(() => {
      // User canceled
    });
  });
};

// Check if activity is full
const isActivityFull = (activity: Activity) => {
  return (activity.curNum ?? 0) >= (activity.limitNum ?? 0);
};

// Check if activity deadline has passed
const isDeadlinePassed = (activity: Activity) => {
  const deadline = new Date(activity.limitTime ?? '').getTime();
  return Date.now() > deadline;
};

// Determine if user can register
const canRegister = (activity: Activity) => {
  return !isActivityFull(activity) && !isDeadlinePassed(activity);
};

const getProgressColor = (activity: Activity) => {
  const percentage = Math.min(100, ((activity.curNum ?? 0) / (activity.limitNum ?? 1)) * 100);
  if (percentage >= 90) return '#ee0a24';
  if (percentage >= 70) return '#ff976a';
  return '#07c160';
}
</script>

<template>
  <div class="activity-list">
    <div class="container">
      <h1 class="page-title">活动列表</h1>

      <van-collapse v-model="activeNames" accordion>
        <van-collapse-item v-for="activity in activities" :key="activity.id" :name="activity.id" class="activity-card">
          <template #title>
            <div class="card-header">
              <div class="card-title-wrapper">
                <div class="activity-icon" :class="{ 'full': isActivityFull(activity) }">
                  <van-icon :name="isActivityFull(activity) ? 'stop-circle-o' : 'fire-o'" />
                </div>
                <div class="card-title">{{ activity.name || '-' }}</div>
              </div>
              <van-tag :type="isActivityFull(activity) ? 'danger' : 'success'" class="card-tag" round>
                {{ activity.curNum ?? '-' }}/{{ activity.limitNum ?? '-' }}
              </van-tag>
            </div>
          </template>

          <template #value>
            <div class="card-preview pr-4">
              <div class="countdown-wrapper" v-if="activity.hasApplied">
                <span>已经报名</span>
              </div>
              <div class="countdown-wrapper" v-else-if="!isDeadlinePassed(activity)">
                <van-icon name="underway-o" class="countdown-icon" />
                <van-count-down :time="getRemainingTime(activity.limitTime)" format="DD天HH时mm分ss秒" class="countdown" />
              </div>
              <div class="deadline-passed" v-else>
                <van-icon name="closed" class="deadline-icon" />
                <span>报名已截止</span>
              </div>
            </div>
          </template>

          <div class="card-content">
            <div class="hero-image-container">
              <van-image :src="activity.heroImg || ''" width="100%" height="220" fit="cover" radius="12px"
                class="hero-image">
                <template #error>
                  <div class="image-placeholder">
                    <van-icon name="photo-o" size="48" />
                    <p>活动图片</p>
                  </div>
                </template>
              </van-image>

              <div class="image-overlay" v-if="isActivityFull(activity) || isDeadlinePassed(activity)">
                <div class="overlay-content">
                  {{ isActivityFull(activity) ? '名额已满' : '报名已截止' }}
                </div>
              </div>
            </div>

            <div class="activity-details">
              <van-cell-group inset class="details-group">
                <van-cell title="活动名称" :value="activity.name || '-'" class="detail-cell" />

                <van-cell title="活动描述" class="detail-cell description-cell">
                  <template #value>
                    <!--
                    <div class="description">{{ activity.description || '-' }}</div>
                    -->
                    <van-text-ellipsis 
                    class="description"
                    rows="5" 
                    :content=" activity.description || '-' " 
                    expand-text="展开" 
                    collapse-text="收起" />
                  </template>
                </van-cell>

                <van-cell title="报名人数" class="detail-cell">
                  <template #value>
                    <div class="participants">
                      <van-progress
                        :percentage="Math.min(100, ((activity.curNum ?? 0) / (activity.limitNum ?? 1)) * 100)"
                        :pivot-text="`${activity.curNum ?? '-'}/${activity.limitNum ?? '-'}`"
                        :color="getProgressColor(activity)" track-color="#e9f5ff" stroke-width="10px"
                        class="progress-bar" />
                    </div>
                  </template>
                </van-cell>

                <van-cell title="截止时间" class="detail-cell">
                  <template #value>
                    <div class="deadline-time" :class="{ 'passed': isDeadlinePassed(activity) }">
                      <van-icon :name="isDeadlinePassed(activity) ? 'clock-o' : 'clock'" class="time-icon" />
                      <span>{{ formatDate(activity.limitTime) }}</span>
                    </div>
                  </template>
                </van-cell>
              </van-cell-group>

              <div class="action-area">
                <van-button block
                  :type="activity.hasApplied ? 'danger' : (canRegister(activity) ? 'primary' : 'default')"
                  :disabled="!canRegister(activity)"
                  @click.stop="!activity.hasApplied ? handleRegister(activity) : handleCancel(activity)"
                  class="register-button" round>
                  <template v-if="activity.hasApplied">
                    {{ '取消报名' }}
                  </template>
                  <template v-else-if="canRegister(activity)">
                    <van-icon name="sign" class="button-icon" />
                    立即报名
                  </template>
                  <template v-else>
                    {{ isActivityFull(activity) ? '名额已满' : '报名已截止' }}
                  </template>
                </van-button>
              </div>
            </div>
          </div>
        </van-collapse-item>
      </van-collapse>

      <div class="empty-state" v-if="!activities || activities.length === 0">
        <van-empty description="暂无活动" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 将 Collapse Item 的 title 和 value 两个插槽都设为 block，上下分行显示 */
:deep(.van-collapse-item__title),
:deep(.van-collapse-item__value) {
  display: block !important;
}

.activity-list {
  background: linear-gradient(135deg, #e0f7fa 0%, #e3f2fd 50%, #e8f5e9 100%);
  min-height: 100vh;
  padding: 16px 0 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.container {
  padding: 0 16px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin: 16px 0 24px;
  position: relative;
  padding-bottom: 12px;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 3px;
}

.activity-card {
  margin-bottom: 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background-color: white;
  transition: all 0.3s ease;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
}

.activity-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #07c160;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.activity-icon.full {
  background-color: #ee0a24;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #323233;
}

.card-tag {
  font-weight: 600;
  padding: 2px 10px;
  font-size: 12px;
}

.card-preview {
  font-size: 13px;
  color: #969799;
  display: flex;
  align-items: center;
}

.countdown-wrapper {
  display: flex;
  align-items: center;
  color: #ff976a;
  font-weight: 500;
}

.countdown-icon {
  margin-right: 4px;
  color: #ff976a;
}

.countdown {
  color: #ff976a;
}

.deadline-passed {
  display: flex;
  align-items: center;
  color: #ee0a24;
  font-weight: 500;
}

.deadline-icon {
  margin-right: 4px;
}

.card-content {
  padding: 16px 0;
}

.hero-image-container {
  position: relative;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.hero-image {
  transition: transform 0.5s ease;
}

.hero-image-container:hover .hero-image {
  transform: scale(1.03);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.overlay-content {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: 700;
  transform: rotate(-5deg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 220px;
  background-color: #f7f8fa;
  color: #969799;
}

.image-placeholder p {
  margin-top: 8px;
}

.activity-details {
  margin-top: 16px;
}

.details-group {
  margin: 0 auto 0 auto !important;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.detail-cell {
  padding: 12px 16px;
}

.detail-cell :deep(.van-cell__title) {
  font-weight: 600;
  color: #323233;
}

.description-cell {
  padding-bottom: 16px;
}

.description {
  white-space: pre-wrap;
  color: #646566;
  line-height: 1.6;
  font-size: 14px;
  text-align: start;
}

.participants {
  width: 100%;
  padding: 8px 0;
}

.progress-bar {
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar :deep(.van-progress__pivot) {
  font-weight: 600;
  min-width: 45px;
  padding: 0 8px;
}

.deadline-time {
  display: flex;
  align-items: center;
  color: #07c160;
  font-weight: 500;
}

.deadline-time.passed {
  color: #ee0a24;
}

.time-icon {
  margin-right: 4px;
}

.action-area {
  padding: 20px 16px 8px;
}

.register-button {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.3);
  transition: all 0.3s ease;
}

.register-button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(7, 193, 96, 0.4);
}

.button-icon {
  margin-right: 6px;
  font-size: 18px;
}

.empty-state {
  padding: 40px 0;
}

/* 自定义 van-collapse 样式 */
:deep(.van-collapse-item__title) {
  padding: 16px;
  font-size: 16px;
}

:deep(.van-collapse-item__content) {
  padding: 0 16px 16px;
}

:deep(.van-cell) {
  background-color: transparent;
}

:deep(.van-cell__value) {
  width: 100%;
  justify-content: center;
  display: flex;
  align-items: center;
}


:deep(.van-cell::after) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.van-cell-group__title) {
  padding: 16px 16px 8px;
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.activity-card {
  animation: fadeIn 0.5s ease forwards;
}
</style>
