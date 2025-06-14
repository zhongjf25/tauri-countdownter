<template>
  <div class="countdown-container">
    <div class="title-bar">
      <div class="title-section">
        <!-- <h3 class="app-title">番茄计时器 - {{ getTimerTitle() }}</h3> -->
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
      <div class="countdown-content">
        <!-- 倒计时显示 -->
        <div class="timer-display">
          <div class="timer-circle">
            <div class="progress-ring">
              <svg class="progress-ring-svg" width="300" height="300">
                <circle
                  class="progress-ring-circle-bg"
                  stroke="rgba(255, 255, 255, 0.1)"
                  stroke-width="8"
                  fill="transparent"
                  r="140"
                  cx="150"
                  cy="150"
                />
                <circle
                  class="progress-ring-circle"
                  :stroke="getProgressColor()"
                  stroke-width="8"
                  fill="transparent"
                  r="140"
                  cx="150"
                  cy="150"
                  :style="{
                    strokeDasharray: `${2 * Math.PI * 140}`,
                    strokeDashoffset: getProgressOffset(),
                  }"
                />
              </svg>
            </div>
            <div class="timer-text">
              <div class="time-value">{{ displayTime }}</div>
              <div class="time-label">{{ getTimeLabel() }}</div>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="control-buttons">
          <el-button
            type="warning"
            size="large"
            @click="pauseTimer"
            v-if="running"
            class="control-btn"
          >
            <el-icon><VideoPause /></el-icon>
            暂停
          </el-button>

          <el-button
            type="primary"
            size="large"
            @click="resumeTimer"
            v-if="!running && timeLeft > 0"
            class="control-btn"
          >
            <el-icon><VideoPlay /></el-icon>
            继续
          </el-button>

          <el-button
            v-if="isPomodoro"
            type="success"
            size="large"
            @click="switchMode"
            class="control-btn"
          >
            <el-icon><VideoPlay /></el-icon>
            {{ isResting ? "直接开始工作" : "直接开始休息" }}
          </el-button>
          
          <el-button
            type="danger"
            size="large"
            @click="stopTimer"
            class="control-btn"
          >
            <el-icon><Close /></el-icon>
            停止
          </el-button>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Window } from "@tauri-apps/api/window";
import {
  sendNotification,
  isPermissionGranted,
} from "@tauri-apps/plugin-notification";
import {
  Minus,
  FullScreen,
  Close,
  VideoPause,
  VideoPlay,
  Back,
} from "@element-plus/icons-vue";
import { usePomodoroStore } from "../../stores/pomodoroStore";

const router = useRouter();
const route = useRoute();
const appWindow = Window.getCurrent();
const pomodoroStore = usePomodoroStore();

// 从路由参数获取初始数据
const initialHours = ref(parseInt(route.query.hours) || 0);
const initialMinutes = ref(parseInt(route.query.minutes) || 0);
const initialSeconds = ref(parseInt(route.query.seconds) || 0);
const isPomodoro = ref(route.query.isPomodoro === "true");
const isResting = ref(route.query.isResting === "true");
const audioPath = ref(route.query.audioPath || "Ki-ringtrain.mp3");
const autoCycling = ref(route.query.autoCycling === "true");
const pomodoroCount = ref(parseInt(route.query.pomodoroCount) || 0);

// 从localStorage加载番茄时间设置
const loadPomodoroSettings = () => {
  try {
    const savedWorkTime = localStorage.getItem("pomodoroWorkTime");
    const savedRestTime = localStorage.getItem("pomodoroRestTime");

    return {
      workTime: savedWorkTime ? parseInt(savedWorkTime) : 25 * 60,
      restTime: savedRestTime ? parseInt(savedRestTime) : 5 * 60,
    };
  } catch (error) {
    console.error("加载番茄设置失败:", error);
    return {
      workTime: 25 * 60,
      restTime: 5 * 60,
    };
  }
};

