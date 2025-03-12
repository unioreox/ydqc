<script setup lang="ts">
import {showDialog} from "vant";

const loginHandle = () => {
  // if (import.meta.env.MODE === 'production') {
//     window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${"wxec410728170d3f78"}
// &redirect_uri=${encodeURIComponent("https://test.grtsinry43.com")}
// &response_type=code
// &scope=snsapi_userinfo
// #wechat_redirect`;
//   } else {
//     console.log("测试环境直接登录");
//     window.location.href = `http://localhost:5173/?code=${encodeURIComponent("54sher.$%*!")}`;
//   }
  // TODO : 仅在测试环境
  showDialog({
    title: '测试环境登录',
    message: '将直接完成登录，无需微信授权',
  }).then(() => {
    window.location.href = `/?code=justfortest`;
  })

}
// }
const loginHandle2 = () => {
  // TODO : 仅在测试环境
  showDialog({
    title: '测试环境登录',
    message: '将直接完成登录，无需微信授权',
  }).then(() => {
    window.location.href = `/?code=justfortest2`;
  })
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
        &nbsp;&nbsp; 测试登录
      </van-button>
      <van-button type="success"
                  class="login-btn"
                  style="border-radius: 10px;width: 10em;box-shadow: #06C05F 0 0 3px;"
                  icon="wechat"
                  @click="loginHandle2">
        &nbsp;&nbsp; 测试登录2
      </van-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.login-container {
  height: 100%;

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
