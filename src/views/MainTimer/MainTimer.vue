<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  ElMessageBox,
  ElButton,
  ElDropdown,
  ElMessage,
  ElSwitch,
  ElDropdownMenu,
  ElDropdownItem,
} from "element-plus";
import { Window } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import "element-plus/dist/index.css";
import { Minus, FullScreen, Close, Setting } from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();

const inputMinutes = ref(25);
const inputSeconds = ref(0);
const timeLeft = ref(inputSeconds.value + inputMinutes.value * 60);
const running = ref(false);
const AudioPath = ref("Ki-ringtrain.mp3");
const autoStartEnabled = ref(false);
const notificationPermissionGranted = ref(false);
let timer = null;

//设置番茄工作状态
const isPomodoro = ref(false);
const isResting = ref(false);
const workTime = ref(25 * 60);
const restTime = ref(5 * 60);
const appWindow = Window.getCurrent();
// 音频对象（可替换为你自己的音频文件路径）
const audio = new Audio(AudioPath.value);

const displayTime = computed(() => {
  const min = Math.floor(timeLeft.value / 60);
  const sec = timeLeft.value % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
});

// 检查通知权限
const checkNotificationPermission = async () => {
  try {
    notificationPermissionGranted.value = await isPermissionGranted();
    if (!notificationPermissionGranted.value) {
      const permission = await requestPermission();
      notificationPermissionGranted.value = permission === "granted";
    }
  } catch (error) {
    console.error("检查通知权限失败:", error);
  }
};

// 检查自启动状态
const checkAutoStartStatus = async () => {
  try {
    autoStartEnabled.value = await isEnabled();
  } catch (error) {
    console.error("检查自启动状态失败:", error);
  }
};

// 切换自启动状态
const toggleAutoStart = async () => {
  try {
    if (autoStartEnabled.value) {
      await enable();
      ElMessage.success("已启用开机自启动");
    } else {
      await disable();
      ElMessage.success("已禁用开机自启动");
    }
  } catch (error) {
    ElMessage.error("设置自启动失败: " + error.message);
    console.error("设置自启动失败:", error);
    // 如果设置失败，恢复原状态
    autoStartEnabled.value = !autoStartEnabled.value;
  }
};

// 检查路由参数，处理自动开始
const handleRouteParams = () => {
  if (route.query.autoStart === "true" && route.query.isPomodoro === "true") {
    isPomodoro.value = true;
    isResting.value = route.query.isResting === "true";
    Pomodoro();
  }
};

// 组件挂载时检查自启动状态
onMounted(async () => {
  checkAutoStartStatus();
  checkNotificationPermission();
  handleRouteParams();
});

// 监听路由变化
watch(route, () => {
  handleRouteParams();
});

const changeDefaultWorkTime = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入工作时间（分钟）",
      "设置工作时间",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: Math.floor(workTime.value / 60),
        inputType: "number",
        inputValidator: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num <= 0 || num > 180) {
            return "请输入1-180之间的数字";
          }
          return true;
        },
      }
    );
    workTime.value = parseInt(value) * 60;
  } catch (error) {
    // 用户取消操作
  }
};

const changeDefaultRestTime = async () => {
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入休息时间（分钟）",
      "设置休息时间",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: Math.floor(restTime.value / 60),
        inputType: "number",
        inputValidator: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num <= 0 || num > 60) {
            return "请输入1-60之间的数字";
          }
          return true;
        },
      }
    );
    restTime.value = parseInt(value) * 60;
  } catch (error) {
    // 用户取消操作
  }
};

const changeDefaultAudioPath = async () => {
  // open file dialog to select audio file
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "音频文件",
        extensions: ["mp3", "wav", "ogg", "m4a", "aac"],
      },
    ],
  });
  // change the audio path
  if (selected) {
    AudioPath.value = convertFileSrc(selected);
    audio.src = AudioPath.value;
    // audio.load();
  }
};

