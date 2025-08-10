<script setup lang="ts">
import {onMounted, ref} from "vue";
import {
  type CollegeCountLeaderBoardVo,
  getCollegeLeaderBoard,
  getTop30UsersByBestScore,
  getUserCountLeaderBoard,
  getUnionLeaderBoard,
  type UnionCountLeaderBoardVo,
  type UserBestScoreLeaderBoardVo,
  type UserCountLeaderBoardVo,
} from "@/api";
import {Trophy, Medal, Clock} from 'lucide-vue-next';
import { showDialog } from "vant";

const current = ref(0);
const lastUpdated = ref("");
const top30User = ref<UserBestScoreLeaderBoardVo[]>([]);
const countUser = ref<UserCountLeaderBoardVo[]>([]);
const collegeUser = ref<CollegeCountLeaderBoardVo[]>([]);
const unionUser = ref<UnionCountLeaderBoardVo[]>([]);

const beforeChange = (index: number) => {
  console.log('beforeChange', index);
  switch (index) {
      // case 0:
      //   fetchTop30Users();
      //   break;
    case 0:
      fetchCountUsers();
      break;
    case 1:
      fetchCollegeUsers();
      break;
    case 2:
      fetchUnionUsers();
      break;
  }
  return true;
}

onMounted(() => {
  // fetchTop30Users();
  fetchCountUsers();
});

const fetchTop30Users = async () => {
  getTop30UsersByBestScore().then((res) => {
    if (res.data?.data?.leaderBoard && res.data?.data?.lastUpdateTime) {
      top30User.value = res.data?.data?.leaderBoard;
      lastUpdated.value = res.data.data.lastUpdateTime;
    }
  });
}

const fetchCountUsers = async () => {
  getUserCountLeaderBoard().then((res) => {
    if (res.data?.data?.leaderBoard && res.data?.data?.lastUpdateTime) {
      countUser.value = res.data?.data?.leaderBoard;
      lastUpdated.value = res.data.data.lastUpdateTime;
      console.log(countUser.value);
    }
  });
}

const fetchCollegeUsers = async () => {
  getCollegeLeaderBoard().then((res) => {
    if (res.data?.data?.leaderBoard && res.data?.data?.lastUpdateTime) {
      // 应murmur要求删除的学院名称
      const delCollegeName = ["湘雅医院", "湘雅二医院", "湘雅三医院"];
      collegeUser.value = res.data?.data?.leaderBoard.filter(item => 
      item.collegeName && !delCollegeName.includes(item.collegeName));
      // collegeUser.value = res.data?.data?.leaderBoard;
      lastUpdated.value = res.data.data.lastUpdateTime;
    }
  });
}

const fetchUnionUsers = async () => {
  getUnionLeaderBoard().then((res) => {
    if (res.data?.data?.leaderBoard && res.data?.data?.lastUpdateTime) {
      // 应murmur要求删除的工会名称
      const delUnionName = ["后勤（无固定期限）"];
      unionUser.value = res.data?.data?.leaderBoard.filter(item =>
      item.unionName && !delUnionName.includes(item.unionName));
      lastUpdated.value = res.data.data.lastUpdateTime;
    }
  });
}
// isOHOS
const isNotOHOS = ref(true)
const userAgent = navigator.userAgent;
const uaVersionMatch = userAgent.match(/Firefox\/(\d+\.\d+\.\d+)/);

function isOHOS(){
if (uaVersionMatch) {
    const versionNumber = uaVersionMatch[1];
    if(versionNumber === '141.0.0'){
      isNotOHOS.value = false;
    }
}
}
isOHOS();
</script>

