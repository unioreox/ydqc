<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import {
  createTeamRequest,
  joinTeam,
  getMyTeamPreview,
  deleteTeam,
  stopTeam,
  getTeamInfo,
  infoApi
} from '@/api';
import { showToast, showLoadingToast, closeToast } from 'vant';
import {
  UserPlus,
  Users,
  Copy,
  LogOut,
  X,
  CheckCircle2,
  RefreshCw,
  Share2
} from 'lucide-vue-next';

// Types based on the API response
import type {
  TeamInfo,
  TeamMemberInfo,
  MyTeamPreview,
  TeamTempInfo,
  UserVo
} from '@/api/types.gen';

const active = ref(0);
const teamName = ref('');
const joinCode = ref('');
const teamCode = ref<string>("");
const isLoading = ref(false);
const joinLoading = ref(false);
const showKeyboard = ref(false);
const showFloatingPanel = ref(false);
const hasTeam = ref(false);
const isTeamLeader = ref(false);
const deleteLoading = ref(false);
const stopLoading = ref(false);
const refreshing = ref(false);
const currentUser = ref<UserVo | null>(null);

const teamInfo = reactive({
  id: '',
  name: '',
  code: '',
  members: 1,
  status: 'active',
  memberList: [] as TeamMemberInfo[]
});

// Check if user already has a team on component mount
onMounted(async () => {
  await getCurrentUserInfo();
  await checkTeamStatus();
});

// Get current user information
const getCurrentUserInfo = async () => {
  try {
    const response = await infoApi();
    if (response.data?.data) {
      currentUser.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to get user info:', error);
  }
};

// Check team status
const checkTeamStatus = async () => {
  try {
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      duration: 0
    });

    const response = await getMyTeamPreview();

    if (response.data?.data) {
      const teamPreview = response.data.data as MyTeamPreview;

      if (teamPreview.inTeam && teamPreview.teamId) {
        hasTeam.value = true;
        teamInfo.id = teamPreview.teamId;

        // If team exists, fetch detailed info
        await fetchTeamDetails(teamPreview.teamId);
      } else {
        hasTeam.value = false;
      }
    } else {
      hasTeam.value = false;
    }
  } catch (error) {
    console.error('Failed to check team status:', error);
    showToast({ type: 'fail', message: '获取队伍信息失败' });
  } finally {
    closeToast();
  }
};

// Fetch detailed team information
const fetchTeamDetails = async (teamId: string) => {
  try {
    const response = await getTeamInfo({
      path: {
        teamId: teamId
      }
    });

    if (response.data?.data) {
      const team = response.data.data as TeamInfo;

      // Check if current user is team leader (first member)
      if (team.members && team.members.length > 0) {
        // Assuming the first member is the leader
        isTeamLeader.value = currentUser.value && team.members[0].id === currentUser.value.id || false;

        teamInfo.memberList = team.members;
        teamInfo.members = team.members.length;

        // Get team name from the team info
        teamInfo.name = team.name || '我的队伍';
      }
    }
  } catch (error) {
    console.error('Failed to fetch team details:', error);
  }
};

// Refresh team data
const refreshTeamData = async () => {
  refreshing.value = true;
  await checkTeamStatus();
  setTimeout(() => {
    refreshing.value = false;
    showToast({ type: 'success', message: '刷新成功' });
  }, 800);
};

// Create team handler
const createTeamHandle = async () => {
  if (!teamName.value) {
    showToast({ type: 'fail', message: '请输入队伍名称' });
    return;
  }

  try {
    isLoading.value = true;
    showLoadingToast({
      message: '创建中...',
      forbidClick: true,
      duration: 0
    });

    const response = await createTeamRequest({
      query: {
        teamName: teamName.value
      }
    });

    if (response.data?.data?.pwd) {
      const tempInfo = response.data.data as TeamTempInfo;
      teamCode.value = tempInfo.pwd || '';
      closeToast();
      showToast({ type: 'success', message: '队伍创建成功' });

      // Set team info for floating panel
      teamInfo.name = teamName.value;
      teamInfo.code = teamCode.value;
      teamInfo.id = tempInfo.id || '';
      isTeamLeader.value = true;
      hasTeam.value = true;
      showFloatingPanel.value = true;

      // Fetch team details
      if (teamInfo.id) {
        await fetchTeamDetails(teamInfo.id);
      }
    }
  } catch (error: any) {
    closeToast();
    showToast({
      type: 'fail',
      message: error.response?.data.msg || '创建失败，请重试'
    });
  } finally {
    isLoading.value = false;
  }
};