const start = () => {
  if (running.value) return;

  // 跳转到倒计时页面
  router.push({
    path: "/countdown",
    query: {
      minutes: inputMinutes.value.toString(),
      seconds: inputSeconds.value.toString(),
      isPomodoro: "false",
      isResting: "false",
      audioPath: AudioPath.value,
    },
  });
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

const Pomodoro = () => {
  if (running.value) return;

  isPomodoro.value = true;
  let minutes, seconds;

  if (!isResting.value) {
    // 工作时间
    minutes = Math.floor(workTime.value / 60);
    seconds = workTime.value % 60;
  } else {
    // 休息时间
    minutes = Math.floor(restTime.value / 60);
    seconds = restTime.value % 60;
  }

  // 跳转到倒计时页面
  router.push({
    path: "/countdown",
    query: {
      minutes: minutes.toString(),
      seconds: seconds.toString(),
      isPomodoro: "true",
      isResting: isResting.value.toString(),
      audioPath: AudioPath.value,
    },
  });
};

const switchPomodoro = () => {
  if (!isPomodoro.value) return;
  if (isResting.value) {
    isResting.value = false;
    Pomodoro();
  } else {
    isResting.value = true;
    Pomodoro();
  }
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

// 快速设置时间
const setQuickTime = (minutes, seconds) => {
  if (running.value || isPomodoro.value) return;
  inputMinutes.value = minutes;
  inputSeconds.value = seconds;
};
</script>

<template>
  <div class="app-container">
    <div class="title-bar">
      <div class="title-section">
        <h3 class="app-title">番茄计时器</h3>
      </div>
      <div class="window-controls">
        <ElDropdown trigger="click">
          <button class="icon-btn">
            <el-icon :size="20"><Setting /></el-icon>
          </button>
          <template #dropdown>
            <ElDropdownMenu slot="dropdown">
              <ElDropdownItem @click="changeDefaultWorkTime"
                >工作时间</ElDropdownItem
              >
              <ElDropdownItem @click="changeDefaultRestTime"
                >休息时间</ElDropdownItem
              >
              <ElDropdownItem @click="changeDefaultAudioPath"
                >闹铃</ElDropdownItem
              >
              <ElDropdownItem>
                <div class="autostart-item">
                  <span>开机自启动</span>
                  <ElSwitch
                    v-model="autoStartEnabled"
                    @change="toggleAutoStart"
                    active-text="开"
                    inactive-text="关"
                    style="margin-left: 10px"
                  />
                </div>
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
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
      <!-- 简约时间显示和设置 -->
      <div class="time-section">
        <div class="time-display">
          <div class="time-value">
            {{ String(inputMinutes).padStart(2, "0") }}:{{
              String(inputSeconds).padStart(2, "0")
            }}
          </div>
        </div>

        <!-- 简约时间调节 -->
        <div class="time-controls">
          <div class="control-row">
            <span class="control-label">分</span>
            <el-slider
              v-model="inputMinutes"
              :min="0"
              :max="60"
              :disabled="running || isPomodoro"
              :show-tooltip="true"
              class="time-slider"
            />
          </div>
          <div class="control-row">
            <span class="control-label">秒</span>
            <el-slider
              v-model="inputSeconds"
              :min="0"
              :max="59"
              :disabled="running || isPomodoro"
              :show-tooltip="true"
              class="time-slider"
            />
          </div>
        </div>

        <!-- 快速设置按钮 -->
        <div class="quick-buttons">
          <button
            class="quick-btn"
            @click="setQuickTime(1, 0)"
            :disabled="running || isPomodoro"
          >
            1分
          </button>
          <button
            class="quick-btn"
            @click="setQuickTime(5, 0)"
            :disabled="running || isPomodoro"
          >
            5分
          </button>
          <button
            class="quick-btn"
            @click="setQuickTime(25, 0)"
            :disabled="running || isPomodoro"
          >
            25分
          </button>
        </div>
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
    </div>
  </div>
</template>

<style scoped src="./MainTimer.css" />
