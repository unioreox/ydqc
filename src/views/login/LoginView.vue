<script setup lang="ts">
const loginHandle = () => {
  if (import.meta.env.MODE === 'production') {
    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${"wx2fdfc27744ffa252"}
&redirect_uri=${encodeURIComponent("https://race.54sher.com")}
&response_type=code
&scope=snsapi_userinfo
#wechat_redirect`;
  } else {
    console.log("测试环境直接登录");
    window.location.href = `http://localhost:5173/?code=grtsinry43`;
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-inner">
      <span class="hint font-bold text-2xl"> 通过微信登录来参与活动 </span>
      <van-button type="success"
                  class="login-btn"
                  style="border-radius: 10px;width: 10em;box-shadow: #06C05F 0 0 3px;"
                  icon="wechat"
                  @click="loginHandle">
        &nbsp;&nbsp; 微信登录
      </van-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.login-container {
  height: 100vh;

  .login-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30vh;
  }

  .hint {
    margin-bottom: 2em;
  }

  .login-btn {
    font-size: 1.1em;
    font-weight: bolder;
  }
}
</style>
