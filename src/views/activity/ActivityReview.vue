<script setup lang="ts">
import {ref, onMounted, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import {type ActivityReviewVO, getReviewContent} from "@/api";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, {language: lang}).value;
      } catch (__) {
      }
    }
    return ''; // use external default escaping
  }
});

const route = useRoute();
const activityId = route.params.id as string;

const loading = ref(true);
const review = ref<ActivityReviewVO>({
  title: '',
  date: '',
  coverImage: '',
  markdown: '',
});


const fetchActivityReview = (id: string) => {
  getReviewContent({
    id
  }).then((res) => {
    if (res.data?.data) {
      review.value = res.data.data as ActivityReviewVO;
    }
    loading.value = false;
  })
};

onMounted(() => {
  fetchActivityReview(activityId);
});

// Render markdown content
const renderedMarkdown = computed(() => {
  return md.render(review.value.markdown || '');
});

// Extract images from markdown for gallery
const markdownImages = computed(() => {
  const imgRegex = /!\[.*?\]\((.*?)\)/g;
  const markdownContent = review.value.markdown || '';
  const matches = [...markdownContent.matchAll(imgRegex)];
  return matches.map(match => match[1]);
});

// View gallery
const showGallery = ref(false);
const initialSwipeIndex = ref(0);
const allImages = computed(() => {
  return [...markdownImages.value];
});

const openGallery = (index: number, source: 'markdown' | 'gallery' = 'gallery') => {
  if (source === 'markdown') {
    initialSwipeIndex.value = index;
  } else {
    initialSwipeIndex.value = markdownImages.value.length + index;
  }
  showGallery.value = true;
};

// Handle image click in markdown content
const handleMarkdownImageClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.tagName === 'IMG') {
    const src = target.getAttribute('src');
    const index = markdownImages.value.findIndex(img => img === src);
    if (index !== -1) {
      openGallery(index, 'markdown');
    }
  }
};
</script>

<template>
  <div class="activity-review">
    <van-skeleton title avatar :row="10" :loading="loading" animated>
      <div class="review-container">
        <!-- Cover Image -->
        <div class="cover-image-container">
          <van-image
              :src="review.coverImage"
              width="100%"
              height="240"
              fit="cover"
              class="cover-image"/>
          <div class="cover-overlay">
            <h1 class="review-title">{{ review.title }}</h1>
            <div class="review-meta">
              <van-icon name="clock-o" class="meta-icon"/>
              <span>{{ new Date(review.date).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>

        <!-- Markdown Content -->
        <div class="markdown-section">
          <div class="section-header">
            <div class="section-title">
              <van-icon name="newspaper-o" class="section-icon"/>
              <h2>活动详情</h2>
            </div>
          </div>

          <div
              class="markdown-content"
              v-html="renderedMarkdown"
              @click="handleMarkdownImageClick"
          ></div>
        </div>

        <!-- Gallery -->
        <!--  <div class="gallery-section">-->
        <!--    <div class="section-header">-->
        <!--      <div class="section-title">-->
        <!--        <van-icon name="photo-o" class="section-icon"/>-->
        <!--        <h2>全部活动照片</h2>-->
        <!--      </div>-->
        <!--      <van-button size="small" type="primary" plain round icon="expand-o" @click="openGallery(0)">-->
        <!--        全部查看-->
        <!--      </van-button>-->
        <!--    </div>-->

        <!--    &lt;!&ndash;<div class="gallery-grid">&ndash;&gt;-->
        <!--    &lt;!&ndash;  <div&ndash;&gt;-->
        <!--    &lt;!&ndash;      v-for="(image, index) in review.gallery.split(',').slice(0, 6)"&ndash;&gt;-->
        <!--    &lt;!&ndash;      :key="index"&ndash;&gt;-->
        <!--    &lt;!&ndash;      class="gallery-item"&ndash;&gt;-->
        <!--    &lt;!&ndash;      @click="openGallery(index)">&ndash;&gt;-->
        <!--    &lt;!&ndash;    <van-image&ndash;&gt;-->
        <!--    &lt;!&ndash;        :src="image"&ndash;&gt;-->
        <!--    &lt;!&ndash;        width="100%"&ndash;&gt;-->
        <!--    &lt;!&ndash;        height="100%"&ndash;&gt;-->
        <!--    &lt;!&ndash;        fit="cover"&ndash;&gt;-->
        <!--    &lt;!&ndash;        radius="8px"/>&ndash;&gt;-->
        <!--    &lt;!&ndash;    <div class="gallery-overlay" v-if="index === 5 && review.gallery.split(',').length > 6">&ndash;&gt;-->
        <!--    &lt;!&ndash;      <span>+{{ review.gallery.split(',').length - 6 }}</span>&ndash;&gt;-->
        <!--    &lt;!&ndash;    </div>&ndash;&gt;-->
        <!--    &lt;!&ndash;  </div>&ndash;&gt;-->
        <!--    &lt;!&ndash;</div>&ndash;&gt;-->
        <!--  </div>-->
      </div>
    </van-skeleton>

    <!-- Image Gallery Viewer -->
    <van-image-preview
        v-model:show="showGallery"
        :images="allImages"
        :start-position="initialSwipeIndex"
        :show-index="true"
        :closeable="true"/>

    <van-back-top/>
  </div>
</template>

<style scoped>
.activity-review {
  background-color: #f7f8fa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: #323233;
}

.review-container {
  padding: 0 0 32px;
}

.cover-image-container {
  position: relative;
  width: 100%;
  height: 240px;
  margin-bottom: 24px;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4), transparent);
  padding: 30px 16px 20px;
}

