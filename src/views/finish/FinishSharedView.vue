<script setup lang="ts">
import {ref, onMounted, nextTick} from 'vue';
import {Button, ShareSheet, showDialog, showNotify, showToast} from 'vant';
import 'vant/lib/index.css';
import {type CertificateVO, getCertificateByIdApi} from "@/api";
import {useRouter} from "vue-router";

const captureArea = ref<HTMLElement | null>(null);

const router = useRouter();

const id = router.currentRoute.value.params.id as string;

const certificateInfo = ref<CertificateVO>({
  id: "",
  userName: "",
  totalMilliseconds: "",
  ranking: 0,
  createAt: "",
  updateAt: "",
});

const participateHandle = () => {
  router.push('/login');
};

onMounted(() => {
  if (captureArea.value) {
    const img = new Image();
    img.src = new URL('@/assets/certificate.jpg', import.meta.url).href;
    img.onload = () => {
      const viewportWidth = Math.min(document.documentElement.clientWidth, 414); // 限制最大宽度为 414px
      const scale = viewportWidth / img.width;
      captureArea.value!.style.width = `${viewportWidth}px`;
      captureArea.value!.style.height = `${img.height * scale}px`;
    };
  }

  getCertificateByIdApi(
      {
        path: {
          id: id,
        },
      }
  ).then(res => {
    if (res.data?.data) {
      console.log('获取证书成功：', res.data.data);
      certificateInfo.value = res.data.data;
    } else {
      showDialog({
        title: '这个证书不存在',
        message: '前面的区域以后再探索吧！',
      }).then(() => {
        router.push('/');
      });
    }
  });
});
</script>

<template>
  <div class="certificate-container">
    <div ref="captureArea" class="capture-area">
      <!-- 这里是您可以添加自定义 DOM 元素的区域 -->
      <div class="custom-content">
        <!-- 示例：添加一些文本 -->
        <h2 class="certificate-title"> {{ certificateInfo.userName }} </h2>
        <p class="recipient-name"> 祝贺你成为本届登山节第 {{ certificateInfo.ranking }} 位完成者， </p>
        <p class="achievement"> 完成时间是 {{ certificateInfo.totalMilliseconds }} </p>
        <p class="wishes"> 愿你持续焕发活力，翻越未来的每一座 “山” ！ </p>

        <div class="foot text-[0.75rem]">
          <span class="text-start"> 证书编号：<br/> {{ certificateInfo.id }} </span>

          <div class="tuanwei-info">
            <p> 共青团中南大学委员会 </p>
            <p> 二〇二四年十月 </p>
          </div>
        </div>
      </div>
    </div>

    <div class="button-container">
      <Button @click="participateHandle" type="primary" block> 我也要参与</Button>
    </div>
  </div>
</template>

<style scoped>
.certificate-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}

.capture-area {
  background: url('@/assets/certificate.jpg') no-repeat center center;
  background-size: contain;
  width: 100%;
  max-width: 414px;
  position: relative;
}

.custom-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #333;
  text-align: center;
}

.certificate-title {
  margin-top: 6vh;
  font-size: 24px;
  margin-bottom: 20px;
}

.foot {
  position: absolute;
  padding: 4em;
  bottom: 3em;
  display: flex;
  width: 100%;
  justify-content: space-between;
}

.recipient-name, .achievement, .wishes {
  font-size: 18px;
  margin-bottom: 10px;
}

.button-container {
  width: 100%;
  max-width: 414px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exported-image {
  width: 100%;
  max-width: 414px;
  margin-top: 16px;
}
</style>