// Join team handler
const joinTeamHandle = async () => {
  if (!joinCode.value) {
    showToast({ type: 'fail', message: '请输入队伍编号' });
    return;
  }

  try {
    joinLoading.value = true;
    showLoadingToast({
      message: '加入中...',
      forbidClick: true,
      duration: 0
    });

    const res = await joinTeam({
      query: {
        teamCode: joinCode.value
      }
    });

    if (res.data) {
      closeToast();
      showToast({ type: 'success', message: '加入成功' });

      // Store the join code for reference
      teamInfo.code = joinCode.value;

      joinCode.value = '';
      showKeyboard.value = false;
      hasTeam.value = true;

      // Need to refresh team data after joining
      await checkTeamStatus();

      showFloatingPanel.value = true;
    }
  } catch (error: any) {
    closeToast();
    showToast({
      type: 'fail',
      message: error.response?.data.msg || '加入失败，请重试'
    });
  } finally {
    joinLoading.value = false;
  }
};

// Delete team handler
const deleteTeamHandle = async () => {
  try {
    deleteLoading.value = true;
    showLoadingToast({
      message: '解散中...',
      forbidClick: true,
      duration: 0
    });

    await deleteTeam();
    closeToast();
    showToast({ type: 'success', message: '队伍已解散' });
    resetTeamState();
  } catch (error: any) {
    closeToast();
    showToast({
      type: 'fail',
      message: error.response?.data.msg || '解散队伍失败，请重试'
    });
  } finally {
    deleteLoading.value = false;
  }
};

// Stop team handler
const stopTeamHandle = async () => {
  try {
    stopLoading.value = true;
    showLoadingToast({
      message: '退出中...',
      forbidClick: true,
      duration: 0
    });

    await stopTeam();
    closeToast();
    showToast({ type: 'success', message: '已退出队伍' });
    resetTeamState();
  } catch (error: any) {
    closeToast();
    showToast({
      type: 'fail',
      message: error.response?.data.msg || '退出队伍失败，请重试'
    });
  } finally {
    stopLoading.value = false;
  }
};

// Reset team state after leaving or deleting
const resetTeamState = () => {
  hasTeam.value = false;
  isTeamLeader.value = false;
  teamInfo.id = '';
  teamInfo.name = '';
  teamInfo.code = '';
  teamInfo.members = 1;
  teamInfo.memberList = [];
  teamCode.value = '';
  showFloatingPanel.value = false;
  active.value = 0; // Switch back to create tab
};

// Copy code functionality
const copyCode = () => {
  const codeToCopy = teamCode.value || teamInfo.code;
  if (codeToCopy) {
    navigator.clipboard.writeText(codeToCopy)
        .then(() => showToast({ type: 'success', message: '编号已复制' }))
        .catch(() => showToast({ type: 'fail', message: '复制失败' }));
  }
};

// Handle keyboard input
const onKeyboardInput = (key: string) => {
  if (joinCode.value.length < 4) {
    joinCode.value += key;
  }
};

// Handle keyboard delete
const onKeyboardDelete = () => {
  joinCode.value = joinCode.value.slice(0, -1);
};

// Close floating panel
const closePanel = () => {
  showFloatingPanel.value = false;
};

// Focus on input to show keyboard
const focusJoinInput = () => {
  showKeyboard.value = true;
};

// Switch tabs
const onTabChange = (index: number) => {
  active.value = index;
  showKeyboard.value = false;
};

// Show confirmation dialog
const showConfirmDialog = (action: 'leave' | 'delete') => {
  return new Promise<boolean>((resolve) => {
    const message = action === 'leave' ? '确定要退出队伍吗？' : '确定要解散队伍吗？';
    const title = action === 'leave' ? '退出队伍' : '解散队伍';

    // Using Vant Dialog
    import('vant').then(({ showDialog }) => {
      showDialog({
        title,
        message,
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })
          .then(() => {
            resolve(true);
          })
          .catch(() => {
            resolve(false);
          });
    });
  });
};

