<script setup>
import { ref, computed, watch, onMounted } from "vue";
import {
  ElMessageBox,
  ElButton,
  ElInputNumber,
  ElDropdown,
  ElMessage,
  ElSwitch,
  ElDropdownMenu,
  ElDropdownItem,
  ElDivider,
} from "element-plus";
import { Window } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  onNotificationReceived,
  onAction,
} from "@tauri-apps/plugin-notification";
import { listen } from "@tauri-apps/api/event";
import { Store, load } from "@tauri-apps/plugin-store";
import "element-plus/dist/index.css";
import {
  Minus,
  FullScreen,
  Close,
  VideoPlay,
  VideoPause,
  RefreshRight,
  Timer,
  Setting,
} from "@element-plus/icons-vue";

const inputMinutes = ref(1);
const inputSeconds = ref(0);
const timeLeft = ref(inputSeconds.value + inputMinutes.value * 60);
const running = ref(false);
const AudioPath = ref("Ki-ringtrain.mp3");
const autoStartEnabled = ref(false);
const notificationPermissionGranted = ref(false);
const notificationIcon = ref("icon.png");
let timer = null;

//设置番茄工作状态
const isPomodoro = ref(false);
const isResting = ref(false);
const workTime = ref(25 * 60);
const restTime = ref(5 * 60);
const appWindow = Window.getCurrent();
// 音频对象（可替换为你自己的音频文件路径）
const audio = new Audio(AudioPath.value);

const store = new Store("settings.bin");  // 使用 Tauri Store 存储设置

onMounted(async () => {
  checkAutoStartStatus();
  checkNotificationPermission();
  // 从存储中加载设置
  const cachedAudioPath = await store.get("audioPath");
  if(cachedAudioPath) {
    AudioPath.value = cachedAudioPath;
    audio.src = convertFileSrc(AudioPath.value);
  }
});


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

// 组件挂载时检查自启动状态
onMounted(async () => {
  checkAutoStartStatus();
  checkNotificationPermission();
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
    const path = convertFileSrc(selected);
    AudioPath.value = path;
    audio.src = AudioPath.value;
    // 保存到存储中
    await store.set("audioPath", path);
    await store.save();
  }
};

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

  // 发送系统通知
  if (notificationPermissionGranted.value) {
    try {
      let notificationOptions;
      if (!isPomodoro.value) {
        notificationOptions = {
          title: "番茄计时器",
          body: "时间到！",
          icon: notificationIcon.value,
        };
      } else if (!isResting.value) {
        notificationOptions = {
          title: "番茄计时器",
          body: "番茄工作时间到！是时候休息一下了 🍅",
          icon: notificationIcon.value,
        };
      } else {
        notificationOptions = {
          title: "番茄计时器",
          body: "休息时间到！开始新的工作周期 💪",
          icon: notificationIcon.value,
        };
      }

      sendNotification(notificationOptions);
      console.log("通知发送成功");
    } catch (error) {
      console.error("发送通知失败:", error);
    }
  }

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
    timeLeft.value = workTime.value;
  } else {
    timeLeft.value = restTime.value;
  }
  running.value = false;
  if (timer) clearInterval(timer);
  timer = null;
  start();
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
                >闹铃选择</ElDropdownItem
              >
              <ElDivider style="margin:4px 0" border-style='solid' />
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
        <el-button
          @click="switchPomodoro"
          :disabled="!isPomodoro"
          :type="isResting ? 'success' : 'info'"
          round
        >
          {{ isResting ? "直接工作" : "直接休息" }}
        </el-button>
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

.tool-bar {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: rgba(255, 255, 255, 0.1);
  /* border-bottom: 1px solid #e0e0e0; */
  padding: 0 16px;
  box-sizing: border-box;
  font-size: 1em;
  gap: 12px;
  /* 可选：阴影和圆角 */
  /* box-shadow: 0 1px 4px rgba(0,0,0,0.03); */
  /* border-radius: 0 0 8px 8px; */
}

.autostart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  width: 100%;
  min-width: 150px;
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
