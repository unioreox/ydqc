<script setup lang="ts">
import {showDialog} from "vant";
import {ref} from "vue";

const activeTab = ref("campus"); // Default to campus login

// Campus login handler
const campusLoginHandle = () => {
  // Redirect to campus authentication
  window.location.href = "/api/v1/oauth2/authorization/csu";
};

// WeChat login handler
const wechatLoginHandle = () => {
  if (import.meta.env.MODE === 'production') {
    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${"wxec410728170d3f78"}
&redirect_uri=${encodeURIComponent("https://ydqc.csu.edu.cn/")}
&response_type=code
&scope=snsapi_userinfo
#wechat_redirect`;
  } else {
    // Test environment - show dialog and skip WeChat authorization
    showDialog({
      title: '测试环境登录',
      message: '将直接完成登录，无需授权',
    }).then(() => {
      window.location.href = `/?code=justfortest`;
    });
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">趁青春，去登山！</h1>
        <p class="login-subtitle">请选择适合您的登录方式</p>
      </div>

      <div class="login-tabs">
        <div
            class="login-tab"
            :class="{ 'active': activeTab === 'campus' }"
            @click="activeTab = 'campus'"
        >
          校内人员
        </div>
        <div
            class="login-tab"
            :class="{ 'active': activeTab === 'wechat' }"
            @click="activeTab = 'wechat'"
        >
          校外人员
        </div>
      </div>

      <div class="login-content">
        <div v-if="activeTab === 'campus'" class="login-option">
          <div class="login-option-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 class="lucide lucide-school">
              <path d="m4 6 8-4 8 4"></path>
              <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"></path>
              <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"></path>
              <path d="M18 5v17"></path>
              <path d="M6 5v17"></path>
              <circle cx="12" cy="9" r="2"></circle>
            </svg>
          </div>
          <h2 class="login-option-title">统一身份认证</h2>
          <p class="login-option-desc">使用中南大学统一身份认证系统登录</p>
          <van-button
              type="primary"
              class="login-btn campus-btn"
              @click="campusLoginHandle"
          >
            立即登录
          </van-button>
        </div>

        <div v-if="activeTab === 'wechat'" class="login-option">
          <div class="login-option-icon wechat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 class="lucide lucide-message-circle">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
            </svg>
          </div>
          <h2 class="login-option-title">微信登录</h2>
          <p class="login-option-desc">使用微信快速登录（请确保在微信客户端内）</p>
          <van-button
              type="success"
              class="login-btn wechat-btn"
              icon="wechat"
              @click="wechatLoginHandle"
          >
            微信登录
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 480px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #666;
  font-size: 1rem;
}

.login-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 2rem;
}

.login-tab {
  flex: 1;
  text-align: center;
  padding: 0.75rem 0;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.login-tab.active {
  color: #1989fa;
  border-bottom: 2px solid #1989fa;
}

.login-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
}

.login-option-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #e6f7ff;
  color: #1989fa;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
}

.login-option-icon.wechat-icon {
  background-color: #e6fff0;
  color: #07c160;
}

.login-option-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.login-option-desc {
  color: #666;
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
}

.campus-btn {
  background-color: #1989fa;
  border: none;
}

.wechat-btn {
  background-color: #07c160;
  border: none;
  box-shadow: 0 0 3px #06c05f;
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }

  .login-option {
    padding: 1rem;
  }
}
</style>