<template>
  <div class="leaderboard-container">
    <div style="padding: 5vh;" v-if="!isNotOHOS"></div>
    <div style="padding: 3vh;" v-if="isNotOHOS"></div>
    <div class="leaderboard-card">
      <!-- 标题栏 -->
      <div class="header">
        <h1 class="title">
          <span class="title-icon">🏆</span>
          排行榜
        </h1>
        <div class="update-info">
          <Clock class="clock-icon"/>
          <span>{{ lastUpdated }}</span>
        </div>
      </div>

      <!-- 标签页 -->
      <van-tabs v-model:active="current"
                :before-change="beforeChange"
                sticky
                animated
                swipeable
                class="custom-tabs">
        <!--&lt;!&ndash; 最佳成绩前30 &ndash;&gt;-->
        <!--<van-tab title="最佳成绩前 30">-->
        <!--  <div class="table-header">-->
        <!--    <span class="rank-column">排名</span>-->
        <!--    <span class="name-column">姓名</span>-->
        <!--    <span class="score-column">用时</span>-->
        <!--  </div>-->

        <!--  <ul v-if="top30User.length > 0" class="ranking-list">-->
        <!--    <li v-for="(user, index) in top30User"-->
        <!--        :key="index"-->
        <!--        class="ranking-item"-->
        <!--        :class="{'top-rank': index < 3}"-->
        <!--        :style="{'animation-delay': `${index * 0.05}s`}">-->

        <!--      <div class="rank-column">-->
        <!--        <div v-if="index === 0" class="medal gold">1</div>-->
        <!--        <div v-else-if="index === 1" class="medal silver">2</div>-->
        <!--        <div v-else-if="index === 2" class="medal bronze">3</div>-->
        <!--        <span v-else class="normal-rank">{{ index + 1 }}</span>-->
        <!--      </div>-->

        <!--      <div class="name-column">-->
        <!--        <div class="avatar-container">-->
        <!--          <img :src="user.userAvatar" :alt="user.userName" class="avatar">-->
        <!--          <div v-if="index < 3" class="avatar-badge"></div>-->
        <!--        </div>-->
        <!--        <span class="user-name">{{ user.userName }}</span>-->
        <!--      </div>-->

        <!--      <div class="score-column">-->
        <!--        <span class="score">{{ user.userBestScoreFormatted }}</span>-->
        <!--      </div>-->
        <!--    </li>-->
        <!--  </ul>-->

        <!--  <div v-else class="empty-state">-->
        <!--    <div class="empty-icon">📊</div>-->
        <!--    <p>暂无数据</p>-->
        <!--  </div>-->
        <!--</van-tab>-->

        <!-- 完成次数前30 -->
        <van-tab title="打卡排行榜">
          <div class="table-header">
            <span class="rank-column">排名</span>
            <span class="name-column">姓名</span>
            <span class="score-column">次数</span>
          </div>

          <ul v-if="countUser.length > 0" class="ranking-list">
            <li v-for="(user, index) in countUser"
                :key="index"
                class="ranking-item"
                :class="{'top-rank': index < 3}"
                :style="{'animation-delay': `${index * 0.05}s`}">

              <div class="rank-column">
                <div v-if="index === 0" class="medal gold">1</div>
                <div v-else-if="index === 1" class="medal silver">2</div>
                <div v-else-if="index === 2" class="medal bronze">3</div>
                <span v-else class="normal-rank">{{ index + 1 }}</span>
              </div>

              <div class="name-column">
                <div class="avatar-container">
                  <img :src="user.userAvatar" :alt="user.userName" class="avatar">
                  <div v-if="index < 3" class="avatar-badge"></div>
                </div>
                
                <span class="user-name">{{ user.userName }}</span>

                <!-- <van-text-ellipsis
                  class="user-name"
                  rows="1"
                  :content="user.userName"
                  dots=" "
                  expand-text=" "
                  collapse-text="收起"
                />                 -->
              </div>

              <div class="score-column">
                <span class="score count-score">{{ user.userCount }}</span>
              </div>
            </li>
          </ul>

          <div v-else class="empty-state">
            <div class="empty-icon">📊</div>
            <p>暂无数据</p>
          </div>
        </van-tab>

        <!-- 学院参与率前10 -->
        <van-tab title="学院参与率">
          <div class="table-header">
            <span class="rank-column">排名</span>
            <span class="college-column">学院</span>
            <span class="percent-column">人次占比</span>
          </div>

          <div class="info-text">
            这里是所有打卡次数与学院总人数的比例
          </div>

          <ul v-if="collegeUser.length > 0" class="ranking-list">
            <li v-for="(college, index) in collegeUser"
                :key="index"
                class="ranking-item"
                :class="{'top-rank': index < 3}"
                :style="{'animation-delay': `${index * 0.05}s`}">

              <div class="rank-column">
                <div v-if="index === 0" class="medal gold">1</div>
                <div v-else-if="index === 1" class="medal silver">2</div>
                <div v-else-if="index === 2" class="medal bronze">3</div>
                <span v-else class="normal-rank">{{ index + 1 }}</span>
              </div>

              <div class="college-column">
                <span class="college-name">{{ college.collegeName }}</span>
              </div>

              <div class="percent-column">
                <div class="percent-container">
                  <div class="percent-bar" :style="{width: `${Math.min(+(college.collegePercent || 0), 100)}%`}"></div>
                  <span class="percent-text">{{ college.collegePercent }} %</span>
                </div>
              </div>
            </li>
          </ul>

          <div v-else class="empty-state">
            <div class="empty-icon">📊</div>
            <p>暂无数据</p>
          </div>
        </van-tab>

        <!-- 工会参与率前10 -->
        <van-tab title="工会参与率">
          <div class="table-header">
            <span class="rank-column">排名</span>
            <span class="college-column">工会</span>
            <span class="percent-column">人次占比</span>
          </div>

          <div class="info-text">
            这里是所有打卡次数与工会总人数的比例
          </div>

          <ul v-if="unionUser.length > 0" class="ranking-list">
            <li v-for="(union, index) in unionUser"
                :key="index"
                class="ranking-item"
                :class="{'top-rank': index < 3}"
                :style="{'animation-delay': `${index * 0.05}s`}">

              <div class="rank-column">
                <div v-if="index === 0" class="medal gold">1</div>
                <div v-else-if="index === 1" class="medal silver">2</div>
                <div v-else-if="index === 2" class="medal bronze">3</div>
                <span v-else class="normal-rank">{{ index + 1 }}</span>
              </div>

              <div class="union-column">
                <span class="union-name">{{ union.unionName }}</span>
              </div>

              <div class="percent-column">
                <div class="percent-container">
                  <div class="percent-bar" :style="{width: `${Math.min(+(union.unionPercent || 0), 100)}%`}"></div>
                  <span class="percent-text">{{ union.unionPercent }} %</span>
                </div>
              </div>
            </li>
          </ul>

          <div v-else class="empty-state">
            <div class="empty-icon">📊</div>
            <p>暂无数据</p>
          </div>
        </van-tab>

        <!--&lt;!&ndash; 登山队活跃度 &ndash;&gt;-->
        <!--<van-tab title="登山队活跃度">-->
        <!--  <div class="table-header">-->
        <!--    <span class="rank-column">排名</span>-->
        <!--    <span class="name-column">学院&nbsp;/&nbsp;队名</span>-->
        <!--    <span class="score-column">用时</span>-->
        <!--  </div>-->

        <!--  <ul v-if="top30User.length > 0" class="ranking-list">-->
        <!--    <li v-for="(user, index) in top30User"-->
        <!--        :key="index"-->
        <!--        class="ranking-item"-->
        <!--        :class="{'top-rank': index < 3}"-->
        <!--        :style="{'animation-delay': `${index * 0.05}s`}">-->

        <!--      <div class="rank-column">-->
        <!--        <div v-if="index === 0" class="medal gold">1</div>-->
        <!--        <div v-else-if="index === 1" class="medal silver">2</div>-->
        <!--        <div v-else-if="index === 2" class="medal bronze">3</div>-->
        <!--        <span v-else class="normal-rank">{{ index + 1 }}</span>-->
        <!--      </div>-->

        <!--      <div class="name-column">-->
        <!--        <div class="avatar-container">-->
        <!--          <img :src="user.userAvatar" :alt="user.userName" class="avatar">-->
        <!--          <div v-if="index < 3" class="avatar-badge"></div>-->
        <!--        </div>-->
        <!--        <span class="user-name">{{ user.userName }}</span>-->
        <!--      </div>-->

        <!--      <div class="score-column">-->
        <!--        <span class="score">{{ user.userBestScoreFormatted }}</span>-->
        <!--      </div>-->
        <!--    </li>-->
        <!--  </ul>-->

        <!--  <div v-else class="empty-state">-->
        <!--    <div class="empty-icon">📊</div>-->
        <!--    <p>暂无数据</p>-->
        <!--  </div>-->
        <!--</van-tab>-->
      </van-tabs>
    </div>

    <!-- 页脚信息 -->
    <div class="footer">
      <span class="footer-text">数据每五分钟更新一次</span>
      <span class="footer-text">为大家的精彩表现点赞 <span class="footer-emoji">🎉</span></span>
    </div>
    <div style="padding: 3vh;" v-if="!isNotOHOS" class="ohosSafeZone"></div>
  </div>
