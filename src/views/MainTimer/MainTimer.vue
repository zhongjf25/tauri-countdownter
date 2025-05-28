<script setup>
import { ref, watch, onMounted } from "vue";
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
import { open, save } from "@tauri-apps/plugin-dialog";
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
const pomodoroCount = ref(0); // 已完成的番茄周期数
const isAutoCycling = ref(false); // 是否开启自动循环

// 从localStorage加载设置
const loadSettings = async () => {
  try {
    const savedWorkTime = localStorage.getItem("pomodoroWorkTime");
    const savedRestTime = localStorage.getItem("pomodoroRestTime");
    const savedAudioPath = localStorage.getItem("pomodoroAudioPath");
    console.log("加载设置:", {
      savedWorkTime,
      savedRestTime,
      savedAudioPath,
    });

    if (savedWorkTime) {
      workTime.value = parseInt(savedWorkTime);
    }
    if (savedRestTime) {
      restTime.value = parseInt(savedRestTime);
    }
    if (savedAudioPath) {
      await setAudioPath(savedAudioPath);
    }
  } catch (error) {
    console.error("加载设置失败:", error);
  }
};

// 保存设置到localStorage
const saveSettings = () => {
  try {
    localStorage.setItem("pomodoroWorkTime", workTime.value.toString());
    localStorage.setItem("pomodoroRestTime", restTime.value.toString());
    localStorage.setItem("pomodoroAudioPath", AudioPath.value);
  } catch (error) {
    console.error("保存设置失败:", error);
  }
};
const appWindow = Window.getCurrent();
// 音频对象（可替换为你自己的音频文件路径）
const audio = new Audio(AudioPath.value);

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
    loadSettings();

    isPomodoro.value = true;
    isResting.value = route.query.isResting === "true";

    // 恢复自动循环状态
    if (route.query.autoCycling === "true") {
      isAutoCycling.value = true;
    }

    // 恢复番茄计数
    if (route.query.pomodoroCount) {
      pomodoroCount.value = parseInt(route.query.pomodoroCount);
    }

    // 如果是从时间结束页面返回的自动循环
    if (route.query.fromTimeUp === "true") {
      // 如果刚完成了工作时间，增加番茄计数
      if (route.query.wasWorking === "true") {
        pomodoroCount.value++;
      }
    }

    Pomodoro();
  }
};

// 组件挂载时检查自启动状态
onMounted(async () => {
  loadSettings(); // 首先加载保存的设置
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
    saveSettings(); // 保存设置
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
    saveSettings(); // 保存设置
  } catch (error) {
    // 用户取消操作
  }
};

// 检查音频文件是否存在
async function checkAudioExists(path) {
  try {
    // fetch 只请求 HEAD，避免下载整个文件
    const response = await fetch(path, { method: "HEAD" });
    return response.ok;
  } catch (e) {
    return false;
  }
}

// 在设置音频路径或加载设置时调用
async function setAudioPath(path) {
  const exists = await checkAudioExists(path);
  if (exists) {
    AudioPath.value = path;
    audio.src = path;
  } else {
    ElMessage.error("音频文件不存在或不可用，已恢复为默认音频");
    AudioPath.value = "Ki-ringtrain.mp3";
    audio.src = AudioPath.value;
    saveSettings();
  }
}

const changeDefaultAudioPath = async () => {
  const selected = await open({
    multiple: false,
    filters: [
      { name: "音频文件", extensions: ["mp3", "wav", "ogg", "m4a", "aac"] },
    ],
  });
  if (selected) {
    const path = convertFileSrc(selected);
    await setAudioPath(path);
    saveSettings();
  }
};

function getAudioFileName(path) {
  try {
    // 先解码URL，再用正则提取最后的文件名
    const decoded = decodeURIComponent(path);
    const match = decoded.match(/[/\\]([^/\\]+\.mp3|wav|ogg|m4a|aac)$/i);
    if (match && match[1]) return match[1];
    // 或直接取最后一个斜杠后的内容
    return decoded.split(/[/\\]/).pop();
  } catch {
    return path;
  }
}

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
  isAutoCycling.value = false;
  pomodoroCount.value = 0;
};

watch([inputMinutes, inputSeconds], ([min, sec]) => {
  if (!running.value) timeLeft.value = min * 60 + sec;
});

const Pomodoro = () => {
  if (running.value) return;

  isPomodoro.value = true;
  let minutes, seconds;

  loadSettings();

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
      autoCycling: isAutoCycling.value.toString(),
      pomodoroCount: pomodoroCount.value.toString(),
    },
  });
};

// 开始番茄工作循环
const startPomodoroLoop = () => {
  if (running.value) return;

  // 确保使用最新的localStorage设置
  loadSettings();

  isAutoCycling.value = true;
  isPomodoro.value = true;
  isResting.value = false;
  pomodoroCount.value = 0;

  Pomodoro();
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
                >工作时间：{{ workTime/60 }} min</ElDropdownItem
              >
              <ElDropdownItem @click="changeDefaultRestTime"
                >休息时间：{{ restTime/60 }} min</ElDropdownItem
              >
              <ElDropdownItem @click="changeDefaultAudioPath"
                >闹铃： {{ getAudioFileName(AudioPath) }}</ElDropdownItem
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
        <ElButton
          size="large"
          @click="start"
          type="primary"
          round
          :disabled="running"
          >开始</ElButton
        >
        <ElButton
          size="large"
          @click="reset"
          type="danger"
          round
          style="margin-left: 10px"
          >重置</ElButton
        >
        <ElButton
          size="large"
          v-if="!isAutoCycling"
          @click="startPomodoroLoop"
          type="success"
          round
          :disabled="running"
          class="icon-btn"
        >
          番茄循环
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped src="./MainTimer.css" />
