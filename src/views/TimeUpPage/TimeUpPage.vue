<template>
  <div class="time-up-container">
    <div class="title-bar">
      <div class="title-section">
        <h3 class="app-title">番茄计时器</h3>
      </div>
      <div class="window-controls">
        <button class="icon-btn" @click="minimizeWindow" title="最小化">
          <el-icon :size="20"><Minus /></el-icon>
        </button>
        <button class="icon-btn" @click="maximizeWindow" title="最大化">
          <el-icon :size="20"><FullScreen /></el-icon>
        </button>
        <button class="icon-btn close-btn" @click="closeWindow" title="关闭">
          <el-icon :size="20"><Close /></el-icon>
        </button>
      </div>
    </div>

    <div class="main-content">
      <div class="time-up-content">
        <div class="icon-container">
          <el-icon :size="80" class="alarm-icon">
            <Timer />
          </el-icon>
        </div>

        <h1 class="time-up-title">{{ getTimeUpMessage() }}</h1>
        <div class="message-content">
          <p class="time-up-message">{{ getDetailMessage() }}</p>
          <div v-if="isPomodoro && !isResting" class="pomodoro-stats">
            <p class="pomodoro-count">
              🍅 已完成 {{ pomodoroCount + 1 }} 个番茄
            </p>
          </div>
        </div>

        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            @click="stopMusicAndReturn"
            class="stop-music-btn"
            v-if="!isPomodoro || !autoCycling"
          >
            <el-icon><VideoPause /></el-icon>
            停止音乐
          </el-button>
          <el-button
            type="success"
            size="large"
            @click="continueNext"
            class="continue-btn"
            v-if="isPomodoro"
          >
            <el-icon><VideoPlay /></el-icon>
            {{ autoCycling ? "继续循环" : isResting ? "开始工作" : "开始休息" }}
          </el-button>

          <el-button
            type="info"
            size="large"
            @click="stopCycleAndReturn"
            class="stop-cycle-btn"
            v-if="isPomodoro && autoCycling"
          >
            <el-icon><Close /></el-icon>
            停止循环
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElButton, ElIcon } from "element-plus";
import { Window } from "@tauri-apps/api/window";
import {
  Timer,
  VideoPlay,
  VideoPause,
  Minus,
  FullScreen,
  Close,
} from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const appWindow = Window.getCurrent();

// 从路由参数获取状态
const isPomodoro = route.query.isPomodoro === "true";
const isResting = route.query.isResting === "true";
const audioPath = route.query.audioPath || "Ki-ringtrain.mp3";
const autoCycling = route.query.autoCycling === "true";
const pomodoroCount = parseInt(route.query.pomodoroCount) || 0;

// 创建音频对象
let audio = null;

onMounted(() => {
  // 播放音乐
  audio = new Audio(audioPath);
  audio.loop = true;
  audio.play().catch((error) => {
    console.error("播放音频失败:", error);
  });
});

onUnmounted(() => {
  // 组件销毁时停止音乐
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
});

const getTimeUpMessage = () => {
  if (!isPomodoro) {
    return "时间到！";
  } else if (!isResting) {
    return "工作时间结束！";
  } else {
    return "休息时间结束！";
  }
};

const getDetailMessage = () => {
  if (!isPomodoro) {
    return "你设置的计时时间已经结束了";
  } else if (!isResting) {
    return "番茄工作时间到！是时候休息一下了 🍅";
  } else {
    return "休息时间到！准备开始新的工作周期 💪";
  }
};

const stopMusicAndReturn = () => {
  // 停止音乐
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  // 返回主页面
  router.push("/");
};

const continueNext = () => {
  // 停止音乐
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  // 根据当前状态决定下一步
  const nextIsResting = !isResting;
  const wasWorking = !isResting; // 记录当前周期是否是工作时间

  // 返回主页面并传递状态，让主页面自动开始下一个周期
  router.push({
    path: "/",
    query: {
      autoStart: "true",
      isPomodoro: "true",
      isResting: nextIsResting.toString(),
      autoCycling: autoCycling.toString(),
      pomodoroCount: pomodoroCount.toString(),
      fromTimeUp: "true",
      wasWorking: wasWorking.toString(),
    },
  });
};

const stopCycleAndReturn = () => {
  // 停止音乐
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  // 返回主页面并停止循环
  router.push("/");
};

const minimizeWindow = async () => {
  await appWindow?.minimize();
};

const maximizeWindow = async () => {
  if (await appWindow?.isMaximized()) {
    await appWindow?.unmaximize();
  } else {
    await appWindow?.maximize();
  }
};

const closeWindow = async () => {
  // await appWindow?.close();
  await appWindow?.hide();
};
</script>

<style scoped src="./TimeUpPage.css" />