</template>

<style scoped>
.leaderboard-container {
  min-height: 100vh;
  padding: 1.5rem 1rem 4rem;
  background: linear-gradient(135deg, #e0f7fa 0%, #e3f2fd 50%, #e8f5e9 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.leaderboard-card {
  max-width: 700px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.leaderboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15), 0 3px 10px rgba(0, 0, 0, 0.08);
}

.header {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
  opacity: 0.6;
  pointer-events: none;
}

.title {
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  margin: 0;
}

.title-icon {
  margin-right: 0.5rem;
  font-size: 1.75rem;
}

.update-info {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  opacity: 0.9;
}

.clock-icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.375rem;
}

.custom-tabs :deep(.van-tabs__wrap) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.custom-tabs :deep(.van-tab) {
  color: #4a5568;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
}

.custom-tabs :deep(.van-tab--active) {
  color: #2b6cb0;
  background-color: rgba(235, 244, 255, 0.5);
}

.custom-tabs :deep(.van-tabs__line) {
  background-color: #3182ce;
  height: 3px;
  border-radius: 3px;
  bottom: 0;
}

.custom-tabs :deep(.van-tab:hover) {
  color: #2c5282;
  background-color: rgba(235, 244, 255, 0.3);
}

.table-header {
  display: flex;
  padding: 0.75rem 1.25rem;
  background-color: rgba(237, 242, 247, 0.8);
  font-weight: 600;
  color: #4a5568;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  top: 44px;
  z-index: 10;
}

