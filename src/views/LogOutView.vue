<template>
  <div class="logout-container">
    <div class="logout-card">
      <van-image width="100" height="100" :src=Logo class="logo" />
      <h1>退出登录</h1>
      <p class="message">您正在登出中南大学悦动青春系统</p>

      <div class="iframe-container">
        <p class="iframe-title">您确定登出吗</p>
        <div class="auth-frame">
          <h2><b>公告</b></h2>
          <p style="text-align: left; text-justify: distribute;">
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            请勿尝试和他人配合在起点和终点进行切号打卡。切号打卡将会导致你的打卡数据无效。
          </p>
          <p style="text-align: right;">
            <br />
            升华工作室
          </p>
        </div>
      </div>

      <div class="buttons">
        <van-button type="primary" block size="large" color="#3370ff" @click="goToHome" class="home-button">
          确定登出
        </van-button>
      </div>

      <p class="footer-text">
        如有问题请联系升华工作室
      </p>
    </div>
  </div>
</template>

<script setup>
// https://ca.csu.edu.cn/personalInfo/logout
// https://ca.csu.edu.cn/authserver/logout
import { useRouter } from 'vue-router';
import Logo from '@/assets/logo.png';
import Cookies from "js-cookie";
import { showDialog } from 'vant';

const router = useRouter();

const goToHome = async () => {
  // TODO: 向https://ca.csu.edu.cn/personalInfo/logout POST数据 请求头Cookie带上Cookies
  // try {
  //   const response = await fetch('https://ca.csu.edu.cn/personalInfo/logout', {
  //     method: 'POST',
  //     credentials: 'include',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     }
  //   });
  //   if (!response.ok) {
  //     throw new Error(`退出请求失败: ${response.status}`);
  //   }
  //   Cookies.remove('token');
  //   router.push('/login');
  // } catch (error) {
  //   console.error('退出登录失败:', error);
  //   Cookies.remove('token');
  //   alert("本系统已注销Token, 统一身份认证系统Token注销错误\n重定向至统一身份认证登录页面强制退出")
  //   location.replace("https://ca.csu.edu.cn/personalInfo/logout");
  // }
  showDialog({
    title: '登出成功',
    message: '点击确定后将重定向至统一身份认证系统\n此操作将注销 OAuth2.0 令牌\n注销后请重新访问ydqc.csu.edu.cn',
  }).then(() => {
    Cookies.remove('token');
    location.replace("https://ca.csu.edu.cn/authserver/logout");
  });
}
</script>

<style scoped>
.logout-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.logout-card {
  max-width: 500px;
  width: 100%;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  margin-bottom: 16px;
}

h1 {
  color: #333;
  margin-bottom: 8px;
  font-size: 24px;
}

.message {
  color: #666;
  margin-bottom: 24px;
}

.iframe-container {
  width: 100%;
  margin: 2em 2em 2em 2em;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  overflow: hidden;
}

.iframe-title {
  background-color: #f9f9f9;
  padding: 8px;
  margin: 0;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #eaeaea;
}

.auth-frame {
  padding: 2em 2em 2em 2em;
  width: 100%;
  height: 15em;
  border: none;
}

.buttons {
  width: 100%;
  margin-bottom: 20px;
}

.home-button {
  border-radius: 8px;
}

.footer-text {
  font-size: 12px;
  color: #999;
  margin-top: 16px;
}
</style>
