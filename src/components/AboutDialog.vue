<template>
  <van-popup
      v-model:show="showPopup"
      position="center"
      :style="{ width: '90%', maxWidth: '400px', maxHeight: '80%' }"
      class="about-popup rounded-md"
      close-on-click-overlay
  >
    <!-- 标题栏 -->
    <div class="about-header">
      <div class="title-container">
        <h2 class="about-title">关于 | Powered by 升华工作室</h2>
      </div>
      <van-icon name="cross" class="close-icon" @click="showPopup = false"/>
    </div>

    <!-- 内容区域 -->
    <div class="about-content">
      <!-- Logo和工作室名称 -->
      <div class="studio-info">
        <div class="studio-logo">
          <img :src="logoSrc" alt="升华工作室" class="logo-image"/>
        </div>
        <h3 class="studio-name">升华工作室</h3>
        <div class="version-badge">v{{ version }}</div>
      </div>

      <!-- 开发团队 -->
      <div class="about-section">
        <h4 class="section-title">
          <van-icon name="friends-o" class="section-icon"/>
          程序开发团队
        </h4>
        <div class="team-grid">
          <div
              v-for="(member, index) in teamMembers"
              :key="index"
              class="team-member"
          >
            <div class="member-avatar">
              <!-- member.name.charAt(0).toUpperCase() -->
              <img :src=member.avatar alt="Avatar" style="border-radius: 50%;"></img>
            </div>
            <div class="member-info">
              <div class="member-name">{{ member.name }}</div>
              <div class="member-role">{{ member.role }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技术栈 -->
      <div class="about-section">
        <h4 class="section-title">
          <van-icon name="cluster-o" class="section-icon"/>
          技术栈
        </h4>
        <div class="tech-stack">
          <div
              v-for="(category, index) in techStack"
              :key="index"
              class="tech-category"
          >
            <div class="category-name">{{ category.category }}</div>
            <div class="tech-items">
              <span
                  v-for="(item, itemIndex) in category.items"
                  :key="itemIndex"
                  class="tech-item"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 页脚 -->
      <div class="about-footer">
        <div class="slogan">盛世升华 服务中南</div>
        <div class="copyright">构建时间: {{ buildTime }}</div>
        <div class="copyright">© 2001-2024 升华工作室</div>
      </div>
    </div>

    <!-- 按钮区域 -->
    <div class="about-actions">
      <van-button
          block
          round
          type="primary"
          color="#4f46e5"
          class="learn-more-btn"
          @click="learnMore"
      >
        了解更多
      </van-button>
      <van-button
          block
          round
          plain
          class="close-btn"
          @click="showPopup = false"
      >
        关闭
      </van-button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import {Popup, Icon, Button} from 'vant';
import logoSrc from '@/assets/logo.png';
import AvatarSrc1 from '@/assets/avatar/1.jpg';
import AvatarSrc2 from '@/assets/avatar/2.jpg';
import AvatarSrc3 from '@/assets/avatar/3.jpg';
import AvatarSrc4 from '@/assets/avatar/4.jpg';
import { ref, onMounted } from 'vue';

const buildTime = ref('');

onMounted(async () => {
  try {
    const response = await fetch('/build-time.json');
    if (!response.ok) throw new Error('Fetch Build Time Error');
    const { time } = await response.json();
    buildTime.value = new Date(time).toLocaleString(); // 转换为本地时间格式
  } catch (error) {
    console.error('Fetch Build Time Error:', error);
    buildTime.value = '未知';
  }
});

// 控制弹窗显示
const showPopup = ref(false);

// 版本信息
const version = ref('2.0_main');


// 团队成员数据
const teamMembers = ref([
  {name: 'grtsinry43', role: '全栈开发', avatar: AvatarSrc1},
  {name: 'SteamFinder', role: '全栈开发', avatar: AvatarSrc2},
  {name: 'mufenqwq', role: '全栈开发', avatar: AvatarSrc3},
  {name: 'Kyliancc', role: '全栈开发', avatar: AvatarSrc4}
]);

// 技术栈数据
const techStack = ref([
  {category: '前端', items: ['Vite', 'Vue3', 'Vant', 'TypeScript']},
  {category: '后端', items: ['SpringBoot', 'MyBatis', 'MySQL']},
  {category: '核心技术', items: ['为人民服务']}
]);

// 了解更多
const learnMore = () => {
  window.open('https://54sh.csu.edu.cn', '_blank');
  console.log("应该不会有人发现log吧（）");
};

// 打开弹窗的方法
const open = () => {
  showPopup.value = true;
};

// 导出方法供外部使用
defineExpose({
  open
});
</script>

<style scoped>
.about-popup {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.about-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.52), rgba(129, 140, 248, 0.59));
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.title-container {
  flex-grow: 1;
}

.about-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.close-icon {
  font-size: 20px;
  cursor: pointer;
}

.about-content {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.studio-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.studio-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
  position: relative;
  overflow: hidden;
}

.studio-logo::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%);
  opacity: 0.6;
}

.logo-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.studio-name {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
}

.version-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #4f46e5, #818cf8);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.about-section {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease-out;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.section-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #4f46e5;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.team-member {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: rgba(243, 244, 246, 0.5);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.team-member:hover {
  background-color: rgba(243, 244, 246, 0.8);
  transform: translateY(-2px);
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #818cf8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 8px;
  font-size: 14px;
}

.member-info {
  flex-grow: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.member-role {
  font-size: 12px;
  color: #6b7280;
}

.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tech-category {
  background-color: rgba(243, 244, 246, 0.5);
  border-radius: 8px;
  padding: 12px;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.category-name::before {
  content: '•';
  color: #4f46e5;
  margin-right: 8px;
  font-size: 18px;
}

.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-item {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(129, 140, 248, 0.1));
  color: #4f46e5;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 12px;
  display: inline-block;
}

.about-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.slogan {
  font-size: 16px;
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 8px;
}

.copyright {
  font-size: 12px;
  color: #6b7280;
}

.about-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.learn-more-btn {
  margin-bottom: 12px;
  font-weight: 600;
}

.close-btn {
  font-weight: 600;
  color: #6b7280;
  border-color: #d1d5db;
}

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
</style>