.rank-column {
  width: 20%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.name-column {
  width: 80%;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
}

.college-column {
  width: 50%;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
}

.union-column {
  width: 50%;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
}

.score-column {
  width: 20%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.percent-column {
  width: 33.333333%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.ranking-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.ranking-item {
  display: flex;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  animation: slideIn 0.5s ease forwards;
  opacity: 0;
  transform: translateY(10px);
}

.ranking-item:hover {
  background-color: rgba(255, 255, 255, 0.7);
}

.top-rank {
  background-color: rgba(235, 244, 255, 0.5);
}

.top-rank:hover {
  background-color: rgba(235, 244, 255, 0.8);
}

.medal {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.medal::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 60%);
  border-radius: 50%;
}

.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffb900 100%);
}

.silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
}

.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #a05a2c 100%);
}

.normal-rank {
  font-weight: 600;
  color: #718096;
}

.avatar-container {
  position: relative;
  margin-right: 0.75rem;
}

.avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.ranking-item:hover .avatar {
  transform: scale(1.05);
}

.avatar-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: #48bb78;
  border: 2px solid white;
}

.user-name {
  font-weight: 600;
  color: #2d3748;
  /* 只显示一行名字 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 9em;
  display: inline-block;
}

.college-name {
  font-weight: 600;
  color: #2d3748;
}

.union-name {
  font-weight: 600;
  color: #2d3748;
}

.score {
  font-weight: 700;
  color: #3182ce;
  font-size: 1.125rem;
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.count-score {
  background: linear-gradient(135deg, #3182ce 0%, #38b2ac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.percent-container {
  position: relative;
  width: 100%;
  height: 1.5rem;
  background-color: rgba(226, 232, 240, 0.5);
  border-radius: 0.75rem;
  overflow: hidden;
}

.percent-bar {
  height: 100%;
  background: linear-gradient(90deg, #3182ce 0%, #4299e1 100%);
  border-radius: 0.75rem;
  transition: width 1s ease-out;
}

.percent-text {
  position: absolute;
  top: 0;
  right: 0.5rem;
  height: 100%;
  display: flex;
  align-items: center;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.info-text {
  padding: 0.75rem 1.25rem;
  color: #718096;
  font-size: 0.875rem;
  text-align: center;
  background-color: rgba(237, 242, 247, 0.5);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.empty-state {
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #718096;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.footer {
  max-width: 700px;
  margin: 1.5rem auto 0;
  text-align: center;
}

.footer-text {
  display: block;
  color: #4a5568;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.footer-emoji {
  display: inline-block;
  animation: bounce 1s infinite alternate;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-5px);
  }
}
</style>

