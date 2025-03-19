<script setup lang="ts">
import {ref, onMounted, nextTick} from 'vue';
import html2canvas from 'html2canvas';
import {Button, ShareSheet, showDialog, showNotify, showToast} from 'vant';
import 'vant/lib/index.css';
import {type CertificateVo, getCertificateByUserIdApi} from "@/api";
import {useRouter} from "vue-router";
import wx from "weixin-js-sdk";
import useClipboard from 'vue-clipboard3';

const captureArea = ref<HTMLElement | null>(null);
const generatedImage = ref<string | null>(null);
const showShare = ref(false);
const showDom = ref(true);

const router = useRouter();
const clipboard = useClipboard();

const certificateInfo = ref<CertificateVo>({
  id: "",
  userName: "",
  totalMilliseconds: "",
  ranking: 0,
  createAt: "",
  updateAt: "",
});

const options = [
  {name: '微信', icon: 'wechat'},
  {name: '复制链接', icon: 'link'},
];

const captureAndExport = async () => {
  if (!captureArea.value) return;

  const scale = 4; // 增加分辨率
  const canvas = await html2canvas(captureArea.value, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
  });

  generatedImage.value = canvas.toDataURL('image/png');

  showDom.value = false;

  showToast({
    type: 'success',
    message: '长按图片保存到相册',
  });
};

const onSelect = async (option: { name: string }) => {
  showShare.value = false;
  // 在这里处理分享逻辑
  console.log('选择的分享选项：', option.name);
  if (option.name === '微信') {
    wx.ready(() => {
      wx.updateAppMessageShareData({
        title: '我完成了中南大学2024首届秋季登山节！', // Share title
        desc: '快来看看我的证书吧！', // Share description
        link: 'https://race.54sher.com/finish/' + certificateInfo.value.id, // Share link
        imgUrl: 'https://race.54sher.com/share.png', // Share icon
        success: () => {
          showToast({
            type: 'success',
            message: '分享链接已生成，现在，你可以点击右上角分享给好友啦！',
          });
        },
        fail: (err) => {
          console.error('分享失败', err);
          showNotify({
            type: 'danger',
            message: ` 分享失败: ${err.errMsg}`,
          });
        },
      });
    });
    wx.error((err) => {
      console.error('微信 JS-SDK 出错', err);
      showNotify({
        type: 'danger',
        message: ` 微信 JS-SDK 出错: ${err.errMsg}`,
      });
    });
  } else if (option.name === '复制链接') {
    try {
      await clipboard.toClipboard('https://ydqc.csu.edu.cn/finish/' + certificateInfo.value.id);
      showToast("已复制到剪贴板");
    } catch (e) {
      console.log(e)
      showToast({message: "复制失败", type: "fail"});
    }
  }
};

onMounted(() => {
  if (captureArea.value) {
    const img = new Image();
    img.src = new URL('@/assets/certificate.png', import.meta.url).href;
    img.onload = () => {
      const viewportWidth = Math.min(document.documentElement.clientWidth, 414); // 限制最大宽度为 414px
      const scale = viewportWidth / img.width;
      captureArea.value!.style.width = `${viewportWidth}px`;
      captureArea.value!.style.height = `${img.height * scale}px`;
    };
  }

  getCertificateByUserIdApi().then(res => {
    if (res.data?.data) {
      console.log('获取证书成功：', res.data.data);
      certificateInfo.value = res.data.data;
    } else {
      showDialog({
        title: '你还没有证书哦',
        message: '前面的区域以后再探索吧！',
      }).then(() => {
        router.push('/user');
      });
    }
  });
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString === "" ? Date.now() : dateString);
  const year = date.getFullYear().toString().split('').map(num => '〇一二三四五六七八九'[parseInt(num)]).join('');
  const month = date.getMonth() + 1;
  const monthChinese = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][month - 1];
  return `${year}年${monthChinese}`;
};
</script>

<template>
  <div class="certificate-container">
    <div ref="captureArea" class="capture-area" v-if="showDom">
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
            <p> {{ formatDate(certificateInfo.createAt || "") }} </p>
          </div>
        </div>
      </div>
    </div>

    <img v-if="generatedImage" :src="generatedImage" alt="导出的图片" class="exported-image"/>

    <div class="button-container">
      <Button @click="captureAndExport" type="primary" block> 导出图片</Button>
      <Button @click="showShare = true" type="default" block> 分享</Button>
    </div>

    <ShareSheet
        v-model:show="showShare"
        :options="options"
        title="立即分享给好友"
        @select="onSelect"
    />
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
  background: url('@/assets/certificate.png') no-repeat center center;
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
  margin-top: 4vh;
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
  font-size: 15px;
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
