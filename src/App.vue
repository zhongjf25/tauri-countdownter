<script setup>
import { ref, computed, watch } from "vue";
import { ElMessageBox, ElButton, ElInputNumber } from "element-plus";
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
  if (timeLeft.value <= 0) timeLeft.value = inputSeconds.value + inputMinutes.value * 60;
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
  timeLeft.value = inputSeconds.value+inputMinutes.value*60;
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
  if(!isPomodoro.value) {
    ElMessageBox.alert("时间到","提示", {
      confirmButtonText: "确定",
      callback: () => {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }
  else if(!isResting.value) {
    isResting.value = true;
    ElMessageBox.alert("番茄工作时间到","提示", {
      confirmButtonText: "开始休息",
      callback: () => {
        audio.pause();
        audio.currentTime = 0;
        isResting.value = true;
        Pomodoro();
      }
    });
  }
  else {
    isResting.value = false;
    ElMessageBox.alert("休息时间到", "提示", {
      confirmButtonText: "开始工作",
      callback: () => {
        audio.pause();
        audio.currentTime = 0;
        isResting.value = false;
        Pomodoro();
      }
    })
  }
}

const Pomodoro = () => {
  isPomodoro.value = true;
  if(!isResting.value) {
    timeLeft.value = 25*60; // 设置为25分钟
  }
  else {
    timeLeft.value = 5*60; // 设置为5分钟休息时间
  }
  running.value = false;
  if (timer) clearInterval(timer);
  timer = null;
  start();
  
}

</script>

<template>
  <main class="container">
    <h2>设置时间</h2>
    <div class="row" style="margin-bottom: 1em;">
      <ElInputNumber
        v-model="inputMinutes"
        controls-position="right"
        :min="0"
        :max="3600"
        :disabled="running || isPomodoro"
        style="width: 100px; margin-right: 10px;"
      />
      <span>分</span>
      <ElInputNumber
        v-model="inputSeconds"
        controls-position="right"
        :min="0"
        :max="59"
        :disabled="running || isPomodoro"
        style="width: 100px; margin-right: 10px;"
      />
      <span>秒</span>
    </div>
    <div class="row" style="margin-bottom: 1em;">
      <ElButton @click="start" type="primary" round :disabled="running">开始</ElButton>
      <ElButton @click="pause" type="warning" round :disabled="!running" style="margin-left: 10px;">暂停</ElButton>
      <ElButton @click="reset" type="danger" round style="margin-left: 10px">重置</ElButton>
    </div>
    <div class="countdown">
      {{ isPomodoro? isResting? "剩余休息时间：":"剩余工作时间：" : "剩余时间：" }}
      <span style="font-size:2em;">{{ displayTime }}</span>
    </div>
  </main>

  <div style="margin-top: 2em; text-align: center;">
    <el-button @click="Pomodoro" :disabled="running" type="success" round >开始番茄工作！</el-button>
  </div>
</template>

<style scoped>
.countdown {
  margin-top: 1em;
  font-size: 1.5em;
  text-align: center;
}
</style>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
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

.container {
  margin: 0;
  padding-top: 10vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: 0.75s;
}

.logo.tauri:hover {
  filter: drop-shadow(0 0 2em #24c8db);
}

.row {
  display: flex;
  justify-content: center;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}

a:hover {
  color: #535bf2;
}

h1 {
  text-align: center;
}

input,
button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: #0f0f0f;
  background-color: #ffffff;
  transition: border-color 0.25s;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.2);
}

button {
  cursor: pointer;
}

button:hover {
  border-color: #396cd8;
}
button:active {
  border-color: #396cd8;
  background-color: #e8e8e8;
}

input,
button {
  outline: none;
}

#greet-input {
  margin-right: 5px;
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f6f6f6;
    background-color: #2f2f2f;
  }

  a:hover {
    color: #24c8db;
  }

  input,
  button {
    color: #ffffff;
    background-color: #0f0f0f98;
  }
  button:active {
    background-color: #0f0f0f69;
  }
}

</style>