// Handle leave team with confirmation
const handleLeaveTeam = async () => {
  const confirmed = await showConfirmDialog('leave');
  if (confirmed) {
    await stopTeamHandle();
  }
};

// Handle delete team with confirmation
const handleDeleteTeam = async () => {
  const confirmed = await showConfirmDialog('delete');
  if (confirmed) {
    await deleteTeamHandle();
  }
};
</script>

<template>
  <div class="team-container bg-gradient-to-b from-blue-100 to-green-100 min-h-screen">
    <!-- Team Management Tabs -->
    <van-tabs v-model:active="active" animated swipeable @change="onTabChange" class="custom-tabs">
      <!-- Create Team Tab -->
      <van-tab v-if="!hasTeam">
        <template #title>
          <div class="tab-title">
            <UserPlus class="tab-icon" />
            <span>创建队伍</span>
          </div>
        </template>

        <van-form @submit="createTeamHandle" class="form-container">
          <van-cell-group inset class="mt-4 mb-6 rounded-lg">
            <van-field
                v-model="teamName"
                label="队伍名称"
                placeholder="请输入队伍名称（3-15字）"
                :rules="[
                { required: true, message: '请输入队伍名称' },
                { validator: (value) => value.length >= 3 && value.length <= 15, message: '长度需3-15字' }
              ]"
                label-width="80px"
                class="custom-field"
            >
              <template #left-icon>
                <Users class="field-icon" />
              </template>
            </van-field>
          </van-cell-group>

          <van-button
              type="primary"
              block
              :loading="isLoading"
              native-type="submit"
              round
              size="large"
              class="submit-button"
          >
            <div class="btn-content">
              <UserPlus class="button-icon" />
              <span>创建队伍</span>
            </div>
          </van-button>
        </van-form>

        <van-empty v-if="!teamCode" description="创建队伍后获取队伍编号" class="mt-8" />

        <div v-if="teamCode" class="code-container">
          <h3 class="code-title">您的队伍编号：</h3>
          <div class="code-display">
            <span v-for="(digit, index) in teamCode" :key="index" class="code-digit">{{ digit }}</span>
          </div>
          <van-button
              type="primary"
              @click="copyCode"
              class="copy-button"
              round
          >
            <div class="btn-content">
              <Copy class="button-icon" />
              <span>复制编号</span>
            </div>
          </van-button>
        </div>
      </van-tab>

      <!-- Join Team Tab -->
      <van-tab v-if="!hasTeam">
        <template #title>
          <div class="tab-title">
            <Users class="tab-icon" />
            <span>加入队伍</span>
          </div>
        </template>

        <div class="join-container">
          <h3 class="join-title">请输入4位队伍编号</h3>

          <div class="code-input-container" @click="focusJoinInput">
            <div
                v-for="i in 4"
                :key="i"
                class="code-input-box"
                :class="{ 'filled': joinCode.length >= i }"
            >
              {{ i <= joinCode.length ? joinCode[i-1] : '' }}
            </div>
          </div>

          <van-button
              type="primary"
              block
              :loading="joinLoading"
              @click="joinTeamHandle"
              round
              size="large"
              class="submit-button mt-8"
              :disabled="joinCode.length !== 4"
          >
            <div class="btn-content">
              <Users class="button-icon" />
              <span>加入队伍</span>
            </div>
          </van-button>
        </div>
      </van-tab>

      <!-- My Team Tab (visible when user has a team) -->
      <van-tab v-if="hasTeam">
        <template #title>
          <div class="tab-title">
            <Users class="tab-icon" />
            <span>我的队伍</span>
          </div>
        </template>

        <div class="team-info-view">
          <van-pull-refresh v-model="refreshing" @refresh="refreshTeamData" success-text="刷新成功">
            <div class="team-card">
              <div class="team-card-header">
                <div class="team-card-title">
                  <h3>{{ teamInfo.name || '我的队伍' }}</h3>
                  <div class="team-tags">
                    <van-tag type="primary" v-if="isTeamLeader" size="medium" round>队长</van-tag>
                    <van-tag type="success" v-else size="medium" round>队员</van-tag>
                    <van-tag type="warning" v-if="teamInfo.status !== 'active'" size="medium" round>
                      {{ teamInfo.status === 'stopped' ? '已停止' : '已结束' }}
                    </van-tag>
                  </div>
                </div>
                <p class="team-card-code">队伍编号: {{ teamInfo.code }}</p>
              </div>

              <div class="team-card-actions">
                <van-button size="small" type="primary" @click="copyCode" class="action-button-small">
                  <div class="btn-content-small">
                    <Copy class="button-icon-small" />
                    <span>复制编号</span>
                  </div>
                </van-button>

                <van-button
                    size="small"
                    type="danger"
                    @click="handleLeaveTeam"
                    :loading="stopLoading"
                    v-if="!isTeamLeader"
                    class="action-button-small ml-2"
                >
                  <div class="btn-content-small">
                    <LogOut class="button-icon-small" />
                    <span>退出队伍</span>
                  </div>
                </van-button>

                <van-button
                    size="small"
                    type="danger"
                    @click="handleDeleteTeam"
                    :loading="deleteLoading"
                    v-if="isTeamLeader"
                    class="action-button-small ml-2"
                >
                  <div class="btn-content-small">
                    <X class="button-icon-small" />
                    <span>解散队伍</span>
                  </div>
                </van-button>
              </div>
            </div>

            <div class="team-members-section">
              <div class="section-header">
                <h3 class="section-title">队伍成员 ({{ teamInfo.members }})</h3>
                <van-button
                    size="small"
                    @click="refreshTeamData"
                    :loading="refreshing"
                    class="refresh-button"
                    round
                >
                  <div class="btn-content-small">
                    <RefreshCw class="button-icon-small" />
                    <span>刷新</span>
                  </div>
                </van-button>
              </div>

              <div class="member-list">
                <div
                    v-for="(member, index) in teamInfo.memberList"
                    :key="index"
                    class="member-item"
                >
                  <div class="member-avatar">
                    <van-image
                        round
                        width="50"
                        height="50"
                        :src="member.avatar || '/placeholder-avatar.png'"
                        fit="cover"
                    />
                    <van-tag
                        v-if="index === 0"
                        type="primary"
                        class="leader-tag"
                        round
                    >
                      队长
                    </van-tag>
                  </div>
                  <div class="member-info">
                    <span class="member-name">{{ member.nickname || '队员' + (index + 1) }}</span>
                    <span class="member-id">ID: {{ member.id?.substring(0, 8) || '未知' }}</span>
                  </div>
                </div>

                <van-empty
                    v-if="teamInfo.memberList.length === 0"
                    description="暂无成员信息"
                    class="empty-members"
                />
              </div>

              <div class="team-actions">
                <van-button
                    block
                    type="primary"
                    round
                    @click="copyCode"
                    class="action-button"
                    color="#07c160"
                >
                  <div class="btn-content">
                    <Share2 class="button-icon" />
                    <span>分享队伍编号</span>
                  </div>
                </van-button>
              </div>
            </div>
          </van-pull-refresh>
        </div>
      </van-tab>
    </van-tabs>

    <!-- Numeric Keyboard -->
    <van-number-keyboard
        v-model="joinCode"
        :show="showKeyboard"
        :maxlength="4"
        @blur="showKeyboard = false"
        @input="onKeyboardInput"
        @delete="onKeyboardDelete"
        random-key-order
        title="队伍编号"
        extra-key="X"
        close-button-text="完成"
        @close="showKeyboard = false"
        safe-area-inset-bottom
    />

    <!-- Floating Panel for Team Info -->
    <van-popup
        v-model:show="showFloatingPanel"
        position="bottom"
        round
        closeable
        @close="closePanel"
        class="team-info-popup"
    >
      <div class="team-info-container">
        <div class="team-info-header">
          <CheckCircle2 class="success-icon" v-if="hasTeam" />
          <h2 class="team-info-title">{{ active === 0 ? '队伍创建成功' : '队伍加入成功' }}</h2>
        </div>

        <div class="team-info-content">
          <van-cell-group inset class="team-info-group">
            <van-cell title="队伍名称" :value="teamInfo.name || '我的队伍'" />
            <van-cell title="队伍编号" :value="teamInfo.code" />
            <van-cell title="队伍成员" :value="`${teamInfo.members}人`" />
            <van-cell title="我的身份" :value="isTeamLeader ? '队长' : '队员'" />
          </van-cell-group>

          <div class="team-info-actions">
            <van-button
                type="primary"
                block
                round
                @click="copyCode"
                v-if="isTeamLeader"
                class="action-button"
                color="#07c160"
            >
              <div class="btn-content">
                <Copy class="button-icon" />
                <span>复制编号分享</span>
              </div>
            </van-button>

            <van-button
                type="default"
                block
                round
                @click="closePanel"
                class="action-button mt-4"
            >
              <div class="btn-content">
                <span>返回</span>
              </div>
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.team-container {
  padding: 16px;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.custom-tabs {
  --van-tabs-line-height: 44px;
  --van-tabs-bottom-bar-color: #1989fa;
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.tab-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab-icon {
  width: 18px;
  height: 18px;
}

.form-container {
  margin-top: 16px;
  padding: 0 8px;
}

.custom-field {
  --van-field-label-color: #323233;
}

.field-icon {
  width: 20px;
  height: 20px;
  margin-right: 4px;
  color: #1989fa;
}

.submit-button {
  margin-top: 24px;
  --van-button-primary-background: #1989fa;
}

/* Button content alignment fix */
.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.btn-content-small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.button-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.button-icon-small {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.code-container {
  margin-top: 24px;
  padding: 20px;
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
  text-align: center;
}

.code-title {
  font-size: 16px;
  color: #323233;
  margin-bottom: 16px;
}

.code-display {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.code-digit {
  width: 50px;
  height: 60px;
  background-color: #f2f3f5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #1989fa;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.1);
}

.copy-button {
  --van-button-primary-background: #07c160;
}

.join-container {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.join-title {
  font-size: 18px;
  color: #323233;
  margin-bottom: 24px;
  text-align: center;
}

.code-input-container {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.code-input-box {
  width: 55px;
  height: 65px;
  border: 2px solid #dcdee0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #323233;
  background-color: white;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.code-input-box.filled {
  border-color: #1989fa;
  background-color: #f0f9ff;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.1);
}

.team-info-popup {
  height: auto;
  max-height: 70vh;
}

.team-info-container {
  padding: 24px 16px;
}

.team-info-header {
  text-align: center;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.success-icon {
  width: 48px;
  height: 48px;
  color: #07c160;
  margin-bottom: 12px;
}

.team-info-title {
  font-size: 20px;
  font-weight: bold;
  color: #323233;
}

.team-info-content {
  padding: 0 8px;
}

.team-info-group {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
}

.team-info-actions {
  padding: 0 8px;
}

.action-button {
  height: 44px;
}

.action-button-small {
  height: 32px;
  font-size: 12px;
}

/* Team view styles */
.team-info-view {
  padding: 16px 0;
}

.team-card {
  background-color: white;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  overflow: hidden;
}

.team-card-header {
  margin-bottom: 16px;
}

.team-card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.team-card-title h3 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: #323233;
}

.team-tags {
  display: flex;
  gap: 8px;
}

.team-card-code {
  font-size: 14px;
  color: #969799;
  margin: 0;
}

.team-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.team-members-section {
  margin-top: 24px;
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  color: #323233;
}

.refresh-button {
  padding: 4px 12px;
  border-radius: 20px;
}

.member-list {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f8f8;
  border-radius: 12px;
  position: relative;
}

.member-avatar {
  position: relative;
  margin-right: 16px;
}

.leader-tag {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 10px;
  padding: 2px 6px;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.member-id {
  font-size: 12px;
  color: #969799;
}

.team-actions {
  padding: 8px 0;
  margin-top: 16px;
}

.empty-members {
  padding: 24px 0;
}

.mt-4 {
  margin-top: 16px;
}

.mt-8 {
  margin-top: 32px;
}

.mb-6 {
  margin-bottom: 24px;
}

.ml-2 {
  margin-left: 8px;
}

.rounded-lg {
  border-radius: 8px;
}
</style>
