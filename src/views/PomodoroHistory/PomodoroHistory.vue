<script setup lang="ts">
import { usePomodoroStore } from "../../stores/pomodoroStore";
import { Window } from "@tauri-apps/api/window";
import { useRouter } from "vue-router";
import { Close, FullScreen, Minus, ArrowLeft } from "@element-plus/icons-vue";

const pomodoroStore = usePomodoroStore();
const appWindow = Window.getCurrent();
const router = useRouter();

const closeWindow = async () => {
  await appWindow.close();
};

const minimizeWindow = async () => {
  await appWindow.minimize();
};

const maximizeWindow = async () => {
  const isMaximized = await appWindow.isMaximized();
  if (isMaximized) {
    await appWindow.unmaximize();
  } else {
    await appWindow.maximize();
  }
};

const goToMenu = () => {
  router.push("/");
};
</script>

<template>
  <div class="app-container">
    <div class="title-bar">
      <div class="title-section">
        <h3 class="app-title">番茄记录</h3>
      </div>
      <div class="window-controls">
        <button class="icon-btn" @click="goToMenu" title="返回">
          <el-icon :size="20"><ArrowLeft /></el-icon>
        </button>
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
  </div>
</template>

<style scoped src="./PomodoroHistory.css" />