.review-title {
  color: white;
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.review-meta {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.meta-icon {
  margin-right: 4px;
}

.ml-3 {
  margin-left: 12px;
}

.summary-card {
  margin: 0 16px 24px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: flex-start;
  transform: translateY(-20px);
}

.summary-icon {
  font-size: 20px;
  color: #07c160;
  margin-right: 12px;
  margin-top: 2px;
}

.summary-text {
  font-size: 15px;
  line-height: 1.6;
  color: #323233;
  margin: 0;
  flex: 1;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 16px;
}

.section-title {
  display: flex;
  align-items: center;
}

.section-icon {
  font-size: 20px;
  color: #07c160;
  margin-right: 8px;
}

.section-title h2 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.participants-section,
.markdown-section,
.gallery-section,
.share-section {
  margin: 0 16px 24px;
  padding: 20px 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.participants-swipe {
  padding: 0 16px;
}

.participant-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
}

.participant-avatar {
  margin-bottom: 8px;
  border: 2px solid #07c160;
}

.participant-name {
  font-size: 14px;
  color: #323233;
  text-align: center;
  margin-bottom: 4px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-role {
  font-size: 10px;
}

.markdown-content {
  padding: 0 16px;
}

/* Override scoped styles for markdown content */
:deep(.markdown-content) {
  line-height: 1.8;
  color: #323233;
}

:deep(.markdown-content h2) {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebedf0;
  color: #07c160;
}

:deep(.markdown-content h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 12px;
  color: #323233;
}

:deep(.markdown-content p) {
  margin: 16px 0;
  font-size: 15px;
}

:deep(.markdown-content img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-content ul, .markdown-content ol) {
  padding-left: 24px;
  margin: 16px 0;
}

:deep(.markdown-content li) {
  margin: 8px 0;
}

:deep(.markdown-content blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 4px solid #07c160;
  background-color: #f7f8fa;
  color: #606266;
  font-style: italic;
}

:deep(.markdown-content em) {
  color: #909399;
  font-style: italic;
  display: block;
  text-align: center;
  margin-top: -12px;
  margin-bottom: 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px;
}

.gallery-item {
  aspect-ratio: 1/1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
  position: relative;
}

.gallery-item:hover {
  transform: scale(1.02);
}

.gallery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.share-section {
  margin: 0 16px 24px;
  padding: 20px 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* Animation */
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

.summary-card,
.participants-section,
.markdown-section,
.gallery-section {
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

.summary-card {
  --index: 1;
}

.participants-section {
  --index: 2;
}

.markdown-section {
  --index: 3;
}

.gallery-section {
  --index: 4;
}
</style>