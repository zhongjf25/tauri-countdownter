<template>
  <div>
    <el-button @click="stopCycleAndReturn">退出</el-button>
    <div v-if="showStats" class="pomodoro-stats">
      <h3>本次番茄统计</h3>
      <p>开始时间：{{ pomodoroStore.startTime?.toLocaleString?.() || '-' }}</p>
      <p>结束时间：{{ pomodoroStore.endTime?.toLocaleString?.() || '-' }}</p>
      <p>工作时长：{{ Math.floor(pomodoroStore.workDuration / 60) }} 分 {{ pomodoroStore.workDuration % 60 }} 秒</p>
      <p>休息时长：{{ Math.floor(pomodoroStore.restDuration / 60) }} 分 {{ pomodoroStore.restDuration % 60 }} 秒</p>
      <p>完成番茄数：{{ pomodoroStore.pomodoroCount }}</p>
    </div>
  </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { usePomodoroStore } from '../../stores/pomodoroStore';
    import { useRouter } from 'vue-router';
</script>