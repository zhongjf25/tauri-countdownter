import { defineStore } from "pinia";
import { ref } from "vue";

export const usePomodoroStore = defineStore("pomodoro", () => {
  // data
  const isRecording = ref(false); // true - 正在记录，false - 没有记录
  const isPaused = ref(false); // true - 暂停，false - 继续
  const isResting = ref(false); // true - 正在休息，false - 正在工作

  const startTime = ref(null); // 记录开始时间
  const endTime = ref(null); // 记录结束时间
  const pauseTime = ref(null); // 记录暂停时刻
  const resumeTime = ref(null); // 记录恢复时刻
  const workDuration = ref(0); // 工作时长
  const restDuration = ref(0); // 休息时长
  const pomodoroCount = ref(0); // 番茄钟计数

  // functions
  function startRecording() {
    // 开始记录 初始化
    isRecording.value = true;
    isPaused.value = false;
    isResting.value = false;
    startTime.value = new Date(); // 记录开始时间
    endTime.value = null; // 清除结束时间
    pauseTime.value = null; // 清除暂停时刻
    resumeTime.value = startTime.value; // 初始化恢复时刻为开始时间
    workDuration.value = 0; // 重置工作时长
    restDuration.value = 0; // 重置休息时长
    pomodoroCount.value = 0; // 重置番茄钟计数
  }

  function pauseRecording() {
    // 暂停记录
    isPaused.value = true;
    pauseTime.value = new Date(); // 记录暂停时刻
    if (isResting.value) {
      // 如果当前是休息状态，记录休息时长
      restDuration.value += Math.floor((pauseTime.value - resumeTime.value) / 1000); // 计算休息时长（秒）
    } else {
      // 如果当前是工作状态，记录工作时长
      workDuration.value += Math.floor((pauseTime.value - resumeTime.value) / 1000); // 计算工作时长（秒）
      pomodoroCount.value += 1; // 增加番茄钟计数
    }
  }

  function resumeRecording(isResumeRest) {
    // 恢复记录
    isPaused.value = false;
    isResting.value = isResumeRest; // isResumeRest 为 true 则恢复休息状态，否则恢复工作状态
    resumeTime.value = new Date(); // 记录恢复时刻
    pauseTime.value = null; // 清除暂停时刻
  }

  function endRecording() {
    // 结束记录
    isRecording.value = false;
    isPaused.value = false;
    isResting.value = false;
    endTime.value = new Date(); // 记录结束时间
    saveToLocalStorage(); // 保存数据到本地存储
  }

  function saveToLocalStorage() {
    // 保存数据到本地存储
    const pomodoroData = {
      startTime: startTime.value,
      endTime: endTime.value,
      workDuration: workDuration.value,
      restDuration: restDuration.value,
      pomodoroCount: pomodoroCount.value
    };
    localStorage.setItem("pomodoroData", JSON.stringify(pomodoroData));
  }

  return {
    // data
    isRecording,
    isPaused,
    isResting,
    startTime,
    endTime,
    pauseTime,
    resumeTime,
    workDuration,
    restDuration,
    pomodoroCount,

    // functions
    startRecording,
    pauseRecording,
    resumeRecording,
    endRecording
  }
})