// 计时器状态
const timeLeft = ref(initialHours.value*3600 + initialMinutes.value*60 + initialSeconds.value);
const totalTime = ref(timeLeft.value);
const running = ref(true);
const notificationPermissionGranted = ref(false);

let timer = null;

// 计算显示时间
const displayTime = computed(() => {
  const hour = Math.floor(timeLeft.value / 3600);
  const min = Math.floor((timeLeft.value % 3600) / 60);
  const sec = timeLeft.value % 60;
  if (hour > 0) return `${hour}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  else return `${min}:${sec.toString().padStart(2, "0")}`;
});
 
// 获取计时器标题
const getTimerTitle = () => {
  if (!isPomodoro.value) return "倒计时";
  return isResting.value ? "休息时间" : "工作时间";
};

// 获取时间标签
const getTimeLabel = () => {
  if (!isPomodoro.value) return "剩余时间";
  return isResting.value ? "剩余休息时间" : "剩余工作时间";
};

// 获取进度条颜色
const getProgressColor = () => {
  if (!isPomodoro.value) return "#00d2ff";
  return isResting.value ? "#5cb85c" : "#ff6b6b";
};

// 计算进度条偏移
const getProgressOffset = () => {
  const progress = timeLeft.value / totalTime.value;
  const circumference = 2 * Math.PI * 140;
  return circumference * (1 - progress);
};

// 检查通知权限
const checkNotificationPermission = async () => {
  try {
    notificationPermissionGranted.value = await isPermissionGranted();
  } catch (error) {
    console.error("检查通知权限失败:", error);
  }
};

// 开始计时器
const startTimer = () => {
  running.value = true;
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      timeUp();
    }
  }, 1000);
};

// 暂停计时器
const pauseTimer = () => {
  running.value = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

// 恢复计时器
const resumeTimer = () => {
  startTimer();
};

// 停止计时器
const stopTimer = () => {
  pauseTimer();
  backToMain();
};

// 时间到
const timeUp = () => {
  pauseTimer();

  // 发送通知
  if (notificationPermissionGranted.value) {
    try {
      let notificationOptions;
      if (!isPomodoro.value) {
        notificationOptions = {
          title: "番茄计时器",
          body: "时间到！",
          icon: "icon.png",
        };
      } else if (!isResting.value) {
        notificationOptions = {
          title: "番茄计时器",
          body: "工作时间到！是时候休息一下了 🍅",
          icon: "icon.png",
        };
      } else {
        notificationOptions = {
          title: "番茄计时器",
          body: "休息时间到！开始新的工作周期 💪",
          icon: "icon.png",
        };
      }
      sendNotification(notificationOptions);
      appWindow?.show();
      appWindow?.setFocus();
      // appWindow?.unminimize();
    } catch (error) {
      console.error("发送通知失败:", error);
    }
  }
  // 跳转到时间结束页面
  router.push({
    path: "/timeup",
    query: {
      isPomodoro: isPomodoro.value.toString(),
      isResting: isResting.value.toString(),
      audioPath: audioPath.value,
      autoCycling: autoCycling.value.toString(),
      pomodoroCount: pomodoroCount.value.toString(),
    },
  });
};

// 切换模式（番茄工作法）
const switchMode = () => {
  pauseTimer();
  isResting.value = !isResting.value;

  // 获取当前的番茄时间设置
  const settings = loadPomodoroSettings();
  const nextTime = isResting.value ? settings.restTime : settings.workTime;

  // 跳转回主页面并自动开始
  router.push({
    path: "/",
    query: {
      autoStart: "true",
      isPomodoro: "true",
      isResting: isResting.value.toString(),
      autoCycling: autoCycling.value.toString(),
      pomodoroCount: pomodoroCount.value.toString(),
      audioPath: audioPath.value,
    },
  });
};

// 返回主页面
const backToMain = () => {
  pauseTimer();
  router.push("/");
};

// 窗口控制
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

// 组件挂载时开始计时
onMounted(() => {
  checkNotificationPermission();
  startTimer();
});

// 组件卸载时清理计时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style scoped src="./CountdownPage.css" />
