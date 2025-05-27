<script setup>
import { ref, computed, watch } from "vue";
import { ElMessageBox, ElButton, ElInputNumber } from "element-plus";
import { Window } from "@tauri-apps/api/window";
import {
  Minus,
  FullScreen,
  Close,
  VideoPlay,
  VideoPause,
  RefreshRight,
  Timer,
} from "@element-plus/icons-vue";
import "element-plus/dist/index.css";

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

// 计算进度百分比
const progressPercentage = computed(() => {
  let totalTime = 0;
  if (isPomodoro.value) {
    totalTime = isResting.value ? 5 * 60 : 25 * 60;
  } else {
    totalTime = inputMinutes.value * 60 + inputSeconds.value;
  }
  if (totalTime === 0) return 0;
  return Math.max(
    0,
    Math.min(100, ((totalTime - timeLeft.value) / totalTime) * 100)
  );
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
        <button
          class="control-btn minimize-btn"
          @click="minimizeWindow"
          title="最小化"
        >
          <el-icon :size="16"><Minus /></el-icon>
        </button>
        <button
          class="control-btn maximize-btn"
          @click="maximizeWindow"
          title="最大化"
        >
          <el-icon :size="16"><FullScreen /></el-icon>
        </button>
        <button class="control-btn close-btn" @click="closeWindow" title="关闭">
          <el-icon :size="16"><Close /></el-icon>
        </button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 状态指示器 -->
      <div class="status-indicator">
        <div
          class="status-dot"
          :class="{
            working: isPomodoro && !isResting,
            resting: isPomodoro && isResting,
            running: running && !isPomodoro,
          }"
        ></div>
        <span class="status-text">
          {{
            isPomodoro
              ? isResting
                ? "休息中"
                : "专注工作"
              : running
              ? "计时中"
              : "待机中"
          }}
        </span>
      </div>

      <!-- 时间显示 -->
      <div class="time-display">
        <div class="time-label">
          {{
            isPomodoro
              ? isResting
                ? "剩余休息时间"
                : "剩余工作时间"
              : "剩余时间"
          }}
        </div>
        <div class="time-value">{{ displayTime }}</div>
        <div class="time-progress">
          <div
            class="progress-bar"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>

      <!-- 时间设置区 -->
      <div class="time-settings" v-if="!isPomodoro">
        <div class="setting-group">
          <label>分钟</label>
          <ElInputNumber
            v-model="inputMinutes"
            :min="0"
            :max="3600"
            :disabled="running"
            size="large"
            controls-position="right"
          />
        </div>
        <div class="setting-group">
          <label>秒钟</label>
          <ElInputNumber
            v-model="inputSeconds"
            :min="0"
            :max="59"
            :disabled="running"
            size="large"
            controls-position="right"
          />
        </div>
      </div>

      <!-- 控制按钮组 -->
      <div class="control-buttons">
        <ElButton
          @click="start"
          type="primary"
          size="large"
          round
          :disabled="running"
          class="main-btn"
        >
          <el-icon><VideoPlay /></el-icon>
          开始
        </ElButton>

        <ElButton
          @click="pause"
          type="warning"
          size="large"
          round
          :disabled="!running"
          class="main-btn"
        >
          <el-icon><VideoPause /></el-icon>
          暂停
        </ElButton>

        <ElButton
          @click="reset"
          type="info"
          size="large"
          round
          class="main-btn"
        >
          <el-icon><RefreshRight /></el-icon>
          重置
        </ElButton>
      </div>

      <!-- 番茄工作按钮 -->
      <div class="pomodoro-section">
        <ElButton
          @click="Pomodoro"
          :disabled="running"
          type="success"
          size="large"
          round
          class="pomodoro-btn"
        >
          <el-icon><Timer /></el-icon>
          {{ isPomodoro ? "退出番茄模式" : "开始番茄工作" }}
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 应用容器 */
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 标题栏 */
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

.title-section {
  display: flex;
  align-items: center;
}

.app-title {
  margin: 0;
  color: white;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.window-controls {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.close-btn:hover {
  background: #ff5f57;
}

.minimize-btn:hover {
  background: #ffbd2e;
}

.maximize-btn:hover {
  background: #28ca42;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
  max-height: calc(100vh - 40px);
  overflow: hidden;
}

/* 状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e0e0e0;
  animation: pulse 2s infinite;
}

.status-dot.working {
  background: #ff6b6b;
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
}

.status-dot.resting {
  background: #4ecdc4;
  box-shadow: 0 0 15px rgba(78, 205, 196, 0.5);
}

.status-dot.running {
  background: #45b7d1;
  box-shadow: 0 0 15px rgba(69, 183, 209, 0.5);
}

.status-text {
  color: white;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 时间显示 */
.time-display {
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 280px;
}

.time-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 10px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.time-value {
  color: white;
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 15px;
  font-family: "SF Mono", "Monaco", "Menlo", monospace;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.time-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #45b7d1);
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 时间设置区 */
.time-settings {
  display: flex;
  gap: 20px;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.setting-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.setting-group label {
  color: white;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 控制按钮组 */
.control-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.main-btn {
  min-width: 100px;
  height: 45px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: none;
  transition: all 0.3s ease;
}

.main-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.main-btn:active {
  transform: translateY(0);
}

/* 番茄工作按钮 */
.pomodoro-section {
  margin-top: auto;
}

.pomodoro-btn {
  min-width: 180px;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: none;
  transition: all 0.3s ease;
}

.pomodoro-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* Element Plus 组件样式覆盖 */
:deep(.el-input-number) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  overflow: hidden;
}

:deep(.el-input-number .el-input__inner) {
  background: transparent;
  border: none;
  color: #333;
  font-weight: 600;
  text-align: center;
}

:deep(.el-input-number .el-input-number__increase),
:deep(.el-input-number .el-input-number__decrease) {
  background: rgba(103, 126, 234, 0.1);
  border: none;
  color: #667eea;
}

:deep(.el-input-number .el-input-number__increase):hover,
:deep(.el-input-number .el-input-number__decrease):hover {
  background: rgba(103, 126, 234, 0.2);
  color: #667eea;
}

:deep(.el-button) {
  border: none;
  font-weight: 600;
  letter-spacing: 0.5px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.el-button--warning) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

:deep(.el-button--info) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

/* 响应式设计 */
@media (max-height: 600px) {
  .main-content {
    gap: 15px;
    padding: 15px;
  }

  .time-display {
    padding: 20px;
    min-width: 240px;
  }

  .time-value {
    font-size: 36px;
  }

  .main-btn {
    height: 40px;
    min-width: 90px;
  }

  .pomodoro-btn {
    height: 45px;
    min-width: 160px;
  }
}

@media (max-width: 400px) {
  .control-buttons {
    gap: 10px;
  }

  .time-settings {
    gap: 15px;
    padding: 15px;
  }
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
}

:root {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: #0f0f0f;
  background-color: #f6f6f6;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }
}
</style>
