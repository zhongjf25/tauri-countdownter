<script setup>
import "element-plus/dist/index.css";
import { onMounted, onUnmounted } from "vue";

onMounted(() => {
  // 禁用右键菜单
  const handler = (e) => e.preventDefault();
  window.addEventListener("contextmenu", handler);
  // 组件卸载时移除监听
  onUnmounted(() => {
    window.removeEventListener("contextmenu", handler);
  });
});
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  user-select: none;  /* 禁止文本选择 */
}
</style>
