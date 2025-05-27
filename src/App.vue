<script setup>
import { ref, computed, watch } from "vue";
import { ElMessageBox, ElButton, ElInputNumber } from "element-plus";
import { Window } from "@tauri-apps/api/window";
import "element-plus/dist/index.css";
import {
  Minus,
  FullScreen,
  Close,
  VideoPlay,
  VideoPause,
  RefreshRight,
  Timer,
} from "@element-plus/icons-vue";

const inputMinutes = ref(1);
const inputSeconds = ref(0);
const timeLeft = ref(inputSeconds.value + inputMinutes.value * 60);
const running = ref(false);
const AudioPath = ref("Ki-ringtrain.mp3");
let timer = null;

//设置番茄工作状态
const isPomodoro = ref(false);
const isResting = ref(false);
const appWindow = Window.getCurrent();

const displayTime = computed(() => {
  const min = Math.floor(timeLeft.value / 60);
  const sec = timeLeft.value % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
});

// 音频对象（可替换为你自己的音频文件路径）
const audio = new Audio(AudioPath.value);

const start = () => {
  if (running.value) return;
  running.value = true;
  if (timeLeft.value <= 0)
    timeLeft.value = inputSeconds.value + inputMinutes.value * 60;
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      TimeOn();
    }
  }, 1000);
};

const pause = () => {
  running.value = false;
  if (timer) clearInterval(timer);
  timer = null;
};

const reset = () => {
  pause();
  timeLeft.value = inputSeconds.value + inputMinutes.value * 60;
  isPomodoro.value = false;
  isResting.value = false;
};

watch([inputMinutes, inputSeconds], ([min, sec]) => {
  if (!running.value) timeLeft.value = min * 60 + sec;
});

const TimeOn = () => {
  running.value = false;
  clearInterval(timer);
  timer = null;
  audio.play();
  if (!isPomodoro.value) {
    ElMessageBox.alert("时间到", "提示", {
      confirmButtonText: "确定",
      callback: () => {
        audio.pause();
        audio.currentTime = 0;
      },
    });
  } else if (!isResting.value) {
    isResting.value = true;
    ElMessageBox.alert("番茄工作时间到", "提示", {
      confirmButtonText: "开始休息",
      callback: () => {
        audio.pause();
        audio.currentTime = 0;
        isResting.value = true;
        Pomodoro();
      },
    });
  } else {
    isResting.value = false;
    ElMessageBox.alert("休息时间到", "提示", {
      confirmButtonText: "开始工作",
      callback: () => {
        audio.pause();
        audio.currentTime = 0;
        isResting.value = false;
        Pomodoro();
      },
    });
  }
};

const Pomodoro = () => {
  isPomodoro.value = true;
  if (!isResting.value) {
    timeLeft.value = 25 * 60; // 设置为25分钟
  } else {
    timeLeft.value = 5 * 60; // 设置为5分钟休息时间
  }
  running.value = false;
  if (timer) clearInterval(timer);
  timer = null;
  start();
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
  await appWindow?.close();
};
</script>

<template>
  <div class="app-container">
    <div class="title-bar">
      <div class="title-section">
        <h3 class="app-title">番茄计时器</h3>
      </div>
      <div class="window-controls">
        <button class="icon-btn" @click="minimizeWindow" title="最小化">
          <el-icon :size="16"><Minus /></el-icon>
        </button>
        <button class="icon-btn" @click="maximizeWindow" title="最大化">
          <el-icon :size="16"><FullScreen /></el-icon>
        </button>
        <button class="icon-btn close-btn" @click="closeWindow" title="关闭">
          <el-icon :size="16"><Close /></el-icon>
        </button>
      </div>
    </div>
    <div class="main-content">
      <h2>设置时间</h2>
      <div class="row" style="margin-bottom: 0.8em">
        <ElInputNumber
          v-model="inputMinutes"
          class="input-space"
          controls-position="right"
          :min="0"
          :max="3600"
          :disabled="running || isPomodoro"
        />
        <span>分</span>
        <ElInputNumber
          v-model="inputSeconds"
          class="input-space"
          controls-position="right"
          :min="0"
          :max="59"
          :disabled="running || isPomodoro"
        />
        <span>秒</span>
      </div>
      <div class="row" style="margin-bottom: 0.8em">
        <ElButton @click="start" type="primary" round :disabled="running"
          >开始</ElButton
        >
        <ElButton
          @click="pause"
          type="warning"
          round
          :disabled="!running"
          style="margin-left: 10px"
          >暂停</ElButton
        >
        <ElButton @click="reset" type="danger" round style="margin-left: 10px"
          >重置</ElButton
        >
      </div>
      <div class="countdown">
        {{
          isPomodoro
            ? isResting
              ? "剩余休息时间："
              : "剩余工作时间："
            : "剩余时间："
        }}
        <span class="countdown-time">{{ displayTime }}</span>
      </div>
      <div style="text-align: center">
        <el-button @click="Pomodoro" :disabled="running" type="success" round
          >开始番茄工作！</el-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}

.title-section {
  display: flex;
  align-items: center;
}

.app-title {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-size: 1.2em;
  margin: 0;
}

.title-bar {
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  -webkit-app-region: drag;
  position: relative;
  z-index: 100;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.window-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  -webkit-app-region: no-drag;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  margin: 0 5px;
}

.icon-btn:hover {
  color: #409eff;
}

.close-btn:hover {
  color: #ff5f56;
}

.input-space {
  width: 80px;
  margin: 10px;
  text-align: center;
}

.countdown-time {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-size: 2em;
  font-weight: bold;
}

.countdown {
  font-size: 1.5em;
  text-align: center;
}
</style>
